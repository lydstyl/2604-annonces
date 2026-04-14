import fs from 'fs/promises';
import path from 'path';

// Type pour une candidature
export interface Candidature {
  id: string;
  listingId: string;
  nom: string;
  prenom: string;
  telephone: string;
  email: string;
  revenusMenuels: number;
  peutFournirGarant: boolean;
  remarques: string;
  dateSubmission: string;
}

const DATA_DIR = path.join(process.cwd(), 'data');
const CANDIDATURES_FILE = path.join(DATA_DIR, 'candidatures.json');

// S'assurer que le répertoire data existe
async function ensureDataDir() {
  try {
    await fs.access(DATA_DIR);
  } catch {
    await fs.mkdir(DATA_DIR, { recursive: true });
  }
}

// Lire toutes les candidatures
export async function getCandidatures(): Promise<Candidature[]> {
  try {
    await ensureDataDir();
    const data = await fs.readFile(CANDIDATURES_FILE, 'utf-8');
    return JSON.parse(data);
  } catch (error) {
    // Si le fichier n'existe pas, retourner un tableau vide
    if ((error as NodeJS.ErrnoException).code === 'ENOENT') {
      return [];
    }
    throw error;
  }
}

// Sauvegarder une nouvelle candidature
export async function saveCandidature(candidature: Omit<Candidature, 'id' | 'dateSubmission'>): Promise<Candidature> {
  await ensureDataDir();

  const candidatures = await getCandidatures();

  const newCandidature: Candidature = {
    ...candidature,
    id: `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
    dateSubmission: new Date().toISOString(),
  };

  candidatures.push(newCandidature);

  await fs.writeFile(CANDIDATURES_FILE, JSON.stringify(candidatures, null, 2), 'utf-8');

  return newCandidature;
}

// Récupérer les candidatures pour une annonce spécifique
export async function getCandidaturesByListingId(listingId: string): Promise<Candidature[]> {
  const candidatures = await getCandidatures();
  return candidatures.filter((c) => c.listingId === listingId);
}
