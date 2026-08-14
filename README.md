# Annuaire 360° — Explorateur & Audit Google Workspace

🇺🇸 [English version below](#english-version)

---

## 🇫🇷 Français

**Annuaire 360°** est une application web Google Apps Script autonome et moderne, conçue pour explorer, auditer et valoriser l'intégralité des données et champs de vos comptes Google Workspace (y compris les schémas personnalisés RH, relations hiérarchiques, statuts 2SV, équipements et localisations).

> 23h, un audit de sécurité tombe. Tu dois vérifier d'urgence quels administrateurs n'ont pas activé la double authentification, identifier les comptes fantômes inactifs depuis six mois et cartographier les liens hiérarchiques de 2 000 collaborateurs.
> 
> Dans la console d'administration Google Workspace standard, cela signifie des dizaines de clics, des filtres limités et des exports CSV bruts longs à retraiter dans des tableurs.
> 
> **Annuaire 360°** transforme cette corvée en une tour de contrôle instantanée, fluide et élégante.

---

### ✨ Fonctionnalités clés

- 🌳 **Organigramme hiérarchique dynamique** : Navigation interactive dans l'arborescence managériale (zoom, panoramique drag-to-pan, recherche debouncée, isolation de branches) avec détection et mise à l'écart des comptes techniques et détection des collaborateurs orphelins.
- 🛡️ **Audit de conformité & Registre centralisé (SSOT)** : Détection en temps réel des failles (admins sans 2SV, comptes suspendus, jamais connectés, mots de passe temporaires, absence de moyen de récupération).
- 🔍 **Double interface de recherche** :
  - *Mode Simple* : Questions métiers en langage naturel pour les équipes RH ou le support.
  - *Mode Expert* : Requêteur booléen complet (ET/OU, regex, dates relatives, `contient`, `est vide`) sur 100 % des champs du domaine.
- 📊 **Tableaux croisés dynamiques (Pivot)** : Répartition instantanée par service, statut, unité organisationnelle ou site.
- ⏱️ **Surveillance automatique quotidienne** : Déclencheur nocturne intelligent qui analyse le parc et n'envoie un rapport par e-mail que si des indicateurs ont varié (zéro fatigue d'alerte).
- ↗️ **Export Google Sheets sécurisé** : Génération en un clic d'un classeur Google Sheets classé dans Drive avec neutralisation stricte des risques d'injection de formules (`CSV / Formula Injection`).
- 💾 **Vues sauvegardées & Préférences isolées** : Chaque utilisateur autorisé enregistre et retrouve ses filtres et jeux de colonnes favoris en toute confidentialité.

---

### 🤖 Détection automatique des comptes techniques et de service

Dans un annuaire Google Workspace d'entreprise, les boîtes de rôle (`contact@`, `direction@`), les matériels (`salle-reunion@`, `tablette-01@`) et les comptes techniques polluent souvent les organigrammes et faussent les calculs RH s'ils sont traités comme des employés humains.

**Annuaire 360°** intègre un moteur heuristique à 4 niveaux (`isGenericAccount`) pour classifier automatiquement ces comptes et les isoler dans un volet dédié de l'organigramme :

1. **Branches d'unités organisationnelles (OU)** : Détection des conteneurs matériels ou techniques (`/Comptes de service`, `/Ressources partagées`, `/Salles`, `/Matériel`, `/Tablettes`, `/Bornes`, `/Robots`, `/Workspace Guests`). Les unités organisationnelles humaines (`/Sites`, `/Agences`, `/Ateliers`, `/Magasins`, `/Dépôts`) sont préservées afin de ne jamais masquer les employés de terrain.
2. **Préfixes d'e-mails de rôles** : Correspondance exacte sur les boîtes partagées et génériques courantes (`admin@`, `contact@`, `support@`, `info@`, `sav@`, `scanner@`, `noreply@`, `caisse@`, `accueil@`, `api@`, `helpdesk@`, etc.).
3. **Modèles d'adresses avec séparateurs** : Reconnaissance des schémas d'équipements ou prestataires (`admin.*`, `presta-*`, `caisse.01`, `ext-*`, `borne.*`, `magasin.*`, etc.).
4. **Mots-clés dans le nom complet** : Identification des ressources matérielles dans le nom d'affichage (`salle`, `room`, `robot`, `scanner`, `tablette`, `kiosk`, `borne`, `générique`, `prestataire`).

---

### 📋 Prérequis

1. **Compte administrateur Google Workspace** : Le compte qui installe et déploie le script doit être **super-administrateur** ou **administrateur délégué** disposant au minimum du privilège `Utilisateurs > Lire` de l'API Directory.
2. **Activation de l'API Admin SDK** :
   - Dans la console **Google Cloud Platform (GCP)** liée au projet, l'API **Admin SDK** doit être activée.
   - Dans l'éditeur **Google Apps Script**, le service avancé **Admin SDK API** (identifiant `AdminDirectory`) doit être ajouté (`Services > + > Admin SDK API`).

---

### 🚀 Guide d'installation et de mise en place

#### Étape 1 : Créer le projet Google Apps Script

##### Option A — Avec clasp (Recommandé pour les développeurs)
Si vous utilisez l'outil CLI [`@google/clasp`](https://github.com/google/clasp) :
```bash
# 1. Cloner le dépôt localement
git clone https://github.com/votre-compte/annuaire-360.git
cd annuaire-360

# 2. Vous connecter à votre compte Google Workspace
clasp login

# 3. Créer un projet Apps Script autonome (type webapp)
clasp create --title "Annuaire 360°" --type standalone

# 4. Pousser les fichiers vers Google Apps Script
clasp push
```

##### Option B — Depuis l'interface web Google Apps Script
1. Rendez-vous sur [script.google.com](https://script.google.com) et cliquez sur **Nouveau projet**.
2. Renommez le projet en **Annuaire 360°**.
3. Créez et collez le contenu des fichiers du projet :
   - `Code.gs` (Script)
   - `Index.html` (HTML)
   - `Stylesheet.html` (HTML)
   - `Script.html` (HTML)
   - `appsscript.json` (dans *Paramètres du projet* > cochez *Afficher le fichier manifeste "appsscript.json"*).
4. Dans le menu de gauche, cliquez sur **Services** (l'icône `+`), sélectionnez **Admin SDK API** (version `directory_v1`, identifiant `AdminDirectory`) et validez.

---

#### Étape 2 : Configurer les règles d'accès ([Code.gs](file:///Users/fabrice/Documents/Mes%20d%C3%A9veloppements/Annuaire%20360/Code.gs))

Ouvrez `Code.gs` et renseignez les autorisations dans l'objet `CFG` :

```javascript
const CFG = {
  APP_NAME: 'Annuaire 360°',
  VERSION: '1.17.0',
  CUSTOMER: 'my_customer',
  PAGE_SIZE: 500,
  MAX_USERS: 9000,

  // --- Contrôle d'accès OBLIGATOIRE ---
  // Option 1 : Liste blanche nominative d'adresses autorisées à ouvrir l'outil
  ALLOWED_EMAILS: [
    'dsi@mondomaine.fr',
    'responsable-rh@mondomaine.fr'
  ],

  // Option 2 : Groupe Google Workspace dont les membres ont accès
  ALLOWED_GROUP: 'admins-annuaire@mondomaine.fr',

  // --- Destinataires du rapport quotidien automatique ---
  REPORT_RECIPIENTS: ['dsi@mondomaine.fr'],
  REPORT_HOUR: 7 // Heure locale (ex: 7h du matin)
};
```

> [!IMPORTANT]
> **Sécurité essentielle** : Ne laissez pas `ALLOWED_EMAILS` et `ALLOWED_GROUP` vides. Toute personne qui accède à la webapp hérite des droits de lecture admin du compte déployeur : le contrôle d'accès applicatif vérifie l'identité réelle du visiteur et bloque immédiatement toute personne non autorisée.

---

#### Étape 3 : Personnaliser la marque et l'apparence ([Index.html](file:///Users/fabrice/Documents/Mes%20d%C3%A9veloppements/Annuaire%20360/Index.html))

Dans `Index.html`, ajustez si vous le souhaitez l'objet `BRAND` pour adapter l'application à vos couleurs d'entreprise :

```javascript
const BRAND = {
  nom:        'Annuaire',
  suffixe:    '360°',
  couleur:    '#1a73e8',   // Couleur primaire (bleu Google par défaut)
  couleurF:   '#174ea6',   // Teinte foncée
  accent:     '#ea4335',   // Couleur d'accentuation (alertes)
  accentTxt:  '#c5221f',
  police:     "'Inter', 'Google Sans', Roboto, Arial, sans-serif"
};
```

---

#### Étape 4 : Déployer l'application web

1. En haut à droite de l'éditeur Apps Script, cliquez sur **Déployer > Nouveau déploiement**.
2. Cliquez sur l'icône d'engrenage ⚙️ et choisissez **Application web**.
3. Renseignez la configuration suivante :
   - **Description** : `Annuaire 360° v1.17`
   - **Exécuter en tant que** : **Moi (votre adresse email admin)**  
     *(Ce réglage permet aux utilisateurs autorisés dans `ALLOWED_EMAILS` / `ALLOWED_GROUP` de requêter l'annuaire sans avoir eux-mêmes besoin d'être super-admins Workspace).*
   - **Qui a accès** : **Tous les utilisateurs de votre domaine** (ou *Tout le monde au sein du domaine*).
4. Cliquez sur **Déployer** et autorisez les autorisations d'accès Google Workspace requises.
5. Copiez l'**URL de l'application web** générée et partagez-la à vos utilisateurs autorisés.

---

#### Étape 5 : Activer la surveillance quotidienne automatique (Optionnel)

Pour recevoir chaque matin par e-mail une synthèse des anomalies ayant changé :
1. Dans l'éditeur Apps Script, sélectionnez la fonction **`REPORT_install`** dans la liste déroulante des fonctions.
2. Cliquez sur **Exécuter**.
3. Le déclencheur temporel quotidien est créé. Pour l'arrêter ultérieurement, exécutez simplement **`REPORT_uninstall`**.

---

### 👨‍💻 À propos

Outil conçu et développé par **Fabrice Faucheux**  
🌐 Site web : [https://faucheux.bzh](https://faucheux.bzh)

### ⚖️ Licence

Ce projet est distribué sous licence **MIT**.

---

<a name="english-version"></a>

## 🇺🇸 English

**Directory 360°** (Annuaire 360°) is a modern, standalone Google Apps Script web application engineered to explore, audit, and leverage the full spectrum of Google Workspace directory fields (including custom HR schemas, reporting lines, 2SV enforcement, assets, and building locations).

> It's 11 PM and a security compliance audit lands. You must immediately identify administrators lacking two-factor authentication, find ghost accounts inactive for over 6 months, and map reporting hierarchies across 2,000 employees.
> 
> In the standard Google Workspace Admin Console, this requires dozens of clicks, rigid filters, and painful CSV exports to clean up in spreadsheets.
> 
> **Directory 360°** turns this tedious task into an instant, seamless, and elegant control tower.

---

### ✨ Key Features

- 🌳 **Interactive Org Chart**: Real-time management hierarchy tree (smooth zoom, drag-to-pan, debounced search, branch isolation) with automated exclusion of service/generic accounts and orphaned member audits.
- 🛡️ **Compliance Audit & Central Rule Registry (SSOT)**: Instant risk detection (admins without 2SV, suspended users, never logged in, pending password resets, missing recovery info).
- 🔍 **Dual Query Engine**:
  - *Quick Search*: Natural language business questions tailored for HR and support teams.
  - *Expert Mode*: Full boolean query engine (AND/OR, regex, relative dates, `contains`, `is empty`) across 100% of domain fields.
- 📊 **Dynamic Pivot Tables**: Instant breakdowns by department, status, org unit, or site.
- ⏱️ **Automated Nightly Monitoring**: Smart background trigger auditing the estate and emailing you only when key metrics change (zero alert fatigue).
- ↗️ **Secure Google Sheets Export**: One-click Google Sheets generation organized in Google Drive with strict spreadsheet formula injection sanitization.
- 💾 **Saved Views & Isolated Preferences**: Every authorized user saves and restores custom filters and column layouts with complete privacy.

---

### 🤖 Smart Detection of Service & Generic Accounts

In an enterprise Google Workspace directory, role mailboxes (`contact@`, `direction@`), devices (`meeting-room@`, `tablet-01@`), and service accounts often clutter reporting trees and skew HR audits if handled as human employees.

**Directory 360°** features a 4-tier heuristic engine (`isGenericAccount`) to automatically classify and isolate non-human accounts into a dedicated side panel in the Org Chart:

1. **Org Unit (OU) Container Filtering**: Detection of hardware and technical organizational units (`/Service Accounts`, `/Shared Resources`, `/Rooms`, `/Hardware`, `/Tablets`, `/Kiosks`, `/Robots`, `/Workspace Guests`). Functional business units (`/Sites`, `/Branches`, `/Workshops`, `/Retail Stores`, `/Warehouses`) remain untouched so that on-site personnel are never masked.
2. **Role & Functional Email Prefixes**: Exact matching on common shared/role mailboxes (`admin@`, `contact@`, `support@`, `info@`, `sav@`, `scanner@`, `noreply@`, `pos@`, `frontdesk@`, `api@`, `helpdesk@`, etc.).
3. **Structured Technical Email Patterns**: Recognition of prefix patterns with delimiters (`admin.*`, `contractor-*`, `pos.01`, `ext-*`, `kiosk.*`, `store.*`, etc.).
4. **Display Name Keywords**: Unambiguous hardware/resource keywords in the user's full name (`salle`, `room`, `robot`, `scanner`, `tablette`, `kiosk`, `borne`, `generic`, `contractor`).

---

### 📋 Prerequisites

1. **Google Workspace Admin Account**: The account deploying the application must be a **Super Admin** or a **Delegated Admin** with at least `Users > Read` Directory API privileges.
2. **Admin SDK API Activation**:
   - The **Admin SDK** must be enabled in the associated Google Cloud Platform (GCP) project.
   - The **Admin SDK API** advanced service (identifier `AdminDirectory`) must be added in the Apps Script editor (`Services > + > Admin SDK API`).

---

### 🚀 Step-by-Step Setup Guide

#### Step 1: Create the Google Apps Script Project

##### Option A — Using clasp (Recommended for developers)
Using [`@google/clasp`](https://github.com/google/clasp):
```bash
# 1. Clone the repository
git clone https://github.com/your-username/annuaire-360.git
cd annuaire-360

# 2. Login to your Workspace account
clasp login

# 3. Create a standalone web app project
clasp create --title "Directory 360°" --type standalone

# 4. Push files to Apps Script
clasp push
```

##### Option B — Via Google Apps Script Web Editor
1. Go to [script.google.com](https://script.google.com) and click **New project**.
2. Rename the project to **Directory 360°**.
3. Create and paste the contents of each source file:
   - `Code.gs` (Script)
   - `Index.html` (HTML)
   - `Stylesheet.html` (HTML)
   - `Script.html` (HTML)
   - `appsscript.json` (In *Project Settings* > check *Show "appsscript.json" manifest file in editor*).
4. On the left menu, click **Services** (`+`), select **Admin SDK API** (version `directory_v1`, identifier `AdminDirectory`) and confirm.

---

#### Step 2: Configure Access Control ([Code.gs](file:///Users/fabrice/Documents/Mes%20d%C3%A9veloppements/Annuaire%20360/Code.gs))

Open `Code.gs` and configure authorization in the `CFG` object:

```javascript
const CFG = {
  APP_NAME: 'Annuaire 360°',
  VERSION: '1.17.0',
  CUSTOMER: 'my_customer',
  PAGE_SIZE: 500,
  MAX_USERS: 9000,

  // --- MANDATORY Access Control ---
  // Option 1: Allowlist of specific email addresses
  ALLOWED_EMAILS: [
    'cio@mydomain.com',
    'hr-lead@mydomain.com'
  ],

  // Option 2: Google Workspace group containing authorized users
  ALLOWED_GROUP: 'directory-auditors@mydomain.com',

  // --- Daily automated audit report recipients ---
  REPORT_RECIPIENTS: ['cio@mydomain.com'],
  REPORT_HOUR: 7 // Local time (e.g. 7:00 AM)
};
```

> [!IMPORTANT]
> **Critical Security Note**: Never leave both `ALLOWED_EMAILS` and `ALLOWED_GROUP` empty. Because the web app runs as the admin deployer, the built-in access control strictly verifies the active visitor's identity and blocks unauthorized users immediately.

---

#### Step 3: Customize Branding & Styles ([Index.html](file:///Users/fabrice/Documents/Mes%20d%C3%A9veloppements/Annuaire%20360/Index.html))

In `Index.html`, update the `BRAND` object to match your corporate colors and typography:

```javascript
const BRAND = {
  nom:        'Directory',
  suffixe:    '360°',
  couleur:    '#1a73e8',   // Primary brand color
  couleurF:   '#174ea6',   // Darker shade
  accent:     '#ea4335',   // Alert / accent color
  accentTxt:  '#c5221f',
  police:     "'Inter', 'Google Sans', Roboto, Arial, sans-serif"
};
```

---

#### Step 4: Deploy as a Web Application

1. In the top right of the Apps Script editor, click **Deploy > New deployment**.
2. Click the gear icon ⚙️ and select **Web app**.
3. Configure the deployment settings:
   - **Description**: `Directory 360° v1.17`
   - **Execute as**: **Me (your admin email address)**  
     *(This allows authorized users in `ALLOWED_EMAILS` / `ALLOWED_GROUP` to query the directory without needing super-admin rights themselves).*
   - **Who has access**: **Anyone within your domain**.
4. Click **Deploy** and grant the requested Google Workspace permissions.
5. Copy the generated **Web app URL** and share it with your authorized users.

---

#### Step 5: Enable Automated Daily Audit (Optional)

To receive a daily morning email summary when directory anomalies change:
1. In the Apps Script editor, select the **`REPORT_install`** function in the top toolbar.
2. Click **Run**.
3. The recurring time-driven trigger is installed. To disable it at any time, run **`REPORT_uninstall`**.

---

### 👨‍💻 About

Designed and developed by **Fabrice Faucheux**  
🌐 Website: [https://faucheux.bzh](https://faucheux.bzh)

### ⚖️ License

This project is licensed under the **MIT License**.
