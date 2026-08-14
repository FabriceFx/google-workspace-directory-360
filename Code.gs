/**
 * ============================================================================
 *  ANNUAIRE 360° — Explorateur de champs Google Workspace
 *  Fichier  : Code.gs
 *  Version  : 1.0.0
 *  Objet    : Web app permettant de requêter TOUS les champs disponibles des
 *             comptes Google Workspace (Admin SDK Directory, projection=full,
 *             y compris customSchemas, locations, relations, websites, etc.)
 * ============================================================================
 *
 *  PRÉREQUIS
 *  ---------
 *  1. Service avancé "Admin SDK API" activé (Services > + > Admin SDK API,
 *     identifiant AdminDirectory).
 *  2. API Admin SDK activée dans le projet Google Cloud associé.
 *  3. Compte exécutant = super-admin ou admin délégué avec le droit
 *     "Utilisateurs > Lire" (privilège Directory).
 *
 *  DÉPLOIEMENT
 *  -----------
 *  Déployer > Nouveau déploiement > Application web
 *    - Exécuter en tant que : Moi (le compte admin)
 *    - Qui a accès        : Tous les utilisateurs du domaine
 *  ⚠ Avec "Exécuter en tant que moi", TOUT utilisateur ayant l'URL hérite de
 *    tes droits admin en lecture. Renseigne impérativement ALLOWED_EMAILS ou
 *    ALLOWED_GROUP ci-dessous pour restreindre l'usage.
 * ============================================================================
 */

/* ---------------------------------------------------------------------------
 *  PORTAGE VERS UN AUTRE DOMAINE
 *  Le moteur est générique : projection full, aplatissement dynamique et
 *  découverte des schémas personnalisés à l'exécution. Pour servir un autre
 *  domaine Google Workspace, seuls ces points sont à revoir :
 *    1. CFG.ALLOWED_EMAILS / CFG.ALLOWED_GROUP  (liste blanche)
 *    2. demoUsers_() / demoSchemas_()           (jeu de démonstration)
 *    3. la charte graphique dans Index.html     (couleurs, polices, marque)
 *  Aucun nom de schéma personnalisé n'est écrit en dur dans le code.
 * ------------------------------------------------------------------------- */

var CFG = {
  APP_NAME: 'Annuaire 360°',
  VERSION: '1.17.0',
  CUSTOMER: 'my_customer',       // résout le domaine du compte exécutant
  PAGE_SIZE: 500,                // max autorisé par l'API
  MAX_USERS: 9000,               // plafond du parc chargé
  BATCH_SIZE: 1500,              // comptes renvoyés par aller-retour client
  CACHE_PREFIX: 'A360_V1_',
  CACHE_TTL: 21600,              // 6 h
  CHUNK: 90000,                  // < 100 Ko par entrée de cache

  // --- Contrôle d'accès -----------------------------------------------------
  ALLOWED_EMAILS: [              // liste blanche ; [] = pas de filtre nominatif
    'fabrice@atelier-informatique.com'
  ],
  ALLOWED_GROUP: '',             // ex : 'admins-workspace@mondomaine.fr'

  // --- Rapports planifiés ---------------------------------------------------
  REPORT_RECIPIENTS: [],         // [] = le compte de déploiement ; sinon liste d'emails
  REPORT_HOUR: 7,                // heure locale d'envoi du contrôle quotidien

  // --- Divers ---------------------------------------------------------------
  STRIP: ['etag', 'thumbnailPhotoEtag', 'kind'], // champs bruyants retirés
  DEMO_IF_NO_ACCESS: true        // bascule sur un jeu fictif si l'API échoue
};

/* ==========================================================================
 *  1. ENTRÉE WEB APP
 * ======================================================================== */

function doGet(e) {
  var tpl = HtmlService.createTemplateFromFile('Index');
  tpl.CFG = CFG;
  return tpl.evaluate()
    .setTitle(CFG.APP_NAME)
    .addMetaTag('viewport', 'width=device-width, initial-scale=1')
    .setXFrameOptionsMode(HtmlService.XFrameOptionsMode.ALLOWALL);
}

function include_(name) {
  var whitelist = ['Stylesheet', 'Script'];
  if (whitelist.indexOf(name) === -1) return '';
  return HtmlService.createHtmlOutputFromFile(name).getContent();
}

/* ==========================================================================
 *  2. CONTRÔLE D'ACCÈS
 * ======================================================================== */

function currentUser_() {
  var active = '';
  try { active = (Session.getActiveUser().getEmail() || '').toLowerCase().trim(); } catch (err) {}
  var effective = '';
  try { effective = (Session.getEffectiveUser().getEmail() || '').toLowerCase().trim(); } catch (err) {}
  return active || effective || '';
}

function checkAccess_() {
  var activeEmail = '';
  try { activeEmail = (Session.getActiveUser().getEmail() || '').toLowerCase().trim(); } catch (err) {}
  var effectiveEmail = '';
  try { effectiveEmail = (Session.getEffectiveUser().getEmail() || '').toLowerCase().trim(); } catch (err) {}
  
  var email = activeEmail || effectiveEmail || '';
  var allowed = false;
  var reason = '';

  var allowedList = (CFG.ALLOWED_EMAILS || []).map(function(x){ return String(x).toLowerCase().trim(); }).filter(Boolean);
  var hasEmailRule = allowedList.length > 0;
  var hasGroupRule = !!(CFG.ALLOWED_GROUP && String(CFG.ALLOWED_GROUP).trim());

  if (!hasEmailRule && !hasGroupRule) {
    allowed = false;
    reason = "Application non configurée (aucune règle d'accès dans ALLOWED_EMAILS ni ALLOWED_GROUP).";
  } else {
    var inList = false;
    if (hasEmailRule) {
      inList = (activeEmail && allowedList.indexOf(activeEmail) !== -1) ||
               (effectiveEmail && allowedList.indexOf(effectiveEmail) !== -1);
    }
    var inGroup = false;
    if (hasGroupRule && (activeEmail || effectiveEmail)) {
      try {
        var checkMail = activeEmail || effectiveEmail;
        inGroup = AdminDirectory.Members.hasMember(CFG.ALLOWED_GROUP, checkMail).isMember === true;
      } catch (err) {
        reason = 'Vérification du groupe impossible : ' + err.message;
      }
    }
    
    allowed = inList || inGroup;
    if (!allowed && !reason) {
      reason = "Compte détecté : " + (activeEmail || effectiveEmail || 'inconnu (Session vide)') + " — non présent dans ALLOWED_EMAILS [" + allowedList.join(', ') + "]" + (hasGroupRule ? (" ni membre du groupe " + CFG.ALLOWED_GROUP) : "");
    }
  }

  return { email: email, allowed: allowed, reason: reason };
}

/* ==========================================================================
 *  3. API EXPOSÉE AU CLIENT
 * ======================================================================== */

/**
 * Amorce l'application : identité, version, disponibilité de l'Admin SDK.
 */
function apiBootstrap() {
  var acc = checkAccess_();
  var api = true, apiError = '';
  try {
    AdminDirectory.Users.list({ customer: CFG.CUSTOMER, maxResults: 1, projection: 'basic' });
  } catch (err) {
    api = false;
    apiError = err.message;
  }
  return {
    ok: true,
    app: CFG.APP_NAME,
    version: CFG.VERSION,
    email: acc.email,
    allowed: acc.allowed,
    reason: acc.reason,
    apiAvailable: api,
    apiError: apiError,
    maxUsers: CFG.MAX_USERS
  };
}

/**
 * Charge UNE tranche de l'annuaire (CFG.BATCH_SIZE comptes) et rend la main.
 */
function apiLoadBatch(payload) {
  var acc = checkAccess_();
  if (!acc.allowed) {
    return { ok: false, errorCode: 'accesRefuse', user: acc.email, reason: acc.reason };
  }

  payload = payload || {};
  var token = payload.pageToken || '';
  var loaded = payload.loadedCount || payload.loaded || 0;
  var force = !!payload.force;
  var first = (loaded === 0 && !token);
  var opts = {
    query: payload.query || '',
    orgUnitPath: (payload.orgUnit || payload.orgUnitPath || '').trim(),
    showDeleted: !!payload.showDeleted
  };

  var key = CFG.CACHE_PREFIX + 'B_' + hash_(JSON.stringify({
    t: token || 'first', q: opts.query || '',
    ou: opts.orgUnitPath || '', d: !!opts.showDeleted, l: loaded
  }));

  if (!force) {
    var hit = cacheGet_(key);
    if (hit) {
      hit.cached = true;
      return hit;
    }
  }

  var users = [];
  var source = 'api';
  var warning = '';
  var warningCode = '';
  var room = Math.max(0, CFG.MAX_USERS - loaded);
  if (room === 0) {
    return { ok: true, users: [], nextPageToken: '', source: 'api', schemas: null };
  }
  var guard = 0;

  try {
    do {
      var params = {
        customer: CFG.CUSTOMER,
        maxResults: Math.min(CFG.PAGE_SIZE, room - users.length),
        projection: 'full',
        viewType: 'admin_view'
      };
      if (token) params.pageToken = token;

      if (opts.showDeleted) {
        // L'API Admin SDK Directory refuse showDeleted combiné à orderBy ou query
        params.showDeleted = 'true';
      } else {
        params.orderBy = 'email';
        var q = [];
        if (opts.query) q.push(opts.query);
        if (opts.orgUnitPath && opts.orgUnitPath !== '/') {
          q.push("orgUnitPath='" + opts.orgUnitPath.replace(/'/g, "\\'") + "'");
        }
        if (q.length) params.query = q.join(' ');
      }

      var res = AdminDirectory.Users.list(params);
      (res.users || []).forEach(function (u) {
        users.push(cleanUser_(JSON.parse(JSON.stringify(u))));
      });
      token = res.nextPageToken || null;
      guard++;
    } while (token && users.length < CFG.BATCH_SIZE && users.length < room && guard < 12);
  } catch (err) {
    if (!first || !CFG.DEMO_IF_NO_ACCESS) return { ok: false, errorCode: 'adminSdk', error: err.message };
    users = demoUsers_();
    token = null;
    source = 'demo';
    warning = err.message;
    warningCode = 'demoCharge';
  }

  if (loaded + users.length >= CFG.MAX_USERS) token = null;   // plafond atteint

  var out = {
    ok: true,
    source: source,
    warning: warning,
    warningCode: warningCode,
    users: users,
    nextPageToken: token || '',
    schemas: first ? (source === 'api' ? safeSchemas_() : demoSchemas_()) : null,
    orgUnits: first ? (source === 'api' ? safeOrgUnits_() : ['/', '/Standard', '/Terrain']) : null,
    maxUsers: CFG.MAX_USERS,
    cached: false,
    elapsed: new Date().getTime() - t0
  };

  if (source === 'api') {
    try { cachePut_(key, out); } catch (err) { /* tranche trop grosse : on ignore */ }
  }
  return out;
}

/**
 * Chargement en une seule réponse. Conservé pour un usage script / batch ;
 * l'interface utilise apiLoadBatch.
 */
function apiLoadUsers(opts) {
  opts = opts || {};
  var t0 = new Date().getTime();
  var acc = checkAccess_();
  if (!acc.allowed) {
    return { ok: false, errorCode: 'accesRefuse', user: acc.email, reason: acc.reason,
             error: 'Accès refusé pour ' + (acc.email || 'compte inconnu') + '. ' + acc.reason };
  }

  var key = CFG.CACHE_PREFIX + hash_(JSON.stringify({
    q: opts.query || '', ou: opts.orgUnitPath || '', d: !!opts.showDeleted, l: opts.loaded || 0
  }));

  if (!opts.force) {
    var cached = cacheGet_(key);
    if (cached) {
      cached.cached = true;
      cached.meta.elapsed = new Date().getTime() - t0;
      return cached;
    }
  }

  var users = [], source = 'api', warning = '';
  try {
    users = fetchAllUsers_(opts);
  } catch (err) {
    if (!CFG.DEMO_IF_NO_ACCESS) return { ok: false, error: 'Admin SDK : ' + err.message };
    users = demoUsers_();
    source = 'demo';
    warning = 'Admin SDK inaccessible (' + err.message + '). Jeu de démonstration chargé.';
  }

  var payload = {
    ok: true,
    source: source,
    warning: warning,
    users: users,
    schemas: source === 'api' ? safeSchemas_() : demoSchemas_(),
    orgUnits: source === 'api' ? safeOrgUnits_() : ['/', '/Standard', '/Terrain'],
    meta: {
      count: users.length,
      truncated: users.length >= CFG.MAX_USERS,
      generatedAt: new Date().toISOString(),
      by: acc.email,
      elapsed: new Date().getTime() - t0
    },
    cached: false
  };

  if (source === 'api') {
    try { cachePut_(key, payload); } catch (err) { /* payload trop gros : on ignore */ }
  }
  return payload;
}

/**
 * Détail brut d'un compte (rafraîchi côté API).
 */
function apiGetUser(userKey) {
  var acc = checkAccess_();
  if (!acc.allowed) return { ok: false, error: 'Accès refusé.' };
  try {
    var u = AdminDirectory.Users.get(userKey, { projection: 'full' });
    return { ok: true, user: JSON.parse(JSON.stringify(u)) };
  } catch (err) {
    return { ok: false, error: err.message };
  }
}

/* ==========================================================================
 *  4. RÉCUPÉRATION ANNUAIRE
 * ======================================================================== */

function fetchAllUsers_(opts) {
  var users = [], token = null, guard = 0;
  var query = [];
  if (opts.query) query.push(opts.query);
  if (opts.orgUnitPath) query.push("orgUnitPath='" + opts.orgUnitPath.replace(/'/g, "\\'") + "'");

  do {
    var params = {
      customer: CFG.CUSTOMER,
      maxResults: CFG.PAGE_SIZE,
      projection: 'full',
      orderBy: 'email',
      viewType: 'admin_view'
    };
    if (token) params.pageToken = token;
    if (query.length) params.query = query.join(' ');
    if (opts.showDeleted) params.showDeleted = 'true';

    var res = AdminDirectory.Users.list(params);
    (res.users || []).forEach(function (u) {
      users.push(cleanUser_(JSON.parse(JSON.stringify(u))));
    });
    token = res.nextPageToken;
    guard++;
  } while (token && users.length < CFG.MAX_USERS && guard < 40);

  return users;
}

function cleanUser_(u) {
  CFG.STRIP.forEach(function (f) { delete u[f]; });
  return u;
}

function safeSchemas_() {
  try {
    var res = AdminDirectory.Schemas.list(CFG.CUSTOMER);
    return (res.schemas || []).map(function (s) {
      return {
        schemaName: s.schemaName,
        displayName: s.displayName,
        fields: (s.fields || []).map(function (f) {
          return {
            fieldName: f.fieldName,
            displayName: f.displayName,
            fieldType: f.fieldType,
            multiValued: !!f.multiValued
          };
        })
      };
    });
  } catch (err) { return []; }
}

function safeOrgUnits_() {
  try {
    var res = AdminDirectory.Orgunits.list(CFG.CUSTOMER, { type: 'all' });
    var list = (res.organizationUnits || []).map(function (o) { return o.orgUnitPath; });
    list.unshift('/');
    return list.sort();
  } catch (err) { return ['/']; }
}

/* ==========================================================================
 *  4. PRÉFÉRENCES UTILISATEUR & VUES SAUVEGARDÉES (ISOLÉES PAR EMAIL)
 * ======================================================================== */

function userPrefKey_(email, key) {
  var safeEmail = String(email || '').toLowerCase().replace(/[^a-z0-9_]/gi, '_');
  return 'u_' + safeEmail + '_' + key;
}

function apiInit() {
  var acc = checkAccess_();
  if (!acc.allowed) {
    return { ok: false, errorCode: 'accesRefuse', user: acc.email, reason: acc.reason };
  }
  var locale = '';
  try { locale = Session.getActiveUserLocale() || ''; } catch (err) { /* ignoré */ }
  return {
    ok: true,
    mode: apiGetPref('mode'),
    lang: apiGetPref('lang'),
    views: apiGetPref('views'),
    locale: locale
  };
}

function apiGetPref(key) {
  var acc = checkAccess_();
  if (!acc.allowed) return null;
  var k = userPrefKey_(acc.email, key);
  try { return PropertiesService.getScriptProperties().getProperty(k); }
  catch (err) { return null; }
}

function apiSetPref(key, value) {
  var acc = checkAccess_();
  if (!acc.allowed) return false;
  var validKeys = ['mode', 'lang', 'views'];
  if (validKeys.indexOf(key) === -1) return false;
  var k = userPrefKey_(acc.email, key);
  try {
    PropertiesService.getScriptProperties().setProperty(k, String(value));
    return true;
  } catch (err) { return false; }
}

/* ==========================================================================
 *  4 bis. JOURNAL D'USAGE
 * ======================================================================== */

var LOG_KEY = 'A360_LOG';
var LOG_MAX = 50;             // 50 entrées max pour rester bien sous la limite de 9 Ko de ScriptProperties

function apiLogEvent(action, count) {
  var acc = checkAccess_();
  if (!acc.allowed) return { ok: false };
  var lock;
  try {
    lock = LockService.getScriptLock();
    lock.waitLock(3000);
    var props = PropertiesService.getScriptProperties();
    var log = [];
    try { log = JSON.parse(props.getProperty(LOG_KEY) || '[]'); } catch (e) { log = []; }
    log.push({
      t: new Date().toISOString(),
      u: acc.email,
      a: String(action || '').substring(0, 20),
      n: parseInt(count, 10) || 0
    });
    if (log.length > LOG_MAX) log = log.slice(log.length - LOG_MAX);
    props.setProperty(LOG_KEY, JSON.stringify(log));
  } catch (err) { /* le journal ne doit jamais bloquer l'outil */ }
  finally { if (lock) try { lock.releaseLock(); } catch (e) { /* noop */ } }
  return { ok: true };
}

function apiGetLog() {
  var acc = checkAccess_();
  if (!acc.allowed) return { ok: false, errorCode: 'accesRefuse', user: acc.email, reason: acc.reason };
  var log = [];
  try { log = JSON.parse(PropertiesService.getScriptProperties().getProperty(LOG_KEY) || '[]'); }
  catch (err) { log = []; }
  return { ok: true, entries: log.reverse().slice(0, 50) };
}

/* ==========================================================================
 *  4 ter. EXPORT GOOGLE SHEETS
 * ======================================================================== */

var EXPORT_FOLDER_KEY = 'A360_EXPORT_FOLDER';
var EXPORT_RETENTION_DAYS = 30;

function apiExportToSheet(payload) {
  var acc = checkAccess_();
  if (!acc.allowed) {
    return { ok: false, errorCode: 'accesRefuse', user: acc.email, reason: acc.reason };
  }
  payload = payload || {};
  var cols = payload.cols || [], rows = payload.rows || [];
  if (!cols.length || !rows.length) return { ok: false, error: 'Rien à exporter.' };
  if (rows.length > CFG.MAX_USERS) rows = rows.slice(0, CFG.MAX_USERS);

  try {
    var name = 'annuaire_' + new Date().toISOString().substring(0, 10)
             + '_' + ((acc.email || 'export').split('@')[0]);
    var data = [cols].concat(rows.map(function (r) {
      return cols.map(function (_, i) {
        var v = r[i];
        if (v === null || v === undefined) return '';
        if (typeof v === 'string' && /^[=+\-@\t\r]/.test(v)) return "'" + v;
        return v;
      });
    }));

    var ss = SpreadsheetApp.create(name, data.length, cols.length);
    var sh = ss.getSheets()[0];
    sh.getRange(1, 1, data.length, cols.length).setValues(data);
    sh.getRange(1, 1, 1, cols.length).setFontWeight('bold');
    sh.setFrozenRows(1);

    try {
      var folder = exportFolder_();
      if (folder) DriveApp.getFileById(ss.getId()).moveTo(folder);
    } catch (err) { /* le classement ne doit pas faire échouer l'export */ }

    try { if (acc.email) ss.addViewer(acc.email); }
    catch (err) { /* demandeur = propriétaire : rien à partager */ }

    purgeOldExports_();
    return { ok: true, url: ss.getUrl(), name: name, count: rows.length };
  } catch (err) {
    return { ok: false, error: err.message };
  }
}

function exportFolder_() {
  var props = PropertiesService.getScriptProperties();
  var id = props.getProperty(EXPORT_FOLDER_KEY);
  if (id) {
    try { return DriveApp.getFolderById(id); }
    catch (err) { /* dossier supprimé : on le recrée */ }
  }
  var folder = DriveApp.createFolder(CFG.APP_NAME + ' – Exports');
  props.setProperty(EXPORT_FOLDER_KEY, folder.getId());
  return folder;
}

function purgeOldExports_() {
  try {
    var limit = Date.now() - EXPORT_RETENTION_DAYS * 86400000;
    var it = exportFolder_().getFiles();
    while (it.hasNext()) {
      var f = it.next();
      if (f.getDateCreated().getTime() < limit) f.setTrashed(true);
    }
  } catch (err) { /* la purge ne doit jamais bloquer l'export */ }
}

/* ==========================================================================
 *  4 quater. RAPPORTS PLANIFIÉS & REGISTRE UNIFIÉ DES RÈGLES (AUDIT_RULES)
 * ======================================================================== */

var REPORT_STATE_KEY = 'A360_REPORT_STATE';
var REPORT_SAMPLE = 15;

/**
 * Registre centralisé des règles de conformité et de sécurité (SSOT).
 * Utilisé pour le rapport planifié serveur, les alertes de conformité et les KPI.
 */
var AUDIT_RULES = [
  {
    id: 'adminSans2sv',
    labelFr: 'Admins sans 2SV',
    labelEn: 'Admins without 2SV',
    severity: 'high',
    inDailyReport: true,
    alertTag: 'admin sans 2SV',
    test: function (u) { return !u.suspended && (u.isAdmin || u.isDelegatedAdmin) && !u.isEnrolledIn2Sv; },
    filters: [['calc.estAdmin', 'eq', 'true'], ['isEnrolledIn2Sv', 'eq', 'false'], ['suspended', 'eq', 'false']]
  },
  {
    id: 'sans2sv',
    labelFr: 'Comptes actifs sans 2SV',
    labelEn: 'Active accounts without 2SV',
    severity: 'high',
    kpiKey: 'kpiSans2sv',
    kpiAlert: true,
    inDailyReport: true,
    alertTag: 'sans 2SV',
    test: function (u) { return !u.suspended && !u.isEnrolledIn2Sv; },
    filters: [['isEnrolledIn2Sv', 'eq', 'false'], ['suspended', 'eq', 'false']]
  },
  {
    id: 'sansRecuperation',
    labelFr: 'Comptes actifs sans moyen de récupération',
    labelEn: 'Active accounts without recovery info',
    severity: 'medium',
    inDailyReport: true,
    alertTag: 'sans récupération',
    test: function (u) { return !u.suspended && !u.recoveryEmail && !u.recoveryPhone; },
    filters: [['recoveryEmail', 'empty', ''], ['recoveryPhone', 'empty', ''], ['suspended', 'eq', 'false']]
  },
  {
    id: 'jamaisConnecte',
    labelFr: 'Comptes jamais connectés',
    labelEn: 'Never logged in accounts',
    severity: 'medium',
    kpiKey: 'kpiJamais',
    kpiAlert: false,
    inDailyReport: true,
    alertTag: 'jamais connecté',
    test: function (u) { return !u.suspended && (!u.lastLoginTime || String(u.lastLoginTime).indexOf('1970') === 0); },
    filters: [['calc.jamaisConnecte', 'eq', 'true'], ['suspended', 'eq', 'false']]
  },
  {
    id: 'sansManager',
    labelFr: 'Collaborateurs sans manager',
    labelEn: 'Members without manager',
    severity: 'low',
    alertTag: 'sans manager',
    test: function (u) { return !u.suspended && !(u.relations || []).some(function(r){ return r.type === 'manager'; }); },
    filters: [['calc.aManager', 'eq', 'false'], ['suspended', 'eq', 'false']]
  },
  {
    id: 'mdpAChanger',
    labelFr: 'Mot de passe temporaire à renouveler',
    labelEn: 'Password change required',
    severity: 'medium',
    alertTag: 'mot de passe à changer',
    test: function (u) { return !u.suspended && !!u.changePasswordAtNextLogin; },
    filters: [['changePasswordAtNextLogin', 'eq', 'true'], ['suspended', 'eq', 'false']]
  },
  {
    id: 'boiteNonConfiguree',
    labelFr: 'Boîte Gmail non configurée',
    labelEn: 'Mailbox not setup',
    severity: 'low',
    alertTag: 'boîte non configurée',
    test: function (u) { return !u.suspended && u.isMailboxSetup === false; },
    filters: [['isMailboxSetup', 'eq', 'false'], ['suspended', 'eq', 'false']]
  },
  {
    id: 'suspendus',
    labelFr: 'Comptes suspendus',
    labelEn: 'Suspended accounts',
    severity: 'info',
    kpiKey: 'kpiSuspendus',
    kpiAlert: false,
    inDailyReport: true,
    test: function (u) { return u.suspended === true; },
    filters: [['suspended', 'eq', 'true']]
  }
];

var REPORT_CHECKS = AUDIT_RULES.filter(function (r) { return r.inDailyReport; }).map(function (r) {
  return { key: r.id, label: r.labelFr, test: r.test };
});

function reportRecipients_() {
  if (CFG.REPORT_RECIPIENTS && CFG.REPORT_RECIPIENTS.length) return CFG.REPORT_RECIPIENTS.join(',');
  try { return Session.getEffectiveUser().getEmail(); } catch (err) { return ''; }
}

function reportDaily() {
  // Dans le contexte d'un déclencheur planifié automatique (Time-driven trigger),
  // Session.getActiveUser() est vide. L'autorisation et l'envoi reposent sur
  // le compte effectif (propriétaire/installateur ayant configuré le déclencheur).
  var triggerEmail = '';
  try { triggerEmail = (Session.getEffectiveUser().getEmail() || '').toLowerCase(); } catch (err) { triggerEmail = ''; }
  if (!triggerEmail) return;

  var users;
  try { users = fetchAllUsers_({}); } catch (err) { return; }

  var counts = {}, samples = {};
  REPORT_CHECKS.forEach(function (c) {
    var hits = users.filter(c.test);
    counts[c.key] = hits.length;
    samples[c.key] = hits.slice(0, REPORT_SAMPLE).map(function (u) { return u.primaryEmail; });
  });

  var props = PropertiesService.getScriptProperties();
  var prev = null;
  try { prev = JSON.parse(props.getProperty(REPORT_STATE_KEY) || 'null'); } catch (err) { prev = null; }

  var changed = !prev || REPORT_CHECKS.some(function (c) {
    return (prev.counts || {})[c.key] !== counts[c.key];
  });

  if (!changed) return;

  var rows = REPORT_CHECKS.map(function (c) {
    var avant = prev ? ((prev.counts || {})[c.key] || 0) : null;
    var delta = (avant === null) ? '' :
      (counts[c.key] === avant ? '=' : (counts[c.key] > avant ? '+' + (counts[c.key] - avant) : String(counts[c.key] - avant)));
    var ech = counts[c.key] && delta !== '=' && delta !== ''
      ? '<div style="font-size:11px;color:#5f6368">' + samples[c.key].join(', ')
        + (counts[c.key] > REPORT_SAMPLE ? '…' : '') + '</div>' : '';
    return '<tr><td style="padding:6px 10px;border-bottom:1px solid #eee">' + c.label + ech + '</td>'
      + '<td style="padding:6px 10px;border-bottom:1px solid #eee;text-align:right">' + (avant === null ? '—' : avant) + '</td>'
      + '<td style="padding:6px 10px;border-bottom:1px solid #eee;text-align:right;font-weight:bold">' + counts[c.key] + '</td>'
      + '<td style="padding:6px 10px;border-bottom:1px solid #eee;text-align:right;color:' + (String(delta).indexOf('+') === 0 ? '#c5221f' : '#188038') + '">' + delta + '</td></tr>';
  }).join('');

  var to = reportRecipients_();
  if (!to) return;
  
  try {
    MailApp.sendEmail({
      to: to,
      subject: '[' + CFG.APP_NAME + '] Contrôle annuaire : des indicateurs ont changé (' + users.length + ' comptes)',
      htmlBody: '<p>' + (prev ? 'Des indicateurs ont changé depuis le dernier contrôle'
                              + (prev.t ? ' (' + prev.t.substring(0, 10) + ')' : '') + '.'
                             : 'Premier contrôle : voici l\'état de référence.') + '</p>'
        + '<table style="border-collapse:collapse;font-family:Arial,sans-serif;font-size:13px">'
        + '<tr><th style="padding:6px 10px;text-align:left;border-bottom:2px solid #1a73e8">Contrôle</th>'
        + '<th style="padding:6px 10px;text-align:right;border-bottom:2px solid #1a73e8">Avant</th>'
        + '<th style="padding:6px 10px;text-align:right;border-bottom:2px solid #1a73e8">Maintenant</th>'
        + '<th style="padding:6px 10px;text-align:right;border-bottom:2px solid #1a73e8">Δ</th></tr>'
        + rows + '</table>'
        + '<p style="color:#5f6368;font-size:11px">' + CFG.APP_NAME + ' v' + CFG.VERSION
        + ' — rapport automatique quotidien. Exécutez REPORT_uninstall pour l\'arrêter.</p>'
    });
    // Enregistrement de l'état de référence UNIQUEMENT après succès de l'envoi
    props.setProperty(REPORT_STATE_KEY, JSON.stringify({ counts: counts, t: new Date().toISOString(), total: users.length }));
    apiLogEvent('report', users.length);
  } catch (err) {
    // Erreur d'envoi (ex: quota email) : ne pas écraser l'état pour retenter lors du prochain passage
  }
}

/** Installe (ou réinstalle) le déclencheur quotidien. À lancer une seule fois. */
function REPORT_install() {
  var acc = checkAccess_();
  if (!acc.allowed) return { ok: false, error: 'Accès refusé.' };
  REPORT_uninstall();
  ScriptApp.newTrigger('reportDaily').timeBased().everyDays(1).atHour(CFG.REPORT_HOUR).create();
  return { ok: true, hour: CFG.REPORT_HOUR, to: reportRecipients_() };
}

/** Retire le déclencheur quotidien. */
function REPORT_uninstall() {
  var acc = checkAccess_();
  if (!acc.allowed) return { ok: false, error: 'Accès refusé.' };
  ScriptApp.getProjectTriggers().forEach(function (t) {
    if (t.getHandlerFunction() === 'reportDaily') ScriptApp.deleteTrigger(t);
  });
  return { ok: true };
}

/* ==========================================================================
 *  5. CACHE CHUNKÉ (gzip + base64)
 * ======================================================================== */

function cachePut_(key, obj) {
  var cache = CacheService.getUserCache();
  var gz = Utilities.gzip(Utilities.newBlob(JSON.stringify(obj)));
  var b64 = Utilities.base64Encode(gz.getBytes());
  var n = Math.ceil(b64.length / CFG.CHUNK);
  if (n > 120) return false;                       // trop volumineux
  var map = {};
  for (var i = 0; i < n; i++) {
    map[key + '_' + i] = b64.substring(i * CFG.CHUNK, (i + 1) * CFG.CHUNK);
  }
  map[key + '_n'] = String(n);
  cache.putAll(map, CFG.CACHE_TTL);
  return true;
}

function cacheGet_(key) {
  try {
    var cache = CacheService.getUserCache();
    var n = parseInt(cache.get(key + '_n'), 10);
    if (!n) return null;
    var keys = [];
    for (var i = 0; i < n; i++) keys.push(key + '_' + i);
    var parts = cache.getAll(keys);
    var b64 = '';
    for (var j = 0; j < n; j++) {
      if (!parts[key + '_' + j]) return null;      // chunk expiré
      b64 += parts[key + '_' + j];
    }
    var blob = Utilities.newBlob(Utilities.base64Decode(b64), 'application/x-gzip', 'c.gz');
    return JSON.parse(Utilities.ungzip(blob).getDataAsString());
  } catch (err) { return null; }
}

function hash_(txt) {
  var raw = Utilities.computeDigest(Utilities.DigestAlgorithm.MD5, txt);
  return raw.map(function (b) { return ('0' + (b & 0xFF).toString(16)).slice(-2); }).join('').substring(0, 12);
}

/* ==========================================================================
 *  6. JEU DE DÉMONSTRATION (structure identique à l'API réelle)
 * ======================================================================== */

/**
 * Schémas de démonstration : structure réaliste, aucun nom de produit ni de
 * schéma propre à un domaine donné.
 */
function demoSchemas_() {
  return [
    {
      schemaName: 'Ressources_humaines', displayName: 'Ressources humaines', fields: [
        { fieldName: 'Matricule', displayName: 'Matricule', fieldType: 'INT64', multiValued: false },
        { fieldName: 'Statut', displayName: 'Statut', fieldType: 'STRING', multiValued: false },
        { fieldName: 'Sous_service', displayName: 'Sous-service', fieldType: 'STRING', multiValued: false },
        { fieldName: 'Site', displayName: 'Site', fieldType: 'STRING', multiValued: false },
        { fieldName: 'Date_entree', displayName: 'Date d\'entrée', fieldType: 'DATE', multiValued: false }
      ]
    },
    {
      schemaName: 'Applications', displayName: 'Applications', fields: [
        { fieldName: 'Intranet', displayName: 'Accès intranet', fieldType: 'BOOL', multiValued: false },
        { fieldName: 'Ticketing', displayName: 'Accès ticketing', fieldType: 'BOOL', multiValued: false }
      ]
    }
  ];
}

/**
 * Domaine utilisé par le jeu de démonstration : celui du compte exécutant,
 * pour que l'outil reste cohérent sur n'importe quelle console. Aucune valeur
 * de domaine n'est écrite en dur.
 */
function demoDomain_() {
  try {
    var mail = Session.getEffectiveUser().getEmail() || currentUser_() || '';
    var dom = mail.split('@')[1];
    if (dom) return dom;
  } catch (err) { /* contexte sans identité : on retombe sur le domaine d'exemple */ }
  return 'exemple.test';
}

/**
 * Jeu de démonstration : 12 comptes ENTIÈREMENT FICTIFS.
 * Aucune personne, adresse ou identifiant réel ne doit figurer ici — ce
 * fichier circule, se partage et se copie d'un projet à l'autre.
 * Les numéros mobiles utilisent la plage 06 39 98 XX XX, réservée par l'ARCEP
 * aux œuvres de fiction : ils ne peuvent être attribués à personne.
 */
function demoUsers_() {
  var domaine = demoDomain_();
  var societe = domaine.split('.')[0].toUpperCase();

  //     prénom     nom          fonction                     service            sous-service        statut             site      matricule adm  2sv  2sv+  dernière connexion            OU
  var seeds = [
    ['Alix',    'BERTRAND',  'Responsable applicatif',     'Systèmes d\'information', 'Outils collaboratifs', 'Cadre',            'Site Nord', 10001, false, true,  true,  '2026-08-12T18:51:46.000Z', '/Standard', 'female'],
    ['Camille', 'DUVAL',     'Directeur des systèmes d\'information', 'Systèmes d\'information', 'Direction', 'Cadre',   'Site Nord', 10002, true,  true,  true,  '2026-08-13T06:12:02.000Z', '/Standard', 'other'],
    ['Noé',     'FONTAINE',  'Ingénieur méthodes',         'Production',       'Méthodes',          'Cadre',            'Site Nord', 10003, false, true,  false, '2026-08-11T15:22:10.000Z', '/Standard', 'male'],
    ['Inès',    'MARCHAND',  'Responsable d\'exploitation','Exploitation',     'Secteur Est',       'Agent de maîtrise','Site Sud',  10004, false, false, false, '2026-06-02T07:45:00.000Z', '/Standard', 'female'],
    ['Rayan',   'PERRIN',    'Analyste',                   'Finance',          'Contrôle de gestion', 'Cadre',          'Site Nord', 10005, false, true,  true,  '2026-08-13T05:58:31.000Z', '/Standard', 'male'],
    ['Lou',     'GARNIER',   'Conducteur de ligne',        'Production',       'Ligne 3',           'Ouvrier',          'Site Nord', 10006, false, false, false, '1970-01-01T00:00:00.000Z', '/Terrain',  'other'],
    ['Sarah',   'LEMOINE',   'Responsable qualité',        'Qualité',          'Laboratoire',       'Cadre',            'Site Nord', 10007, false, true,  true,  '2026-08-10T09:03:44.000Z', '/Standard', 'female'],
    ['Tom',     'ROUX',      'Technicien logistique',      'Logistique',       'Planning transport','Agent de maîtrise','Site Sud',  10008, false, true,  false, '2026-03-19T11:20:05.000Z', '/Standard', 'male'],
    ['Manon',   'GIRAUD',    'Assistante RH',              'Ressources humaines', 'Paie',           'Employé',          'Site Nord', 10009, false, true,  true,  '2026-08-12T16:40:12.000Z', '/Standard', 'female'],
    ['Elias',   'BLANC',     'Développeur',                'Systèmes d\'information', 'Études et développement', 'Cadre','Site Nord', 10010, false, true,  true,  '2026-08-13T07:31:09.000Z', '/Standard', 'male'],
    ['Jade',    'MERCIER',   'Chargée de communication',   'Communication',    'Marque employeur',  'Cadre',            'Site Nord', 10011, false, true,  false, '2025-11-28T13:12:55.000Z', '/Standard', 'female'],
    ['Hugo',    'CHEVALIER', 'Chauffeur',                  'Transport',        'Flotte Ouest',      'Ouvrier',          'Site Sud',  10012, false, false, false, '2026-01-07T05:11:40.000Z', '/Terrain',  'male'],
    ['Service', 'SUPPORT',   'Support Informatique',       'Systèmes d\'information', 'Helpdesk',  'Service',          'Site Nord', 10098, false, true,  true,  '2026-08-13T04:00:00.000Z', '/Services', 'other'],
    ['Contact', 'ACCUEIL',   'Standard & Accueil',         'Moyens Généraux',  'Accueil',           'Générique',        'Site Nord', 10099, false, false, false, '2026-08-13T04:00:00.000Z', '/Services', 'other']
  ];

  var mgrDsi = norm_(seeds[1][0]) + '.' + norm_(seeds[1][1]) + '@' + domaine;   // Camille DUVAL (DSI)
  var mgrApp = norm_(seeds[0][0]) + '.' + norm_(seeds[0][1]) + '@' + domaine;   // Alix BERTRAND (Resp. applicatif)
  var mgrExp = norm_(seeds[3][0]) + '.' + norm_(seeds[3][1]) + '@' + domaine;   // Inès MARCHAND (Resp. exploitation)

  return seeds.map(function (s, i) {
    var login = norm_(s[0]) + '.' + norm_(s[1]);
    var sud = (s[6] === 'Site Sud');
    var suspendu = (i === 10);

    // Hiérarchie réaliste multi-niveaux
    var mgr = mgrDsi;
    if (i === 1 || i >= 12) mgr = '';                  // DSI (racine) ou comptes de service (aucun manager)
    else if (i === 9) mgr = mgrApp;                    // Elias (Dev) reporte à Alix (Resp App)
    else if (i === 5 || i === 7) mgr = mgrExp;         // Lou (Conducteur) et Tom (Logistique) reportent à Inès (Resp Exp)
    else if (i === 11) mgr = '';                       // Hugo (Chauffeur) sans manager (Anomalie RH volontaire)

    return {
      id: '900000000000000000' + (10 + i),
      primaryEmail: login + '@' + domaine,
      name: { givenName: s[0], familyName: s[1], fullName: s[0] + ' ' + s[1] },
      isAdmin: s[8], isDelegatedAdmin: (i < 2),
      lastLoginTime: s[11],
      creationTime: new Date(2014 + (i % 11), (i * 3) % 12, 1 + (i % 27)).toISOString(),
      agreedToTerms: true, suspended: suspendu, archived: false,
      changePasswordAtNextLogin: (i === 5), ipWhitelisted: false,
      emails: [{ address: login + '@' + domaine, primary: true }],
      relations: mgr ? [{ value: mgr, type: 'manager' }] : [],
      addresses: [{ type: 'work', formatted: sud ? '4 route des Ateliers - 00000 Ville-Sud'
                                                 : '1 avenue de l\'Exemple - 00000 Ville-Nord' }],
      organizations: [{
        name: societe, title: s[2], primary: true, customType: 'work',
        department: s[3], description: (i % 3 === 0 ? 'Équipé' : 'Non équipé'),
        costCenter: (i % 4 === 0 ? 'Aucune' : 'CC' + (400 + i))
      }],
      phones: [{ value: String(13000 + i * 7), type: 'home' }]
        .concat(i % 3 === 0 ? [] : [{ value: '+33 6 39 98 ' + (10 + i) + ' ' + (20 + i), type: 'mobile' }]),
      languages: [{ languageCode: 'fr', preference: 'preferred' }]
        .concat(i % 4 === 0 ? [{ languageCode: 'en', preference: 'preferred' }] : []),
      websites: [{ value: 'https://' + domaine, primary: true, type: 'work' }],
      locations: [{
        type: 'desk', area: 'desk', buildingId: sud ? 'BAT-SUD-02' : 'BAT-NORD-01',
        floorName: (i % 2 ? 'Rez-de-chaussée' : '1er étage'),
        floorSection: (i % 2 ? 'Aile Sud' : 'Aile Nord'),
        deskCode: '1.3.' + (100 + i) + '.C'
      }],
      gender: { type: s[13] },
      customerId: 'C00000demo',
      orgUnitPath: s[12],
      isMailboxSetup: !suspendu,
      isEnrolledIn2Sv: s[9], isEnforcedIn2Sv: s[10],
      includeInGlobalAddressList: true,
      thumbnailPhotoUrl: '',
      customSchemas: {
        Ressources_humaines: {
          Matricule: s[7], Statut: s[5], Sous_service: s[4], Site: s[6],
          Date_entree: (2014 + (i % 11)) + '-0' + (1 + (i % 9)) + '-1' + (i % 9)
        },
        Applications: { Intranet: (i % 3 !== 0), Ticketing: (i < 4) }
      },
      recoveryEmail: (i % 3 === 0 ? login + '@exemple.test' : ''),
      recoveryPhone: (i % 3 === 0 ? '+33639981' + (10 + i) : '')
    };
  });
}

function norm_(s) {
  return String(s).toLowerCase()
    .normalize('NFD').replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z]+/g, '-');
}

/* ==========================================================================
 *  7. TESTS RAPIDES (à lancer depuis l'éditeur)
 * ======================================================================== */

function TEST_bootstrap() { Logger.log(JSON.stringify(apiBootstrap(), null, 2)); }

function TEST_load() {
  var r = apiLoadUsers({ force: true });
  Logger.log('source=%s count=%s elapsed=%sms', r.source, r.meta && r.meta.count, r.meta && r.meta.elapsed);
  if (r.users && r.users.length) Logger.log(JSON.stringify(r.users[0], null, 2));
}