# AGENTS.md — annonces (annonces.duckdns.org)

Guide de référence pour les agents travaillant sur ce repo (pipeline app-update).

## Stack

- Next.js 16.2.3 (App Router), React 19, TypeScript 5.6 strict, Tailwind 3.4
- Données : fichiers JSON dans `data/` (candidatures.json, leads.json) — **gitignorés**
- Email : nodemailer SMTP (lib/email.ts) vers lydstyl@gmail.com
- Google Sheets : synchro candidatures via lib/sheets.ts (token ~/.hermes/google_token.json)
- **Déploiement : PM2 + Nginx, PAS Docker.** Port interne : **3011**. Domaine : https://annonces.duckdns.org

## Commandes

```bash
npm run build        # production build (next build)
npm run start        # next start (PM2 lance ceci avec -p 3011)
npm run lint         # next lint
npm run test         # vitest (à installer par le pipeline si absent)
npx tsc --noEmit     # type checking
```

## Structure

- `app/annonce/[id]/page.tsx` — page annonce (générée statiquement via generateStaticParams)
- `app/candidature/[id]/` — formulaire + confirmation
- `app/api/candidatures/[id]/route.ts` — POST : valide → saveCandidature → email → sheets
- `components/` — ApplicationForm, FAQSection, ImageCarousel, VideoEmbed, MapEmbed
- `lib/listings.ts` — **données des annonces (prix, FAQ, conditions)** — source de vérité du contenu
- `lib/storage.ts` — CRUD candidatures/leads JSON
- `lib/email.ts` — envoi d'emails nodemailer
- `lib/sheets.ts` — écriture Google Sheet Admin (gid=715080568, spreadsheet 1rZ9NOGgLcBHKwVQvtwjvB3A0k5BZ5eC46LhbMffQM50)

## Règles métier (raismes-t3)

- Loyer : 630 € + 35 € charges = **665 €/mois CC**
- **Seuil GLI (assurance MAIF/Solly Azar) : loyer CC ≤ 33% des revenus nets → revenus ≥ ~2 016 €** (665/0.33 = 2015,15 → arrondi 2016)
- 3× loyer = 1 995 €
- **Auto-email RDV** (nouvelle feature) : éligible si `cdiPlus3Mois === true` ET (`revenusMenuels >= 2016` OU (`revenusMenuels >= 1995` ET `peutFournirGarant === true` — garantie Visale))
- Lien calendrier RDV : https://calendar.app.google/DQPx7dskXd7bY6bq8
- L'email de notification à lydstyl@gmail.com part TOUJOURS (toute candidature, conditions ou non)
- Critères GLI : CDI hors période d'essai ou fonctionnaire ; CDD ≥ 12 mois restants accepté si taux d'effort ≤ 25% ; allocations CAF prises à 50% max ; demandeur d'emploi/RSA exclu ; pièces : CNI, 3 bulletins, contrat, avis d'imposition, justificatif domicile, RIB

## Déploiement (agent BUILD)

```bash
npm run build
pm2 restart annonces-immobilier   # ⚠️ 2 process PM2 du même nom existent (id 2 et 3) — restart les deux ou par id
curl -s http://localhost:3011/annonce/raismes-t3   # health check
```

Ne JAMAIS commiter `data/*.json`, `data/*.bak`, `.env*` (dans .gitignore). Ne pas merger vers main : push branche feature uniquement.

## Conventions

- TypeScript strict, pas de `any`
- Fonctions pures testables pour la logique métier (ex: eligibility)
- Tests : vitest, tests unitaires de logique (pas de rendu UI)
