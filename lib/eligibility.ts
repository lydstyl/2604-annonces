import { getListingById } from './listings';

// Logique métier d'éligibilité à l'auto-email RDV.
// Fonctions pures, testables sans environnement (vitest).
// Les seuils sont calculés depuis le loyer charges comprises de chaque annonce.

// Loyer CC du T3 Raismes — dérivé de la source de vérité lib/listings.ts
// (630 € loyer + 48 € charges = 678 €/mois depuis la mise à jour des charges).
const raismesT3 = getListingById('raismes-t3');
export const LOYER_CC_T3 = raismesT3 ? raismesT3.price.rent + raismesT3.price.charges : 678;

// Seuil GLI : loyer CC ≤ 33% des revenus nets mensuels → revenus ≥ loyerCC / 0.33
export const GLI_MIN_REVENUS = Math.ceil(LOYER_CC_T3 / 0.33); // 2055 pour le T3

// Seuil alternative garantie Visale : ~3× le loyer CC
export const VISALE_MIN_REVENUS = LOYER_CC_T3 * 3; // 2034 pour le T3

// Calcule les seuils d'éligibilité pour une annonce donnée (depuis son loyer CC)
export function computeThresholds(loyerCC: number) {
  return {
    gliMinRevenus: Math.ceil(loyerCC / 0.33),
    visaleMinRevenus: loyerCC * 3,
  };
}

export interface VisitRdvEligibilityInput {
  cdiPlus3Mois?: boolean;
  revenusMenuels: number;
  peutFournirGarant: boolean;
  garantieVisale?: boolean;
}

/**
 * Un candidat reçoit l'auto-email de prise de RDV visite si :
 * - garantie Visale (Action Logement) détenue → éligible immédiatement (sans autre condition), OU
 * - CDI > 3 mois (hors période d'essai) ET
 *   (revenus >= seuil GLI 33% OU
 *    (revenus >= 3× loyer ET garant/Visale fourni))
 *
 * @param loyerCC loyer charges comprises de l'annonce (ex: 678 pour le T3, 550 pour appt5)
 */
export function isEligibleVisitRdv(input: VisitRdvEligibilityInput, loyerCC: number): boolean {
  if (input.garantieVisale === true) return true;

  if (!input.cdiPlus3Mois) return false;

  const revenus = input.revenusMenuels;
  if (typeof revenus !== 'number' || !Number.isFinite(revenus)) return false;

  const { gliMinRevenus, visaleMinRevenus } = computeThresholds(loyerCC);
  if (revenus >= gliMinRevenus) return true;
  return revenus >= visaleMinRevenus && input.peutFournirGarant === true;
}
