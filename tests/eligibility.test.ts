import { describe, it, expect } from 'vitest';
import {
  isEligibleVisitRdv,
  GLI_MIN_REVENUS,
  VISALE_MIN_REVENUS,
} from '../lib/eligibility';

describe('isEligibleVisitRdv — auto-email RDV (raismes-t3)', () => {
  it('accepte un CDI avec revenus >= seuil GLI (2016 €)', () => {
    expect(
      isEligibleVisitRdv({ cdiPlus3Mois: true, revenusMenuels: 2200, peutFournirGarant: false })
    ).toBe(true);
  });

  it('accepte un CDI à la borne exacte du seuil GLI (2016 €)', () => {
    expect(
      isEligibleVisitRdv({ cdiPlus3Mois: true, revenusMenuels: GLI_MIN_REVENUS, peutFournirGarant: false })
    ).toBe(true);
  });

  it('refuse un CDI juste sous le seuil GLI sans garant (2015 €)', () => {
    expect(
      isEligibleVisitRdv({ cdiPlus3Mois: true, revenusMenuels: 2015, peutFournirGarant: false })
    ).toBe(false);
  });

  it('accepte un CDI entre 1995 et 2016 avec garant (garantie Visale)', () => {
    expect(
      isEligibleVisitRdv({ cdiPlus3Mois: true, revenusMenuels: 1995, peutFournirGarant: true })
    ).toBe(true);
  });

  it('accepte un CDI à la borne exacte du seuil Visale avec garant (1995 €)', () => {
    expect(
      isEligibleVisitRdv({ cdiPlus3Mois: true, revenusMenuels: VISALE_MIN_REVENUS, peutFournirGarant: true })
    ).toBe(true);
  });

  it('refuse un CDI entre 1995 et 2016 sans garant', () => {
    expect(
      isEligibleVisitRdv({ cdiPlus3Mois: true, revenusMenuels: 1995, peutFournirGarant: false })
    ).toBe(false);
  });

  it('refuse un CDI sous le seuil Visale même avec garant (1994 €)', () => {
    expect(
      isEligibleVisitRdv({ cdiPlus3Mois: true, revenusMenuels: 1994, peutFournirGarant: true })
    ).toBe(false);
  });

  it('refuse sans CDI même avec revenus élevés', () => {
    expect(
      isEligibleVisitRdv({ cdiPlus3Mois: false, revenusMenuels: 5000, peutFournirGarant: true })
    ).toBe(false);
  });

  it('refuse sans CDI même avec un garant', () => {
    expect(
      isEligibleVisitRdv({ cdiPlus3Mois: false, revenusMenuels: 2500, peutFournirGarant: true })
    ).toBe(false);
  });

  it('refuse avec CDI mais revenus à 0', () => {
    expect(
      isEligibleVisitRdv({ cdiPlus3Mois: true, revenusMenuels: 0, peutFournirGarant: true })
    ).toBe(false);
  });

  it('refuse si cdiPlus3Mois est undefined (champ non renseigné)', () => {
    expect(
      isEligibleVisitRdv({ cdiPlus3Mois: undefined, revenusMenuels: 3000, peutFournirGarant: true })
    ).toBe(false);
  });

  it('refuse si revenusMenuels est NaN', () => {
    expect(
      isEligibleVisitRdv({ cdiPlus3Mois: true, revenusMenuels: NaN, peutFournirGarant: true })
    ).toBe(false);
  });

  it('refuse si revenusMenuels est négatif', () => {
    expect(
      isEligibleVisitRdv({ cdiPlus3Mois: true, revenusMenuels: -100, peutFournirGarant: true })
    ).toBe(false);
  });

  it('n\'exige pas de garant au-dessus du seuil GLI (2016 €)', () => {
    expect(
      isEligibleVisitRdv({ cdiPlus3Mois: true, revenusMenuels: 2016, peutFournirGarant: false })
    ).toBe(true);
  });

  it('accepte une garantie Visale seule, sans CDI', () => {
    expect(
      isEligibleVisitRdv({ garantieVisale: true, cdiPlus3Mois: false, revenusMenuels: 0, peutFournirGarant: false })
    ).toBe(true);
  });

  it('accepte une garantie Visale avec revenus faibles (1200 €)', () => {
    expect(
      isEligibleVisitRdv({ garantieVisale: true, cdiPlus3Mois: false, revenusMenuels: 1200, peutFournirGarant: false })
    ).toBe(true);
  });

  it('refuse sans garantie Visale ni CDI', () => {
    expect(
      isEligibleVisitRdv({ garantieVisale: false, cdiPlus3Mois: false, revenusMenuels: 1200, peutFournirGarant: false })
    ).toBe(false);
  });
});
