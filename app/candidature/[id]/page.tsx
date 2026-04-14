import { notFound } from 'next/navigation';
import { getListingById, getAllListings } from '@/lib/listings';
import ApplicationForm from '@/components/ApplicationForm';

// Génération statique des pages pour toutes les annonces
export async function generateStaticParams() {
  const listings = getAllListings();
  return listings.map((listing) => ({
    id: listing.id,
  }));
}

// Métadonnées dynamiques
export async function generateMetadata({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const listing = getListingById(id);

  if (!listing) {
    return {
      title: 'Annonce non trouvée',
    };
  }

  return {
    title: `Candidature - ${listing.title}`,
    description: `Formulaire de candidature pour ${listing.title}`,
  };
}

export default async function CandidaturePage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const listing = getListingById(id);

  if (!listing) {
    notFound();
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="container-custom">
        {/* En-tête */}
        <div className="mb-8">
          <h1 className="text-3xl sm:text-4xl font-bold text-gray-900 mb-2">
            📝 Formulaire de candidature
          </h1>
          <p className="text-lg text-gray-600">
            Pour le logement : <strong>{listing.title}</strong>
          </p>
        </div>

        {/* Rappel des conditions */}
        <div className="mb-8 card p-6 bg-blue-50 border-2 border-blue-200">
          <h2 className="text-xl font-bold text-gray-900 mb-3">📋 Rappel des conditions</h2>
          <ul className="space-y-2">
            {listing.conditions.map((condition, index) => (
              <li key={index} className="flex items-start">
                <span className="text-blue-600 mr-2">•</span>
                <span className="text-gray-700">{condition}</span>
              </li>
            ))}
          </ul>
        </div>

        {/* Formulaire */}
        <ApplicationForm listingId={listing.id} listingTitle={listing.title} />
      </div>
    </div>
  );
}
