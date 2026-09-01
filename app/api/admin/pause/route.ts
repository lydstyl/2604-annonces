import { NextRequest, NextResponse } from 'next/server';
import { getAllListings } from '@/lib/listings';
import { getPausedListingIds, setListingPaused } from '@/lib/pause';

// Vérifie le mot de passe admin (header x-admin-auth, même pattern que les autres routes admin)
function isAuthenticated(request: NextRequest): boolean {
  const auth = request.headers.get('x-admin-auth');
  return auth === process.env.ADMIN_PASSWORD;
}

// Résumé du statut pause de toutes les annonces (pour l'admin)
async function buildPauseSummary() {
  const pausedIds = await getPausedListingIds();
  return getAllListings().map((listing) => ({
    id: listing.id,
    title: listing.title,
    type: listing.type ?? 'Logement',
    paused: pausedIds.includes(listing.id),
  }));
}

// GET /api/admin/pause — statut pause de chaque annonce (admin)
export async function GET(request: NextRequest) {
  if (!isAuthenticated(request)) {
    return NextResponse.json({ error: 'Non autorisé' }, { status: 401 });
  }

  try {
    const listings = await buildPauseSummary();
    return NextResponse.json({ listings });
  } catch (error) {
    console.error('Error fetching pause status:', error);
    return NextResponse.json({ error: 'Erreur serveur' }, { status: 500 });
  }
}

// POST /api/admin/pause — met en pause ou reprend une annonce (admin)
// Body : { id: string, paused: boolean }
export async function POST(request: NextRequest) {
  if (!isAuthenticated(request)) {
    return NextResponse.json({ error: 'Non autorisé' }, { status: 401 });
  }

  try {
    const body = await request.json();
    const { id, paused } = body;

    if (typeof id !== 'string' || id.length === 0) {
      return NextResponse.json({ error: 'ID manquant' }, { status: 400 });
    }
    if (typeof paused !== 'boolean') {
      return NextResponse.json({ error: 'paused doit être un booléen' }, { status: 400 });
    }

    // L'annonce doit exister
    const listingExists = getAllListings().some((l) => l.id === id);
    if (!listingExists) {
      return NextResponse.json({ error: 'Annonce non trouvée' }, { status: 404 });
    }

    await setListingPaused(id, paused);

    const listings = await buildPauseSummary();
    return NextResponse.json({ success: true, paused, listings });
  } catch (error) {
    console.error('Error setting pause status:', error);
    return NextResponse.json({ error: 'Erreur serveur' }, { status: 500 });
  }
}
