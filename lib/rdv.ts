import fs from 'fs/promises';
import path from 'path';

// ============ Types ============

// Config de créneaux de visite intégrée pour une annonce (champ optionnel Listing.rdv)
export interface RdvConfig {
  durationMinutes: number; // durée EXACTE d'un créneau (ex: 15)
  days: number[]; // jours ouvrés, convention JS getDay : 0 = dimanche, 1 = lundi, …
  startTime: string; // 'HH:MM' heure locale de début de plage (ex: '18:30')
  endTime: string; // 'HH:MM' heure locale de fin de plage (ex: '19:30')
  minLeadDays: number; // réservation possible à partir de J + minLeadDays
  maxLeadDays: number; // réservation possible jusqu'à J + maxLeadDays
  timezone: string; // IANA, ex: 'Europe/Paris'
  availableFrom?: string; // Date calendaire (YYYY-MM-DD, fuseau config.timezone) à partir de laquelle
  // les créneaux sont proposés — toute date strictement inférieure est exclue (bornes incluses)
}

// Un créneau disponible (bornes ISO UTC)
export interface RdvSlot {
  start: string; // ISO UTC
  end: string; // ISO UTC
}

// Un rendez-vous réservé (persisté dans data/rdvs.json)
export interface Rdv {
  id: string;
  listingId: string;
  start: string; // ISO UTC
  end: string; // ISO UTC
  nom: string;
  prenom: string;
  telephone: string;
  email: string;
  createdAt: string; // ISO UTC
  googleEventId?: string; // id de l'événement Google Calendar « Visites » (sync phase 2)
}

// Entrée de réservation (la durée vient de la config de l'annonce)
export interface RdvBookingInput {
  listingId: string;
  start: string; // ISO UTC — doit être un début de créneau valide
  durationMinutes: number;
  nom: string;
  prenom: string;
  telephone: string;
  email: string;
}

export type BookRdvResult = { ok: true; rdv: Rdv } | { ok: false; reason: 'CONFLICT' };

// ============ Persistance (même pattern que candidatures.json) ============

const RDVS_FILE = path.join(process.cwd(), 'data', 'rdvs.json');

// File d'écriture : sérialise les réservations pour éviter les courses
// (lecture → vérification → écriture) entre requêtes concurrentes.
let writeQueue: Promise<unknown> = Promise.resolve();

function enqueue<T>(fn: () => Promise<T>): Promise<T> {
  const run = writeQueue.then(fn, fn);
  writeQueue = run.then(
    () => undefined,
    () => undefined
  );
  return run;
}

async function ensureDir(filePath: string) {
  const dir = path.dirname(filePath);
  try {
    await fs.access(dir);
  } catch {
    await fs.mkdir(dir, { recursive: true });
  }
}

// Lire tous les RDV (fichier absent → tableau vide)
export async function getRdvs(filePath: string = RDVS_FILE): Promise<Rdv[]> {
  try {
    const data = await fs.readFile(filePath, 'utf-8');
    return JSON.parse(data) as Rdv[];
  } catch (error) {
    if ((error as NodeJS.ErrnoException).code === 'ENOENT') {
      return [];
    }
    throw error;
  }
}

// Réservation atomique : lit, vérifie le chevauchement, écrit.
// Le fichier est créé s'il n'existe pas (data/rdvs.json, gitignoré).
export async function bookRdv(input: RdvBookingInput, filePath: string = RDVS_FILE): Promise<BookRdvResult> {
  return enqueue(async () => {
    await ensureDir(filePath);
    const rdvs = await getRdvs(filePath);
    const end = new Date(new Date(input.start).getTime() + input.durationMinutes * 60 * 1000).toISOString();

    if (hasOverlap(rdvs, input.start, end)) {
      return { ok: false as const, reason: 'CONFLICT' as const };
    }

    const rdv: Rdv = {
      id: `rdv-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      listingId: input.listingId,
      start: input.start,
      end,
      nom: input.nom,
      prenom: input.prenom,
      telephone: input.telephone,
      email: input.email,
      createdAt: new Date().toISOString(),
    };

    rdvs.push(rdv);
    await fs.writeFile(filePath, JSON.stringify(rdvs, null, 2), 'utf-8');
    return { ok: true as const, rdv };
  });
}

// Mise à jour atomique d'un RDV (ex: persistance de googleEventId après sync
// Google Calendar). Retourne le RDV mis à jour, ou null si l'id n'existe pas.
export async function updateRdv(
  id: string,
  patch: Partial<Rdv>,
  filePath: string = RDVS_FILE
): Promise<Rdv | null> {
  return enqueue(async () => {
    await ensureDir(filePath);
    const rdvs = await getRdvs(filePath);
    const index = rdvs.findIndex((r) => r.id === id);
    if (index === -1) {
      return null;
    }
    rdvs[index] = { ...rdvs[index], ...patch };
    await fs.writeFile(filePath, JSON.stringify(rdvs, null, 2), 'utf-8');
    return rdvs[index];
  });
}

// ============ Helpers date / timezone ============

function pad(n: number): string {
  return String(n).padStart(2, '0');
}

function getParts(date: Date, timeZone: string): Record<string, string> {
  const parts = new Intl.DateTimeFormat('en-US', {
    timeZone,
    hourCycle: 'h23',
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
  }).formatToParts(date);
  const result: Record<string, string> = {};
  for (const p of parts) {
    result[p.type] = p.value;
  }
  return result;
}

// Date calendaire locale (YYYY-MM-DD) d'un instant ISO dans le fuseau donné
export function getDateInTimeZone(iso: string, timeZone: string): string {
  const parts = getParts(new Date(iso), timeZone);
  return `${parts.year}-${parts.month}-${parts.day}`;
}

// Date du jour (YYYY-MM-DD) dans le fuseau donné
export function getTodayInTimeZone(timeZone: string): string {
  return getDateInTimeZone(new Date().toISOString(), timeZone);
}

// Convertit une date calendaire + heure locale (fuseau) en instant UTC.
// Gère l'heure d'été (l'offset est calculé pour la date concernée).
export function zonedTimeToUtc(dateStr: string, timeStr: string, timeZone: string): Date {
  const utcCandidate = new Date(`${dateStr}T${timeStr}:00Z`);
  const parts = getParts(utcCandidate, timeZone);
  const localAsUtc = Date.UTC(
    parseInt(parts.year, 10),
    parseInt(parts.month, 10) - 1,
    parseInt(parts.day, 10),
    parseInt(parts.hour, 10),
    parseInt(parts.minute, 10),
    parseInt(parts.second, 10)
  );
  const offsetMs = localAsUtc - utcCandidate.getTime();
  return new Date(utcCandidate.getTime() - offsetMs);
}

// ============ Logique métier pure ============

// Un RDV existant chevauche-t-il [startISO, endISO) ? (frontières exclusives)
export function hasOverlap(rdvs: Rdv[], startISO: string, endISO: string): boolean {
  const start = new Date(startISO).getTime();
  const end = new Date(endISO).getTime();
  return rdvs.some((r) => {
    const rStart = new Date(r.start).getTime();
    const rEnd = new Date(r.end).getTime();
    return rStart < end && rEnd > start;
  });
}

// Génère les créneaux d'une date calendaire (YYYY-MM-DD), en excluant ceux
// déjà pris (chevauchement). Retourne [] si le jour n'est pas dans config.days.
export function generateSlotsForDate(config: RdvConfig, dateStr: string, existingRdvs: Rdv[] = []): RdvSlot[] {
  const day = new Date(`${dateStr}T00:00:00Z`).getUTCDay();
  if (!config.days.includes(day)) {
    return [];
  }

  const startMs = zonedTimeToUtc(dateStr, config.startTime, config.timezone).getTime();
  const endMs = zonedTimeToUtc(dateStr, config.endTime, config.timezone).getTime();
  const durationMs = config.durationMinutes * 60 * 1000;

  const slots: RdvSlot[] = [];
  for (let t = startMs; t + durationMs <= endMs; t += durationMs) {
    const start = new Date(t).toISOString();
    const end = new Date(t + durationMs).toISOString();
    if (!hasOverlap(existingRdvs, start, end)) {
      slots.push({ start, end });
    }
  }
  return slots;
}

// Liste des prochaines dates avec créneaux disponibles, bornée par
// minLeadDays / maxLeadDays. Ne contient que des dates avec ≥ 1 créneau.
export function getAvailableSlots(
  config: RdvConfig,
  fromDate: string,
  existingRdvs: Rdv[] = []
): Array<{ date: string; slots: RdvSlot[] }> {
  const [y, m, d] = fromDate.split('-').map(Number);
  const results: Array<{ date: string; slots: RdvSlot[] }> = [];

  for (let i = config.minLeadDays; i <= config.maxLeadDays; i++) {
    const date = new Date(Date.UTC(y, m - 1, d + i));
    const dateStr = `${date.getUTCFullYear()}-${pad(date.getUTCMonth() + 1)}-${pad(date.getUTCDate())}`;
    // availableFrom : exclut toute date strictement inférieure (la date elle-même est incluse)
    if (config.availableFrom && dateStr < config.availableFrom) {
      continue;
    }
    const slots = generateSlotsForDate(config, dateStr, existingRdvs);
    if (slots.length > 0) {
      results.push({ date: dateStr, slots });
    }
  }
  return results;
}

// Un début de créneau (ISO UTC) est-il disponible pour cette config ?
// False si : pas un début de créneau valide (jour/horaire/durée) OU déjà pris.
export function isSlotAvailable(config: RdvConfig, startISO: string, existingRdvs: Rdv[] = []): boolean {
  const start = new Date(startISO);
  if (Number.isNaN(start.getTime())) {
    return false;
  }
  const end = new Date(start.getTime() + config.durationMinutes * 60 * 1000).toISOString();
  if (hasOverlap(existingRdvs, startISO, end)) {
    return false;
  }
  const dateStr = getDateInTimeZone(startISO, config.timezone);
  // availableFrom : un créneau dont la date locale est strictement antérieure est indisponible
  if (config.availableFrom && dateStr < config.availableFrom) {
    return false;
  }
  const validStarts = generateSlotsForDate(config, dateStr, []).map((s) => s.start);
  return validStarts.includes(startISO);
}

// Formate un instant en français lisible : « lundi 10 août 2026 à 18:30 »
export function formatRdvDateTime(startISO: string, timeZone: string): string {
  const date = new Date(startISO);
  const datePart = new Intl.DateTimeFormat('fr-FR', {
    timeZone,
    weekday: 'long',
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  }).format(date);
  const timePart = new Intl.DateTimeFormat('fr-FR', {
    timeZone,
    hour: '2-digit',
    minute: '2-digit',
  }).format(date);
  return `${datePart} à ${timePart}`;
}
