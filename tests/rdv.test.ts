import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import fs from 'fs/promises';
import os from 'os';
import path from 'path';
import {
  generateSlotsForDate,
  getAvailableSlots,
  isSlotAvailable,
  hasOverlap,
  bookRdv,
  formatRdvDateTime,
  getTodayInTimeZone,
  getDateInTimeZone,
  zonedTimeToUtc,
  type Rdv,
  type RdvBookingInput,
} from '../lib/rdv';
import { getListingById } from '../lib/listings';

// Config réelle de l'annonce appt5 (T2 n°5) — la config de la mission
const appt5Config = getListingById('appt5')!.rdv!;

function makeRdv(overrides: Partial<Rdv> = {}): Rdv {
  return {
    id: 'rdv-test',
    listingId: 'appt5',
    start: '2026-08-10T16:30:00.000Z',
    end: '2026-08-10T16:45:00.000Z',
    nom: 'Dupont',
    prenom: 'Jean',
    telephone: '0600000000',
    email: 'jean@example.com',
    createdAt: '2026-08-01T10:00:00.000Z',
    ...overrides,
  };
}

function makeInput(overrides: Partial<RdvBookingInput> = {}): RdvBookingInput {
  return {
    listingId: 'appt5',
    start: '2026-08-10T17:00:00.000Z', // 19h00 Paris (lundi)
    durationMinutes: 15,
    nom: 'Dupont',
    prenom: 'Jean',
    telephone: '0600000000',
    email: 'jean@example.com',
    ...overrides,
  };
}

describe('Config rdv de appt5 (T2 n°5)', () => {
  it('existe sur l annonce appt5 avec les valeurs exactes de la mission', () => {
    expect(appt5Config).toBeDefined();
    expect(appt5Config.durationMinutes).toBe(15); // EXACTEMENT 15 minutes
    expect(appt5Config.days).toEqual([1, 2, 3, 4, 5]); // lundi à vendredi (JS getDay 0=dimanche)
    expect(appt5Config.startTime).toBe('18:30');
    expect(appt5Config.endTime).toBe('19:30');
    expect(appt5Config.minLeadDays).toBe(1);
    expect(appt5Config.maxLeadDays).toBe(21);
    expect(appt5Config.timezone).toBe('Europe/Paris');
    expect(appt5Config.availableFrom).toBe('2026-08-17'); // pas de visite avant le 17 août 2026
  });

  it('raismes-t3 n a pas de config rdv (fallback Google Calendar inchangé)', () => {
    expect(getListingById('raismes-t3')!.rdv).toBeUndefined();
  });

  it('appt5 expose le rdvBailleur (name Gabriel, phone 07 81 15 45 03)', () => {
    const listing = getListingById('appt5')!;
    expect(listing.rdvBailleur).toBeDefined();
    expect(listing.rdvBailleur!.name).toBe('Gabriel');
    expect(listing.rdvBailleur!.phone).toBe('07 81 15 45 03');
  });

  it('raismes-t3 n a pas de rdvBailleur (inchangé)', () => {
    expect(getListingById('raismes-t3')!.rdvBailleur).toBeUndefined();
  });
});

describe('generateSlotsForDate — génération des créneaux', () => {
  it('génère 4 créneaux de 15 min entre 18h30 et 19h30 un lundi (Europe/Paris)', () => {
    // 2026-08-10 est un lundi ; été → UTC+2
    const slots = generateSlotsForDate(appt5Config, '2026-08-10');
    expect(slots).toHaveLength(4);
    expect(slots.map((s) => s.start)).toEqual([
      '2026-08-10T16:30:00.000Z', // 18h30 Paris
      '2026-08-10T16:45:00.000Z', // 18h45
      '2026-08-10T17:00:00.000Z', // 19h00
      '2026-08-10T17:15:00.000Z', // 19h15
    ]);
    expect(slots.map((s) => s.end)).toEqual([
      '2026-08-10T16:45:00.000Z',
      '2026-08-10T17:00:00.000Z',
      '2026-08-10T17:15:00.000Z',
      '2026-08-10T17:30:00.000Z',
    ]);
  });

  it('chaque créneau dure EXACTEMENT 15 minutes', () => {
    for (const slot of generateSlotsForDate(appt5Config, '2026-08-10')) {
      const durationMs = new Date(slot.end).getTime() - new Date(slot.start).getTime();
      expect(durationMs).toBe(15 * 60 * 1000);
    }
  });

  it('ne génère aucun créneau samedi et dimanche', () => {
    expect(generateSlotsForDate(appt5Config, '2026-08-08')).toHaveLength(0); // samedi
    expect(generateSlotsForDate(appt5Config, '2026-08-09')).toHaveLength(0); // dimanche
  });

  it('génère les créneaux un vendredi (jour 5 inclus)', () => {
    expect(generateSlotsForDate(appt5Config, '2026-08-14')).toHaveLength(4); // vendredi
  });

  it('retire les créneaux déjà pris (chevauchement avec un RDV existant)', () => {
    const taken = [makeRdv({ start: '2026-08-10T16:45:00.000Z', end: '2026-08-10T17:00:00.000Z' })];
    const slots = generateSlotsForDate(appt5Config, '2026-08-10', taken);
    expect(slots).toHaveLength(3);
    expect(slots.map((s) => s.start)).not.toContain('2026-08-10T16:45:00.000Z');
  });
});

describe('getAvailableSlots — prochaines dates avec créneaux', () => {
  it('respecte minLeadDays=1 : le premier jour proposé est au plus tôt le lendemain', () => {
    // Sans availableFrom pour isoler la règle minLeadDays (la config appt5 bloque avant le 17/08)
    const configSansBlocage = { ...appt5Config, availableFrom: undefined };
    // from = samedi 2026-08-08 → lendemain = dimanche 09 (pas de créneau) → lundi 10
    const dates = getAvailableSlots(configSansBlocage, '2026-08-08', []);
    expect(dates.length).toBeGreaterThan(0);
    expect(dates[0].date).toBe('2026-08-10');
    expect(dates[0].slots).toHaveLength(4);
  });

  it('borne la fenêtre à maxLeadDays=21 jours', () => {
    const dates = getAvailableSlots(appt5Config, '2026-08-08', []);
    const last = dates[dates.length - 1];
    // 08-08 + 21 jours = 08-29 ; dernier jour ouvré de la fenêtre = vendredi 08-28
    expect(last.date).toBe('2026-08-28');
    expect(dates.some((d) => d.date === '2026-08-29')).toBe(false);
  });

  it('ne liste que des dates avec au moins un créneau restant, jours 1..5 uniquement', () => {
    const dates = getAvailableSlots(appt5Config, '2026-08-08', []);
    for (const d of dates) {
      expect(d.slots.length).toBeGreaterThan(0);
      const day = new Date(`${d.date}T00:00:00Z`).getUTCDay();
      expect([1, 2, 3, 4, 5]).toContain(day);
    }
  });

  it('exclut une date entièrement réservée', () => {
    // Réserve tous les créneaux du lundi 17 août (premier jour autorisé par availableFrom)
    const taken = ['2026-08-17T16:30:00.000Z', '2026-08-17T16:45:00.000Z', '2026-08-17T17:00:00.000Z', '2026-08-17T17:15:00.000Z'].map(
      (start) => makeRdv({ start, end: new Date(new Date(start).getTime() + 15 * 60 * 1000).toISOString() })
    );
    const dates = getAvailableSlots(appt5Config, '2026-08-08', taken);
    expect(dates.some((d) => d.date === '2026-08-17')).toBe(false);
    expect(dates[0].date).toBe('2026-08-18'); // mardi
  });
});

describe('hasOverlap — chevauchement', () => {
  it('détecte un chevauchement exact', () => {
    const rdvs = [makeRdv({ start: '2026-08-10T16:30:00.000Z', end: '2026-08-10T16:45:00.000Z' })];
    expect(hasOverlap(rdvs, '2026-08-10T16:30:00.000Z', '2026-08-10T16:45:00.000Z')).toBe(true);
  });

  it('détecte un chevauchement partiel', () => {
    const rdvs = [makeRdv({ start: '2026-08-10T16:30:00.000Z', end: '2026-08-10T16:45:00.000Z' })];
    expect(hasOverlap(rdvs, '2026-08-10T16:40:00.000Z', '2026-08-10T16:50:00.000Z')).toBe(true);
  });

  it('ne signale pas de conflit pour des créneaux adjacents (frontières exclusives)', () => {
    const rdvs = [makeRdv({ start: '2026-08-10T16:30:00.000Z', end: '2026-08-10T16:45:00.000Z' })];
    expect(hasOverlap(rdvs, '2026-08-10T16:15:00.000Z', '2026-08-10T16:30:00.000Z')).toBe(false);
    expect(hasOverlap(rdvs, '2026-08-10T16:45:00.000Z', '2026-08-10T17:00:00.000Z')).toBe(false);
  });
});

describe('isSlotAvailable — vérification de dispo', () => {
  it('retourne true pour un créneau valide non pris', () => {
    expect(isSlotAvailable(appt5Config, '2026-08-17T17:00:00.000Z', [])).toBe(true);
  });

  it('retourne false si le créneau est déjà pris', () => {
    const rdvs = [makeRdv({ start: '2026-08-17T17:00:00.000Z', end: '2026-08-17T17:15:00.000Z' })];
    expect(isSlotAvailable(appt5Config, '2026-08-17T17:00:00.000Z', rdvs)).toBe(false);
  });

  it('retourne false pour un horaire qui n est pas un début de créneau', () => {
    expect(isSlotAvailable(appt5Config, '2026-08-17T16:37:00.000Z', [])).toBe(false);
  });

  it('retourne false hors plage horaire (avant 18h30 / après 19h30 Paris)', () => {
    expect(isSlotAvailable(appt5Config, '2026-08-17T16:00:00.000Z', [])).toBe(false); // 18h00 Paris
    expect(isSlotAvailable(appt5Config, '2026-08-17T18:00:00.000Z', [])).toBe(false); // 20h00 Paris
  });

  it('retourne false un samedi même à la bonne heure', () => {
    expect(isSlotAvailable(appt5Config, '2026-08-22T16:30:00.000Z', [])).toBe(false); // samedi 22 août 18h30 Paris
  });
});

describe('getAvailableSlots — availableFrom (blocage des dates antérieures)', () => {
  it('exclut les dates strictement antérieures à availableFrom et commence à 2026-08-17', () => {
    const dates = getAvailableSlots(appt5Config, '2026-08-08', []);
    expect(dates.length).toBeGreaterThan(0);
    for (const d of dates) {
      expect(d.date >= '2026-08-17').toBe(true);
    }
    // vendredi 14 août < availableFrom → exclu
    expect(dates.some((d) => d.date === '2026-08-14')).toBe(false);
    expect(dates[0].date).toBe('2026-08-17');
  });

  it('inclut la date availableFrom elle-même', () => {
    const dates = getAvailableSlots(appt5Config, '2026-08-08', []);
    const d = dates.find((x) => x.date === '2026-08-17');
    expect(d).toBeDefined();
    expect(d!.slots).toHaveLength(4); // lundi 17 août : 4 créneaux de 15 min
  });

  it('sans availableFrom, le comportement est inchangé (aucun blocage)', () => {
    const configSansBlocage = { ...appt5Config, availableFrom: undefined };
    const dates = getAvailableSlots(configSansBlocage, '2026-08-08', []);
    expect(dates.some((d) => d.date === '2026-08-10')).toBe(true); // lundi 10 août proposé
  });
});

describe('isSlotAvailable — availableFrom (blocage des dates antérieures)', () => {
  it('retourne false pour un créneau dont la date locale est strictement antérieure à availableFrom', () => {
    // vendredi 14 août 18h30 Paris = 16:30 UTC → date locale 2026-08-14 < 2026-08-17
    expect(isSlotAvailable(appt5Config, '2026-08-14T16:30:00.000Z', [])).toBe(false);
  });

  it('retourne true le jour même de availableFrom (date incluse)', () => {
    // lundi 17 août 18h30 Paris = 16:30 UTC → date locale 2026-08-17 == availableFrom
    expect(isSlotAvailable(appt5Config, '2026-08-17T16:30:00.000Z', [])).toBe(true);
  });

  it('retourne true pour un créneau après availableFrom', () => {
    expect(isSlotAvailable(appt5Config, '2026-08-18T16:30:00.000Z', [])).toBe(true);
  });
});

describe('bookRdv — réservation atomique (data/rdvs.json)', () => {
  let tmpDir: string;

  beforeAll(async () => {
    tmpDir = await fs.mkdtemp(path.join(os.tmpdir(), 'rdv-test-'));
  });

  afterAll(async () => {
    await fs.rm(tmpDir, { recursive: true, force: true });
  });

  it('réserve un créneau et l écrit dans le fichier JSON (créé si absent)', async () => {
    const file = path.join(tmpDir, 'rdvs.json');
    const result = await bookRdv(makeInput(), file);

    expect(result.ok).toBe(true);
    if (!result.ok) return;
    expect(result.rdv.id).toBeTruthy();
    expect(result.rdv.listingId).toBe('appt5');
    expect(result.rdv.start).toBe('2026-08-10T17:00:00.000Z');
    expect(result.rdv.end).toBe('2026-08-10T17:15:00.000Z'); // durée 15 min calculée
    expect(result.rdv.nom).toBe('Dupont');
    expect(result.rdv.prenom).toBe('Jean');
    expect(result.rdv.telephone).toBe('0600000000');
    expect(result.rdv.email).toBe('jean@example.com');
    expect(result.rdv.createdAt).toBeTruthy();

    const written = JSON.parse(await fs.readFile(file, 'utf-8'));
    expect(Array.isArray(written)).toBe(true);
    expect(written).toHaveLength(1);
  });

  it('crée le répertoire data s il n existe pas', async () => {
    const file = path.join(tmpDir, 'sous-dossier-inexistant', 'rdvs.json');
    const result = await bookRdv(makeInput({ start: '2026-08-11T16:30:00.000Z' }), file);
    expect(result.ok).toBe(true);
    await expect(fs.access(file)).resolves.toBeUndefined();
  });

  it('rejette un double booking du même créneau (CONFLICT)', async () => {
    const file = path.join(tmpDir, 'rdvs-double.json');
    const input = makeInput();

    const first = await bookRdv(input, file);
    expect(first.ok).toBe(true);

    const second = await bookRdv(input, file);
    expect(second.ok).toBe(false);
    if (second.ok) return;
    expect(second.reason).toBe('CONFLICT');

    // Toujours un seul RDV dans le fichier
    const written = JSON.parse(await fs.readFile(file, 'utf-8'));
    expect(written).toHaveLength(1);
  });

  it('rejette un créneau chevauchant un RDV existant (même listing)', async () => {
    const file = path.join(tmpDir, 'rdvs-overlap.json');
    const first = await bookRdv(makeInput({ start: '2026-08-11T16:45:00.000Z' }), file);
    expect(first.ok).toBe(true);

    const overlapping = await bookRdv(
      makeInput({ start: '2026-08-11T16:50:00.000Z' }),
      file
    );
    expect(overlapping.ok).toBe(false);
    if (overlapping.ok) return;
    expect(overlapping.reason).toBe('CONFLICT');
  });

  it('autorise un créneau adjacent (frontière exacte) après le premier', async () => {
    const file = path.join(tmpDir, 'rdvs-adjacent.json');
    const first = await bookRdv(makeInput({ start: '2026-08-11T16:30:00.000Z' }), file);
    expect(first.ok).toBe(true);

    const adjacent = await bookRdv(makeInput({ start: '2026-08-11T16:45:00.000Z' }), file);
    expect(adjacent.ok).toBe(true);
  });
});

describe('formatRdvDateTime / getTodayInTimeZone', () => {
  it('formate un créneau en français avec la date et l heure (Europe/Paris)', () => {
    const formatted = formatRdvDateTime('2026-08-10T16:30:00.000Z', 'Europe/Paris');
    expect(formatted).toContain('lundi');
    expect(formatted).toContain('août');
    expect(formatted).toContain('18:30');
  });

  it('getTodayInTimeZone retourne une date YYYY-MM-DD valide', () => {
    const today = getTodayInTimeZone('Europe/Paris');
    expect(today).toMatch(/^\d{4}-\d{2}-\d{2}$/);
    expect(Number.isNaN(new Date(`${today}T00:00:00Z`).getTime())).toBe(false);
  });
});

// ============ Tests complémentaires — trous de couverture ============

describe('zonedTimeToUtc — conversion fuseau → UTC (été ET hiver)', () => {
  it('hiver (janvier) : Paris UTC+1', () => {
    const utc = zonedTimeToUtc('2026-01-12', '18:30', 'Europe/Paris'); // lundi
    // 18h30 locale = 17h30 UTC en janvier (UTC+1)
    expect(utc.toISOString()).toBe('2026-01-12T17:30:00.000Z');
  });

  it('été (août) : Paris UTC+2', () => {
    const utc = zonedTimeToUtc('2026-08-10', '18:30', 'Europe/Paris'); // lundi
    // 18h30 locale = 16h30 UTC en été (UTC+2)
    expect(utc.toISOString()).toBe('2026-08-10T16:30:00.000Z');
  });

  it('change d heure d ete (mars) : passage a UTC+2 le dernier dimanche de mars', () => {
    // 29 mars 2026 = dernier dimanche de mars → switch a 2h00 locale
    // 18h30 le 29/03 est deja en ETA
    const utc = zonedTimeToUtc('2026-03-29', '18:30', 'Europe/Paris');
    expect(utc.toISOString()).toBe('2026-03-29T16:30:00.000Z');
  });

  it('retour a l heure d hiver (octobre) : dernier dimanche d octobre', () => {
    // 25 octobre 2026 = dernier dimanche → switch a 3h00 locale
    // 18h30 le 25/10 est deja en HIVER
    const utc = zonedTimeToUtc('2026-10-25', '18:30', 'Europe/Paris');
    expect(utc.toISOString()).toBe('2026-10-25T17:30:00.000Z');
  });

  it('gere un autre fuseau : America/New_York en hiver (UTC-5)', () => {
    const utc = zonedTimeToUtc('2026-01-12', '12:00', 'America/New_York');
    // 12h00 NY hiver = 17h00 UTC
    expect(utc.toISOString()).toBe('2026-01-12T17:00:00.000Z');
  });
});

describe('getDateInTimeZone — extraction date calendaire dans un fuseau', () => {
  it('extrait la bonne date en mode ete', () => {
    // 16:30 UTC = 18:30 Paris (ete)
    expect(getDateInTimeZone('2026-08-10T16:30:00.000Z', 'Europe/Paris')).toBe('2026-08-10');
  });

  it('extrait la bonne date en mode hiver', () => {
    // 17:30 UTC = 18:30 Paris (hiver)
    expect(getDateInTimeZone('2026-01-12T17:30:00.000Z', 'Europe/Paris')).toBe('2026-01-12');
  });

  it('retourne la date precedente quand l instant est juste avant minuit local', () => {
    // 23:00 Paris = 21:00 UTC (ete) → le timestamp est encore le meme jour
    // Mais 01:00 UTC (ete) = 03:00 Paris → meme jour
    // Cas limite : 22:00 UTC (ete) = 00:00 Paris J+1 → on doit obtenir J+1
    expect(getDateInTimeZone('2026-08-09T22:00:00.000Z', 'Europe/Paris')).toBe('2026-08-10');
  });
});

describe('generateSlotsForDate — duree non divisante la plage', () => {
  const config20min = { ...appt5Config, durationMinutes: 20 };

  it('genere 3 creneaux de 20 min entre 18h30 et 19h30 (plage 60 / 20 = 3)', () => {
    const slots = generateSlotsForDate(config20min, '2026-08-10');
    expect(slots).toHaveLength(3);
    // 18h30, 18h50, 19h10 → dernier finit a 19h30 exactement
    const lastEnd = new Date(slots[2].end).getTime();
    const endTimeMs = zonedTimeToUtc('2026-08-10', '19:30', 'Europe/Paris').getTime();
    expect(lastEnd).toBe(endTimeMs);
  });

  it('ne genere rien si la duree depasse la plage', () => {
    const configTooBig = { ...appt5Config, durationMinutes: 61 };
    const slots = generateSlotsForDate(configTooBig, '2026-08-10');
    expect(slots).toHaveLength(0);
  });
});

describe('generateSlotsForDate — traverses de mois et annee', () => {
  it('fonctionne quand le lead passe au mois suivant', () => {
    // from = 2026-08-20, minLeadDays=1 → start 08-21, max 08-20+21=09-10
    const dates = getAvailableSlots(appt5Config, '2026-08-20', []);
    expect(dates.length).toBeGreaterThan(0);
    // Premiere date = 08-21 (mardi)
    expect(dates[0].date).toBe('2026-08-21');
    // Derniere date = <= 09-10 (jeudi)
    const last = dates[dates.length - 1];
    expect(last.date).toBe('2026-09-10');
  });

  it('traversee decembre → janvier', () => {
    // from = 2026-12-20, minLead=1, maxLead=21 → 12-21 to 01-10
    const dates = getAvailableSlots(appt5Config, '2026-12-20', []);
    expect(dates.length).toBeGreaterThan(0);
    expect(dates[0].date.startsWith('2026-12')).toBe(true);
    const last = dates[dates.length - 1];
    expect(last.date.startsWith('2027-01')).toBe(true);
  });

  it('si tous les jours de la fenetre sont des week-ends → []', () => {
    // from = samedi 2026-08-08 + minLeadDays=5 → debute 08-13 (jeudi) donc ca marche pas
    // Force avec un from tel que min lead tombe sur un weekend couvert par max lead
    // from = vendredi 2026-08-07 + minLeadDays=0 + maxLeadDays=0 → seulement 08-07 (vendredi) OK
    // Pour avoir uniquement weekend : minLeadDays=2 depuis samedi 08-08 → 08-10 (lundi) OK
    // C'est impossible avec days=[1..5] et min/max<=6 sans tomber sur un semaine ouvrée
    // Test plus simple: un from tres reculé
    const empty = getAvailableSlots({ ...appt5Config, maxLeadDays: 0 }, '2026-08-09');
    expect(empty).toEqual([]); // dimanche + maxLeadDays=0 → only day 0 after sun = sun itself → excluded by days
  });
});

describe('hasOverlap — bords et cas limites', () => {
  it('tableau vide → false', () => {
    expect(hasOverlap([], '2026-08-10T16:30:00.000Z', '2026-08-10T16:45:00.000Z')).toBe(false);
  });

  it('deux RDV distincts : ni l un ni lautre ne chevauche [A,B) mais un autre intervalle oui', () => {
    const rdvs = [
      makeRdv({ start: '2026-08-10T16:00:00.000Z', end: '2026-08-10T16:15:00.000Z' }),
      makeRdv({ start: '2026-08-10T17:30:00.000Z', end: '2026-08-10T17:45:00.000Z' }),
    ];
    // L intervalle cible est entre les deux
    expect(hasOverlap(rdvs, '2026-08-10T16:30:00.000Z', '2026-08-10T16:45:00.000Z')).toBe(false);
  });

  it('contiguite exacte : A fini exactement ou B commence → aucun chevauchement', () => {
    const rdvs = [makeRdv({ start: '2026-08-10T16:30:00.000Z', end: '2026-08-10T17:00:00.000Z' })];
    // B commence exactement ou A finit
    expect(hasOverlap(rdvs, '2026-08-10T17:00:00.000Z', '2026-08-10T17:15:00.000Z')).toBe(false);
    // B finit exactement ou A commence
    expect(hasOverlap(rdvs, '2026-08-10T16:15:00.000Z', '2026-08-10T16:30:00.000Z')).toBe(false);
  });
});

describe('isSlotAvailable — cas limites', () => {
  it('timestamp NaN → false', () => {
    expect(isSlotAvailable(appt5Config, 'invalid-date', [])).toBe(false);
  });

  it('creation multiple successive dans un fichier temporaire (pas de course)', async () => {
    let tmpDir: string;
    tmpDir = await fs.mkdtemp(path.join(os.tmpdir(), 'rdv-multi-'));
    try {
      const file = path.join(tmpDir, 'multi.json');
      // Book sequentially (not concurrently — the write queue handles that anyway)
      for (let i = 0; i < 3; i++) {
        const r = await bookRdv(
          makeInput({
            start: `2026-08-${11 + i}T16:30:00.000Z`,
          }),
          file
        );
        expect(r.ok).toBe(true);
      }
      const data = JSON.parse(await fs.readFile(file, 'utf-8'));
      expect(data).toHaveLength(3);
    } finally {
      await fs.rm(tmpDir, { recursive: true, force: true });
    }
  });
});
