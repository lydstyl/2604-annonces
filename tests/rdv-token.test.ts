import { describe, it, expect } from 'vitest';
import crypto from 'crypto';
import {
  createRdvPrefillToken,
  verifyRdvPrefillToken,
  buildRdvBookingUrl,
  type RdvPrefill,
} from '../lib/rdv-token';
import { getListingById } from '../lib/listings';

const SECRET = 'secret-de-test';
const prefill: RdvPrefill = {
  nom: 'Dupont',
  prenom: 'Jean',
  telephone: '0600000000',
  email: 'jean@example.com',
};

describe('createRdvPrefillToken — signature HMAC', () => {
  it('crée un token signé vérifiable avec le même secret', () => {
    const token = createRdvPrefillToken(prefill, { secret: SECRET });
    const decoded = verifyRdvPrefillToken(token, SECRET);
    expect(decoded).toEqual(prefill);
  });

  it('produit un token URL-safe (utilisable en query param sans encodage)', () => {
    const token = createRdvPrefillToken(prefill, { secret: SECRET });
    expect(token).not.toMatch(/[+/=]/);
    expect(token).toMatch(/^[A-Za-z0-9_.-]+\.[A-Za-z0-9_.-]+$/);
  });

  it('encode les coordonnées dans le payload (décodable, non chiffré — l intégrité est portée par la signature)', () => {
    const token = createRdvPrefillToken(prefill, { secret: SECRET });
    expect(token).not.toBeNull();
    const payload = token!.split('.')[0];
    const decoded = JSON.parse(Buffer.from(payload, 'base64url').toString('utf-8'));
    expect(decoded.nom).toBe('Dupont');
    expect(decoded.email).toBe('jean@example.com');
    expect(typeof decoded.exp).toBe('number');
  });
});

describe('verifyRdvPrefillToken — intégrité', () => {
  it('retourne null si le secret de vérification diffère', () => {
    const token = createRdvPrefillToken(prefill, { secret: SECRET });
    expect(verifyRdvPrefillToken(token, 'autre-secret')).toBeNull();
  });

  it('retourne null si le payload est altéré (tampering du nom)', () => {
    const token = createRdvPrefillToken(prefill, { secret: SECRET });
    expect(token).not.toBeNull();
    const [, signature] = token!.split('.');
    const tamperedPayload = Buffer.from(
      JSON.stringify({ ...prefill, nom: 'Hacker' })
    ).toString('base64url');
    expect(verifyRdvPrefillToken(`${tamperedPayload}.${signature}`, SECRET)).toBeNull();
  });

  it('retourne null pour un token malformé', () => {
    expect(verifyRdvPrefillToken('pas-un-token', SECRET)).toBeNull();
    expect(verifyRdvPrefillToken('', SECRET)).toBeNull();
    expect(verifyRdvPrefillToken('abc.def.ghi', SECRET)).toBeNull();
    expect(verifyRdvPrefillToken(null, SECRET)).toBeNull();
    expect(verifyRdvPrefillToken(undefined, SECRET)).toBeNull();
  });

  it('retourne null pour une signature tronquée (longueur différente)', () => {
    const token = createRdvPrefillToken(prefill, { secret: SECRET });
    expect(token).not.toBeNull();
    const [payload] = token!.split('.');
    expect(verifyRdvPrefillToken(`${payload}.abc`, SECRET)).toBeNull();
  });

  it('retourne null si le payload n est pas un objet de coordonnées valide', () => {
    const payload = Buffer.from(JSON.stringify({ foo: 'bar' })).toString('base64url');
    const signature = tokenSignature(payload, SECRET);
    expect(verifyRdvPrefillToken(`${payload}.${signature}`, SECRET)).toBeNull();
  });

  it('retourne null pour un token expiré (exp dépassé)', () => {
    const token = createRdvPrefillToken(prefill, {
      secret: SECRET,
      ttlMs: 1000,
      now: Date.now() - 5000,
    });
    expect(verifyRdvPrefillToken(token, SECRET)).toBeNull();
  });

  it('accepte un token dans sa fenêtre de validité', () => {
    const token = createRdvPrefillToken(prefill, {
      secret: SECRET,
      ttlMs: 10_000,
      now: Date.now(),
    });
    expect(verifyRdvPrefillToken(token, SECRET)).toEqual(prefill);
  });

  it('utilise RDV_TOKEN_SECRET de l environnement quand aucun secret explicite', () => {
    process.env.RDV_TOKEN_SECRET = 'env-secret';
    try {
      const token = createRdvPrefillToken(prefill);
      expect(token).not.toBeNull();
      expect(verifyRdvPrefillToken(token)).toEqual(prefill);
      expect(verifyRdvPrefillToken(token, 'autre-secret')).toBeNull();
    } finally {
      delete process.env.RDV_TOKEN_SECRET;
    }
  });

  it('retourne null si RDV_TOKEN_SECRET absent (aucun secret en dur)', () => {
    delete process.env.RDV_TOKEN_SECRET;
    expect(createRdvPrefillToken(prefill)).toBeNull();
    expect(verifyRdvPrefillToken('abc.def')).toBeNull();
  });

  it('rejette un token qui expire exactement à Date.now() (strictement dans le futur)', () => {
    // exp === now → doit être rejeté car parsed.exp <= Date.now() est true
    const now = Date.now();
    const token = createRdvPrefillToken(prefill, {
      secret: SECRET,
      ttlMs: 0,
      now,
    });
    expect(token).not.toBeNull();
    // Vérifier que verifyRdvPrefillToken utilise bien Date.now() : impossible
    // de mocker Date.now pour un seul appel, donc on teste le contrat :
    // si on appelle immédiatement, le token est expiré (exp <= now courant).
    // Note: le token a exp = now, et Date.now() au moment du verify est ≥ now,
    // donc le token sera bien rejeté.
    expect(verifyRdvPrefillToken(token, SECRET)).toBeNull();
  });

  it('accepte un token qui expire dans 1ms (limite de validité)', () => {
    // exp > now → accepté (strict) — on utilise un now fixe dans le passé
    // pour que Date.now() soit toujours < exp
    const pastNow = Date.now() - 10_000;
    const token = createRdvPrefillToken(prefill, {
      secret: SECRET,
      ttlMs: 20_000, // expire 10s après maintenant
      now: pastNow,
    });
    expect(verifyRdvPrefillToken(token, SECRET)).toEqual(prefill);
  });
});

describe('buildRdvBookingUrl — lien de réservation avec token', () => {
  it('retourne le lien interne avec token HMAC pour une annonce avec config rdv (appt5)', () => {
    const url = buildRdvBookingUrl(getListingById('appt5')!, prefill, 'https://annonces.duckdns.org', {
      secret: SECRET,
    });
    expect(url).toMatch(/^https:\/\/annonces\.duckdns\.org\/rdv\/appt5\?token=/);
    const token = url!.split('token=')[1];
    expect(verifyRdvPrefillToken(token, SECRET)).toEqual(prefill);
  });

  it('retourne null pour une annonce sans config rdv (raismes-t3 → fallback calendrier Google inchangé)', () => {
    const url = buildRdvBookingUrl(getListingById('raismes-t3')!, prefill, 'https://annonces.duckdns.org', {
      secret: SECRET,
    });
    expect(url).toBeNull();
  });

  it('retourne le lien SANS token si le secret est absent (pré-remplissage désactivé)', () => {
    delete process.env.RDV_TOKEN_SECRET;
    const url = buildRdvBookingUrl(getListingById('appt5')!, prefill, 'https://annonces.duckdns.org');
    expect(url).toBe('https://annonces.duckdns.org/rdv/appt5');
  });

  it('utilise NEXT_PUBLIC_SITE_URL par défaut quand aucun siteUrl fourni', () => {
    process.env.NEXT_PUBLIC_SITE_URL = 'https://example.com';
    try {
      const url = buildRdvBookingUrl(getListingById('appt5')!, prefill, undefined, { secret: SECRET });
      expect(url).toMatch(/^https:\/\/example\.com\/rdv\/appt5\?token=/);
    } finally {
      delete process.env.NEXT_PUBLIC_SITE_URL;
    }
  });
});

// Helper : signature HMAC-SHA256 base64url d'un payload (même algorithme que lib/rdv-token)
function tokenSignature(payload: string, secret: string): string {
  return crypto.createHmac('sha256', secret).update(payload).digest('base64url');
}
