'use client';

import { useState, FormEvent } from 'react';
import { useRouter } from 'next/navigation';

interface ApplicationFormProps {
  listingId: string;
  listingTitle: string;
}

export default function ApplicationForm({ listingId, listingTitle }: ApplicationFormProps) {
  const router = useRouter();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [formData, setFormData] = useState({
    nom: '',
    prenom: '',
    telephone: '',
    email: '',
    revenusMenuels: '',
    peutFournirGarant: false,
    cdiPlus3Mois: false,
    dateAmenagement: '',
    remarques: '',
  });

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>
  ) => {
    const { name, value, type } = e.target;
    const checked = (e.target as HTMLInputElement).checked;

    setFormData((prev) => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value,
    }));
  };

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    setError(null);

    try {
      const response = await fetch(`/api/candidatures/${listingId}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(formData),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Une erreur est survenue');
      }

      // Redirection vers page de confirmation
      router.push(`/candidature/${listingId}/confirmation?nom=${encodeURIComponent(formData.prenom)}`);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Une erreur est survenue');
      setIsSubmitting(false);
    }
  };

  return (
    <div className="card p-6 sm:p-8">
      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Nom et Prénom */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
          <div>
            <label htmlFor="nom" className="block text-sm font-semibold text-gray-700 mb-2">
              Nom <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              id="nom"
              name="nom"
              required
              value={formData.nom}
              onChange={handleChange}
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
              placeholder="Votre nom"
            />
          </div>

          <div>
            <label htmlFor="prenom" className="block text-sm font-semibold text-gray-700 mb-2">
              Prénom <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              id="prenom"
              name="prenom"
              required
              value={formData.prenom}
              onChange={handleChange}
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
              placeholder="Votre prénom"
            />
          </div>
        </div>

        {/* Téléphone et Email */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
          <div>
            <label htmlFor="telephone" className="block text-sm font-semibold text-gray-700 mb-2">
              Téléphone <span className="text-red-500">*</span>
            </label>
            <input
              type="tel"
              id="telephone"
              name="telephone"
              required
              value={formData.telephone}
              onChange={handleChange}
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
              placeholder="06 12 34 56 78"
            />
          </div>

          <div>
            <label htmlFor="email" className="block text-sm font-semibold text-gray-700 mb-2">
              Email <span className="text-red-500">*</span>
            </label>
            <input
              type="email"
              id="email"
              name="email"
              required
              value={formData.email}
              onChange={handleChange}
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
              placeholder="votre@email.fr"
            />
          </div>
        </div>

        {/* Revenus mensuels */}
        <div>
          <label htmlFor="revenusMenuels" className="block text-sm font-semibold text-gray-700 mb-2">
            Revenus mensuels nets (en €) <span className="text-red-500">*</span>
          </label>
          <input
            type="number"
            id="revenusMenuels"
            name="revenusMenuels"
            required
            min="0"
            step="0.01"
            value={formData.revenusMenuels}
            onChange={handleChange}
            className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
            placeholder="2000"
          />
          <p className="text-xs text-gray-500 mt-1">Incluez votre salaire net, les aides (CAF, etc.) et tout autre revenu régulier</p>
        </div>

        {/* CDI + Garant */}
        <div className="space-y-3">
          <div className="flex items-start">
            <input
              type="checkbox"
              id="cdiPlus3Mois"
              name="cdiPlus3Mois"
              checked={formData.cdiPlus3Mois}
              onChange={handleChange}
              className="mt-1 h-5 w-5 text-primary-600 border-gray-300 rounded focus:ring-primary-500"
            />
            <label htmlFor="cdiPlus3Mois" className="ml-3 text-gray-700">
              Je suis en CDI depuis plus de 3 mois (hors période d&apos;essai)
            </label>
          </div>

          <div className="flex items-start">
            <input
              type="checkbox"
              id="peutFournirGarant"
              name="peutFournirGarant"
              checked={formData.peutFournirGarant}
              onChange={handleChange}
              className="mt-1 h-5 w-5 text-primary-600 border-gray-300 rounded focus:ring-primary-500"
            />
            <label htmlFor="peutFournirGarant" className="ml-3 text-gray-700">
              Je peux fournir un garant ou une garantie
            </label>
          </div>
        </div>

        {/* Date d'aménagement souhaitée */}
        <div>
          <label htmlFor="dateAmenagement" className="block text-sm font-semibold text-gray-700 mb-2">
            Date d&apos;aménagement souhaitée
          </label>
          <input
            type="date"
            id="dateAmenagement"
            name="dateAmenagement"
            value={formData.dateAmenagement}
            onChange={handleChange}
            className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
          />
        </div>

        {/* Remarques */}
        <div>
          <label htmlFor="remarques" className="block text-sm font-semibold text-gray-700 mb-2">
            Remarques / Informations complémentaires
          </label>
          <textarea
            id="remarques"
            name="remarques"
            rows={4}
            value={formData.remarques}
            onChange={handleChange}
            className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
            placeholder="Parlez-nous de votre situation, vos motivations..."
          />
        </div>

        {/* Message d'erreur */}
        {error && (
          <div className="p-4 bg-red-50 border border-red-200 rounded-lg">
            <p className="text-red-700">{error}</p>
          </div>
        )}

        {/* Bouton de soumission */}
        <button
          type="submit"
          disabled={isSubmitting}
          className="w-full btn-primary disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {isSubmitting ? 'Envoi en cours...' : 'Envoyer ma candidature'}
        </button>

        <p className="text-sm text-gray-500 text-center">
          En soumettant ce formulaire, vous acceptez d'être contacté concernant cette candidature.
        </p>
      </form>
    </div>
  );
}
