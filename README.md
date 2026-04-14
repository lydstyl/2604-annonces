# Annonces Immobilières

Application web de gestion de location immobilière construite avec Next.js 16.

## 🏠 Fonctionnalités

- Affichage d'annonces immobilières avec carrousel d'images
- Intégration vidéo YouTube et Google Maps
- Formulaire de candidature en ligne
- Notifications par email automatiques
- Stockage des candidatures au format JSON
- Design responsive et moderne avec Tailwind CSS

## 🚀 Installation

```bash
# Installer les dépendances
npm install

# Copier et configurer les variables d'environnement
cp .env.local.example .env.local
# Éditer .env.local avec vos informations SMTP

# Lancer le serveur de développement
npm run dev
```

L'application sera accessible sur [http://localhost:3000](http://localhost:3000)

## 📝 Configuration Email

Pour recevoir les notifications par email, configurez les variables SMTP dans `.env.local` :

```env
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=votre_email@gmail.com
SMTP_PASSWORD=votre_mot_de_passe_app_16_caracteres
EMAIL_FROM=votre_email@gmail.com  # Doit être identique à SMTP_USER
EMAIL_TO=lydstyl@gmail.com
```

### ⚠️ Important : Mot de passe d'application Gmail

**NE PAS utiliser votre mot de passe Gmail habituel !**

Le `SMTP_PASSWORD` doit être un **mot de passe d'application** (16 caractères) généré spécifiquement pour cette application.

#### Comment obtenir un mot de passe d'application Gmail :

1. **Activer la validation en 2 étapes** sur votre compte Google (obligatoire)
   - Aller sur : https://myaccount.google.com/security
   - Activer la "Validation en deux étapes"

2. **Générer un mot de passe d'application**
   - Aller sur : https://myaccount.google.com/apppasswords
   - Sélectionner "Application" → "Autre (nom personnalisé)"
   - Taper "Annonces Immobilières" (ou un autre nom)
   - Cliquer sur "Générer"
   - **Copier le mot de passe de 16 caractères** (exemple : `abcd efgh ijkl mnop`)

3. **Coller ce mot de passe dans `.env.local`**
   ```env
   SMTP_PASSWORD=abcdefghijklmnop
   ```
   Note : Enlever les espaces si présents

Ce mot de passe est différent de votre mot de passe Gmail et ne permet que l'envoi d'emails via SMTP.

### 📬 Note sur EMAIL_FROM

- **EMAIL_FROM doit être identique à SMTP_USER** pour éviter les rejets
- Gmail et la plupart des serveurs SMTP n'autorisent pas l'envoi avec un expéditeur différent du compte authentifié
- N'utilisez pas un email inexistant ou différent, cela causera des erreurs d'envoi

## 🗺️ Configuration Google Maps (Optionnel)

L'application fonctionne **sans clé API Google Maps** en utilisant un embed basique. Cependant, pour une meilleure intégration et fonctionnalités avancées, vous pouvez obtenir une clé API gratuite.

### Comment obtenir une clé API Google Maps :

1. **Aller sur Google Cloud Console**
   - Accédez à : https://console.cloud.google.com/

2. **Créer un nouveau projet** (ou utiliser un projet existant)
   - Cliquer sur le sélecteur de projet en haut
   - Cliquer sur "Nouveau projet"
   - Nommer le projet : "Annonces Immobilières"
   - Cliquer sur "Créer"

3. **Activer l'API Maps Embed**
   - Aller dans le menu ≡ → "APIs & Services" → "Library"
   - Rechercher "Maps Embed API"
   - Cliquer dessus et cliquer sur "Activer"

4. **Créer une clé API**
   - Aller dans ≡ → "APIs & Services" → "Credentials"
   - Cliquer sur "+ CREATE CREDENTIALS" → "API key"
   - **Copier la clé** (format : `AIzaSyXxXxXxXxXxXxXxXxXxXxXxXxXxXxX`)

5. **Sécuriser la clé (recommandé)**
   - Cliquer sur la clé créée pour l'éditer
   - Sous "Application restrictions" → Choisir "HTTP referrers (web sites)"
   - Ajouter votre domaine : `votre-domaine.com/*` et `localhost:3000/*`
   - Sous "API restrictions" → Choisir "Restrict key"
   - Sélectionner uniquement "Maps Embed API"
   - Cliquer sur "Save"

6. **Ajouter la clé dans `.env.local`**
   ```env
   NEXT_PUBLIC_GOOGLE_MAPS_API_KEY=AIzaSyXxXxXxXxXxXxXxXxXxXxXxXxXxXxX
   ```

### 💰 Tarification Google Maps

- **Gratuit jusqu'à 28 000 chargements de cartes par mois**
- Au-delà : $7 pour 1000 chargements supplémentaires
- Pour une petite application, vous resterez largement dans les limites gratuites

### ⚠️ Sans clé API

Si vous ne configurez pas `NEXT_PUBLIC_GOOGLE_MAPS_API_KEY`, l'application utilisera un embed Google Maps basique qui fonctionne mais peut avoir des limitations (watermark, moins de fonctionnalités).

## 🏗️ Structure du Projet

```
app/                      # Pages Next.js (App Router)
  ├── annonce/[id]/       # Pages d'annonces
  ├── candidature/[id]/   # Formulaires de candidature
  └── api/                # Routes API
components/               # Composants React réutilisables
lib/                      # Utilitaires et logique métier
public/images/            # Images des annonces
data/                     # Stockage JSON des candidatures
```

## 🔧 Commandes Disponibles

```bash
npm run dev      # Serveur de développement
npm run build    # Build de production
npm start        # Démarrer le serveur de production
npm run lint     # Linter le code
```

## 🚢 Déploiement

### Avec PM2

```bash
# Build de production
npm run build

# Démarrer avec PM2
pm2 start "npm start" --name "annonces-immobilier"

# Sauvegarder la configuration PM2
pm2 save
```

### Configuration Nginx

Exemple de configuration Nginx en reverse proxy :

```nginx
server {
    listen 80;
    server_name votre-domaine.fr;

    location / {
        proxy_pass http://localhost:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_cache_bypass $http_upgrade;
    }
}
```

## 📦 Technologies Utilisées

- **Next.js 16.2.3** - Framework React
- **React 19** - Bibliothèque UI
- **TypeScript 5.6** - Typage statique
- **Tailwind CSS 3.4** - Framework CSS
- **Nodemailer** - Envoi d'emails

## 📄 Ajouter une Nouvelle Annonce

1. Ajoutez les images dans `public/images/`
2. Éditez `lib/listings.ts` et ajoutez une nouvelle entrée dans l'objet `listings`
3. Les pages seront générées automatiquement au build

## 📋 Licence

Ce projet est privé et destiné à un usage personnel.
