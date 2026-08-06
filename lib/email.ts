import nodemailer from 'nodemailer';
import type { Candidature } from './storage';
import type { Listing } from './listings';

// Lien calendrier de réservation de visite
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

  const prixLigne =
    listing.price.rent > 0
      ? `Le loyer est de ${listing.price.rent} € + ${listing.price.charges} € de charges, soit ${listing.price.rent + listing.price.charges} €/mois.`
      : '';

  const emailText = `Bonjour ${candidature.prenom},

Je reviens vers vous suite à votre candidature pour l'appartement T3 situé à Raismes.

👉 Lien vers l'annonce : ${annonceUrl}

Votre profil correspond à ce que je recherche, je vous propose donc de visiter le logement.

Vous pouvez directement réserver un créneau de visite à votre convenance via le lien ci-dessous :
👉 Prendre rendez-vous : ${VISIT_CALENDAR_URL}

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
          <p>Je reviens vers vous suite à votre candidature pour l'appartement T3 situé à Raismes.</p>
          <p>👉 Lien vers l'annonce : <a href="${annonceUrl}">${annonceUrl}</a></p>
          <p>Votre profil correspond à ce que je recherche, je vous propose donc de visiter le logement.</p>
          <p>Vous pouvez directement réserver un créneau de visite à votre convenance via le lien ci-dessous :</p>
          <div class="cta">
            <a href="${VISIT_CALENDAR_URL}">📅 Prendre rendez-vous</a>
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
    subject: 'Visite appartement T3 Raismes — Prise de rendez-vous en ligne',
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
            <a href="https://docs.google.com/spreadsheets/d/1rZ9NOGgLcBHKwVQvtwjvB3A0k5BZ5eC46LhbMffQM50" style="background-color: #0f9d58; color: white; padding: 12px 24px; text-decoration: none; border-radius: 8px; font-weight: bold; display: inline-block;">
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
📊 Voir le Google Sheets : https://docs.google.com/spreadsheets/d/1rZ9NOGgLcBHKwVQvtwjvB3A0k5BZ5eC46LhbMffQM50
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
