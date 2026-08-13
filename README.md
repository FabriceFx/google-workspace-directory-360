# Annuaire 360°

🇺🇸 [English version below](#english-version)

## 🇫🇷 Français

**Annuaire 360°** est une application web Google Apps Script puissante conçue pour explorer et auditer l'intégralité des champs de vos comptes Google Workspace. 

Tu penses qu'un annuaire d'entreprise n'est qu'une base de contacts statique et ennuyeuse, bonne à être consultée une fois par an ? C'est faux. Ton annuaire est la base de données la plus critique de ton système d'information. Rester dans le noir avec des exports CSV illisibles, c'est laisser des failles de sécurité ouvertes et la qualité de tes données RH se dégrader silencieusement. 

Imagine une tour de contrôle qui surveille ta donnée en temps réel, audite automatiquement tes failles (administrateurs sans 2FA, comptes fantômes), mémorise tes requêtes les plus complexes, et t'alerte par e-mail chaque matin avant même ton premier café. Ce n'est plus une promesse lointaine, c'est ce que t'offre **Annuaire 360°**.

### ✨ Fonctionnalités phares
- **Data Quality & Anomalies** : Détection automatique des risques (comptes suspendus, sans double authentification, jamais connectés, etc.) via un onglet dédié.
- **Rapports quotidiens automatiques** : Un déclencheur surveille l'annuaire chaque nuit et vous alerte par e-mail uniquement en cas de nouvelle anomalie (zéro fatigue d'alerte).
- **Exports Google Sheets sécurisés** : Export direct de vos requêtes vers Google Drive avec neutralisation stricte des risques d'injection de formules (CSV Injection).
- **Vues sauvegardées** : Mémorisez vos filtres et configurations de colonnes pour les rejouer en un clic.
- **KPIs visuels** : Des indicateurs clés dynamiques (Glassmorphism, Material Design 3) pour piloter l'état de votre parc.
- **Journal d'usage** : Suivi des accès et de l'utilisation de l'outil.

### 📋 Prérequis
1. **Droits d'accès** : Le compte exécutant le script doit être un super-administrateur ou un administrateur délégué possédant le droit "Utilisateurs > Lire" (privilège API Directory).
2. **Services Google** :
   - Le service avancé **Admin SDK API** (identifiant `AdminDirectory`) doit être activé dans Apps Script (`Services > + > Admin SDK API`).
   - L'API **Admin SDK** doit être activée dans le projet Google Cloud (GCP) associé à ce script.

### ⚙️ Installation et Configuration
1. Créez un nouveau projet Google Apps Script et copiez-y les fichiers sources (`Code.gs`, `Index.html`, `Stylesheet.html`, `Script.html`, `appsscript.json`).
2. Configurez les accès dans le fichier `Code.gs` au niveau de l'objet `CFG` :
   - Renseignez `ALLOWED_EMAILS` (liste blanche nominative) ou `ALLOWED_GROUP` (groupe Google Workspace) pour restreindre l'accès à l'outil. C'est **indispensable** pour la sécurité.
3. (Optionnel) Exécutez la fonction `REPORT_install` depuis l'éditeur pour activer le suivi quotidien par e-mail.
4. Déployez l'application :
   - Allez dans **Déployer > Nouveau déploiement > Application web**.
   - **Exécuter en tant que** : *Moi* (le compte admin).
   - **Qui a accès** : *Tous les utilisateurs du domaine*.

### 👨‍💻 À propos
Outil conçu et développé par **Fabrice Faucheux** ([https://faucheux.bzh](https://faucheux.bzh)).

### ⚖️ Licence
Ce projet est sous licence MIT.

---

<a name="english-version"></a>
## 🇺🇸 English

**Directory 360°** (Annuaire 360°) is a powerful Google Apps Script web application designed to explore and audit the entirety of your Google Workspace account fields.

You might think a corporate directory is just a static, boring contact list you check once a year. That's a limiting belief. Your directory is the most critical database in your IT ecosystem. Staying in the dark with unreadable CSV exports means leaving security vulnerabilities wide open and letting your HR data silently degrade.

Imagine a control tower that monitors your data in real-time, automatically audits vulnerabilities (admins without 2FA, ghost accounts), remembers your most complex queries, and alerts you by email every morning before your first coffee. This is no longer a distant promise—it's exactly what **Directory 360°** delivers.

### ✨ Key Features
- **Data Quality & Anomalies**: Automatic detection of risks (suspended accounts, no 2-step verification, never logged in, etc.) through a dedicated tab.
- **Automated Daily Reports**: A nightly trigger monitors the directory and emails you only when a new anomaly is detected (zero alert fatigue).
- **Secure Google Sheets Exports**: Direct export of your queries to Google Drive with strict sanitization against spreadsheet formula injections.
- **Saved Views**: Save your filters and column configurations to replay them with a single click.
- **Visual KPIs**: Dynamic key performance indicators (Glassmorphism, Material Design 3) to oversee your fleet at a glance.
- **Usage Log**: Native tracking of tool access and usage.

### 📋 Requirements
1. **Access Rights**: The account executing the script must be a super admin or a delegated admin with "Users > Read" permissions (Directory API privilege).
2. **Google Services**:
   - The **Admin SDK API** advanced service (identifier `AdminDirectory`) must be enabled in Apps Script (`Services > + > Admin SDK API`).
   - The **Admin SDK API** must be enabled in the Google Cloud Project (GCP) associated with this script.

### ⚙️ Installation and Configuration
1. Create a new Google Apps Script project and copy the source files (`Code.gs`, `Index.html`, `Stylesheet.html`, `Script.html`, `appsscript.json`) into it.
2. Configure access control in the `Code.gs` file within the `CFG` object:
   - Fill in `ALLOWED_EMAILS` (allowlist) or `ALLOWED_GROUP` (Google Workspace group) to restrict access. This is **mandatory** for security.
3. (Optional) Run the `REPORT_install` function from the editor to enable the daily email monitoring.
4. Deploy the application:
   - Go to **Deploy > New deployment > Web app**.
   - **Execute as**: *Me* (the admin account).
   - **Who has access**: *Anyone within the domain*.

### 👨‍💻 About
Designed and developed by **Fabrice Faucheux** ([https://faucheux.bzh](https://faucheux.bzh)).

### ⚖️ License
This project is licensed under the MIT License.
