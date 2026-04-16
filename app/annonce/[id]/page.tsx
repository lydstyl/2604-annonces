import { notFound } from 'next/navigation';
import Link from 'next/link';
import { getListingById, getAllListings } from '@/lib/listings';
import ImageCarousel from '@/components/ImageCarousel';
import VideoEmbed from '@/components/VideoEmbed';
import MapEmbed from '@/components/MapEmbed';
import FAQSection from '@/components/FAQSection';
import ChatWidget from '@/components/ChatWidget';

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
    title: listing.title,
    description: listing.description,
  };
}

export default async function AnnoncePage({ params }: { params: Promise<{ id: string }> }) {
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
            🏡 {listing.title}
          </h1>
          <p className="text-lg text-gray-600">{listing.description}</p>
        </div>

        {/* Carrousel d'images */}
        <div className="mb-8">
          <ImageCarousel images={listing.images} alt={listing.title} />
          {listing.mediaDisclaimer && (
            <div className="mt-3 p-3 bg-amber-50 border border-amber-200 rounded-lg">
              <p className="text-sm text-amber-800">
                ℹ️ {listing.mediaDisclaimer}
              </p>
            </div>
          )}
        </div>

        {/* Points forts */}
        <section className="mb-8 card p-6">
          <h2 className="text-2xl font-bold text-gray-900 mb-4">✨ Les points forts</h2>
          <ul className="space-y-2">
            {listing.features.map((feature, index) => (
              <li key={index} className="flex items-start">
                <span className="text-primary-600 mr-2">•</span>
                <span className="text-gray-700">{feature}</span>
              </li>
            ))}
          </ul>
        </section>

        {/* Loyer & charges */}
        <section className="mb-8 card p-6 bg-primary-50 border-2 border-primary-200">
          <h2 className="text-2xl font-bold text-gray-900 mb-4">💶 Loyer & charges</h2>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div>
              <p className="text-gray-600 text-sm">Loyer</p>
              <p className="text-2xl font-bold text-primary-700">{listing.price.rent} €<span className="text-base font-normal text-gray-600">/mois</span></p>
            </div>
            <div>
              <p className="text-gray-600 text-sm">Charges</p>
              <p className="text-2xl font-bold text-primary-700">{listing.price.charges} €<span className="text-base font-normal text-gray-600">/mois</span></p>
            </div>
            <div>
              <p className="text-gray-600 text-sm">Dépôt de garantie</p>
              <p className="text-2xl font-bold text-primary-700">{listing.price.deposit} €</p>
            </div>
          </div>
        </section>

        {/* Conditions de location */}
        <section className="mb-8 card p-6">
          <h2 className="text-2xl font-bold text-gray-900 mb-4">✅ Conditions de location</h2>
          <ul className="space-y-2">
            {listing.conditions.map((condition, index) => (
              <li key={index} className="flex items-start">
                <span className="text-green-600 mr-2">✓</span>
                <span className="text-gray-700">{condition}</span>
              </li>
            ))}
          </ul>
        </section>

        {/* Disponibilité */}
        <section className="mb-8 card p-6 bg-green-50 border-2 border-green-200">
          <h2 className="text-2xl font-bold text-gray-900 mb-2">📅 Disponibilité</h2>
          <p className="text-lg text-gray-700">Disponible à partir du <strong>{listing.availableFrom}</strong></p>
        </section>

        {/* Vidéo */}
        {listing.videoId && (
          <section className="mb-8">
            <h2 className="text-2xl font-bold text-gray-900 mb-4">🎥 Visite en vidéo</h2>
            <VideoEmbed videoId={listing.videoId} title={`Visite - ${listing.title}`} />
          </section>
        )}

        {/* Carte */}
        <section className="mb-8">
          <h2 className="text-2xl font-bold text-gray-900 mb-4">📍 Localisation</h2>
          <MapEmbed location={listing.address} embedUrl={listing.mapEmbedUrl} />
          <p className="text-sm text-gray-600 mt-2">{listing.address}</p>
        </section>

        {/* FAQ */}
        <section className="mb-8">
          <h2 className="text-2xl font-bold text-gray-900 mb-4">❓ Questions fréquentes</h2>
          <FAQSection items={listing.faq} />
        </section>

        {/* CTA */}
        <div className="sticky bottom-8 z-10">
          <div className="card p-6 bg-gradient-to-r from-primary-600 to-primary-700 text-white shadow-2xl">
            <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
              <div>
                <h3 className="text-xl font-bold mb-1">Intéressé par ce logement ?</h3>
                <p className="text-primary-100">Remplissez le formulaire de candidature en quelques minutes</p>
              </div>
              <Link
                href={`/candidature/${listing.id}`}
                className="bg-white text-primary-700 hover:bg-gray-100 font-bold py-4 px-8 rounded-lg transition-colors shadow-lg whitespace-nowrap"
              >
                Je suis intéressé →
              </Link>
            </div>
          </div>
        </div>

        {/* Chatbot */}
        <ChatWidget listingId={listing.id} />
      </div>
    </div>
  );
}
