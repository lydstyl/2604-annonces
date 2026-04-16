import nodemailer from 'nodemailer';
import type { Candidature } from './storage';

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

          <div style="margin-top: 25px; text-align: center;">
            <a href="${process.env.NEXT_PUBLIC_SITE_URL || 'https://annonces.duckdns.org'}/admin" style="background-color: #0284c7; color: white; padding: 12px 24px; text-decoration: none; border-radius: 8px; font-weight: bold; display: inline-block;">
              📋 Voir toutes les candidatures
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

Voir toutes les candidatures : ${process.env.NEXT_PUBLIC_SITE_URL || 'https://annonces.duckdns.org'}/admin
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
