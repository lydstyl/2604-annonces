import fs from 'fs/promises';
import path from 'path';

// ============ Persistance du statut « pause » des annonces ============
// Fichier : data/paused-listings.json (gitignoré via /data/*.json, persisté sur
// l'hôte grâce au volume Docker ./data:/app/data — même pattern que candidatures.json).
//
// Le chemin est résolu à CHAQUE appel pour permettre l'override en test
// (process.env.PAUSED_LISTINGS_FILE) sans recharger le module.

function pauseFilePath(): string {
  return (
    process.env.PAUSED_LISTINGS_FILE ??
    path.join(process.cwd(), 'data', 'paused-listings.json')
  );
}

// File d'écriture : sérialise (lecture → vérification → écriture) entre
// requêtes concurrentes (même pattern que lib/rdv.ts).
let writeQueue: Promise<unknown> = Promise.resolve();

function enqueue<T>(fn: () => Promise<T>): Promise<T> {
  const run = writeQueue.then(fn, fn);
  writeQueue = run.then(
    () => undefined,
    () => undefined
  );
  return run;
}

// Ids des annonces en pause ([] si le fichier n'existe pas, est vide ou corrompu)
export async function getPausedListingIds(): Promise<string[]> {
  try {
    const raw = await fs.readFile(pauseFilePath(), 'utf-8');
    const parsed: unknown = JSON.parse(raw);
    if (!Array.isArray(parsed)) return [];
    return parsed.filter((id): id is string => typeof id === 'string' && id.length > 0);
  } catch (error) {
    if ((error as NodeJS.ErrnoException).code === 'ENOENT') return [];
    // Fichier corrompu : on ne fait pas planter la home/annonce, on traite comme « aucune pause »
    console.error('Erreur lecture paused-listings.json:', error);
    return [];
  }
}

// Une annonce est-elle en pause ?
export async function isListingPaused(id: string): Promise<boolean> {
  const pausedIds = await getPausedListingIds();
  return pausedIds.includes(id);
}

// Met en pause (paused=true) ou reprend (paused=false) une annonce.
// Idempotent : re-pauser/reprendre une annonce déjà dans l'état demandé ne réécrit pas le fichier.
export async function setListingPaused(id: string, paused: boolean): Promise<void> {
  return enqueue(async () => {
    const current = await getPausedListingIds();
    const alreadyPaused = current.includes(id);

    if (paused === alreadyPaused) return;

    const next = paused ? [...current, id] : current.filter((x) => x !== id);
    await fs.mkdir(path.dirname(pauseFilePath()), { recursive: true });
    await fs.writeFile(pauseFilePath(), JSON.stringify(next, null, 2), 'utf-8');
  });
}
