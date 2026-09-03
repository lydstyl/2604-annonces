// Logique métier d'éligibilité à l'auto-email RDV.
// Fonctions pures, testables sans environnement (vitest).
// Règle unique : le candidat reçoit l'auto-email si CDI > 3 mois ET revenus ≥ 3× loyer CC.
// Le seuil est calculé dynamiquement depuis le loyer charges comprises passé en paramètre.

export interface VisitRdvEligibilityInput {
  cdiPlus3Mois?: boolean;
  revenusMenuels: number;
}

/**
 * Un candidat reçoit l'auto-email de prise de RDV visite si ET SEULEMENT SI :
 * - cdiPlus3Mois === true (CDI hors période d'essai, > 3 mois), ET
 * - revenusMenuels (nombre fini) >= loyerCC * 3 (3× le loyer charges comprises)
 *
 * La garantie Visale et le garant restent collectés dans le formulaire et le dossier
 * mais ne comptent PLUS dans le déclenchement de l'auto-email : une personne avec
 * Visale mais revenus < 3× loyer ne reçoit PAS l'email auto.
 *
 * @param loyerCC loyer charges comprises de l'annonce (ex: 678 pour raismes-t3, 550 pour appt5)
 */
export function isEligibleVisitRdv(input: VisitRdvEligibilityInput, loyerCC: number): boolean {
  if (input.cdiPlus3Mois !== true) return false;

  const revenus = input.revenusMenuels;
  if (typeof revenus !== 'number' || !Number.isFinite(revenus)) return false;

  return revenus >= loyerCC * 3;
}
