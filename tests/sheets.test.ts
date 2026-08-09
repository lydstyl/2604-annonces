import { describe, it, expect, vi } from 'vitest';
import {
  getSheetTabForListing,
  ensureSheetTab,
  buildCandidatureRow,
  SHEET_HEADERS,
  ADMIN_TAB,
  type SheetsClientLike,
} from '../lib/sheets';
import type { Candidature } from '../lib/storage';

const SPREADSHEET_ID = '1rZ9NOGgLcBHKwVQvtwjvB3A0k5BZ5eC46LhbMffQM50';

function makeCandidature(overrides: Partial<Candidature> = {}): Candidature {
  return {
    id: 'cand-test',
    listingId: 'appt5',
    nom: 'Dupont',
    prenom: 'Jean',
    telephone: '0600000000',
    email: 'jean@example.com',
    revenusMenuels: 1800,
    peutFournirGarant: true,
    cdiPlus3Mois: true,
    garantieVisale: false,
    dateAmenagement: '',
    remarques: 'Disponible rapidement',
    dateSubmission: '2026-08-01T10:00:00.000Z',
    ...overrides,
  };
}

// Client Sheets factice pour ensureSheetTab (dépendance injectée, pas d'appel réseau)
function makeSheetsClient(existingTabs: string[]) {
  const get = vi.fn(async () => ({
    data: { sheets: existingTabs.map((title) => ({ properties: { title } })) },
  }));
  const batchUpdate = vi.fn(async () => ({}));
  const update = vi.fn(async () => ({}));
  const sheets = {
    spreadsheets: {
      get,
      batchUpdate,
      values: { update },
    },
  } as unknown as SheetsClientLike;
  return { sheets, get, batchUpdate, update };
}

describe('getSheetTabForListing — onglet dédié par annonce', () => {
  it('route appt5 (T2 n°5) vers un onglet dédié, séparé de Admin', () => {
    const tab = getSheetTabForListing('appt5');
    expect(tab).toBe('T2 appt5');
    expect(tab).not.toBe(ADMIN_TAB);
  });

  it('route raismes-t3 (T3) vers l onglet Admin existant', () => {
    expect(getSheetTabForListing('raismes-t3')).toBe(ADMIN_TAB);
  });

  it('retombe sur Admin pour une annonce inconnue (comportement actuel inchangé)', () => {
    expect(getSheetTabForListing('inconnu')).toBe(ADMIN_TAB);
  });
});

describe('ensureSheetTab — création de l onglet dédié si absent', () => {
  it('ne crée rien si l onglet existe déjà', async () => {
    const { sheets, batchUpdate, update } = makeSheetsClient([ADMIN_TAB, 'T2 appt5']);
    await ensureSheetTab(sheets, SPREADSHEET_ID, 'T2 appt5');
    expect(batchUpdate).not.toHaveBeenCalled();
    expect(update).not.toHaveBeenCalled();
  });

  it('crée l onglet dédié via batchUpdate addSheet et initialise les en-têtes s il est absent', async () => {
    const { sheets, batchUpdate, update } = makeSheetsClient([ADMIN_TAB]);
    await ensureSheetTab(sheets, SPREADSHEET_ID, 'T2 appt5');
    expect(batchUpdate).toHaveBeenCalledTimes(1);
    expect(batchUpdate).toHaveBeenCalledWith({
      spreadsheetId: SPREADSHEET_ID,
      requestBody: {
        requests: [{ addSheet: { properties: { title: 'T2 appt5' } } }],
      },
    });
    expect(update).toHaveBeenCalledTimes(1);
    expect(update).toHaveBeenCalledWith({
      spreadsheetId: SPREADSHEET_ID,
      range: "'T2 appt5'!A1:K1",
      valueInputOption: 'USER_ENTERED',
      requestBody: { values: [SHEET_HEADERS] },
    });
  });
});

describe('SHEET_HEADERS — en-têtes du nouvel onglet dédié', () => {
  it('définit les 11 colonnes au même format que l onglet Admin', () => {
    expect(SHEET_HEADERS).toHaveLength(11);
    expect(SHEET_HEADERS[0]).toBe('N°');
    expect(SHEET_HEADERS).toContain('Téléphone');
    expect(SHEET_HEADERS).toContain('Email');
  });
});

describe('buildCandidatureRow — construction de la ligne', () => {
  it('construit la ligne avec le numéro incrémenté et les coordonnées du candidat', () => {
    const row = buildCandidatureRow(makeCandidature(), 7);
    expect(row[0]).toBe(7);
    expect(row[1]).toBe('Jean Dupont');
    expect(row[2]).toBe('Nouveau');
    expect(row[6]).toBe("'0600000000"); // ' force le format texte (garde le 0)
    expect(row[7]).toBe('jean@example.com');
    expect(row).toHaveLength(11);
  });

  it('formate les revenus avec espace fine et symbole €', () => {
    const row = buildCandidatureRow(makeCandidature({ revenusMenuels: 1800 }), 1);
    expect(row[3]).toContain('€');
  });

  it('affiche ✅ Oui en colonne K pour garantieVisale (nouvelle colonne feature T2)', () => {
    const row = buildCandidatureRow(makeCandidature({ garantieVisale: true }), 1);
    expect(row[10]).toBe('✅ Oui');
  });

  it('affiche ❌ Non pour les booléens false (CDI, garant, Visale)', () => {
    const row = buildCandidatureRow(makeCandidature({
      cdiPlus3Mois: false,
      peutFournirGarant: false,
      garantieVisale: false,
    }), 1);
    expect(row[4]).toBe('❌ Non'); // peutFournirGarant
    expect(row[5]).toBe('❌ Non'); // cdiPlus3Mois
    expect(row[10]).toBe('❌ Non'); // garantieVisale
  });

  it('gère les remarques vides (chaîne vide)', () => {
    const row = buildCandidatureRow(makeCandidature({ remarques: '' }), 1);
    expect(row[9]).toBe('');
  });

  it('formate la date en français (JJ/MM/AAAA HH:MM)', () => {
    const row = buildCandidatureRow(makeCandidature({ dateSubmission: '2025-12-31T23:59:00.000Z' }), 1);
    // La date est formatée en heure locale par new Date(). Le test vérifie juste
    // que le format est JJ/MM/AAAA HH:MM (pas ISO).
    expect(row[8]).toMatch(/^\d{2}\/\d{2}\/\d{4} \d{2}:\d{2}$/);
  });
});
