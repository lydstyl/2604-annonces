import type { Candidature } from './storage';
import path from 'path';
import fs from 'fs';
import os from 'os';

const SPREADSHEET_ID = '1rZ9NOGgLcBHKwVQvtwjvB3A0k5BZ5eC46LhbMffQM50';

// ============ Onglets du spreadsheet ============
//
// Les candidatures T3 (raismes-t3) s'écrivent dans l'onglet « T3 » historique
// (gid 715080568). Les candidatures T2 appt5 (appt5) sont enregistrées dans un
// onglet DÉDIÉ « T2 appt5 », créé automatiquement s'il n'existe pas, pour ne
// pas mélanger les deux biens dans le même onglet.

export const ADMIN_TAB = 'Admin';

// Mapping annonce → onglet dédié. Toute annonce absente → Admin (défaut).
export const SHEET_TAB_BY_LISTING: Record<string, string> = {
  appt5: 'T2 appt5',
  'raismes-t3': 'T3',
};

export function getSheetTabForListing(listingId: string): string {
  return SHEET_TAB_BY_LISTING[listingId] ?? ADMIN_TAB;
}

// ============ Lien Google Sheets par annonce ============
//
// L'email de notification « Nouvelle candidature » (lib/email.ts) affiche un
// lien « 📊 Voir le Google Sheets ». Pour les annonces avec un onglet dédié,
// le lien pointe directement sur le bon onglet via son gid ; pour les autres
// (défaut), le lien reste inchangé (sans gid).

// gid des onglets dédiés : annonce → identifiant d'onglet
export const SHEET_GID_BY_LISTING: Record<string, string> = {
  appt5: '1158512914',
  'raismes-t3': '715080568',
};

/**
 * URL complète du Google Sheets (avec gid d'onglet le cas échéant) pour une
 * annonce. Fonction pure : appt5 (T2) → lien avec gid=1158512914 ; raismes-t3
 * (T3) → lien avec gid=715080568 ; tout autre listingId → lien de base
 * inchangé (sans gid).
 */
export function getSheetUrlForListing(listingId: string): string {
  const baseUrl = `https://docs.google.com/spreadsheets/d/${SPREADSHEET_ID}`;
  const gid = SHEET_GID_BY_LISTING[listingId];
  return gid ? `${baseUrl}/edit#gid=${gid}` : baseUrl;
}

// En-têtes du nouvel onglet dédié — mêmes colonnes que l'onglet Admin
export const SHEET_HEADERS: string[] = [
  'N°',
  'Nom Prénom',
  'Statut',
  'Revenus',
  'Garant',
  'CDI > 3 mois',
  'Téléphone',
  'Email',
  'Date',
  'Remarques',
  'Garantie Visale',
];

// Client Sheets minimal utilisé par ensureSheetTab (injectable pour les tests)
export interface SheetsClientLike {
  spreadsheets: {
    get: (params: { spreadsheetId: string; fields?: string }) => Promise<{
      data: { sheets?: Array<{ properties?: { title?: string } }> };
    }>;
    batchUpdate: (params: {
      spreadsheetId: string;
      requestBody: { requests: Array<{ addSheet: { properties: { title: string } } }> };
    }) => Promise<unknown>;
    values: {
      update: (params: {
        spreadsheetId: string;
        range: string;
        valueInputOption: string;
        requestBody: { values: (string | number)[][] };
      }) => Promise<unknown>;
    };
  };
}

/**
 * Vérifie que l'onglet `tabName` existe dans le spreadsheet ; le crée via
 * batchUpdate (addSheet) s'il est absent, puis initialise ses en-têtes.
 * Fonction pure côté logique : le client Sheets est injecté (tests sans réseau).
 */
export async function ensureSheetTab(
  sheets: SheetsClientLike,
  spreadsheetId: string,
  tabName: string
): Promise<void> {
  const meta = await sheets.spreadsheets.get({
    spreadsheetId,
    fields: 'sheets.properties.title',
  });
  const titles = (meta.data.sheets ?? [])
    .map((s) => s.properties?.title)
    .filter((t): t is string => Boolean(t));

  if (titles.includes(tabName)) {
    return;
  }

  await sheets.spreadsheets.batchUpdate({
    spreadsheetId,
    requestBody: {
      requests: [{ addSheet: { properties: { title: tabName } } }],
    },
  });

  // Initialiser les en-têtes du nouvel onglet
  await sheets.spreadsheets.values.update({
    spreadsheetId,
    range: `'${tabName}'!A1:K1`,
    valueInputOption: 'USER_ENTERED',
    requestBody: { values: [SHEET_HEADERS] },
  });
}

// ============ Formatage (présentation French-style) ============

function formatFrenchDate(isoString: string): string {
  const d = new Date(isoString);
  const day = String(d.getDate()).padStart(2, '0');
  const month = String(d.getMonth() + 1).padStart(2, '0');
  const year = d.getFullYear();
  const hours = String(d.getHours()).padStart(2, '0');
  const mins = String(d.getMinutes()).padStart(2, '0');
  return `${day}/${month}/${year} ${hours}:${mins}`;
}

function formatRevenus(revenus: number): string {
  // Format: "1 800€" with French spacing and euro symbol
  const parts = Math.round(revenus).toString().split('');
  const withSpaces: string[] = [];
  for (let i = parts.length - 1, count = 0; i >= 0; i--, count++) {
    if (count > 0 && count % 3 === 0) withSpaces.unshift('\u202f');
    withSpaces.unshift(parts[i]);
  }
  return withSpaces.join('') + '\u202f€';
}

function boolToOuiNon(val: boolean | undefined | null): string {
  return val ? '✅ Oui' : '❌ Non';
}

// ============ Construction de la ligne ============

/**
 * Construit la ligne d'une candidature dans le sheet (11 colonnes, A..K).
 * Note: préfixer le téléphone avec ' pour éviter que Sheets mange le 0 initial.
 */
export function buildCandidatureRow(candidature: Candidature, nextNum: number): (string | number)[] {
  return [
    nextNum,
    `${candidature.prenom} ${candidature.nom}`,
    'Nouveau',
    formatRevenus(candidature.revenusMenuels),
    boolToOuiNon(candidature.peutFournirGarant),
    boolToOuiNon(candidature.cdiPlus3Mois),
    `'${candidature.telephone}`, // ' force le format texte dans Sheets
    candidature.email,
    formatFrenchDate(candidature.dateSubmission),
    candidature.remarques || '',
    boolToOuiNon(candidature.garantieVisale), // colonne K — garantie Visale (Action Logement)
  ];
}

/**
 * Écrit la candidature dans l'onglet Google Sheet de son annonce :
 * - appt5 (T2) → onglet dédié « T2 appt5 » (créé automatiquement si absent)
 * - raismes-t3 (T3) → onglet « T3 » historique (gid 715080568)
 * - autres annonces → onglet « Admin » (défaut)
 * Appelée après saveCandidature() dans la route API.
 * Ne fait pas planter la route si le write échoue.
 */
export async function appendCandidatureToSheet(candidature: Candidature): Promise<void> {
  try {
    // 1. Charger le token Google depuis ~/.hermes/google_token.json
    const tokenPath = path.join(os.homedir(), '.hermes', 'google_token.json');
    if (!fs.existsSync(tokenPath)) {
      console.warn('[sheets] Token Google introuvable, écriture sheet ignorée');
      return;
    }

    const tokenData = JSON.parse(fs.readFileSync(tokenPath, 'utf-8'));

    // Fix: l'expiry peut être stocké en timestamp numérique au lieu d'ISO string
    if (typeof tokenData.expiry === 'number') {
      const expiryDate = new Date(tokenData.expiry * 1000);
      tokenData.expiry = expiryDate.toISOString();
    }

    // 2. Initialiser Google Sheets API
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
      let refreshedToken: string | null = null;
      let refreshedExpiry: string | null = null;
      try {
        const { credentials } = await auth.refreshAccessToken();
        refreshedToken = credentials.access_token ?? null;
        refreshedExpiry = credentials.expiry_date
          ? new Date(credentials.expiry_date).toISOString()
          : null;
      } catch (refreshErr) {
        // Vrai échec du refresh : on garde le token existant.
        console.warn('[sheets] Refresh token échoué, tentative avec token existant');
      }
      if (refreshedToken) {
        tokenData.token = refreshedToken;
        if (refreshedExpiry) tokenData.expiry = refreshedExpiry;
        try {
          fs.writeFileSync(tokenPath, JSON.stringify(tokenData, null, 2), 'utf-8');
        } catch (writeErr) {
          // L'écriture du token rafraîchi peut échouer en Docker (volume monté
          // en lecture seule : /root/.hermes/google_token.json:ro). Ce n'est PAS
          // un échec de refresh — le token rafraîchi est déjà en mémoire via
          // auth.refreshAccessToken() pour la session courante. On avertit sans
          // masquer un vrai échec de refresh (géré au-dessus).
          console.warn('[sheets] Token rafraîchi mais écriture impossible (volume en lecture seule ?), continuation avec le token en mémoire');
        }
      }
    }

    const sheets = google.sheets({ version: 'v4', auth });

    // 2bis. Déterminer l'onglet cible selon l'annonce et le créer si nécessaire.
    // Cast localisé : le client googleapis a des signatures plus larges que le
    // contrat minimal SheetsClientLike (utilisé pour les tests sans réseau).
    const tab = getSheetTabForListing(candidature.listingId);
    await ensureSheetTab(sheets as unknown as SheetsClientLike, SPREADSHEET_ID, tab);

    // 3. Lire la colonne A pour déterminer le prochain N°
    const existing = await sheets.spreadsheets.values.get({
      spreadsheetId: SPREADSHEET_ID,
      range: `'${tab}'!A:A`,
    });
    const rows = existing.data.values || [];
    // rows[0] = en-tête "N°", rows[1]..rows[n] = données
    let nextNum = 1;
    const allNums: number[] = [];
    for (let i = 1; i < rows.length; i++) {
      const val = parseInt(rows[i]?.[0] || '0', 10);
      if (!isNaN(val)) allNums.push(val);
    }
    nextNum = allNums.length > 0 ? Math.max(...allNums) + 1 : 1;

    // 4. Construire la nouvelle ligne
    const newRow = buildCandidatureRow(candidature, nextNum);

    // 5. Écrire la ligne
    const nextRowIndex = rows.length + 1; // header + existing data + 1
    await sheets.spreadsheets.values.update({
      spreadsheetId: SPREADSHEET_ID,
      range: `'${tab}'!A${nextRowIndex}:K${nextRowIndex}`,
      valueInputOption: 'USER_ENTERED',
      requestBody: { values: [newRow] },
    });

    console.log(
      `[sheets] ✅ Candidature ajoutée au sheet (onglet ${tab}, N°${nextNum}) : ${candidature.prenom} ${candidature.nom}`
    );
  } catch (error) {
    // Ne pas faire planter la route si le sheet échoue
    console.error('[sheets] Erreur écriture Google Sheet:', error);
  }
}
