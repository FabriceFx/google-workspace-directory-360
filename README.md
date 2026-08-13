# Annuaire 360°

🇺🇸 [English version below](#english-version)

## 🇫🇷 Français

**Annuaire 360°** est une application web Google Apps Script puissante conçue pour explorer l'intégralité des champs de vos comptes Google Workspace. 

Vous passez des heures à fouiller dans la console d'administration pour retrouver quel collaborateur n'a pas activé la validation en deux étapes, ou à jongler entre des exports CSV interminables pour vérifier la qualité de vos données RH ? *Annuaire 360°* vous épargne cette douleur. En quelques clics, l'outil vous donne un accès plat et immédiat à **tous** les champs (y compris vos schémas personnalisés), pour ne plus jamais naviguer à l'aveugle.

### 📋 Prérequis

1. **Droits d'accès** : Le compte exécutant le script doit être un super-administrateur ou un administrateur délégué possédant le droit "Utilisateurs > Lire" (privilège API Directory).
2. **Services Google** :
   - Le service avancé **Admin SDK API** (identifiant `AdminDirectory`) doit être activé dans Apps Script (`Services > + > Admin SDK API`).
   - L'API **Admin SDK** doit être activée dans le projet Google Cloud (GCP) associé à ce script.

### ⚙️ Installation et Configuration

1. Créez un nouveau projet Google Apps Script et copiez-y les fichiers (`Code.gs`, `Index.html`, `Stylesheet.html`, `Script.html`, `appsscript.json`).
2. Configurez les accès dans le fichier `Code.gs` au niveau de l'objet `CFG` :
   - Renseignez `ALLOWED_EMAILS` (liste blanche nominative) ou `ALLOWED_GROUP` (groupe Google Workspace) pour restreindre l'accès à l'outil. C'est **indispensable** pour la sécurité.
3. Déployez l'application :
   - Allez dans **Déployer > Nouveau déploiement > Application web**.
   - **Exécuter en tant que** : *Moi* (le compte admin).
   - **Qui a accès** : *Tous les utilisateurs du domaine*.

### ⚖️ Licence

Ce projet est sous licence MIT.

---

<a name="english-version"></a>
## 🇺🇸 English

**Annuaire 360°** (Directory 360°) is a powerful Google Apps Script web application designed to explore the entirety of your Google Workspace account fields.

Spending hours digging through the admin console to find out which employee hasn't enabled 2-step verification, or juggling endless CSV exports to check your HR data quality? *Annuaire 360°* saves you from this pain. In a few clicks, the tool gives you flat and immediate access to **all** fields (including your custom schemas), so you never have to navigate blindly again.

### 📋 Requirements

1. **Access Rights**: The account executing the script must be a super admin or a delegated admin with "Users > Read" permissions (Directory API privilege).
2. **Google Services**:
   - The **Admin SDK API** advanced service (identifier `AdminDirectory`) must be enabled in Apps Script (`Services > + > Admin SDK API`).
   - The **Admin SDK API** must be enabled in the Google Cloud Project (GCP) associated with this script.

### ⚙️ Installation and Configuration

1. Create a new Google Apps Script project and copy the files (`Code.gs`, `Index.html`, `Stylesheet.html`, `Script.html`, `appsscript.json`) into it.
2. Configure access control in the `Code.gs` file within the `CFG` object:
   - Fill in `ALLOWED_EMAILS` (allowlist) or `ALLOWED_GROUP` (Google Workspace group) to restrict access to the tool. This is **mandatory** for security.
3. Deploy the application:
   - Go to **Deploy > New deployment > Web app**.
   - **Execute as**: *Me* (the admin account).
   - **Who has access**: *Anyone within the domain*.

### ⚖️ License

This project is licensed under the MIT License.
