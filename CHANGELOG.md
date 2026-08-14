# Changelog / Historique des versions

Toutes les modifications notables apportées à ce projet seront documentées dans ce fichier. / All notable changes to this project will be documented in this file.

## [1.15.0] - 2026-08-14

### 🇫🇷 Français

**L'arborescence managériale prend vie.**

Un organigramme d'entreprise ne devrait pas être un fichier PowerPoint périmé ou un graphe pollué par des dizaines de comptes génériques (`contact@`, `support@`). Un clic génère désormais l'arborescence hiérarchique interactive en temps réel, isole intelligemment les comptes de service et met en lumière les collaborateurs oubliés sans responsable déclaré.

- ✨ **Organigramme dynamique** : arbre hiérarchique interactif (zoom, déploiement/repli des branches, cartes collaborateur avec photo, poste et département).
- 🤖 **Détection des comptes génériques** : isolation automatique des comptes techniques, de service et de ressources pour préserver la clarté managériale.
- ⚠️ **Audit des non-rattachés** : volet latéral dédié identifiant immédiatement les collaborateurs sans manager déclaré (anomalie RH).
- 🔍 **Recherche et filtres** : recherche en temps réel dans l'arbre et bascule pour masquer/afficher les comptes techniques.

### 🇺🇸 English

**The managerial hierarchy comes to life.**

A corporate org chart shouldn't be an outdated slide deck or a graph cluttered with generic service accounts (`contact@`, `support@`). One click now generates an interactive real-time reporting tree, cleanly isolates service accounts, and highlights members left without a declared manager.

- ✨ **Interactive Org Chart**: real-time reporting tree (zoom, expand/collapse branches, member cards with photo, title, and department).
- 🤖 **Generic account detection**: automatic isolation of service, shared, and resource accounts to keep the human hierarchy clear.
- ⚠️ **Unassigned audit**: dedicated side tray identifying members without a manager (HR onboarding anomaly).
- 🔍 **Search and filters**: instant search highlighting across the tree and toggle to hide/show service accounts.

## [1.14.0] - 2026-08-13

### 🇫🇷 Français

**L'annuaire sort de son navigateur.**

Un tableau filtré ne devrait pas mourir dans un CSV. Un clic l'envoie désormais dans Google Sheets — classé dans un dossier dédié du Drive de l'admin, partagé en lecture avec le demandeur, sans risque d'injection de formule puisque les valeurs sont écrites en tant que données. Et pendant que vous dormez, un contrôle quotidien surveille les indicateurs critiques (admins sans 2SV, comptes sans récupération…) et ne vous écrit que quand quelque chose a changé.

- ✨ **Export Google Sheets** : classeur créé côté serveur, rangé dans « Annuaire 360° – Exports », partagé en lecture, purge automatique à 30 jours, journalisé.
- ✨ **Rapports planifiés** : déclencheur quotidien (REPORT_install), 5 contrôles de sécurité/qualité, e-mail uniquement en cas de variation des compteurs, échantillon des comptes concernés.
- 🔒 **Scopes** : ajout au manifeste de `spreadsheets`, `drive.file` (restreint aux fichiers créés par l'app), `script.scriptapp` et `script.send_mail` — nouvelle autorisation à accorder au premier lancement.

### 🇺🇸 English

**The directory leaves the browser.**

A filtered table shouldn't die in a CSV. One click now sends it to Google Sheets — filed in a dedicated folder in the admin's Drive, shared read-only with the requester, immune to formula injection since values are written as data. And while you sleep, a daily check watches critical indicators (admins without 2SV, accounts without recovery…) and only writes to you when something changed.

- ✨ **Google Sheets export**: server-side spreadsheet, filed under “Annuaire 360° – Exports”, shared read-only, 30-day auto-purge, logged.
- ✨ **Scheduled reports**: daily trigger (REPORT_install), 5 security/quality checks, e-mail only when counters change, sample of affected accounts.
- 🔒 **Scopes**: manifest now includes `spreadsheets`, `drive.file` (restricted to app-created files), `script.scriptapp` and `script.send_mail` — re-consent required on first launch.

## [1.13.0] - 2026-08-13

### 🇫🇷 Français

**L'outil devient un poste de pilotage.**

Jusqu'ici, Annuaire 360° répondait à vos questions. Désormais, il vous en pose : qui partage un numéro de téléphone ? Quel manager déclaré n'existe plus ? Combien d'actifs sans 2SV ce matin ? Tuiles de synthèse en page d'accueil, détection d'anomalies croisées, vues sauvegardées pour vos audits récurrents, filtre par unité organisationnelle et journal d'usage : l'annuaire ne se contente plus d'être exploré, il se surveille.

- ✨ **Tuiles KPI** : synthèse cliquable en tête du mode simple (comptes, actifs sans 2SV, admins, jamais connectés, suspendus, alertes).
- ✨ **Onglet Anomalies** : détection des noms en double, téléphones et e-mails de secours partagés, managers introuvables ou suspendus.
- ✨ **Vues sauvegardées** : filtres, colonnes, tri et mode mémorisés par utilisateur, applicables en un clic.
- ✨ **Filtre de chargement** : restriction par unité organisationnelle et inclusion des comptes supprimés (≤ 20 jours) — côté serveur, sans charger tout le parc.
- 🔒 **Journal d'usage** : traçabilité des chargements et exports (qui, quand, combien), consultable depuis « À propos ».

### 🇺🇸 English

**The tool becomes a control tower.**

Until now, Annuaire 360° answered your questions. Now it asks its own: who shares a phone number? Which recorded manager no longer exists? How many active accounts lack 2SV this morning? Summary tiles on the landing page, cross-account anomaly detection, saved views for recurring audits, org-unit scoped loading and a usage log: the directory is no longer just explored — it is monitored.

- ✨ **KPI tiles**: clickable summary atop quick search (accounts, active without 2SV, admins, never signed in, suspended, alerts).
- ✨ **Anomalies tab**: duplicate full names, shared phone numbers and recovery e-mails, missing or suspended managers.
- ✨ **Saved views**: filters, columns, sort and mode stored per user, applied in one click.
- ✨ **Load scoping**: restrict by organizational unit and include deleted accounts (≤ 20 days) — server-side, without loading the whole estate.
- 🔒 **Usage log**: traceability of loads and exports (who, when, how many), available from “About”.

## [1.12.0] - 2026-08-13

### 🇫🇷 Français

**Le coût d'une erreur silencieuse.**

Un export CSV semble inoffensif — jusqu'au jour où un profil malicieux insère `=cmd|' /C calc'!A0` et qu'un administrateur double-clique sur le fichier généré. Un cache mal géré semble anodin — jusqu'à ce que vous preniez des décisions sur un jeu de données silencieusement tronqué. Cette mise à jour referme ces failles béantes avant même qu'elles ne fassent des dégâts. Vous gardez des données sûres, fiables et complètes.

- 🔒 **Sécurité** : Neutralisation des injections de formules Excel (CSV) et échappement natif des unités organisationnelles contenant des apostrophes.
- 🛡️ **Fiabilité** : Accès refusé par défaut si la configuration est vide (Fail-Closed) et prévention stricte de l'empoisonnement du cache serveur par le jeu de démonstration.
- ✨ **UX & UI** : Affichage résilient des résultats partiels en cas d'erreur API, restauration intelligente des colonnes en mode expert, et correction déterministe du tri des dates.

### 🇺🇸 English

**The cost of a silent failure.**

A CSV export seems harmless — until a malicious profile inserts `=cmd|' /C calc'!A0` and an administrator double-clicks the generated file. Poorly managed cache seems trivial — until you make decisions based on silently truncated data. This update closes these gaping holes before they can cause any damage. Your data remains secure, reliable, and complete.

- 🔒 **Security**: Neutralized Excel formula injections (CSV) and native escaping of organizational units containing apostrophes.
- 🛡️ **Reliability**: Access denied by default if configuration is empty (Fail-Closed) and strict prevention of server cache poisoning by the demo payload.
- ✨ **UX & UI**: Resilient display of partial results on API errors, smart restoration of expert columns, and deterministic date sorting fix.

## [1.11.0] - 2026-08-13

### 🇫🇷 Français

**Un grand ménage d'architecture.**

Un fichier de 2 200 lignes, c'est pratique à copier mais pénible à maintenir. L'interface est désormais découpée en trois fichiers aux responsabilités nettes : le squelette HTML et la configuration `BRAND` dans `Index.html`, la charte graphique dans `Stylesheet.html`, la logique applicative (i18n, événements, rendus) dans `Script.html`. Et au passage, l'application ne demande plus que les autorisations dont elle a réellement besoin.

- ♻️ **Refactoring** : séparation des responsabilités — `Index.html` (structure + configuration), `Stylesheet.html` (CSS), `Script.html` (JavaScript), assemblés via `include()` et `createTemplateFromFile`.
- 🔒 **Sécurité** : retrait du scope OAuth `script.external_request` (aucun appel `UrlFetchApp` dans le code — principe du moindre privilège).

### 🇺🇸 English

**A major architecture cleanup.**

A 2,200-line file is easy to copy but painful to maintain. The interface is now split into three files with clear responsibilities: the HTML skeleton and `BRAND` configuration in `Index.html`, the stylesheet in `Stylesheet.html`, and the application logic (i18n, events, renderers) in `Script.html`. Along the way, the app now requests only the permissions it actually needs.

- ♻️ **Refactoring**: separation of concerns — `Index.html` (structure + configuration), `Stylesheet.html` (CSS), `Script.html` (JavaScript), assembled via `include()` and `createTemplateFromFile`.
- 🔒 **Security**: removed the `script.external_request` OAuth scope (no `UrlFetchApp` call in the code — least-privilege principle).

## [1.10.0] - 2026-08-13

### 🇫🇷 Français

**La terre promise de vos données d'annuaire.**

Vous pensiez que croiser des données RH personnalisées avec l'état de la validation en deux étapes était un travail réservé aux scripts Python interminables. C'est faux. L'interface d'Annuaire 360° vous permet de filtrer, combiner et exporter absolument tous les champs de votre domaine Google Workspace directement depuis votre navigateur. Finie la frustration des exports CSV tronqués et du croisement de données sous Excel à 23h. Vous reprenez le contrôle total de la qualité de vos données, instantanément.

- ✨ **Ajout** : Documentation bilingue (`README.md`) et initialisation du `CHANGELOG.md`.
- ✨ **Moteur** : Application web complète (Mode Simple / Mode Expert) avec moteur de recherche aplati sur tout le JSON de l'Admin SDK.
- 🔒 **Sécurité** : Caching fragmenté (chunking) et protection par liste blanche (email / groupe).

### 🇺🇸 English

**The promised land of your directory data.**

You thought cross-referencing custom HR data with 2-step verification status was a job reserved for endless Python scripts. That's false. The Annuaire 360° interface lets you filter, combine, and export absolutely every field of your Google Workspace domain directly from your browser. Gone is the frustration of truncated CSV exports and late-night Excel data merging. You take back total control of your data quality, instantly.

- ✨ **Added**: Bilingual documentation (`README.md`) and initialization of `CHANGELOG.md`.
- ✨ **Engine**: Full web application (Simple Mode / Expert Mode) with a flattened search engine across all Admin SDK JSON.
- 🔒 **Security**: Fragmented caching (chunking) and allowlist protection (email / group).
