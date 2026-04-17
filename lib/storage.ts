import fs from 'fs/promises';
import path from 'path';

// Source d'un lead ou candidature
export type Source = 'formulaire' | 'leboncoin' | 'facebook' | 'autre';

// Statut d'un lead
export type LeadStatut = 'nouveau' | 'repondu' | 'converti' | 'perdu';

// Statut d'une candidature
export type CandidatureStatut = 'nouveau' | 'contacte' | 'formulaire_recu' | 'en_etude' | 'visite_planifiee' | 'accepte' | 'refuse';

// Type pour un lead (message entrant avant candidature)
export interface Lead {
  id: string;
  pseudo: string;
  source: Source;
  message: string;
  annonceId: string;
  dateMessage: string;
  emailId?: string;
  repondu: boolean;
  dateReponse?: string;
  candidatureId?: string;
  statut: LeadStatut;
}

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
  source?: Source;
  pseudoSource?: string;
  sourceId?: string;
  statut?: CandidatureStatut;
}

const DATA_DIR = path.join(process.cwd(), 'data');
const CANDIDATURES_FILE = path.join(DATA_DIR, 'candidatures.json');
const LEADS_FILE = path.join(DATA_DIR, 'leads.json');

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
    source: candidature.source || 'formulaire',
    statut: candidature.statut || 'nouveau',
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

// Supprimer une candidature par son ID
export async function deleteCandidature(id: string): Promise<boolean> {
  await ensureDataDir();

  const candidatures = await getCandidatures();
  const initialLength = candidatures.length;
  const filtered = candidatures.filter((c) => c.id !== id);

  if (filtered.length === initialLength) {
    return false; // Not found
  }

  await fs.writeFile(CANDIDATURES_FILE, JSON.stringify(filtered, null, 2), 'utf-8');
  return true;
}

// Mettre à jour le statut d'une candidature
export async function updateCandidatureStatut(id: string, statut: CandidatureStatut): Promise<Candidature | null> {
  await ensureDataDir();

  const candidatures = await getCandidatures();
  const candidature = candidatures.find((c) => c.id === id);
  if (!candidature) return null;

  candidature.statut = statut;
  await fs.writeFile(CANDIDATURES_FILE, JSON.stringify(candidatures, null, 2), 'utf-8');
  return candidature;
}

// ============ LEADS ============

// Lire tous les leads
export async function getLeads(): Promise<Lead[]> {
  try {
    await ensureDataDir();
    const data = await fs.readFile(LEADS_FILE, 'utf-8');
    return JSON.parse(data);
  } catch (error) {
    if ((error as NodeJS.ErrnoException).code === 'ENOENT') {
      return [];
    }
    throw error;
  }
}

// Sauvegarder un nouveau lead
export async function saveLead(lead: Omit<Lead, 'id' | 'dateMessage'>): Promise<Lead> {
  await ensureDataDir();

  const leads = await getLeads();

  const newLead: Lead = {
    ...lead,
    id: `lead-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
    dateMessage: new Date().toISOString(),
  };

  leads.push(newLead);

  await fs.writeFile(LEADS_FILE, JSON.stringify(leads, null, 2), 'utf-8');

  return newLead;
}

// Supprimer un lead
export async function deleteLead(id: string): Promise<boolean> {
  await ensureDataDir();

  const leads = await getLeads();
  const initialLength = leads.length;
  const filtered = leads.filter((l) => l.id !== id);

  if (filtered.length === initialLength) {
    return false;
  }

  await fs.writeFile(LEADS_FILE, JSON.stringify(filtered, null, 2), 'utf-8');
  return true;
}

// Mettre à jour le statut d'un lead
export async function updateLeadStatut(id: string, statut: LeadStatut): Promise<Lead | null> {
  await ensureDataDir();

  const leads = await getLeads();
  const lead = leads.find((l) => l.id === id);
  if (!lead) return null;

  lead.statut = statut;
  await fs.writeFile(LEADS_FILE, JSON.stringify(leads, null, 2), 'utf-8');
  return lead;
}

// Marquer un lead comme répondu
export async function markLeadRepondu(id: string): Promise<Lead | null> {
  await ensureDataDir();

  const leads = await getLeads();
  const lead = leads.find((l) => l.id === id);
  if (!lead) return null;

  lead.repondu = true;
  lead.dateReponse = new Date().toISOString();
  lead.statut = 'repondu';
  await fs.writeFile(LEADS_FILE, JSON.stringify(leads, null, 2), 'utf-8');
  return lead;
}

// Lier un lead à une candidature
export async function linkLeadToCandidature(leadId: string, candidatureId: string): Promise<Lead | null> {
  await ensureDataDir();

  const leads = await getLeads();
  const lead = leads.find((l) => l.id === leadId);
  if (!lead) return null;

  lead.candidatureId = candidatureId;
  lead.statut = 'converti';
  await fs.writeFile(LEADS_FILE, JSON.stringify(leads, null, 2), 'utf-8');
  return lead;
}
