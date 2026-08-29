import { notFound } from 'next/navigation';
import Link from 'next/link';
import { getListingById, getAllListings } from '@/lib/listings';
import {
  getRdvs,
  getAvailableSlots,
  getTodayInTimeZone,
  formatRdvDateTime,
} from '@/lib/rdv';
import { verifyRdvPrefillToken, type RdvPrefill } from '@/lib/rdv-token';
import RdvBookingForm from '@/components/RdvBookingForm';

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
            </p>
            <p className="text-gray-700 mt-2">
              Pour modifier ou annuler ce rendez-vous, écrivez à{' '}
              <strong>{listing.rdvBailleur?.email ?? 'lydstyl@gmail.com'}</strong> ou appelez le{' '}
              <strong>{listing.rdvBailleur?.phone}</strong>.
            </p>
            {listing.rdvHost && (
              <p className="text-gray-700 mt-2">
                ℹ️ La visite est assurée par <strong>{listing.rdvHost.name}</strong> : merci de le
                prévenir de votre arrivée au <strong>{listing.rdvHost.phone}</strong>.
              </p>
            )}
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
            {listing.rdv.schedule ? (
              <li>
                <strong>Horaires :</strong> planning par jour — voir les créneaux disponibles ci-dessous
              </li>
            ) : (
              <li>
                <strong>Horaires :</strong> du lundi au vendredi, de {listing.rdv.startTime!.replace(':', 'h')} à{' '}
                {listing.rdv.endTime!.replace(':', 'h')}
              </li>
            )}
            <li>
              <strong>Réservation :</strong> de demain jusqu'à{' '}
              {listing.rdv.maxLeadDays % 7 === 0
                ? `${listing.rdv.maxLeadDays / 7} semaine${listing.rdv.maxLeadDays / 7 > 1 ? 's' : ''}`
                : `${listing.rdv.maxLeadDays} jours`}{' '}
              à l'avance
            </li>
          </ul>
        </div>

        {/* Formulaire de réservation — client component (fetch, erreurs affichées dans la page) */}
        <RdvBookingForm
          listingId={listingId}
          availableDates={availableDates}
          timezone={timezone}
          prefill={prefill}
        />
      </div>
    </div>
  );
}
