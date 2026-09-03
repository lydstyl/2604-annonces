import { NextRequest, NextResponse } from 'next/server';
import { saveCandidature } from '@/lib/storage';
import { sendCandidatureEmail, sendVisitRdvEmail } from '@/lib/email';
import { appendCandidatureToSheet } from '@/lib/sheets';
import { getListingById } from '@/lib/listings';
import { isEligibleVisitRdv } from '@/lib/eligibility';

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: listingId } = await params;
    const body = await request.json();

    // Validation des champs requis
    const { nom, prenom, telephone, email, revenusMenuels, peutFournirGarant, cdiPlus3Mois, garantieVisale, dateAmenagement, remarques } = body;

    if (!nom || !prenom || !telephone || !email || revenusMenuels === undefined) {
      return NextResponse.json(
        { error: 'Tous les champs obligatoires doivent être remplis' },
        { status: 400 }
      );
    }

    // Validation de l'email
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return NextResponse.json(
        { error: 'Email invalide' },
        { status: 400 }
      );
    }

    // Validation des revenus
    const revenusNumber = parseFloat(revenusMenuels);
    if (isNaN(revenusNumber) || revenusNumber < 0) {
      return NextResponse.json(
        { error: 'Revenus invalides' },
        { status: 400 }
      );
    }

    // Vérifier que l'annonce existe
    const listing = getListingById(listingId);
    if (!listing) {
      return NextResponse.json(
        { error: 'Annonce non trouvée' },
        { status: 404 }
      );
    }

    // Sauvegarder la candidature
    const candidature = await saveCandidature({
      listingId,
      nom: nom.trim(),
      prenom: prenom.trim(),
      telephone: telephone.trim(),
      email: email.trim(),
      revenusMenuels: revenusNumber,
      peutFournirGarant: !!peutFournirGarant,
      cdiPlus3Mois: !!cdiPlus3Mois,
      garantieVisale: !!garantieVisale,
      dateAmenagement: dateAmenagement || '',
      remarques: remarques?.trim() || '',
    });

    // Envoyer l'email de notification
    // Note: L'email est envoyé même si la candidature ne respecte pas les conditions
    try {
      await sendCandidatureEmail(candidature, listing.title);
    } catch (emailError) {
      console.error('Erreur lors de l\'envoi de l\'email:', emailError);
      // On continue même si l'email échoue (la candidature est déjà sauvegardée)
    }

    // Auto-email RDV : si le candidat est éligible (règle unique : CDI > 3 mois ET
    // revenus ≥ 3× loyer CC de l'annonce), lui envoyer le lien de réservation.
    // L'email de notification ci-dessus part TOUJOURS, celui-ci est conditionnel.
    if (
      isEligibleVisitRdv(
        {
          cdiPlus3Mois: candidature.cdiPlus3Mois,
          revenusMenuels: candidature.revenusMenuels,
        },
        // Loyer CC de l'annonce → seuil 3× loyer CC dynamique par annonce
        listing.price.rent + listing.price.charges
      )
    ) {
      try {
        await sendVisitRdvEmail(candidature, listing);
      } catch (rdvEmailError) {
        console.error('Erreur lors de l\'envoi de l\'email RDV:', rdvEmailError);
        // On continue même si l'email échoue (la candidature est déjà sauvegardée)
      }
    }

    // Écrire dans le Google Sheet (ne fait pas planter si ça échoue)
    await appendCandidatureToSheet(candidature);

    return NextResponse.json(
      {
        success: true,
        message: 'Candidature envoyée avec succès',
        id: candidature.id,
      },
      { status: 201 }
    );
  } catch (error) {
    console.error('Erreur lors du traitement de la candidature:', error);
    return NextResponse.json(
      { error: 'Une erreur est survenue lors du traitement de votre candidature' },
      { status: 500 }
    );
  }
}
