import Link from 'next/link';
import { getActiveListingCards } from '@/lib/listings';
import { getPausedListingIds } from '@/lib/pause';

// Dynamique : le statut pause (data/paused-listings.json) doit être relu à
// chaque requête — pas de rendu statique au build (pas de force-static).
export const dynamic = 'force-dynamic';

export default async function Home() {
  const pausedIds = await getPausedListingIds();
  const cards = getActiveListingCards(pausedIds);

  return (
    <div className="min-h-screen bg-gray-50 py-10">
      <div className="container-custom">
        {/* En-tête */}
        <header className="mb-10 text-center">
          <h1 className="text-3xl sm:text-4xl font-bold text-gray-900 mb-2">
            🏡 Nos annonces disponibles
          </h1>
          <p className="text-lg text-gray-600">
            Découvrez nos logements à louer — consultez chaque annonce pour les détails et la candidature.
          </p>
        </header>

        {/* Grille de cartes */}
        {cards.length === 0 ? (
          <div className="text-center py-16 text-gray-500">
            <div className="text-5xl mb-4">🏠</div>
            <p className="text-xl font-semibold text-gray-700 mb-1">Aucune annonce disponible</p>
            <p>Nos logements sont temporairement indisponibles — revenez prochainement !</p>
          </div>
        ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
          {cards.map((card) => (
            <article
              key={card.id}
              className="card flex flex-col bg-white rounded-xl shadow-md overflow-hidden hover:shadow-lg transition-shadow"
            >
              {/* Photo de couverture (si dispo) */}
              {card.coverImage ? (
                <div className="relative h-48 bg-gray-200">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={card.coverImage}
                    alt={card.title}
                    className="w-full h-full object-cover"
                  />
                  <span className="absolute top-3 left-3 bg-primary-600 text-white text-sm font-bold px-3 py-1 rounded-full shadow">
                    {card.type}
                  </span>
                </div>
              ) : (
                <div className="relative h-48 bg-primary-50 flex items-center justify-center">
                  <span className="text-primary-600 text-5xl" aria-hidden>
                    🏠
                  </span>
                  <span className="absolute top-3 left-3 bg-primary-600 text-white text-sm font-bold px-3 py-1 rounded-full shadow">
                    {card.type}
                  </span>
                </div>
              )}

              {/* Contenu */}
              <div className="p-6 flex flex-col flex-1">
                <h2 className="text-xl font-bold text-gray-900 mb-2">{card.title}</h2>

                <dl className="space-y-1 text-gray-700 mb-4">
                  <div className="flex justify-between">
                    <dt className="text-gray-500">Surface</dt>
                    <dd className="font-semibold">{card.surface} m²</dd>
                  </div>
                  <div className="flex justify-between">
                    <dt className="text-gray-500">Loyer charges comprises</dt>
                    <dd className="font-semibold text-primary-700">{card.rentChargesComprises} €/mois</dd>
                  </div>
                  <div className="flex justify-between">
                    <dt className="text-gray-500">Localisation</dt>
                    <dd className="font-semibold">{card.location}</dd>
                  </div>
                </dl>

                <div className="mt-auto">
                  <Link
                    href={card.href}
                    className="btn-primary inline-block w-full text-center"
                  >
                    Voir l&apos;annonce →
                  </Link>
                </div>
              </div>
            </article>
          ))}
        </div>
        )}
      </div>
    </div>
  );
}
