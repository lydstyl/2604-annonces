import { NextRequest, NextResponse } from 'next/server';
import { getLeads, saveLead, deleteLead, updateLeadStatut, markLeadRepondu, linkLeadToCandidature } from '@/lib/storage';
import type { Source, LeadStatut } from '@/lib/storage';

// Verify admin password from header
function isAuthenticated(request: NextRequest): boolean {
  const auth = request.headers.get('x-admin-auth');
  return auth === process.env.ADMIN_PASSWORD;
}

// GET all leads
export async function GET(request: NextRequest) {
  if (!isAuthenticated(request)) {
    return NextResponse.json({ error: 'Non autorisé' }, { status: 401 });
  }

  try {
    const leads = await getLeads();
    // Sort by date descending (newest first)
    leads.sort((a, b) => new Date(b.dateMessage).getTime() - new Date(a.dateMessage).getTime());
    return NextResponse.json(leads);
  } catch (error) {
    console.error('Error fetching leads:', error);
    return NextResponse.json({ error: 'Erreur serveur' }, { status: 500 });
  }
}

// POST - Create a new lead
export async function POST(request: NextRequest) {
  if (!isAuthenticated(request)) {
    return NextResponse.json({ error: 'Non autorisé' }, { status: 401 });
  }

  try {
    const body = await request.json();
    const { pseudo, source, message, annonceId, emailId, repondu } = body;

    if (!pseudo || !source || !message || !annonceId) {
      return NextResponse.json(
        { error: 'Champs requis manquants: pseudo, source, message, annonceId' },
        { status: 400 }
      );
    }

    const validSources: Source[] = ['formulaire', 'leboncoin', 'facebook', 'autre'];
    if (!validSources.includes(source)) {
      return NextResponse.json(
        { error: `Source invalide. Valeurs acceptées: ${validSources.join(', ')}` },
        { status: 400 }
      );
    }

    const lead = await saveLead({
      pseudo,
      source,
      message,
      annonceId,
      emailId,
      repondu: repondu ?? false,
      statut: 'nouveau',
    });

    return NextResponse.json(lead, { status: 201 });
  } catch (error) {
    console.error('Error creating lead:', error);
    return NextResponse.json({ error: 'Erreur serveur' }, { status: 500 });
  }
}

// PATCH - Update lead status or mark as replied
export async function PATCH(request: NextRequest) {
  if (!isAuthenticated(request)) {
    return NextResponse.json({ error: 'Non autorisé' }, { status: 401 });
  }

  try {
    const body = await request.json();
    const { id, statut, markRepondu, candidatureId } = body;

    if (!id) {
      return NextResponse.json({ error: 'ID manquant' }, { status: 400 });
    }

    let result = null;

    if (markRepondu) {
      result = await markLeadRepondu(id);
    } else if (candidatureId) {
      result = await linkLeadToCandidature(id, candidatureId);
    } else if (statut) {
      const validStatuts: LeadStatut[] = ['nouveau', 'repondu', 'converti', 'perdu'];
      if (!validStatuts.includes(statut)) {
        return NextResponse.json(
          { error: `Statut invalide. Valeurs acceptées: ${validStatuts.join(', ')}` },
          { status: 400 }
        );
      }
      result = await updateLeadStatut(id, statut);
    } else {
      return NextResponse.json(
        { error: 'Action requise: statut, markRepondu ou candidatureId' },
        { status: 400 }
      );
    }

    if (!result) {
      return NextResponse.json({ error: 'Lead non trouvé' }, { status: 404 });
    }

    return NextResponse.json(result);
  } catch (error) {
    console.error('Error updating lead:', error);
    return NextResponse.json({ error: 'Erreur serveur' }, { status: 500 });
  }
}

// DELETE a lead
export async function DELETE(request: NextRequest) {
  if (!isAuthenticated(request)) {
    return NextResponse.json({ error: 'Non autorisé' }, { status: 401 });
  }

  try {
    const { id } = await request.json();
    if (!id) {
      return NextResponse.json({ error: 'ID manquant' }, { status: 400 });
    }

    const deleted = await deleteLead(id);
    if (!deleted) {
      return NextResponse.json({ error: 'Lead non trouvé' }, { status: 404 });
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error deleting lead:', error);
    return NextResponse.json({ error: 'Erreur serveur' }, { status: 500 });
  }
}
