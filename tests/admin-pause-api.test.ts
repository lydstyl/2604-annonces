import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import fs from 'fs/promises';
import os from 'os';
import path from 'path';
import { NextRequest } from 'next/server';
import { GET, POST } from '../app/api/admin/pause/route';
import { getAllListings, getListingById } from '../lib/listings';
import { getPausedListingIds, setListingPaused } from '../lib/pause';

// ===== Setup : fichier de pause isolé par test =====
let tmpDir: string;

beforeEach(async () => {
  tmpDir = await fs.mkdtemp(path.join(os.tmpdir(), 'pause-api-test-'));
  process.env.PAUSED_LISTINGS_FILE = path.join(tmpDir, 'paused-listings.json');
});

afterEach(async () => {
  delete process.env.PAUSED_LISTINGS_FILE;
  await fs.rm(tmpDir, { recursive: true, force: true });
});

// ===== Helpers =====
const ADMIN_PASSWORD = 'test-admin-pass';

function makeRequest(method: string, body?: object, overrides?: Record<string, string>): Request {
  const headers = new Headers({
    'Content-Type': 'application/json',
    ...overrides,
  });
  return new Request('http://localhost/api/admin/pause', {
    method,
    headers,
    body: body ? JSON.stringify(body) : undefined,
  });
}

async function jsonFromResponse(res: Response): Promise<any> {
  return res.json();
}

// ===== Tests GET — statut pause de toutes les annonces =====
describe('GET /api/admin/pause — résumé du statut pause', () => {
  it('retourne 401 sans header x-admin-auth', async () => {
    const req = makeRequest('GET');
    const res = await GET(req as NextRequest);
    expect(res.status).toBe(401);
    const body = await jsonFromResponse(res);
    expect(body.error).toBe('Non autorisé');
  });

  it('retourne 401 avec un mot de passe incorrect', async () => {
    process.env.ADMIN_PASSWORD = ADMIN_PASSWORD;
    const req = makeRequest('GET', undefined, { 'x-admin-auth': 'wrong-password' });
    const res = await GET(req as NextRequest);
    expect(res.status).toBe(401);
    const body = await jsonFromResponse(res);
    expect(body.error).toBe('Non autorisé');
  });

  it('retourne 200 avec le bon mot de passe', async () => {
    process.env.ADMIN_PASSWORD = ADMIN_PASSWORD;
    const req = makeRequest('GET', undefined, { 'x-admin-auth': ADMIN_PASSWORD });
    const res = await GET(req as NextRequest);
    expect(res.status).toBe(200);
    const body = await jsonFromResponse(res);
    expect(body).toHaveProperty('listings');
    expect(Array.isArray(body.listings)).toBe(true);
  });

  it('retourne le statut de toutes les annonces', async () => {
    process.env.ADMIN_PASSWORD = ADMIN_PASSWORD;
    // Mettons une annonce en pause avant le GET
    await setListingPaused('raismes-t3', true);
    const req = makeRequest('GET', undefined, { 'x-admin-auth': ADMIN_PASSWORD });
    const res = await GET(req as NextRequest);
    const body = await jsonFromResponse(res);
    expect(body.listings).toHaveLength(getAllListings().length);
    const raismesStatus = body.listings.find((l: any) => l.id === 'raismes-t3');
    expect(raismesStatus.paused).toBe(true);
    const appt5Status = body.listings.find((l: any) => l.id === 'appt5');
    expect(appt5Status.paused).toBe(false);
  });

  it('chaque entrée contient id, title, type, paused', async () => {
    process.env.ADMIN_PASSWORD = ADMIN_PASSWORD;
    const req = makeRequest('GET', undefined, { 'x-admin-auth': ADMIN_PASSWORD });
    const res = await GET(req as NextRequest);
    const body = await jsonFromResponse(res);
    for (const entry of body.listings) {
      expect(typeof entry.id).toBe('string');
      expect(entry.id.length).toBeGreaterThan(0);
      expect(typeof entry.title).toBe('string');
      expect(entry.title.length).toBeGreaterThan(0);
      expect(typeof entry.type).toBe('string');
      expect(typeof entry.paused).toBe('boolean');
    }
  });
});

// ===== Tests POST — mise en pause / reprise d'une annonce =====
describe('POST /api/admin/pause — toggle pause par annonce', () => {
  it('retourne 401 sans authentification', async () => {
    const req = makeRequest('POST', { id: 'raismes-t3', paused: true });
    const res = await POST(req as NextRequest);
    expect(res.status).toBe(401);
  });

  it('retourne 401 avec un mot de passe incorrect', async () => {
    process.env.ADMIN_PASSWORD = ADMIN_PASSWORD;
    const req = makeRequest(
      'POST',
      { id: 'raismes-t3', paused: true },
      { 'x-admin-auth': 'wrong' }
    );
    const res = await POST(req as NextRequest);
    expect(res.status).toBe(401);
  });

  it('retourne 400 si l id est manquant', async () => {
    process.env.ADMIN_PASSWORD = ADMIN_PASSWORD;
    const req = makeRequest(
      'POST',
      { paused: true },
      { 'x-admin-auth': ADMIN_PASSWORD }
    );
    const res = await POST(req as NextRequest);
    expect(res.status).toBe(400);
    const body = await jsonFromResponse(res);
    expect(body.error).toBe('ID manquant');
  });

  it('retourne 400 si l id est une chaîne vide', async () => {
    process.env.ADMIN_PASSWORD = ADMIN_PASSWORD;
    const req = makeRequest(
      'POST',
      { id: '', paused: true },
      { 'x-admin-auth': ADMIN_PASSWORD }
    );
    const res = await POST(req as NextRequest);
    expect(res.status).toBe(400);
    const body = await jsonFromResponse(res);
    expect(body.error).toBe('ID manquant');
  });

  it('retourne 400 si paused n est pas un booléen', async () => {
    process.env.ADMIN_PASSWORD = ADMIN_PASSWORD;
    const req = makeRequest(
      'POST',
      { id: 'raismes-t3', paused: 'true' },
      { 'x-admin-auth': ADMIN_PASSWORD }
    );
    const res = await POST(req as NextRequest);
    expect(res.status).toBe(400);
    const body = await jsonFromResponse(res);
    expect(body.error).toBe('paused doit être un booléen');
  });

  it('retourne 400 si paused est un nombre', async () => {
    process.env.ADMIN_PASSWORD = ADMIN_PASSWORD;
    const req = makeRequest(
      'POST',
      { id: 'raismes-t3', paused: 1 },
      { 'x-admin-auth': ADMIN_PASSWORD }
    );
    const res = await POST(req as NextRequest);
    expect(res.status).toBe(400);
  });

  it('retourne 404 si l annonce nexiste pas', async () => {
    process.env.ADMIN_PASSWORD = ADMIN_PASSWORD;
    const req = makeRequest(
      'POST',
      { id: 'non-existante', paused: true },
      { 'x-admin-auth': ADMIN_PASSWORD }
    );
    const res = await POST(req as NextRequest);
    expect(res.status).toBe(404);
    const body = await jsonFromResponse(res);
    expect(body.error).toBe('Annonce non trouvée');
  });

  it('met en pause une annonce existante et retourne success=true', async () => {
    process.env.ADMIN_PASSWORD = ADMIN_PASSWORD;
    const req = makeRequest(
      'POST',
      { id: 'raismes-t3', paused: true },
      { 'x-admin-auth': ADMIN_PASSWORD }
    );
    const res = await POST(req as NextRequest);
    expect(res.status).toBe(200);
    const body = await jsonFromResponse(res);
    expect(body.success).toBe(true);
    expect(body.paused).toBe(true);
  });

  it('la pause est persistée et vérifiable via getPausedListingIds', async () => {
    process.env.ADMIN_PASSWORD = ADMIN_PASSWORD;
    const req = makeRequest(
      'POST',
      { id: 'raismes-t3', paused: true },
      { 'x-admin-auth': ADMIN_PASSWORD }
    );
    await POST(req as NextRequest);
    const pausedIds = await getPausedListingIds();
    expect(pausedIds).toContain('raismes-t3');
  });

  it('reprit une annonce en pause et met à jour la persistance', async () => {
    process.env.ADMIN_PASSWORD = ADMIN_PASSWORD;
    // Pause initiale
    let req = makeRequest(
      'POST',
      { id: 'raismes-t3', paused: true },
      { 'x-admin-auth': ADMIN_PASSWORD }
    );
    await POST(req as NextRequest);
    // Reprendre
    req = makeRequest(
      'POST',
      { id: 'raismes-t3', paused: false },
      { 'x-admin-auth': ADMIN_PASSWORD }
    );
    const res = await POST(req as NextRequest);
    const body = await jsonFromResponse(res);
    expect(body.success).toBe(true);
    expect(body.paused).toBe(false);
    const pausedIds = await getPausedListingIds();
    expect(pausedIds).not.toContain('raismes-t3');
  });

  it('le POST renvoie le résumé complet mis à jour', async () => {
    process.env.ADMIN_PASSWORD = ADMIN_PASSWORD;
    const req = makeRequest(
      'POST',
      { id: 'raismes-t3', paused: true },
      { 'x-admin-auth': ADMIN_PASSWORD }
    );
    const res = await POST(req as NextRequest);
    const body = await jsonFromResponse(res);
    expect(body.listings).toBeDefined();
    expect(Array.isArray(body.listings)).toBe(true);
    const raismesEntry = body.listings.find((l: any) => l.id === 'raismes-t3');
    expect(raismesEntry.paused).toBe(true);
  });

  it('permet de basculer plusieurs annonces indépendamment', async () => {
    process.env.ADMIN_PASSWORD = ADMIN_PASSWORD;
    // Pause raismes-t3
    let req = makeRequest(
      'POST',
      { id: 'raismes-t3', paused: true },
      { 'x-admin-auth': ADMIN_PASSWORD }
    );
    await POST(req as NextRequest);
    // Pause appt5
    req = makeRequest(
      'POST',
      { id: 'appt5', paused: true },
      { 'x-admin-auth': ADMIN_PASSWORD }
    );
    await POST(req as NextRequest);
    // Reprendre uniquement raismes-t3
    req = makeRequest(
      'POST',
      { id: 'raismes-t3', paused: false },
      { 'x-admin-auth': ADMIN_PASSWORD }
    );
    const res = await POST(req as NextRequest);
    const body = await jsonFromResponse(res);
    const raismes = body.listings.find((l: any) => l.id === 'raismes-t3');
    const appt5 = body.listings.find((l: any) => l.id === 'appt5');
    expect(raismes.paused).toBe(false);
    expect(appt5.paused).toBe(true);
  });

  it('est idempotent : re-pauser ne crée pas de doublon dans le fichier', async () => {
    process.env.ADMIN_PASSWORD = ADMIN_PASSWORD;
    const req = makeRequest(
      'POST',
      { id: 'raismes-t3', paused: true },
      { 'x-admin-auth': ADMIN_PASSWORD }
    );
    await POST(req as NextRequest);
    await POST(req as NextRequest); // appel redondant
    const pausedIds = await getPausedListingIds();
    expect(pausedIds).toEqual(['raismes-t3']);
    expect(pausedIds).toHaveLength(1);
  });
});
