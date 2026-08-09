import { describe, it, expect, vi, beforeAll, afterAll, beforeEach } from 'vitest';
import fs from 'fs/promises';
import os from 'os';
import path from 'path';
import {
  buildEventPayload,
  syncRdvToCalendar,
  type CalendarSyncDeps,
  type OAuth2Client,
} from '../lib/calendar';
import { updateRdv, type Rdv } from '../lib/rdv';
import { getListingById } from '../lib/listings';

const appt5 = getListingById('appt5')!;
const raismesT3 = getListingById('raismes-t3')!;

// ===== Helpers =====

function makeRdv(overrides: Partial<Rdv> = {}): Rdv {
  return {
    id: 'rdv-test',
    listingId: 'appt5',
    start: '2026-08-10T17:00:00.000Z',
    end: '2026-08-10T17:15:00.000Z',
    nom: 'Dupont',
    prenom: 'Jean',
    telephone: '0600000000',
    email: 'jean@example.com',
    createdAt: '2026-08-01T10:00:00.000Z',
    ...overrides,
  };
}

function makeDeps(overrides: Partial<CalendarSyncDeps> = {}): CalendarSyncDeps {
  return {
    getAuth: vi.fn(async () => ({} as OAuth2Client)),
    ensureVisitsCalendar: vi.fn(async () => 'visits-calendar-id'),
    createVisitEvent: vi.fn(async () => 'event-123'),
    ...overrides,
  };
}

// Hoisted spies pour le mock de googleapis — accessibles depuis beforeEach + tests
const calMocks = vi.hoisted(() => ({
  calendar: vi.fn(),
  list: vi.fn(),
  insertCal: vi.fn(),
  insertEvent: vi.fn(),
}));

vi.mock('googleapis', () => ({
  auth: { OAuth2: class {} },
  google: { calendar: calMocks.calendar },
}));

// Charger les fonctions après le mock pour capturer googleapis mocké
const { ensureVisitsCalendar: ensured, createVisitEvent: created } = await import('../lib/calendar');

beforeEach(() => {
  // Reset each test's spied calls and defaults
  calMocks.list.mockClear();
  calMocks.insertCal.mockClear();
  calMocks.insertEvent.mockClear();
  calMocks.calendar.mockClear();

  calMocks.calendar.mockReturnValue({
    calendarList: { list: calMocks.list },
    calendars: { insert: calMocks.insertCal },
    events: { insert: calMocks.insertEvent },
  });

  // Default responses (override per-test with mockResolvedValueOnce)
  calMocks.list.mockResolvedValue({ data: { items: [] } });
  calMocks.insertCal.mockResolvedValue({ data: { id: 'new-cal-id' } });
  calMocks.insertEvent.mockResolvedValue({ data: { id: 'evt-new-id' } });
});

// ============ buildEventPayload — construction du payload ============

describe('buildEventPayload — construction du payload Google Calendar', () => {
  it('construit le titre « Visite T2 - Prénom Nom » (type de l annonce + candidat)', () => {
    const payload = buildEventPayload(makeRdv(), appt5);
    expect(payload.summary).toBe('Visite T2 - Jean Dupont');
  });

  it('reporte start et end ISO UTC du créneau réservé', () => {
    const payload = buildEventPayload(makeRdv(), appt5);
    expect(payload.start.dateTime).toBe('2026-08-10T17:00:00.000Z');
    expect(payload.end.dateTime).toBe('2026-08-10T17:15:00.000Z');
  });

  it('utilise le fuseau Europe/Paris (config rdv de l annonce)', () => {
    const payload = buildEventPayload(makeRdv(), appt5);
    expect(payload.start.timeZone).toBe('Europe/Paris');
    expect(payload.end.timeZone).toBe('Europe/Paris');
  });

  it('utilise l adresse de l annonce comme lieu de visite', () => {
    const payload = buildEventPayload(makeRdv(), appt5);
    expect(payload.location).toBe('32 B rue Henri Durre, 59590 Raismes, France');
  });

  it('la description contient le téléphone, l email du candidat et le lien de l annonce', () => {
    const payload = buildEventPayload(makeRdv(), appt5);
    expect(payload.description).toContain('0600000000');
    expect(payload.description).toContain('jean@example.com');
    expect(payload.description).toContain('/annonce/appt5');
  });

  it('définit un rappel popup 1440 minutes (24h) avant le début', () => {
    const payload = buildEventPayload(makeRdv(), appt5);
    expect(payload.reminders.useDefault).toBe(false);
    expect(payload.reminders.overrides).toEqual([{ method: 'popup', minutes: 1440 }]);
  });

  it('ajoute le téléphone bailleur avant le téléphone de M. Janot (rdvHost en dernière ligne) pour appt5', () => {
    const payload = buildEventPayload(makeRdv(), appt5);
    expect(payload.description).toContain('Téléphone bailleur 07 81 15 45 03');
    expect(payload.description).toContain('Téléphone de M. Janot : 07 68 34 97 79');

    const lines = payload.description.split('\n');
    expect(lines).toHaveLength(5);
    expect(lines[3]).toBe('Téléphone bailleur 07 81 15 45 03');
    expect(lines[lines.length - 1]).toBe('Téléphone de M. Janot : 07 68 34 97 79');
  });

  it('laisse la description inchangée (pas de ligne Téléphone de ni Téléphone bailleur) quand le listing n a ni rdvHost ni rdvBailleur', () => {
    const payload = buildEventPayload(makeRdv(), raismesT3);
    expect(payload.description).not.toContain('Téléphone de');
    expect(payload.description).not.toContain('Téléphone bailleur');
    expect(payload.description.split('\n')).toHaveLength(3);
  });

  it('ajoute le rdvHost email comme participant (attendees) quand le listing en a un (appt5)', () => {
    const payload = buildEventPayload(makeRdv(), appt5);
    expect(payload.attendees).toEqual([{ email: 'janot59590@gmail.com' }]);
  });

  it('n ajoute pas attendees quand le listing n a pas de rdvHost email (raismes-t3)', () => {
    const payload = buildEventPayload(makeRdv(), raismesT3);
    expect(payload.attendees).toBeUndefined();
  });
});

// ============ syncRdvToCalendar — logique d idempotence ============

describe('syncRdvToCalendar — logique d idempotence', () => {
  it('ne crée PAS d évènement quand googleEventId est déjà présent (retourne l id existant)', async () => {
    const deps = makeDeps();
    const rdv = makeRdv({ googleEventId: 'existing-event-id' });

    const result = await syncRdvToCalendar(rdv, appt5, deps);

    expect(result).toBe('existing-event-id');
    expect(deps.getAuth).not.toHaveBeenCalled();
    expect(deps.ensureVisitsCalendar).not.toHaveBeenCalled();
    expect(deps.createVisitEvent).not.toHaveBeenCalled();
  });

  it('crée l évènement quand googleEventId est absent : auth → calendrier Visites → insert', async () => {
    const deps = makeDeps();
    const rdv = makeRdv();

    const result = await syncRdvToCalendar(rdv, appt5, deps);

    expect(result).toBe('event-123');
    expect(deps.getAuth).toHaveBeenCalledTimes(1);
    expect(deps.ensureVisitsCalendar).toHaveBeenCalledTimes(1);
    expect(deps.createVisitEvent).toHaveBeenCalledTimes(1);
    // Le payload passé à l'insert est bien celui de buildEventPayload
    const [, calendarId, payload] = vi.mocked(deps.createVisitEvent).mock.calls[0];
    expect(calendarId).toBe('visits-calendar-id');
    expect(payload.summary).toBe('Visite T2 - Jean Dupont');
    expect(payload.start.dateTime).toBe('2026-08-10T17:00:00.000Z');
  });
});

// ============ ensureVisitsCalendar — recherche ou création ============

describe('ensureVisitsCalendar', () => {
  it('retourne l id existant quand le calendrier Visites est déjà listé', async () => {
    calMocks.list.mockResolvedValueOnce({ data: { items: [{ id: 'cal-abc', summary: 'Visites' }] } });

    const auth = {} as unknown as OAuth2Client;
    const calId = await ensured(auth);

    expect(calId).toBe('cal-abc');
    expect(calMocks.list).toHaveBeenCalledTimes(1);
    expect(calMocks.insertCal).not.toHaveBeenCalled();
  });

  it('crée le calendrier via calendars.insert s il n est pas trouvé', async () => {
    calMocks.list.mockResolvedValueOnce({ data: { items: [] } });
    calMocks.insertCal.mockResolvedValueOnce({ data: { id: 'new-cal-xyz', summary: 'Visites', timeZone: 'Europe/Paris' } });

    const auth = {} as unknown as OAuth2Client;
    const calId = await ensured(auth);

    expect(calId).toBe('new-cal-xyz');
    expect(calMocks.list).toHaveBeenCalledTimes(1);
    expect(calMocks.insertCal).toHaveBeenCalledTimes(1);
    expect(calMocks.insertCal).toHaveBeenCalledWith({
      requestBody: { summary: 'Visites', timeZone: 'Europe/Paris' },
    });
  });

  it('lève une erreur si calendars.insert retourne sans id', async () => {
    calMocks.list.mockResolvedValueOnce({ data: { items: [] } });
    calMocks.insertCal.mockResolvedValueOnce({ data: {} });

    const auth = {} as unknown as OAuth2Client;
    await expect(ensured(auth)).rejects.toThrow('sans id en réponse');
  });

  it('ignore les calendriers avec un nom différent et passe à la création', async () => {
    calMocks.list.mockResolvedValueOnce({
      data: { items: [{ id: 'other-1', summary: 'Mon Agenda' }, { id: 'other-2', summary: 'Perso' }] },
    });
    calMocks.insertCal.mockResolvedValueOnce({ data: { id: 'created-vis' } });

    const auth = {} as unknown as OAuth2Client;
    const calId = await ensured(auth);

    expect(calId).toBe('created-vis');
    expect(calMocks.list).toHaveBeenCalledTimes(1);
    expect(calMocks.insertCal).toHaveBeenCalledTimes(1);
  });
});

// ============ createVisitEvent — gestion d erreurs ============

describe('createVisitEvent', () => {
  it('retourne event.id quand la création réussit', async () => {
    calMocks.insertEvent.mockResolvedValueOnce({ data: { id: 'evt-success-99' } });

    const auth = {} as unknown as OAuth2Client;
    const payload = buildEventPayload(makeRdv(), appt5);
    const eventId = await created(auth, 'cal-123', payload);

    expect(eventId).toBe('evt-success-99');
    expect(calMocks.insertEvent).toHaveBeenCalledWith({
      calendarId: 'cal-123',
      requestBody: payload,
      sendUpdates: 'all',
    });
  });

  it('lève une erreur si l API retourne aucun id', async () => {
    calMocks.insertEvent.mockResolvedValueOnce({ data: { id: null } });

    const auth = {} as unknown as OAuth2Client;
    const payload = buildEventPayload(makeRdv(), appt5);
    await expect(created(auth, 'cal-123', payload)).rejects.toThrow('sans id en réponse');
  });
});

// ============ updateRdv — persistance atomique ============

describe('updateRdv — persistance atomique de googleEventId dans data/rdvs.json', () => {
  let tmpDir: string;

  beforeAll(async () => {
    tmpDir = await fs.mkdtemp(path.join(os.tmpdir(), 'calendar-test-'));
  });

  afterAll(async () => {
    await fs.rm(tmpDir, { recursive: true, force: true });
  });

  it('écrit le googleEventId sur le bon RDV (par id) et préserve le reste', async () => {
    const file = path.join(tmpDir, 'rdvs.json');
    await fs.writeFile(file, JSON.stringify([makeRdv({ id: 'rdv-a' }), makeRdv({ id: 'rdv-b' })], null, 2), 'utf-8');

    const updated = await updateRdv('rdv-b', { googleEventId: 'event-456' }, file);

    expect(updated).not.toBeNull();
    expect(updated!.id).toBe('rdv-b');
    expect(updated!.googleEventId).toBe('event-456');
    expect(updated!.nom).toBe('Dupont'); // le reste est préservé

    const written = JSON.parse(await fs.readFile(file, 'utf-8'));
    expect(written).toHaveLength(2);
    expect(written[0].googleEventId).toBeUndefined();
    expect(written[1].googleEventId).toBe('event-456');
  });

  it('retourne null si l id n existe pas', async () => {
    const file = path.join(tmpDir, 'rdvs-inconnu.json');
    await fs.writeFile(file, JSON.stringify([makeRdv()], null, 2), 'utf-8');

    const result = await updateRdv('rdv-inexistant', { googleEventId: 'event-789' }, file);
    expect(result).toBeNull();
  });
});

// ============ buildEventPayload — valeurs par défaut & configuration ============

describe('buildEventPayload — valeurs par défaut et configuration', () => {
  it('utilise « logement » quand listing.type est absent', () => {
    const listingWithoutType = { ...appt5, type: undefined as never };
    const payload = buildEventPayload(makeRdv(), listingWithoutType);
    expect(payload.summary).toBe('Visite logement - Jean Dupont');
  });

  it('inclut l URL absolue de l annonce dans la description', () => {
    process.env.NEXT_PUBLIC_SITE_URL = 'https://example.com';
    try {
      const payload = buildEventPayload(makeRdv(), appt5);
      expect(payload.description).toContain('https://example.com/annonce/appt5');
    } finally {
      delete process.env.NEXT_PUBLIC_SITE_URL;
    }
  });

  it('utilise l URL par défaut quand NEXT_PUBLIC_SITE_URL est absent', () => {
    const savedUrl = process.env.NEXT_PUBLIC_SITE_URL;
    delete process.env.NEXT_PUBLIC_SITE_URL;
    try {
      const payload = buildEventPayload(makeRdv(), appt5);
      expect(payload.description).toContain('https://annonces.duckdns.org/annonce/appt5');
    } finally {
      if (savedUrl !== undefined) {
        process.env.NEXT_PUBLIC_SITE_URL = savedUrl;
      }
    }
  });
});
