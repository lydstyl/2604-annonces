import crypto from 'crypto';
import type { Listing } from './listings';

// ============ Token HMAC de pré-remplissage RDV ============
//
// Le lien de réservation de visite envoyé dans l'auto-email RDV porte un token
// signé HMAC-SHA256 contenant les coordonnées du candidat. À l'ouverture de la
// page /rdv/[listingId]?token=..., le formulaire est pré-rempli si la signature
// est valide. Le token n'est PAS chiffré : l'intégrité est portée par la
// signature, pas la confidentialité (les coordonnées restent lisibles en
// base64url — c'est le but : on peut les décoder côté client pour pré-remplir).

export interface RdvPrefill {
  nom: string;
  prenom: string;
  telephone: string;
  email: string;
}

// Payload interne du token : coordonnées + expiration (timestamp ms)
interface RdvTokenPayload extends RdvPrefill {
  exp: number;
}

// TTL par défaut du lien de réservation : 30 jours (fenêtre de réservation
// J+1..J+21 + marge pour que le candidat puisse cliquer après réception)
export const DEFAULT_TOKEN_TTL_MS = 30 * 24 * 60 * 60 * 1000;

// Nom de la variable d'env portant le secret HMAC (à définir dans .env.local).
// Si le secret est absent, AUCUN token n'est émis : le lien de réservation
// reste sans token (comportement historique) — jamais de secret en dur.
export const RDV_TOKEN_SECRET_ENV = 'RDV_TOKEN_SECRET';

export interface CreateTokenOptions {
  secret?: string;
  ttlMs?: number;
  now?: number;
}

function getSecret(explicit?: string): string | null {
  if (explicit) return explicit;
  const envSecret = process.env[RDV_TOKEN_SECRET_ENV];
  if (envSecret) return envSecret;
  console.warn(
    `[rdv-token] ${RDV_TOKEN_SECRET_ENV} non défini — aucun token émis, lien sans pré-remplissage`
  );
  return null;
}

function sign(payload: string, secret: string): string {
  return crypto.createHmac('sha256', secret).update(payload).digest('base64url');
}

function encodePayload(payload: RdvTokenPayload): string {
  return Buffer.from(JSON.stringify(payload), 'utf-8').toString('base64url');
}

/**
 * Crée un token signé contenant les coordonnées du candidat + expiration.
 * Format : `<base64url(payload)>.<base64url(hmac-sha256)>` — URL-safe.
 * Retourne `null` si le secret n'est pas défini (aucun token émis —
 * l'appelant retombe sur le lien sans token, comportement historique).
 */
export function createRdvPrefillToken(
  prefill: RdvPrefill,
  options: CreateTokenOptions = {}
): string | null {
  const secret = getSecret(options.secret);
  if (!secret) return null;

  const ttlMs = options.ttlMs ?? DEFAULT_TOKEN_TTL_MS;
  const now = options.now ?? Date.now();

  const payload = encodePayload({ ...prefill, exp: now + ttlMs });
  return `${payload}.${sign(payload, secret)}`;
}

/**
 * Vérifie un token et retourne les coordonnées si la signature est valide
 * ET le token non expiré. Retourne null sinon (token invalide, altéré,
 * expiré, malformé ou secret différent).
 */
export function verifyRdvPrefillToken(
  token: string | null | undefined,
  secret?: string
): RdvPrefill | null {
  if (!token) return null;

  const parts = token.split('.');
  if (parts.length !== 2) return null;
  const [payload, signature] = parts;

  const secretValue = getSecret(secret);
  if (!secretValue) return null;

  const expected = sign(payload, secretValue);
  // Comparaison en temps constant pour éviter les timing attacks
  const sigBuf = Buffer.from(signature);
  const expBuf = Buffer.from(expected);
  if (sigBuf.length !== expBuf.length || !crypto.timingSafeEqual(sigBuf, expBuf)) {
    return null;
  }

  let parsed: RdvTokenPayload;
  try {
    parsed = JSON.parse(Buffer.from(payload, 'base64url').toString('utf-8'));
  } catch {
    return null;
  }

  // Validation stricte de la forme du payload
  if (
    typeof parsed !== 'object' ||
    parsed === null ||
    typeof parsed.nom !== 'string' ||
    typeof parsed.prenom !== 'string' ||
    typeof parsed.telephone !== 'string' ||
    typeof parsed.email !== 'string' ||
    typeof parsed.exp !== 'number'
  ) {
    return null;
  }

  // Expiration : strictement dans le futur
  if (parsed.exp <= Date.now()) {
    return null;
  }

  return {
    nom: parsed.nom,
    prenom: parsed.prenom,
    telephone: parsed.telephone,
    email: parsed.email,
  };
}

/**
 * Construit le lien de réservation interne porteur du token HMAC pour une
 * annonce disposant d'une config RDV intégrée. Retourne null pour une annonce
 * sans config (raismes-t3 → fallback calendrier Google, comportement inchangé).
 */
export function buildRdvBookingUrl(
  listing: Listing,
  prefill: RdvPrefill,
  siteUrl?: string,
  options: CreateTokenOptions = {}
): string | null {
  if (!listing.rdv) return null;
  const base = siteUrl ?? process.env.NEXT_PUBLIC_SITE_URL ?? 'https://annonces.duckdns.org';
  const token = createRdvPrefillToken(prefill, options);
  // Secret absent → lien sans token (pré-remplissage désactivé, comportement historique)
  if (!token) return `${base}/rdv/${listing.id}`;
  return `${base}/rdv/${listing.id}?token=${encodeURIComponent(token)}`;
}
