import { notFound } from 'next/navigation';
import Link from 'next/link';
import { getListingById, getAllListings } from '@/lib/listings';
import {
  getRdvs,
  getAvailableSlots,
  getTodayInTimeZone,
  formatRdvDateTime,
  type RdvSlot,
} from '@/lib/rdv';
import { verifyRdvPrefillToken, type RdvPrefill } from '@/lib/rdv-token';

// Génération statique des pages pour toutes les annonces disposant d'une config RDV
export async function generateStaticParams() {
  const listings = getAllListings();
  return listings
    .filter((l) => l.rdv)
    .map((listing) => ({
      listingId: listing.id,
    }));
}

// Rendu à la requête (pas statique) : les searchParams (écran de confirmation)
// et la liste des créneaux disponibles doivent refléter l'état en temps réel
// (réservations déjà prises), pas l'état figé au moment du build.
export const dynamic = 'force-dynamic';

type RdvPageParams = { params: Promise<{ listingId: string }> };
type RdvPageSearchParams = {
  searchParams: Promise<{ confirmed?: string; start?: string; prenom?: string; token?: string }>;
};

function formatDateFr(dateStr: string): string {
  // dateStr = 'YYYY-MM-DD' (date calendaire) — formaté en UTC pour rester stable
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

function formatCreneau(slot: RdvSlot, timeZone: string): string {
  return `${formatHeure(slot.start, timeZone)} – ${formatHeure(slot.end, timeZone)}`;
}

function ConfirmationScreen({
  listingId,
  start,
  prenom,
}: {
  listingId: string;
  start: string;
  prenom: string;
}) {
  const listing = getListingById(listingId);
  if (!listing || !listing.rdv) {
    return null;
  }
  const rdvDateTime = formatRdvDateTime(start, listing.rdv.timezone);

  return (
    <div className="min-h-screen bg-gray-50 py-16">
      <div className="container-custom max-w-2xl">
        <div className="card p-8 text-center">
          <div className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-6">
            <svg className="w-10 h-10 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
            </svg>
          </div>

          <h1 className="text-3xl font-bold text-gray-900 mb-4">
            Merci {prenom || 'candidat'} !
          </h1>
          <p className="text-lg text-gray-600 mb-8">
            Votre visite est bien réservée.
          </p>

          <div className="bg-blue-50 border border-blue-200 rounded-lg p-6 mb-8 text-left">
            <h2 className="font-bold text-gray-900 mb-3">📅 Votre créneau de visite</h2>
            <p className="text-gray-700 mb-2">
              <strong>Date et heure :</strong> {rdvDateTime}
            </p>
            <p className="text-gray-700 mb-2">
              <strong>Durée :</strong> 15 minutes
            </p>
            <p className="text-gray-700">
              <strong>Adresse :</strong> {listing.address}
            </p>
          </div>

          <div className="bg-gray-50 border border-gray-200 rounded-lg p-6 mb-8 text-left">
            <h2 className="font-bold text-gray-900 mb-2">📧 Et maintenant ?</h2>
            <p className="text-gray-700">
              Un email de confirmation vient de vous être envoyé avec le détail de votre visite.
              Si vous devez modifier ou annuler ce rendez-vous, répondez simplement à cet email.
            </p>
          </div>

          <Link href={`/annonce/${listingId}`} className="inline-block btn-primary">
            Retour à l&apos;annonce
          </Link>
        </div>
      </div>
    </div>
  );
}

export default async function RdvPage({ params, searchParams }: RdvPageParams & RdvPageSearchParams) {
  const { listingId } = await params;
  const { confirmed, start, prenom, token } = await searchParams;
  const listing = getListingById(listingId);

  if (!listing || !listing.rdv) {
    notFound();
  }

  const timezone = listing.rdv.timezone;

  // Écran de confirmation après réservation réussie (POST /api/rdv → redirect)
  if (confirmed === '1' && start) {
    return <ConfirmationScreen listingId={listingId} start={start} prenom={prenom || ''} />;
  }

  // Pré-remplissage des coordonnées depuis le token HMAC du lien de réservation
  // (envoyé dans l'auto-email RDV). Token invalide/expiré → formulaire vide,
  // le candidat peut remplir à la main (pas de blocage).
  const prefill: RdvPrefill | null = token ? verifyRdvPrefillToken(token) : null;

  const existingRdvs = (await getRdvs()).filter((r) => r.listingId === listingId);
  const today = getTodayInTimeZone(timezone);
  const availableDates = getAvailableSlots(listing.rdv, today, existingRdvs);

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="container-custom max-w-3xl">
        {/* En-tête */}
        <div className="mb-8">
          <h1 className="text-3xl sm:text-4xl font-bold text-gray-900 mb-2">
            📅 Réserver une visite
          </h1>
          <p className="text-lg text-gray-600">
            Pour le logement : <strong>{listing.title}</strong>
          </p>
          <p className="text-gray-600">
            📍 {listing.address}
          </p>
        </div>

        {/* Rappel du logement */}
        <div className="mb-8 card p-6 bg-blue-50 border-2 border-blue-200">
          <h2 className="text-xl font-bold text-gray-900 mb-3">🏠 Votre visite</h2>
          <ul className="space-y-2 text-gray-700">
            <li>
              <strong>Durée :</strong> {listing.rdv.durationMinutes} minutes
            </li>
            <li>
              <strong>Horaires :</strong> du lundi au vendredi, de {listing.rdv.startTime.replace(':', 'h')} à{' '}
              {listing.rdv.endTime.replace(':', 'h')}
            </li>
            <li>
              <strong>Réservation :</strong> de demain jusqu'à 3 semaines à l'avance
            </li>
          </ul>
        </div>

        {/* Formulaire de réservation */}
        <form method="POST" action="/api/rdv" className="card p-6 mb-8">
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

          {availableDates.length > 0 && (
            <button
              type="submit"
              className="w-full btn-primary py-4 text-lg font-bold"
            >
              ✅ Confirmer ma visite
            </button>
          )}
        </form>
      </div>
    </div>
  );
}
