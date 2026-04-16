import { NextRequest, NextResponse } from 'next/server';
import { getCandidatures, deleteCandidature } from '@/lib/storage';

// Verify admin password from header
function isAuthenticated(request: NextRequest): boolean {
  const auth = request.headers.get('x-admin-auth');
  return auth === process.env.ADMIN_PASSWORD;
}

// GET all candidatures
export async function GET(request: NextRequest) {
  if (!isAuthenticated(request)) {
    return NextResponse.json({ error: 'Non autorisé' }, { status: 401 });
  }

  try {
    const candidatures = await getCandidatures();
    // Sort by date descending (newest first)
    candidatures.sort((a, b) => new Date(b.dateSubmission).getTime() - new Date(a.dateSubmission).getTime());
    return NextResponse.json(candidatures);
  } catch (error) {
    console.error('Error fetching candidatures:', error);
    return NextResponse.json({ error: 'Erreur serveur' }, { status: 500 });
  }
}

// DELETE a candidature
export async function DELETE(request: NextRequest) {
  if (!isAuthenticated(request)) {
    return NextResponse.json({ error: 'Non autorisé' }, { status: 401 });
  }

  try {
    const { id } = await request.json();
    if (!id) {
      return NextResponse.json({ error: 'ID manquant' }, { status: 400 });
    }

    const deleted = await deleteCandidature(id);
    if (!deleted) {
      return NextResponse.json({ error: 'Candidature non trouvée' }, { status: 404 });
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error deleting candidature:', error);
    return NextResponse.json({ error: 'Erreur serveur' }, { status: 500 });
  }
}
