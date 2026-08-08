import { describe, it, expect } from 'vitest';
import {
  isEligibleVisitRdv,
  computeThresholds,
  GLI_MIN_REVENUS,
  VISALE_MIN_REVENUS,
} from '../lib/eligibility';

// Loyer CC de chaque annonce
const LOYER_CC_T3 = 665;
const LOYER_CC_APPT5 = 550;

describe('computeThresholds — seuils dynamiques par annonce', () => {
  it('calcule les seuils du T3 (665 € CC) : GLI 2016, Visale 1995', () => {
    const t = computeThresholds(LOYER_CC_T3);
    expect(t.gliMinRevenus).toBe(2016);
    expect(t.visaleMinRevenus).toBe(1995);
  });

  it('calcule les seuils de appt5 (550 € CC) : GLI 1667, Visale 1650', () => {
    const t = computeThresholds(LOYER_CC_APPT5);
    expect(t.gliMinRevenus).toBe(1667);
    expect(t.visaleMinRevenus).toBe(1650);
  });
});

describe('isEligibleVisitRdv — auto-email RDV (raismes-t3, 665 € CC)', () => {
  it('accepte un CDI avec revenus >= seuil GLI (2016 €)', () => {
    expect(
      isEligibleVisitRdv({ cdiPlus3Mois: true, revenusMenuels: 2200, peutFournirGarant: false }, LOYER_CC_T3)
    ).toBe(true);
  });

  it('accepte un CDI à la borne exacte du seuil GLI (2016 €)', () => {
    expect(
      isEligibleVisitRdv({ cdiPlus3Mois: true, revenusMenuels: GLI_MIN_REVENUS, peutFournirGarant: false }, LOYER_CC_T3)
    ).toBe(true);
  });

  it('refuse un CDI juste sous le seuil GLI sans garant (2015 €)', () => {
    expect(
      isEligibleVisitRdv({ cdiPlus3Mois: true, revenusMenuels: 2015, peutFournirGarant: false }, LOYER_CC_T3)
    ).toBe(false);
  });

  it('accepte un CDI entre 1995 et 2016 avec garant (garantie Visale)', () => {
    expect(
      isEligibleVisitRdv({ cdiPlus3Mois: true, revenusMenuels: 1995, peutFournirGarant: true }, LOYER_CC_T3)
    ).toBe(true);
  });

  it('accepte un CDI à la borne exacte du seuil Visale avec garant (1995 €)', () => {
    expect(
      isEligibleVisitRdv({ cdiPlus3Mois: true, revenusMenuels: VISALE_MIN_REVENUS, peutFournirGarant: true }, LOYER_CC_T3)
    ).toBe(true);
  });

  it('refuse un CDI entre 1995 et 2016 sans garant', () => {
    expect(
      isEligibleVisitRdv({ cdiPlus3Mois: true, revenusMenuels: 1995, peutFournirGarant: false }, LOYER_CC_T3)
    ).toBe(false);
  });

  it('refuse un CDI sous le seuil Visale même avec garant (1994 €)', () => {
    expect(
      isEligibleVisitRdv({ cdiPlus3Mois: true, revenusMenuels: 1994, peutFournirGarant: true }, LOYER_CC_T3)
    ).toBe(false);
  });

  it('refuse sans CDI même avec revenus élevés', () => {
    expect(
      isEligibleVisitRdv({ cdiPlus3Mois: false, revenusMenuels: 5000, peutFournirGarant: true }, LOYER_CC_T3)
    ).toBe(false);
  });

  it('refuse sans CDI même avec un garant', () => {
    expect(
      isEligibleVisitRdv({ cdiPlus3Mois: false, revenusMenuels: 2500, peutFournirGarant: true }, LOYER_CC_T3)
    ).toBe(false);
  });

  it('refuse avec CDI mais revenus à 0', () => {
    expect(
      isEligibleVisitRdv({ cdiPlus3Mois: true, revenusMenuels: 0, peutFournirGarant: true }, LOYER_CC_T3)
    ).toBe(false);
  });

  it('refuse si cdiPlus3Mois est undefined (champ non renseigné)', () => {
    expect(
      isEligibleVisitRdv({ cdiPlus3Mois: undefined, revenusMenuels: 3000, peutFournirGarant: true }, LOYER_CC_T3)
    ).toBe(false);
  });

  it('refuse si revenusMenuels est NaN', () => {
    expect(
      isEligibleVisitRdv({ cdiPlus3Mois: true, revenusMenuels: NaN, peutFournirGarant: true }, LOYER_CC_T3)
    ).toBe(false);
  });

  it('refuse si revenusMenuels est négatif', () => {
    expect(
      isEligibleVisitRdv({ cdiPlus3Mois: true, revenusMenuels: -100, peutFournirGarant: true }, LOYER_CC_T3)
    ).toBe(false);
  });

  it('n\'exige pas de garant au-dessus du seuil GLI (2016 €)', () => {
    expect(
      isEligibleVisitRdv({ cdiPlus3Mois: true, revenusMenuels: 2016, peutFournirGarant: false }, LOYER_CC_T3)
    ).toBe(true);
  });

  it('accepte une garantie Visale seule, sans CDI', () => {
    expect(
      isEligibleVisitRdv({ garantieVisale: true, cdiPlus3Mois: false, revenusMenuels: 0, peutFournirGarant: false }, LOYER_CC_T3)
    ).toBe(true);
  });

  it('accepte une garantie Visale avec revenus faibles (1200 €)', () => {
    expect(
      isEligibleVisitRdv({ garantieVisale: true, cdiPlus3Mois: false, revenusMenuels: 1200, peutFournirGarant: false }, LOYER_CC_T3)
    ).toBe(true);
  });

  it('refuse sans garantie Visale ni CDI', () => {
    expect(
      isEligibleVisitRdv({ garantieVisale: false, cdiPlus3Mois: false, revenusMenuels: 1200, peutFournirGarant: false }, LOYER_CC_T3)
    ).toBe(false);
  });
});

describe('isEligibleVisitRdv — appt5 (T2, 550 € CC, seuils 1667/1650)', () => {
  it('accepte un CDI au seuil GLI appt5 (1667 €)', () => {
    expect(
      isEligibleVisitRdv({ cdiPlus3Mois: true, revenusMenuels: 1667, peutFournirGarant: false }, LOYER_CC_APPT5)
    ).toBe(true);
  });

  it('refuse un CDI juste sous le seuil GLI appt5 sans garant (1666 €)', () => {
    expect(
      isEligibleVisitRdv({ cdiPlus3Mois: true, revenusMenuels: 1666, peutFournirGarant: false }, LOYER_CC_APPT5)
    ).toBe(false);
  });

  it('accepte un CDI au seuil Visale appt5 avec garant (1650 €)', () => {
    expect(
      isEligibleVisitRdv({ cdiPlus3Mois: true, revenusMenuels: 1650, peutFournirGarant: true }, LOYER_CC_APPT5)
    ).toBe(true);
  });

  it('accepte une garantie Visale seule pour appt5', () => {
    expect(
      isEligibleVisitRdv({ garantieVisale: true, cdiPlus3Mois: false, revenusMenuels: 800, peutFournirGarant: false }, LOYER_CC_APPT5)
    ).toBe(true);
  });

  it('accepte un CDI à 1700 € sans garant (≥ seuil GLI appt5 de 1667 €)', () => {
    // 1700 ≥ 1667 (seuil GLI appt5) → éligible même sans garant
    expect(
      isEligibleVisitRdv({ cdiPlus3Mois: true, revenusMenuels: 1700, peutFournirGarant: false }, LOYER_CC_APPT5)
    ).toBe(true);
  });

  it('refuse un revenu de 2000 € sans CDI (même au-dessus du seuil GLI)', () => {
    expect(
      isEligibleVisitRdv({ cdiPlus3Mois: false, revenusMenuels: 2000, peutFournirGarant: true }, LOYER_CC_APPT5)
    ).toBe(false);
  });
});
