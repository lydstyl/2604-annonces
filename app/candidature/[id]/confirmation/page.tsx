import Link from 'next/link';
import { Suspense } from 'react';

function ConfirmationContent({ searchParams }: { searchParams: { nom?: string } }) {
  const nom = searchParams.nom || 'Candidat';

  return (
    <div className="min-h-screen bg-gray-50 py-16">
      <div className="container-custom max-w-2xl">
        <div className="card p-8 text-center">
          {/* Icône de succès */}
          <div className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-6">
            <svg className="w-10 h-10 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
            </svg>
          </div>

          {/* Message de confirmation */}
          <h1 className="text-3xl font-bold text-gray-900 mb-4">
            Merci {nom} !
          </h1>
          <p className="text-lg text-gray-600 mb-8">
            Votre candidature a bien été envoyée. Nous avons reçu vos informations et vous contacterons rapidement par email ou téléphone.
          </p>

          <div className="bg-blue-50 border border-blue-200 rounded-lg p-6 mb-8 text-left">
            <h2 className="font-bold text-gray-900 mb-2">📧 Prochaines étapes</h2>
            <ul className="space-y-2 text-gray-700">
              <li className="flex items-start">
                <span className="text-blue-600 mr-2">1.</span>
                <span>Nous étudions votre candidature</span>
              </li>
              <li className="flex items-start">
                <span className="text-blue-600 mr-2">2.</span>
                <span>Si votre profil correspond, nous vous contacterons pour organiser une visite</span>
              </li>
              <li className="flex items-start">
                <span className="text-blue-600 mr-2">3.</span>
                <span>Vous devrez ensuite fournir un dossier complet</span>
              </li>
            </ul>
          </div>

          <Link
            href="/"
            className="inline-block btn-primary"
          >
            Retour à l'annonce
          </Link>
        </div>
      </div>
    </div>
  );
}

export default async function ConfirmationPage({
  searchParams,
}: {
  searchParams: Promise<{ nom?: string }>;
}) {
  const resolvedParams = await searchParams;

  return (
    <Suspense fallback={<div>Chargement...</div>}>
      <ConfirmationContent searchParams={resolvedParams} />
    </Suspense>
  );
}
