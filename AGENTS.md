# AGENTS.md — annonces (annonces.duckdns.org)

Guide de référence pour les agents travaillant sur ce repo (pipeline app-update).

## Stack

- Next.js 16.2.3 (App Router), React 19, TypeScript 5.6 strict, Tailwind 3.4
- Données : fichiers JSON dans `data/` (candidatures.json, leads.json) — **gitignorés**
- Email : nodemailer SMTP (lib/email.ts) vers lydstyl@gmail.com
- Google Sheets : synchro candidatures via lib/sheets.ts (token ~/.hermes/google_token.json — monté en lecture seule dans le conteneur Docker : `/root/.hermes/google_token.json:ro`)
- **Déploiement : Docker (migration en cours depuis PM2 + Nginx).** Port interne : **3011** (`network_mode: host`). Domaine : https://annonces.duckdns.org

## Commandes

```bash
npm run build        # production build (next build)
npm run start        # next start (port 3011 via ENV PORT — PM2 ou CMD du conteneur Docker)
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

### Migration Docker (étape 6 — build UNIQUEMENT, PAS de basculement)

```bash
docker compose build        # build image multi-stage node:22 (deps → builder → runner)
docker compose config       # valide : PORT=3011, env_file .env.local, volumes data + token Google
# ⚠️ NE PAS arrêter PM2, NE PAS démarrer le conteneur ici.
# Le basculement PM2 → Docker se fait à l'étape 7, avec l'accord explicite de Gabriel.
```

### Docker (nouveau déploiement, une fois basculé)

- **Dockerfile** : multi-stage `node:22-slim` (deps `npm ci --omit=dev` → builder `npm ci` + `next build` → runner). Non-standalone : `node_modules` + `.next` + `public` + `package.json` + `next.config.mjs` copiés dans le runner. `ENV PORT=3011`, `EXPOSE 3011`.
- **docker-compose.yml** : `network_mode: host` → le conteneur écoute directement sur **127.0.0.1:3011**, Nginx inchangé. `env_file: .env.local` (runtime uniquement — `.dockerignore` exclut `.env.local` du build ; les `NEXT_PUBLIC_*` ont des fallbacks).
- **Volumes** : `./data:/app/data` (JSON gitignorés persistés sur l'hôte) ; `~/.hermes/google_token.json:/root/.hermes/google_token.json:ro` — requis par `lib/sheets.ts` et `lib/calendar.ts` (`os.homedir()` = `/root` dans le conteneur).
- **.dockerignore** : node_modules, .git, .next, data, .env.local, *.md.

### Health checks (après basculement, étape 7)

```bash
# ⚠️ CRITIQUE : vérifier le proxy_pass du vhost Nginx annonces (/etc/nginx/sites-available/annonces)
# doit pointer vers http://127.0.0.1:3011 (il a déjà pointé vers 3027 mort → 502 en prod, 08/08/2026)
curl -s http://localhost:3011/annonce/raismes-t3                 # health check local
curl -s -o /dev/null -w "%{http_code}" https://annonces.duckdns.org/rdv/appt5   # health check VIA LE DOMAINE (toujours)
```

### Ancien déploiement PM2 (référence pendant la migration)

```bash
npm run build
pm2 restart annonces-immobilier   # ⚠️ un seul process (id variable) — `next start -p 3011`
```

Ne JAMAIS commiter `data/*.json`, `data/*.bak`, `.env*` (dans .gitignore). Ne pas merger vers main : push branche feature uniquement.

## Conventions

- TypeScript strict, pas de `any`
- Fonctions pures testables pour la logique métier (ex: eligibility)
- Tests : vitest, tests unitaires de logique (pas de rendu UI)
