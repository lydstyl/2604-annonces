import { describe, it, expect } from 'vitest';
import { isEligibleVisitRdv } from '../lib/eligibility';

// Loyer CC de chaque annonce (seuil auto-email = 3× ce loyer, calculé dynamiquement)
const LOYER_CC_T3 = 678; // raismes-t3 (630 € loyer + 48 € charges)
const LOYER_CC_APPT5 = 550; // appt5

describe('isEligibleVisitRdv — règle unique : CDI > 3 mois ET revenus ≥ 3× loyer CC', () => {
  it('accepte un CDI à la borne exacte 3× loyer CC du T3 (2034 €)', () => {
    expect(isEligibleVisitRdv({ cdiPlus3Mois: true, revenusMenuels: 2034 }, LOYER_CC_T3)).toBe(true);
  });

  it('refuse un CDI juste sous 3× loyer CC du T3 (2033 €)', () => {
    expect(isEligibleVisitRdv({ cdiPlus3Mois: true, revenusMenuels: 2033 }, LOYER_CC_T3)).toBe(false);
  });

  it('accepte un CDI à la borne exacte 3× loyer CC de appt5 (1650 €)', () => {
    expect(isEligibleVisitRdv({ cdiPlus3Mois: true, revenusMenuels: 1650 }, LOYER_CC_APPT5)).toBe(true);
  });

  it('refuse un CDI juste sous 3× loyer CC de appt5 (1649 €)', () => {
    expect(isEligibleVisitRdv({ cdiPlus3Mois: true, revenusMenuels: 1649 }, LOYER_CC_APPT5)).toBe(false);
  });

  it('accepte un CDI largement au-dessus du seuil T3 (2500 €)', () => {
    expect(isEligibleVisitRdv({ cdiPlus3Mois: true, revenusMenuels: 2500 }, LOYER_CC_T3)).toBe(true);
  });

  it('refuse sans CDI même avec des revenus très élevés (9999 €)', () => {
    expect(isEligibleVisitRdv({ cdiPlus3Mois: false, revenusMenuels: 9999 }, LOYER_CC_T3)).toBe(false);
  });

  it('refuse si cdiPlus3Mois est undefined (champ non renseigné)', () => {
    expect(isEligibleVisitRdv({ cdiPlus3Mois: undefined, revenusMenuels: 9999 }, LOYER_CC_T3)).toBe(false);
  });

  it('refuse si revenusMenuels est NaN', () => {
    expect(isEligibleVisitRdv({ cdiPlus3Mois: true, revenusMenuels: NaN }, LOYER_CC_T3)).toBe(false);
  });

  it('refuse si revenusMenuels est négatif (-100 €)', () => {
    expect(isEligibleVisitRdv({ cdiPlus3Mois: true, revenusMenuels: -100 }, LOYER_CC_T3)).toBe(false);
  });

  it('refuse si revenusMenuels est à 0', () => {
    expect(isEligibleVisitRdv({ cdiPlus3Mois: true, revenusMenuels: 0 }, LOYER_CC_T3)).toBe(false);
  });
});
