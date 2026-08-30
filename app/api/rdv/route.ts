import { NextRequest, NextResponse } from 'next/server';
import { getListingById } from '@/lib/listings';
import { getRdvs, isSlotAvailable, bookRdv, updateRdv } from '@/lib/rdv';
import { sendRdvConfirmationEmail, sendRdvNotificationEmail } from '@/lib/email';
import { syncRdvToCalendar } from '@/lib/calendar';

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData();

    const listingId = String(formData.get('listingId') || '').trim();
    const start = String(formData.get('start') || '').trim();
    const nom = String(formData.get('nom') || '').trim();
    const prenom = String(formData.get('prenom') || '').trim();
    const telephone = String(formData.get('telephone') || '').trim();
    const email = String(formData.get('email') || '').trim();

    // Validation des champs requis
    if (!listingId || !start || !nom || !prenom || !telephone || !email) {
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

    // Vérifier que l'annonce existe et a une config de créneaux intégrée
    const listing = getListingById(listingId);
    if (!listing || !listing.rdv) {
      return NextResponse.json(
        { error: 'Annonce non trouvée ou réservation de visite indisponible' },
        { status: 404 }
      );
    }

    // Vérifier que le créneau demandé est un début de créneau valide de la config
    // (jour ouvré, plage horaire, durée) — indépendamment des réservations existantes
    if (!isSlotAvailable(listing.rdv, start, [])) {
      return NextResponse.json(
        { error: 'Créneau invalide' },
        { status: 400 }
      );
    }

    // Vérifier la disponibilité : 409 si le créneau est déjà pris
    const existingRdvs = (await getRdvs()).filter((r) => r.listingId === listingId);
    if (!isSlotAvailable(listing.rdv, start, existingRdvs)) {
      return NextResponse.json(
        { error: 'Ce créneau vient d\'être réservé. Merci d\'en choisir un autre.' },
        { status: 409 }
      );
    }

    // Réservation atomique (ré-vérifie le chevauchement sous verrou)
    const result = await bookRdv({
      listingId,
      start,
      durationMinutes: listing.rdv.durationMinutes,
      nom,
      prenom,
      telephone,
      email,
    });

    if (!result.ok) {
      if (result.reason === 'ALREADY_BOOKED') {
        const bailleurEmail = listing.rdvBailleur?.email ?? process.env.EMAIL_TO ?? 'lydstyl@gmail.com';
        return NextResponse.json(
          {
            code: 'ALREADY_BOOKED',
            error: `Vous avez déjà réservé un créneau de visite pour ce logement. Pour le modifier ou l'annuler, écrivez à ${bailleurEmail}.`,
          },
          { status: 409 }
        );
      }
      return NextResponse.json(
        { error: 'Ce créneau vient d\'être réservé. Merci d\'en choisir un autre.' },
        { status: 409 }
      );
    }

    // Emails : confirmation au candidat + notification à Gabriel.
    // Une erreur d'email ne fait pas échouer la réservation (déjà persistée).
    try {
      await sendRdvConfirmationEmail(result.rdv, listing);
    } catch (emailError) {
      console.error('Erreur lors de l\'envoi de l\'email de confirmation RDV:', emailError);
    }

    try {
      await sendRdvNotificationEmail(result.rdv, listing);
    } catch (emailError) {
      console.error('Erreur lors de l\'envoi de l\'email de notification RDV:', emailError);
    }

    // Sync Google Calendar (calendrier « Visites ») : NON BLOQUANTE.
    // Une erreur Google ne fait pas échouer la réservation (déjà persistée),
    // exactement comme le pattern des emails ci-dessus. Si l'événement est
    // créé, on persiste son id (googleEventId) pour garantir l'idempotence.
    try {
      const eventId = await syncRdvToCalendar(result.rdv, listing);
      if (eventId && !result.rdv.googleEventId) {
        await updateRdv(result.rdv.id, { googleEventId: eventId });
      }
    } catch (calendarError) {
      console.error('Erreur lors de la création de l\'événement Google Calendar (réservation conservée):', calendarError);
    }

    // Redirection vers l'écran de confirmation de la page RDV.
    // Base ABSOLUE depuis NEXT_PUBLIC_SITE_URL (pas request.url qui, derrière
    // Nginx, pointe vers l'URL interne localhost:3011 → lien cassé pour le candidat).
    const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || 'https://annonces.duckdns.org';
    const confirmationUrl = new URL(
      `/rdv/${listingId}?confirmed=1&start=${encodeURIComponent(result.rdv.start)}&prenom=${encodeURIComponent(prenom)}`,
      siteUrl
    );
    return NextResponse.redirect(confirmationUrl, 303);
  } catch (error) {
    console.error('Erreur lors du traitement de la réservation de RDV:', error);
    return NextResponse.json(
      { error: 'Une erreur est survenue lors de la réservation de votre visite' },
      { status: 500 }
    );
  }
}
