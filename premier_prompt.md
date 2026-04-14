Crée une application web complète pour la gestion de location immobilière.

STACK :

- Next.js (App Router)
- TypeScript
- HTML / Tailwind pour la partie CSS (design moderne, responsive, mobile-first)
- Utiliser des composants propres et réutilisables

OBJECTIF :
Créer un site permettant de publier une annonce immobilière et de collecter automatiquement des candidatures via un formulaire simple.

FONCTIONNALITÉS :

1. PAGE ANNONCE (/annonce/[id])

Afficher une annonce immobilière avec :

TITRE :
Spacieux T3 de 85 m² – Raismes Centre – Disponible de suite

CONTENU :

🏡 Spacieux T3 de 85 m² – Raismes Centre – Disponible de suite

📍 Situé en plein centre de Raismes, proche de toutes commodités (commerces, gare, bus, centre commercial de Petite Forêt).

✨ Les points forts :

- Appartement lumineux de 85 m²
- Grande cuisine équipée avec branchements lave-vaisselle et lave-linge
- Salon spacieux
- 2 chambres confortables
- Salle d’eau moderne avec douche et WC
- Chauffage au gaz (économique et performant)
- Volets roulants sur toutes les fenêtres
- Fibre optique disponible pour un Internet haut débit
- Stationnement facile à proximité

💶 Loyer & charges :

- Loyer : 610 € / mois
- Charges : 35 € / mois
- Dépôt de garantie : 610 €

✅ Conditions de location :

- Revenus nets ≥ 3 × le loyer charges comprises
- Au moins 1 CDI dans le foyer (hors période d’essai)
- Dossier complet demandé

📅 Disponible aujourd'hui

ÉLÉMENTS VISUELS :

- carrousel avec images (voir les images dans le dossier)
- intégration d’une vidéo YouTube https://www.youtube.com/watch?v=CLYk4N3QttI
- carte Google Maps (Raismes centre)
- section FAQ (questions / réponses)

BOUTON :

- "Je suis intéressé" → redirige vers le formulaire

---

2. FORMULAIRE DE CANDIDATURE (/candidature/[id])

Formulaire simple avec les champs suivants :

- nom
- prénom
- téléphone
- email
- revenus mensuels
- case à cocher : "Je peux fournir un garant ou une garantie"
- champ texte libre : "Remarques / informations complémentaires"

BOUTON :

- "Envoyer ma candidature"

---

3. BACKEND (API Routes Next.js)

- stocker les candidatures dans un fichier JSON ou une base simple
- chaque soumission doit être enregistrée

EMAIL (OBLIGATOIRE) :

- envoyer un email à : lydstyl@gmail.com pour CHAQUE candidature (même si elle ne respecte pas les conditions)
- inclure toutes les informations du formulaire dans l’email

---

4. DESIGN

- moderne
- propre
- responsive (mobile-first)
- UX simple et fluide
- bouton call-to-action visible

---

5. STRUCTURE DU PROJET

- utiliser App Router de Next.js
- organiser le code proprement :
  - components
  - app
  - lib
  - api

---

6. BONUS

- prévoir facilement l’ajout de nouvelles annonces
- rendre le code facilement modifiable

---

7. DÉPLOIEMENT

Le projet doit être prêt pour un déploiement sur serveur personnel avec :

- build Next.js (npm run build)
- lancement avec Node.js
- utilisation de PM2 pour gérer le processus
- configuration avec Nginx comme reverse proxy

Le code doit être compatible avec cet environnement.

---

CONTRAINTES :

- code clair, maintenable
- éviter les dépendances inutiles
- commentaires utiles dans le code
- fournir un fichier .gitignore adapté
