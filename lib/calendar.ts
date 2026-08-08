import type { google } from 'googleapis';
import path from 'path';
import fs from 'fs';
import os from 'os';
import type { Rdv } from './rdv';
import type { Listing } from './listings';

// Type exact du client OAuth2 retourné par `new google.auth.OAuth2(...)`
// (dérivé de googleapis pour éviter le mismatch de copie google-auth-library).
export type OAuth2Client = InstanceType<typeof google.auth.OAuth2>;

// ============ Types ============

// Payload d'un événement Google Calendar (structure compatible Schema$Event)
export interface CalendarEventPayload {
  summary: string;
  start: { dateTime: string; timeZone: string };
  end: { dateTime: string; timeZone: string };
  location: string;
  description: string;
  reminders: {
    useDefault: boolean;
    overrides: Array<{ method: string; minutes: number }>;
  };
}

// Dépendances de syncRdvToCalendar (injectables pour les tests, réelles en prod)
export interface CalendarSyncDeps {
  getAuth: () => Promise<OAuth2Client>;
  ensureVisitsCalendar: (auth: OAuth2Client) => Promise<string>;
  createVisitEvent: (auth: OAuth2Client, calendarId: string, payload: CalendarEventPayload) => Promise<string>;
}

export const VISITS_CALENDAR_NAME = 'Visites';

// ============ Auth (même pattern que lib/sheets.ts) ============

// Charge le token Google depuis ~/.hermes/google_token.json et retourne un
// client OAuth2 prêt à l'emploi. Refresh automatique si l'expiration est
// proche (< 5 min). AUCUN flux OAuth interactif : le scope calendar est déjà
// présent dans le token partagé.
export async function getAuth(): Promise<OAuth2Client> {
  const tokenPath = path.join(os.homedir(), '.hermes', 'google_token.json');
  if (!fs.existsSync(tokenPath)) {
    throw new Error('[calendar] Token Google introuvable, synchronisation calendrier impossible');
  }

  const tokenData = JSON.parse(fs.readFileSync(tokenPath, 'utf-8'));

  // Fix: l'expiry peut être stocké en timestamp numérique au lieu d'ISO string
  if (typeof tokenData.expiry === 'number') {
    const expiryDate = new Date(tokenData.expiry * 1000);
    tokenData.expiry = expiryDate.toISOString();
  }

  const { google } = await import('googleapis');
  const auth = new google.auth.OAuth2(
    tokenData.client_id,
    tokenData.client_secret,
    tokenData.token_uri
  );
  auth.setCredentials({
    access_token: tokenData.token,
    refresh_token: tokenData.refresh_token,
    expiry_date: new Date(tokenData.expiry).getTime(),
    token_type: 'Bearer',
  });

  // Refresh si nécessaire
  const now = Date.now();
  if (tokenData.expiry && new Date(tokenData.expiry).getTime() - now < 5 * 60 * 1000) {
    try {
      const { credentials } = await auth.refreshAccessToken();
      // Sauvegarder le token rafraîchi
      tokenData.token = credentials.access_token;
      tokenData.expiry = credentials.expiry_date
        ? new Date(credentials.expiry_date).toISOString()
        : tokenData.expiry;
      fs.writeFileSync(tokenPath, JSON.stringify(tokenData, null, 2), 'utf-8');
    } catch (refreshErr) {
      console.warn('[calendar] Refresh token échoué, tentative avec token existant');
    }
  }

  return auth;
}

// ============ Construction du payload (pure, testable) ============

// Construit le payload Google Calendar d'un événement de visite :
// - summary : « Visite T2 - Prénom Nom »
// - start/end : bornes ISO UTC du créneau réservé, fuseau Europe/Paris
// - location : adresse de l'annonce
// - description : téléphone + email du candidat + lien de l'annonce
// - reminder : popup 1440 minutes (24h) avant le début
export function buildEventPayload(rdv: Rdv, listing: Listing): CalendarEventPayload {
  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || 'https://annonces.duckdns.org';
  const annonceUrl = `${siteUrl}/annonce/${listing.id}`;
  const timeZone = listing.rdv?.timezone ?? 'Europe/Paris';

  return {
    summary: `Visite ${listing.type ?? 'logement'} - ${rdv.prenom} ${rdv.nom}`,
    start: { dateTime: rdv.start, timeZone },
    end: { dateTime: rdv.end, timeZone },
    location: listing.address,
    description: [
      `Téléphone : ${rdv.telephone}`,
      `Email : ${rdv.email}`,
      `Annonce : ${annonceUrl}`,
    ].join('\n'),
    reminders: {
      useDefault: false,
      overrides: [{ method: 'popup', minutes: 1440 }],
    },
  };
}

// ============ API Google Calendar ============

// Cherche le calendrier « Visites » via calendarList.list ; le crée via
// calendars.insert s'il est absent. Retourne son id.
export async function ensureVisitsCalendar(auth: OAuth2Client): Promise<string> {
  const { google } = await import('googleapis');
  const calendar = google.calendar({ version: 'v3', auth });

  const list = await calendar.calendarList.list();
  const existing = (list.data.items ?? []).find((c) => c.summary === VISITS_CALENDAR_NAME);
  if (existing?.id) {
    return existing.id;
  }

  const created = await calendar.calendars.insert({
    requestBody: { summary: VISITS_CALENDAR_NAME, timeZone: 'Europe/Paris' },
  });
  const id = created.data.id;
  if (!id) {
    throw new Error('[calendar] Création du calendrier Visites sans id en réponse');
  }
  return id;
}

// Crée l'événement dans le calendrier donné. Retourne event.id.
export async function createVisitEvent(
  auth: OAuth2Client,
  calendarId: string,
  payload: CalendarEventPayload
): Promise<string> {
  const { google } = await import('googleapis');
  const calendar = google.calendar({ version: 'v3', auth });

  const res = await calendar.events.insert({
    calendarId,
    requestBody: payload,
  });
  const id = res.data.id;
  if (!id) {
    throw new Error('[calendar] Création de l événement sans id en réponse');
  }
  return id;
}

// ============ Orchestration (idempotente) ============

const defaultDeps: CalendarSyncDeps = {
  getAuth,
  ensureVisitsCalendar,
  createVisitEvent,
};

// Synchronise un RDV réservé vers le calendrier Google « Visites ».
// Ne crée l'événement QUE si rdv.googleEventId est absent (idempotence).
// Retourne l'id de l'événement (nouveau ou déjà existant), ou null si absent.
export async function syncRdvToCalendar(
  rdv: Rdv,
  listing: Listing,
  deps: CalendarSyncDeps = defaultDeps
): Promise<string | null> {
  if (rdv.googleEventId) {
    console.log(`[calendar] RDV ${rdv.id} déjà synchronisé (googleEventId=${rdv.googleEventId}), création ignorée`);
    return rdv.googleEventId;
  }

  const auth = await deps.getAuth();
  const calendarId = await deps.ensureVisitsCalendar(auth);
  const payload = buildEventPayload(rdv, listing);
  const eventId = await deps.createVisitEvent(auth, calendarId, payload);

  console.log(`[calendar] ✅ Événement créé (${eventId}) pour le RDV ${rdv.id} (${rdv.prenom} ${rdv.nom})`);
  return eventId;
}
