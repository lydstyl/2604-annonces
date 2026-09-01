import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import fs from 'fs/promises';
import os from 'os';
import path from 'path';
import { getPausedListingIds, isListingPaused, setListingPaused } from '../lib/pause';

// Chaque test écrit dans un répertoire temporaire dédié (PAUSED_LISTINGS_FILE
// est relu à chaque appel → l'override d'env fonctionne même après import).
let tmpDir: string;

beforeEach(async () => {
  tmpDir = await fs.mkdtemp(path.join(os.tmpdir(), 'pause-test-'));
  process.env.PAUSED_LISTINGS_FILE = path.join(tmpDir, 'paused-listings.json');
});

afterEach(async () => {
  delete process.env.PAUSED_LISTINGS_FILE;
  await fs.rm(tmpDir, { recursive: true, force: true });
});

describe('getPausedListingIds — lecture du fichier de pause', () => {
  it('retourne [] quand le fichier n existe pas encore', async () => {
    expect(await getPausedListingIds()).toEqual([]);
  });

  it('retourne [] quand le fichier est vide (aucune annonce en pause)', async () => {
    await fs.writeFile(path.join(tmpDir, 'paused-listings.json'), JSON.stringify([]), 'utf-8');
    expect(await getPausedListingIds()).toEqual([]);
  });

  it('retourne les ids persistés dans le fichier', async () => {
    await fs.writeFile(
      path.join(tmpDir, 'paused-listings.json'),
      JSON.stringify(['raismes-t3', 'appt5']),
      'utf-8'
    );
    expect(await getPausedListingIds()).toEqual(['raismes-t3', 'appt5']);
  });

  it('ne plante pas sur un fichier JSON corrompu (retourne [])', async () => {
    await fs.writeFile(path.join(tmpDir, 'paused-listings.json'), '{pas du json', 'utf-8');
    expect(await getPausedListingIds()).toEqual([]);
  });

  it('ignore les entrées non-strings du fichier', async () => {
    await fs.writeFile(
      path.join(tmpDir, 'paused-listings.json'),
      JSON.stringify(['raismes-t3', 42, null, '']),
      'utf-8'
    );
    expect(await getPausedListingIds()).toEqual(['raismes-t3']);
  });
});

describe('isListingPaused — statut d une annonce', () => {
  it('retourne false par défaut', async () => {
    expect(await isListingPaused('raismes-t3')).toBe(false);
  });

  it('retourne true après mise en pause', async () => {
    await setListingPaused('raismes-t3', true);
    expect(await isListingPaused('raismes-t3')).toBe(true);
    expect(await isListingPaused('appt5')).toBe(false);
  });
});

describe('setListingPaused — persistance du statut pause', () => {
  it('persiste une annonce en pause dans le fichier JSON sous data/', async () => {
    await setListingPaused('raismes-t3', true);

    const paused = await getPausedListingIds();
    expect(paused).toEqual(['raismes-t3']);

    // Le fichier est écrit sur disque (relu indépendamment de la mémoire)
    const raw = await fs.readFile(path.join(tmpDir, 'paused-listings.json'), 'utf-8');
    expect(JSON.parse(raw)).toEqual(['raismes-t3']);
  });

  it('persiste plusieurs annonces en pause', async () => {
    await setListingPaused('raismes-t3', true);
    await setListingPaused('appt5', true);
    expect(await getPausedListingIds()).toEqual(['raismes-t3', 'appt5']);
  });

  it('est idempotent : re-pauser une annonce déjà en pause ne crée pas de doublon', async () => {
    await setListingPaused('raismes-t3', true);
    await setListingPaused('raismes-t3', true);
    expect(await getPausedListingIds()).toEqual(['raismes-t3']);
  });

  it('reprend une annonce : la retire du fichier', async () => {
    await setListingPaused('raismes-t3', true);
    await setListingPaused('raismes-t3', false);
    expect(await getPausedListingIds()).toEqual([]);
    expect(await isListingPaused('raismes-t3')).toBe(false);
  });

  it('reprend une annonce sans affecter les autres', async () => {
    await setListingPaused('raismes-t3', true);
    await setListingPaused('appt5', true);
    await setListingPaused('raismes-t3', false);
    expect(await getPausedListingIds()).toEqual(['appt5']);
  });

  it('reprend une annonce qui n est pas en pause : sans effet', async () => {
    await setListingPaused('raismes-t3', false);
    expect(await getPausedListingIds()).toEqual([]);
  });

  it('créé le répertoire data/ s il n existe pas', async () => {
    const nested = path.join(tmpDir, 'data', 'paused-listings.json');
    process.env.PAUSED_LISTINGS_FILE = nested;
    await setListingPaused('raismes-t3', true);
    expect(await getPausedListingIds()).toEqual(['raismes-t3']);
  });
});
