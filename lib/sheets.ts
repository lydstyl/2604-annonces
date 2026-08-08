import type { Candidature } from './storage';
import path from 'path';
import fs from 'fs';
import os from 'os';

const SPREADSHEET_ID = '1rZ9NOGgLcBHKwVQvtwjvB3A0k5BZ5eC46LhbMffQM50';

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

/**
 * Écrit la candidature dans le Google Sheet "Admin" (onglet des candidatures).
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
      try {
        const { credentials } = await auth.refreshAccessToken();
        // Sauvegarder le token rafraîchi
        tokenData.token = credentials.access_token;
        tokenData.expiry = credentials.expiry_date
          ? new Date(credentials.expiry_date).toISOString()
          : tokenData.expiry;
        fs.writeFileSync(tokenPath, JSON.stringify(tokenData, null, 2), 'utf-8');
      } catch (refreshErr) {
        console.warn('[sheets] Refresh token échoué, tentative avec token existant');
      }
    }

    const sheets = google.sheets({ version: 'v4', auth });

    // 3. Lire la colonne A pour déterminer le prochain N°
    const existing = await sheets.spreadsheets.values.get({
      spreadsheetId: SPREADSHEET_ID,
      range: "'Admin'!A:A",
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
    // Note: préfixer le téléphone avec ' pour éviter que Sheets mange le 0 initial
    const newRow = [
      nextNum,
      `${candidature.prenom} ${candidature.nom}`,
      'Nouveau',
      formatRevenus(candidature.revenusMenuels),
      boolToOuiNon(candidature.peutFournirGarant),
      boolToOuiNon(candidature.cdiPlus3Mois),
      `'${candidature.telephone}`,  // ' force le format texte dans Sheets
      candidature.email,
      formatFrenchDate(candidature.dateSubmission),
      candidature.remarques || '',
      boolToOuiNon(candidature.garantieVisale), // colonne K — garantie Visale (Action Logement)
    ];

    // 5. Écrire la ligne
    const nextRowIndex = rows.length + 1; // header + existing data + 1
    await sheets.spreadsheets.values.update({
      spreadsheetId: SPREADSHEET_ID,
      range: `'Admin'!A${nextRowIndex}:K${nextRowIndex}`,
      valueInputOption: 'USER_ENTERED',
      requestBody: { values: [newRow] },
    });

    console.log(`[sheets] ✅ Candidature ajoutée au sheet (N°${nextNum}) : ${candidature.prenom} ${candidature.nom}`);
  } catch (error) {
    // Ne pas faire planter la route si le sheet échoue
    console.error('[sheets] Erreur écriture Google Sheet:', error);
  }
}
