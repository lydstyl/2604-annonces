// Logique métier d'éligibilité à l'auto-email RDV (annonce raismes-t3).
// Fonctions pures, testables sans environnement (vitest).

// Loyer CC du T3 Raismes : 630 € + 35 € charges = 665 €/mois
export const LOYER_CC_T3 = 665;

// Seuil GLI : loyer CC ≤ 33% des revenus nets mensuels → revenus ≥ 665 / 0.33 ≈ 2 015,15 → arrondi 2 016
export const GLI_MIN_REVENUS = Math.ceil(LOYER_CC_T3 / 0.33); // 2016

// Seuil alternative garantie Visale : ~3× le loyer CC
export const VISALE_MIN_REVENUS = LOYER_CC_T3 * 3; // 1995

export interface VisitRdvEligibilityInput {
  cdiPlus3Mois?: boolean;
  revenusMenuels: number;
  peutFournirGarant: boolean;
}

/**
 * Un candidat reçoit l'auto-email de prise de RDV visite si :
 * - CDI > 3 mois (hors période d'essai) ET
 *   (revenus >= 2 016 € (seuil GLI 33%) OU
 *    (revenus >= 1 995 € (3× loyer) ET garant/Visale fourni))
 */
export function isEligibleVisitRdv(input: VisitRdvEligibilityInput): boolean {
  if (!input.cdiPlus3Mois) return false;

  const revenus = input.revenusMenuels;
  if (typeof revenus !== 'number' || !Number.isFinite(revenus)) return false;

  if (revenus >= GLI_MIN_REVENUS) return true;
  return revenus >= VISALE_MIN_REVENUS && input.peutFournirGarant === true;
}
