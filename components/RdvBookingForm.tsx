'use client';

import { useState } from 'react';

// Types partagés avec lib/rdv (RdvSlot) — dupliqués ici car un client component
// ne peut pas importer librement les types serveur (import type est OK en fait,
// mais on garde des types locaux simples pour la sérialisation des props).
export interface RdvFormSlot {
  start: string;
  end: string;
}

export interface RdvFormDate {
  date: string;
  slots: RdvFormSlot[];
}

export interface RdvFormPrefill {
  nom: string;
  prenom: string;
  telephone: string;
  email: string;
}

interface RdvBookingFormProps {
  listingId: string;
  availableDates: RdvFormDate[];
  timezone: string;
  prefill: RdvFormPrefill | null;
}

function formatDateFr(dateStr: string): string {
  return new Intl.DateTimeFormat('fr-FR', {
    timeZone: 'UTC',
    weekday: 'long',
    day: 'numeric',
    month: 'long',
  }).format(new Date(`${dateStr}T00:00:00Z`));
}

function formatHeure(iso: string, timeZone: string): string {
  return new Intl.DateTimeFormat('fr-FR', {
    timeZone,
    hour: '2-digit',
    minute: '2-digit',
  })
    .format(new Date(iso))
    .replace(':', 'h');
}

function formatCreneau(slot: RdvFormSlot, timeZone: string): string {
  return `${formatHeure(slot.start, timeZone)} – ${formatHeure(slot.end, timeZone)}`;
}

// Formulaire de réservation de visite — client component : le submit passe par
// fetch (au lieu d'un POST natif) pour afficher les erreurs (créneau déjà pris,
// doublon ALREADY_BOOKED) proprement dans la page au lieu d'un JSON brut.
export default function RdvBookingForm({
  listingId,
  availableDates,
  timezone,
  prefill,
}: RdvBookingFormProps) {
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError(null);
    setSubmitting(true);
    try {
      const formData = new FormData(e.currentTarget);
      // redirect: 'follow' (défaut) : le navigateur suit le 303 de succès vers
      // l'écran de confirmation. NE PAS utiliser 'manual' : une réponse de
      // redirection est alors exposée en opaqueredirect (status 0, headers
      // masqués) → le succès s'afficherait comme une erreur (bug 30/08/2026).
      const res = await fetch('/api/rdv', {
        method: 'POST',
        body: formData,
      });

      // Succès : le 303 a été suivi → res.url = URL finale de la page de
      // confirmation (?confirmed=1&start=...&prenom=...).
      if (res.ok) {
        window.location.href = res.url || '/';
        return;
      }

      // Erreur : message JSON { error, code? } affiché dans la page
      const data = (await res.json().catch(() => null)) as { error?: string } | null;
      setError(
        data?.error ?? 'Une erreur est survenue lors de la réservation de votre visite.'
      );
    } catch {
      setError('Une erreur est survenue lors de la réservation de votre visite.');
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <form method="POST" onSubmit={handleSubmit} className="card p-6 mb-8">
      <input type="hidden" name="listingId" value={listingId} />

      {/* Coordonnées */}
      <div className="mb-6">
        <h2 className="text-xl font-bold text-gray-900 mb-3">👤 Vos coordonnées</h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label htmlFor="nom" className="block text-sm font-semibold text-gray-700 mb-1">
              Nom <span className="text-red-500">*</span>
            </label>
            <input
              id="nom"
              name="nom"
              type="text"
              required
              placeholder="Votre nom"
              defaultValue={prefill?.nom ?? ''}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
            />
          </div>
          <div>
            <label htmlFor="prenom" className="block text-sm font-semibold text-gray-700 mb-1">
              Prénom <span className="text-red-500">*</span>
            </label>
            <input
              id="prenom"
              name="prenom"
              type="text"
              required
              placeholder="Votre prénom"
              defaultValue={prefill?.prenom ?? ''}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
            />
          </div>
          <div>
            <label htmlFor="telephone" className="block text-sm font-semibold text-gray-700 mb-1">
              Téléphone <span className="text-red-500">*</span>
            </label>
            <input
              id="telephone"
              name="telephone"
              type="tel"
              required
              placeholder="06 12 34 56 78"
              defaultValue={prefill?.telephone ?? ''}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
            />
          </div>
          <div>
            <label htmlFor="email" className="block text-sm font-semibold text-gray-700 mb-1">
              Email <span className="text-red-500">*</span>
            </label>
            <input
              id="email"
              name="email"
              type="email"
              required
              placeholder="vous@exemple.fr"
              defaultValue={prefill?.email ?? ''}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
            />
          </div>
        </div>
      </div>

      {/* Créneaux disponibles */}
      <div className="mb-6">
        <h2 className="text-xl font-bold text-gray-900 mb-3">🗓️ Choisissez votre créneau</h2>

        {availableDates.length === 0 ? (
          <p className="text-gray-600 bg-amber-50 border border-amber-200 rounded-lg p-4">
            Aucun créneau disponible pour le moment. Revenez dans quelques jours ou{' '}
            <a href={`mailto:lydstyl@gmail.com`} className="text-primary-600 underline">
              contactez-nous
            </a>
            .
          </p>
        ) : (
          <div className="space-y-6">
            {availableDates.map(({ date, slots }) => (
              <div key={date}>
                <h3 className="font-bold text-gray-800 mb-2 capitalize">{formatDateFr(date)}</h3>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                  {slots.map((slot) => (
                    <label
                      key={slot.start}
                      className="flex items-center justify-center gap-2 border border-gray-300 rounded-lg px-3 py-2 cursor-pointer hover:border-primary-500 hover:bg-primary-50 transition-colors has-[:checked]:border-primary-600 has-[:checked]:bg-primary-100"
                    >
                      <input
                        type="radio"
                        name="start"
                        value={slot.start}
                        required
                        className="accent-primary-600"
                      />
                      <span className="text-sm font-semibold text-gray-800">
                        {formatCreneau(slot, timezone)}
                      </span>
                    </label>
                  ))}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {error && (
        <div
          role="alert"
          className="mb-6 bg-red-50 border border-red-300 text-red-800 rounded-lg p-4"
        >
          ⚠️ {error}
        </div>
      )}

      {availableDates.length > 0 && (
        <button
          type="submit"
          disabled={submitting}
          className="w-full btn-primary py-4 text-lg font-bold disabled:opacity-60 disabled:cursor-not-allowed"
        >
          {submitting ? '⏳ Confirmation en cours…' : '✅ Confirmer ma visite'}
        </button>
      )}
    </form>
  );
}
