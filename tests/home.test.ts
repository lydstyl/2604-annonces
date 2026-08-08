import { describe, it, expect } from 'vitest';
import { getListingCards, getListingById } from '../lib/listings';

describe('getListingCards — cartes de la home page', () => {
  it('retourne une carte par annonce (raismes-t3 et appt5)', () => {
    const cards = getListingCards();
    expect(cards.length).toBe(2);
    const ids = cards.map((c) => c.id).sort();
    expect(ids).toEqual(['appt5', 'raismes-t3']);
  });

  it('chaque carte a un lien /annonce/{id} cliquable', () => {
    for (const card of getListingCards()) {
      expect(card.href).toBe(`/annonce/${card.id}`);
    }
  });

  it('chaque carte expose type, titre, surface, loyer CC, localisation non vides', () => {
    for (const card of getListingCards()) {
      expect(card.type.length).toBeGreaterThan(0);
      expect(card.title.length).toBeGreaterThan(0);
      expect(card.surface).toBeGreaterThan(0);
      expect(card.rentChargesComprises).toBeGreaterThan(0);
      expect(card.location.length).toBeGreaterThan(0);
    }
  });

  it('la carte raismes-t3 : T3, 85 m², 665 € CC, Raismes Centre, photo de couverture', () => {
    const card = getListingCards().find((c) => c.id === 'raismes-t3')!;
    expect(card).toBeDefined();
    expect(card.type).toBe('T3');
    expect(card.surface).toBe(85);
    expect(card.rentChargesComprises).toBe(665);
    expect(card.location).toBe('Raismes Centre');
    // photo de couverture = première image dispo
    const listing = getListingById('raismes-t3')!;
    expect(card.coverImage).toBe(listing.images[0]);
    expect(card.coverImage).toBeTruthy();
  });

  it('la carte appt5 : T2, 57 m², 550 € CC, pas de photo de couverture (images vides)', () => {
    const card = getListingCards().find((c) => c.id === 'appt5')!;
    expect(card).toBeDefined();
    expect(card.type).toBe('T2');
    expect(card.surface).toBe(57);
    expect(card.rentChargesComprises).toBe(550);
    expect(card.location).toBe('Raismes');
    expect(card.coverImage).toBeNull();
  });
});
