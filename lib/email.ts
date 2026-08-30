import nodemailer from 'nodemailer';
import type { Candidature } from './storage';
import type { Listing } from './listings';
import type { Rdv } from './rdv';
import { formatRdvDateTime } from './rdv';
import { buildRdvBookingUrl } from './rdv-token';
import { getSheetUrlForListing } from './sheets';

// Lien calendrier de réservation de visite (défaut : agenda T3)
export const VISIT_CALENDAR_URL = 'https://calendar.app.google/DQPx7dskXd7bY6bq8';

// Configuration du transporteur email
function createTransporter() {
  return nodemailer.createTransport({
    host: process.env.SMTP_HOST,
    port: parseInt(process.env.SMTP_PORT || '587'),
    secure: false, // true for 465, false for other ports
    auth: {
      user: process.env.SMTP_USER,
      pass: process.env.SMTP_PASSWORD,
    },
  });
}

// Envoyer l'email automatique de prise de RDV visite (candidat éligible)
// Template inspiré du « Cas 1 » du skill gestion-candidatures-location.
export async function sendVisitRdvEmail(candidature: Candidature, listing: Listing) {
  const transporter = createTransporter();

  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || 'https://annonces.duckdns.org';
  const annonceUrl = `${siteUrl}/annonce/${listing.id}`;
  // Si l'annonce a une config RDV intégrée, on pointe vers la page de réservation
  // interne avec un token HMAC portant les coordonnées du candidat (pré-remplissage
  // du formulaire) ; sinon fallback sur le calendrier Google (comportement T3 inchangé).
  const rdvBookingUrl = buildRdvBookingUrl(listing, {
    nom: candidature.nom,
    prenom: candidature.prenom,
    telephone: candidature.telephone,
    email: candidature.email,
  });
  const calendarUrl = listing.calendarUrl || VISIT_CALENDAR_URL;
  const bookingUrl = rdvBookingUrl || calendarUrl;
  const bookingCtaLabel = rdvBookingUrl ? 'Réserver un créneau de visite' : 'Prendre rendez-vous';
  const logementLabel = listing.type ? `l'appartement ${listing.type} situé à Raismes` : 'le logement situé à Raismes';

  const prixLigne =
    listing.price.rent > 0
      ? `Le loyer est de ${listing.price.rent} € + ${listing.price.charges} € de charges, soit ${listing.price.rent + listing.price.charges} €/mois.`
      : '';

  const emailText = `Bonjour ${candidature.prenom},

Je reviens vers vous suite à votre candidature pour ${logementLabel}.

👉 Lien vers l'annonce : ${annonceUrl}

Votre profil correspond à ce que je recherche, je vous propose donc de visiter le logement.

Vous pouvez directement réserver un créneau de visite à votre convenance via le lien ci-dessous :
👉 ${bookingCtaLabel} : ${bookingUrl}

${prixLigne}

N'hésitez pas à me contacter si vous avez des questions avant la visite.

Dans l'attente de votre retour, cordialement,
Gabriel Brun`;

  const emailHtml = `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <style>
        body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
        .container { max-width: 600px; margin: 0 auto; padding: 20px; }
        .header { background-color: #0284c7; color: white; padding: 20px; text-align: center; }
        .content { background-color: #f9f9f9; padding: 20px; }
        .cta { margin: 20px 0; text-align: center; }
        .cta a { background-color: #0284c7; color: white; padding: 12px 24px; text-decoration: none; border-radius: 8px; font-weight: bold; display: inline-block; }
        .footer { margin-top: 20px; padding: 20px; text-align: center; font-size: 12px; color: #777; }
      </style>
    </head>
    <body>
      <div class="container">
        <div class="header">
          <h1>🏠 Visite appartement</h1>
        </div>
        <div class="content">
          <p>Bonjour ${candidature.prenom},</p>
          <p>Je reviens vers vous suite à votre candidature pour ${logementLabel}.</p>
          <p>👉 Lien vers l'annonce : <a href="${annonceUrl}">${annonceUrl}</a></p>
          <p>Votre profil correspond à ce que je recherche, je vous propose donc de visiter le logement.</p>
          <p>Vous pouvez directement réserver un créneau de visite à votre convenance via le lien ci-dessous :</p>
          <div class="cta">
            <a href="${bookingUrl}">📅 ${bookingCtaLabel}</a>
          </div>
          ${prixLigne ? `<p>${prixLigne}</p>` : ''}
          <p>N'hésitez pas à me contacter si vous avez des questions avant la visite.</p>
          <p>Dans l'attente de votre retour, cordialement,<br/>Gabriel Brun</p>
        </div>
        <div class="footer">
          <p>Cet email a été généré automatiquement suite à votre candidature.</p>
        </div>
      </div>
    </body>
    </html>
  `;

  const mailOptions = {
    from: process.env.EMAIL_FROM,
    to: candidature.email,
    subject: listing.type
      ? `Visite appartement ${listing.type} Raismes — Prise de rendez-vous en ligne`
      : 'Visite appartement Raismes — Prise de rendez-vous en ligne',
    text: emailText,
    html: emailHtml,
  };

  try {
    await transporter.sendMail(mailOptions);
    console.log('Visit RDV email sent successfully');
  } catch (error) {
    console.error('Error sending visit RDV email:', error);
    throw new Error('Erreur lors de l\'envoi de l\'email de rendez-vous');
  }
}

// Email de confirmation de RDV au candidat, avec la date et l'heure du créneau
export async function sendRdvConfirmationEmail(rdv: Rdv, listing: Listing) {
  const transporter = createTransporter();

  const logementLabel = listing.type ? `l'appartement ${listing.type} situé à Raismes` : 'le logement situé à Raismes';
  const timezone = listing.rdv?.timezone ?? 'Europe/Paris';
  const rdvDateTime = formatRdvDateTime(rdv.start, timezone);
  const dureeMinutes = listing.rdv?.durationMinutes ?? 15;

  // Coordonnées de contact : email du bailleur (Gabriel) dans la confirmation
  // pour que le candidat puisse modifier/annuler — même sans Google Calendar
  // (cas T2 : la visite est assurée par le locataire actuel, le candidat doit
  // pouvoir le joindre). Le téléphone du bailleur n'est PLUS affiché aux
  // candidats (règle Gabriel 30/08/2026 : pas de contact téléphonique pour la
  // modification des rendez-vous).
  const bailleurEmail = listing.rdvBailleur?.email ?? process.env.EMAIL_TO ?? 'lydstyl@gmail.com';
  const contactLine = `Pour modifier ou annuler ce rendez-vous, écrivez à ${bailleurEmail}.`;
  const hostLine = listing.rdvHost
    ? `ℹ️ La visite est assurée par ${listing.rdvHost.name} : merci de le prévenir de votre arrivée au ${listing.rdvHost.phone}.`
    : '';

  const emailText = `Bonjour ${rdv.prenom},

Votre visite pour ${logementLabel} est bien confirmée.

📅 Créneau réservé : ${rdvDateTime}
📍 Adresse : ${listing.address}

Votre visite durera ${dureeMinutes} minutes.

${contactLine}
${hostLine}

À bientôt,
Gabriel Brun`;

  const emailHtml = `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <style>
        body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
        .container { max-width: 600px; margin: 0 auto; padding: 20px; }
        .header { background-color: #0284c7; color: white; padding: 20px; text-align: center; }
        .content { background-color: #f9f9f9; padding: 20px; }
        .rdv-box { background-color: #e0f2fe; border: 1px solid #7dd3fc; border-radius: 8px; padding: 16px; margin: 16px 0; }
        .footer { margin-top: 20px; padding: 20px; text-align: center; font-size: 12px; color: #777; }
      </style>
    </head>
    <body>
      <div class="container">
        <div class="header">
          <h1>✅ Visite confirmée</h1>
        </div>
        <div class="content">
          <p>Bonjour ${rdv.prenom},</p>
          <p>Votre visite pour ${logementLabel} est bien confirmée.</p>
          <div class="rdv-box">
            <p><strong>📅 Créneau réservé :</strong> ${rdvDateTime}</p>
            <p><strong>📍 Adresse :</strong> ${listing.address}</p>
            <p><strong>⏱️ Durée :</strong> ${dureeMinutes} minutes</p>
          </div>
          <p>${contactLine}</p>
          ${hostLine ? `<p>${hostLine}</p>` : ''}
          <p>À bientôt,<br/>Gabriel Brun</p>
        </div>
        <div class="footer">
          <p>Cet email a été généré automatiquement suite à votre réservation de visite.</p>
        </div>
      </div>
    </body>
    </html>
  `;

  const mailOptions = {
    from: process.env.EMAIL_FROM,
    to: rdv.email,
    subject: `Confirmation de visite ${listing.type ? listing.type : 'appartement'} Raismes — ${rdvDateTime}`,
    text: emailText,
    html: emailHtml,
  };

  try {
    await transporter.sendMail(mailOptions);
    console.log('RDV confirmation email sent successfully');
  } catch (error) {
    console.error('Error sending RDV confirmation email:', error);
    throw new Error('Erreur lors de l\'envoi de l\'email de confirmation de RDV');
  }
}

// Email de notification à Gabriel (EMAIL_TO) : coordonnées candidat + créneau
export async function sendRdvNotificationEmail(rdv: Rdv, listing: Listing) {
  const transporter = createTransporter();

  const timezone = listing.rdv?.timezone ?? 'Europe/Paris';
  const rdvDateTime = formatRdvDateTime(rdv.start, timezone);

  const emailText = `
Nouveau RDV de visite réservé :

Annonce : ${listing.title}
Créneau : ${rdvDateTime}
Adresse de visite : ${listing.address}

Candidat :
Nom : ${rdv.nom}
Prénom : ${rdv.prenom}
Téléphone : ${rdv.telephone}
Email : ${rdv.email}

ID du RDV : ${rdv.id}
  `;

  const emailHtml = `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <style>
        body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
        .container { max-width: 600px; margin: 0 auto; padding: 20px; }
        .header { background-color: #0284c7; color: white; padding: 20px; text-align: center; }
        .content { background-color: #f9f9f9; padding: 20px; }
        .field { margin-bottom: 15px; }
        .label { font-weight: bold; color: #555; }
        .value { color: #333; }
        .rdv-box { background-color: #e0f2fe; border: 1px solid #7dd3fc; border-radius: 8px; padding: 16px; margin: 16px 0; }
        .footer { margin-top: 20px; padding: 20px; text-align: center; font-size: 12px; color: #777; }
      </style>
    </head>
    <body>
      <div class="container">
        <div class="header">
          <h1>📅 Nouveau RDV de visite</h1>
        </div>
        <div class="content">
          <p><strong>Annonce :</strong> ${listing.title}</p>
          <div class="rdv-box">
            <p><strong>🕐 Créneau :</strong> ${rdvDateTime}</p>
            <p><strong>📍 Adresse de visite :</strong> ${listing.address}</p>
          </div>
          <hr>
          <div class="field">
            <div class="label">Nom :</div>
            <div class="value">${rdv.nom}</div>
          </div>
          <div class="field">
            <div class="label">Prénom :</div>
            <div class="value">${rdv.prenom}</div>
          </div>
          <div class="field">
            <div class="label">Téléphone :</div>
            <div class="value">${rdv.telephone}</div>
          </div>
          <div class="field">
            <div class="label">Email :</div>
            <div class="value">${rdv.email}</div>
          </div>
          <hr>
          <div class="field">
            <div class="label">ID du RDV :</div>
            <div class="value">${rdv.id}</div>
          </div>
        </div>
        <div class="footer">
          <p>Cette notification a été générée automatiquement par le système de gestion des annonces immobilières.</p>
        </div>
      </div>
    </body>
    </html>
  `;

  const mailOptions = {
    from: process.env.EMAIL_FROM,
    // Destinataires : Gabriel (EMAIL_TO) + l'email du locataire qui réalise les visites (rdvHost) si renseigné — dédupliqués
    to: Array.from(
      new Set([process.env.EMAIL_TO || 'lydstyl@gmail.com', ...(listing.rdvHost?.email ? [listing.rdvHost.email] : [])])
    ),
    subject: `Nouveau RDV visite - ${rdv.prenom} ${rdv.nom} - ${listing.title}`,
    text: emailText,
    html: emailHtml,
  };

  try {
    await transporter.sendMail(mailOptions);
    console.log('RDV notification email sent successfully');
  } catch (error) {
    console.error('Error sending RDV notification email:', error);
    throw new Error('Erreur lors de l\'envoi de l\'email de notification de RDV');
  }
}

// Envoyer l'email de notification pour une candidature
export async function sendCandidatureEmail(candidature: Candidature, listingTitle: string) {
  const transporter = createTransporter();

  const emailHtml = `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <style>
        body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
        .container { max-width: 600px; margin: 0 auto; padding: 20px; }
        .header { background-color: #0284c7; color: white; padding: 20px; text-align: center; }
        .content { background-color: #f9f9f9; padding: 20px; }
        .field { margin-bottom: 15px; }
        .label { font-weight: bold; color: #555; }
        .value { color: #333; }
        .footer { margin-top: 20px; padding: 20px; text-align: center; font-size: 12px; color: #777; }
      </style>
    </head>
    <body>
      <div class="container">
        <div class="header">
          <h1>📝 Nouvelle candidature</h1>
        </div>
        <div class="content">
          <p><strong>Annonce concernée :</strong> ${listingTitle}</p>
          <hr>

          <div class="field">
            <div class="label">Nom :</div>
            <div class="value">${candidature.nom}</div>
          </div>

          <div class="field">
            <div class="label">Prénom :</div>
            <div class="value">${candidature.prenom}</div>
          </div>

          <div class="field">
            <div class="label">Téléphone :</div>
            <div class="value">${candidature.telephone}</div>
          </div>

          <div class="field">
            <div class="label">Email :</div>
            <div class="value">${candidature.email}</div>
          </div>

          <div class="field">
            <div class="label">Revenus mensuels nets :</div>
            <div class="value">${candidature.revenusMenuels} €</div>
          </div>

          <div class="field">
            <div class="label">Peut fournir un garant :</div>
            <div class="value">${candidature.peutFournirGarant ? 'Oui ✓' : 'Non ✗'}</div>
          </div>

          <div class="field">
            <div class="label">Remarques :</div>
            <div class="value">${candidature.remarques || '<em>Aucune remarque</em>'}</div>
          </div>

          <hr>

          <div class="field">
            <div class="label">Date de soumission :</div>
            <div class="value">${new Date(candidature.dateSubmission).toLocaleString('fr-FR')}</div>
          </div>

          <div class="field">
            <div class="label">ID de candidature :</div>
            <div class="value">${candidature.id}</div>
          </div>

          <div style="margin-top: 25px; text-align: center; display: flex; flex-direction: column; gap: 10px;">
            <a href="${process.env.NEXT_PUBLIC_SITE_URL || 'https://annonces.duckdns.org'}/admin" style="background-color: #0284c7; color: white; padding: 12px 24px; text-decoration: none; border-radius: 8px; font-weight: bold; display: inline-block;">
              📋 Voir toutes les candidatures (admin)
            </a>
            <a href="${getSheetUrlForListing(candidature.listingId)}" style="background-color: #0f9d58; color: white; padding: 12px 24px; text-decoration: none; border-radius: 8px; font-weight: bold; display: inline-block;">
              📊 Voir le Google Sheets
            </a>
          </div>
        </div>
        <div class="footer">
          <p>Cette notification a été générée automatiquement par le système de gestion des annonces immobilières.</p>
        </div>
      </div>
    </body>
    </html>
  `;

  const emailText = `
Nouvelle candidature pour : ${listingTitle}

Nom : ${candidature.nom}
Prénom : ${candidature.prenom}
Téléphone : ${candidature.telephone}
Email : ${candidature.email}
Revenus mensuels nets : ${candidature.revenusMenuels} €
Peut fournir un garant : ${candidature.peutFournirGarant ? 'Oui' : 'Non'}
Remarques : ${candidature.remarques || 'Aucune remarque'}

Date de soumission : ${new Date(candidature.dateSubmission).toLocaleString('fr-FR')}
ID de candidature : ${candidature.id}

Voir toutes les candidatures (admin) : ${process.env.NEXT_PUBLIC_SITE_URL || 'https://annonces.duckdns.org'}/admin
📊 Voir le Google Sheets : ${getSheetUrlForListing(candidature.listingId)}
  `;

  const mailOptions = {
    from: process.env.EMAIL_FROM,
    to: process.env.EMAIL_TO || 'lydstyl@gmail.com',
    subject: `Nouvelle candidature - ${candidature.prenom} ${candidature.nom} - ${listingTitle}`,
    text: emailText,
    html: emailHtml,
  };

  try {
    await transporter.sendMail(mailOptions);
    console.log('Email sent successfully');
  } catch (error) {
    console.error('Error sending email:', error);
    throw new Error('Erreur lors de l\'envoi de l\'email');
  }
}
