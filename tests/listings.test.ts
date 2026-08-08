import { describe, it, expect } from 'vitest';
import { listings, getAllListings, getListingById } from '../lib/listings';

describe('Structure des listings', () => {
  it('expose au moins une annonce', () => {
    expect(getAllListings().length).toBeGreaterThan(0);
  });

  it('a des ids uniques', () => {
    const ids = getAllListings().map((l) => l.id);
    expect(new Set(ids).size).toBe(ids.length);
  });

  it('chaque listing a une structure valide (pas de crash possible avec images/faq vides)', () => {
    for (const listing of getAllListings()) {
      expect(typeof listing.id).toBe('string');
      expect(listing.id.length).toBeGreaterThan(0);
      expect(typeof listing.title).toBe('string');
      expect(listing.title.length).toBeGreaterThan(0);
      expect(typeof listing.description).toBe('string');
      expect(Array.isArray(listing.images)).toBe(true);
      expect(Array.isArray(listing.faq)).toBe(true);
      expect(Array.isArray(listing.conditions)).toBe(true);
      expect(listing.conditions.length).toBeGreaterThan(0);
      expect(typeof listing.address).toBe('string');
      expect(listing.address.length).toBeGreaterThan(0);
      expect(typeof listing.availableFrom).toBe('string');
      expect(typeof listing.price.rent).toBe('number');
      expect(typeof listing.price.charges).toBe('number');
      expect(typeof listing.price.deposit).toBe('number');
      // Chaque entrée FAQ valide si présente
      for (const item of listing.faq) {
        expect(typeof item.question).toBe('string');
        expect(item.question.length).toBeGreaterThan(0);
        expect(typeof item.answer).toBe('string');
        expect(item.answer.length).toBeGreaterThan(0);
      }
    }
  });

  it('getListingById retourne undefined pour un id inconnu', () => {
    expect(getListingById('inconnu')).toBeUndefined();
  });
});

describe('Listing raismes-t3', () => {
  const listing = getListingById('raismes-t3');

  it('existe avec le bon loyer (630 € + 35 € charges = 665 € CC)', () => {
    expect(listing).toBeDefined();
    expect(listing!.price.rent).toBe(630);
    expect(listing!.price.charges).toBe(35);
    expect(listing!.price.deposit).toBe(630);
  });

  it('contient la FAQ "Quelles sont les conditions pour obtenir ce logement ?"', () => {
    expect(listing).toBeDefined();
    const faq = listing!.faq.find(
      (item) => item.question === 'Quelles sont les conditions pour obtenir ce logement ?'
    );
    expect(faq).toBeDefined();
  });

  it('la FAQ conditions reprend les critères GLI (33 %, 2 016 €, Visale, 1 995 €)', () => {
    const faq = listing!.faq.find(
      (item) => item.question === 'Quelles sont les conditions pour obtenir ce logement ?'
    );
    const answer = faq!.answer;
    expect(answer).toContain('33 %');
    expect(answer).toContain('2 016');
    expect(answer).toContain('Visale');
    expect(answer).toContain('1 995');
    expect(answer).toContain('CDI');
    expect(answer).toContain('CAF');
  });
});

describe('Listing appt5 (T2 n°5 – 32 B rue Henri Durre)', () => {
  it('existe avec id appt5 (URL /annonce/appt5)', () => {
    expect(getListingById('appt5')).toBeDefined();
    expect(listings['appt5']).toBeDefined();
  });

  it('est un T2 au 32 B rue Henri Durre, 59590 Raismes', () => {
    const listing = getListingById('appt5')!;
    expect(listing.address).toContain('Henri Durre');
    expect(listing.address).toContain('Raismes');
    expect(listing.title.toLowerCase()).toContain('t2');
    expect(listing.type).toBe('T2');
  });

  it('a des images vides en attendant les photos (page doit tenir sans crash)', () => {
    const listing = getListingById('appt5')!;
    expect(listing.images).toEqual([]);
  });

  it('a une FAQ complète (conditions GLI, DPE, surfaces, charges)', () => {
    const listing = getListingById('appt5')!;
    expect(listing.faq.length).toBeGreaterThan(5);
    const faq = listing.faq.find(
      (item) => item.question === 'Quelles sont les conditions pour obtenir ce logement ?'
    );
    expect(faq).toBeDefined();
    expect(faq!.answer).toContain('1 667');
    expect(faq!.answer).toContain('Visale');
    expect(faq!.answer).toContain('1 650');
  });

  it('a des conditions par défaut non vides', () => {
    const listing = getListingById('appt5')!;
    expect(listing.conditions.length).toBeGreaterThan(0);
  });

  it('a le bon prix : 500 € + 50 € charges = 550 € CC, caution 500 €', () => {
    const listing = getListingById('appt5')!;
    expect(listing.price.rent).toBe(500);
    expect(listing.price.charges).toBe(50);
    expect(listing.price.deposit).toBe(500);
    expect(listing.price.rent + listing.price.charges).toBe(550);
  });

  it('est disponible fin octobre 2026', () => {
    const listing = getListingById('appt5')!;
    expect(listing.availableFrom).toContain('octobre');
  });
});
