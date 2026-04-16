'use client';

import { useState, useEffect, useCallback } from 'react';

interface Candidature {
  id: string;
  listingId: string;
  nom: string;
  prenom: string;
  telephone: string;
  email: string;
  revenusMenuels: number;
  peutFournirGarant: boolean;
  remarques: string;
  dateSubmission: string;
}

export default function AdminPage() {
  const [authenticated, setAuthenticated] = useState(false);
  const [password, setPassword] = useState('');
  const [authError, setAuthError] = useState('');
  const [candidatures, setCandidatures] = useState<Candidature[]>([]);
  const [loading, setLoading] = useState(false);
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [confirmDeleteId, setConfirmDeleteId] = useState<string | null>(null);

  const fetchCandidatures = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/admin/candidatures', {
        headers: { 'x-admin-auth': password },
      });
      if (res.ok) {
        const data = await res.json();
        setCandidatures(data);
      }
    } catch (err) {
      console.error('Error fetching:', err);
    }
    setLoading(false);
  }, [password]);

  useEffect(() => {
    if (authenticated) {
      fetchCandidatures();
    }
  }, [authenticated, fetchCandidatures]);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setAuthError('');
    try {
      const res = await fetch('/api/admin/auth', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ password }),
      });
      if (res.ok) {
        setAuthenticated(true);
      } else {
        setAuthError('Mot de passe incorrect');
      }
    } catch {
      setAuthError('Erreur de connexion');
    }
  };

  const handleDelete = async (id: string) => {
    setDeletingId(id);
    try {
      const res = await fetch('/api/admin/candidatures', {
        method: 'DELETE',
        headers: {
          'Content-Type': 'application/json',
          'x-admin-auth': password,
        },
        body: JSON.stringify({ id }),
      });
      if (res.ok) {
        setCandidatures((prev) => prev.filter((c) => c.id !== id));
      }
    } catch (err) {
      console.error('Error deleting:', err);
    }
    setDeletingId(null);
    setConfirmDeleteId(null);
  };

  // Login screen
  if (!authenticated) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center px-4">
        <div className="card p-8 w-full max-w-sm">
          <div className="text-center mb-6">
            <div className="w-16 h-16 bg-primary-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <span className="text-2xl">🔒</span>
            </div>
            <h1 className="text-2xl font-bold text-gray-900">Administration</h1>
            <p className="text-gray-600 mt-1">Candidatures immobilières</p>
          </div>
          <form onSubmit={handleLogin} className="space-y-4">
            <div>
              <label htmlFor="password" className="block text-sm font-semibold text-gray-700 mb-2">
                Mot de passe
              </label>
              <input
                type="password"
                id="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                placeholder="Entrez le mot de passe"
                required
                autoFocus
              />
            </div>
            {authError && (
              <p className="text-red-600 text-sm text-center">{authError}</p>
            )}
            <button type="submit" className="w-full btn-primary">
              Connexion
            </button>
          </form>
        </div>
      </div>
    );
  }

  // Admin dashboard
  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white border-b border-gray-200 sticky top-0 z-20">
        <div className="container-custom py-4 flex items-center justify-between">
          <div>
            <h1 className="text-xl sm:text-2xl font-bold text-gray-900">📋 Candidatures</h1>
            <p className="text-sm text-gray-500">{candidatures.length} candidature{candidatures.length !== 1 ? 's' : ''}</p>
          </div>
          <div className="flex items-center gap-3">
            <button
              onClick={fetchCandidatures}
              className="text-sm px-3 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
              disabled={loading}
            >
              {loading ? '⏳' : '🔄'} Rafraîchir
            </button>
            <button
              onClick={() => { setAuthenticated(false); setPassword(''); }}
              className="text-sm px-3 py-2 border border-red-300 text-red-600 rounded-lg hover:bg-red-50 transition-colors"
            >
              Déconnexion
            </button>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="container-custom py-6">
        {loading && candidatures.length === 0 ? (
          <div className="text-center py-12 text-gray-500">
            <div className="text-4xl mb-3">⏳</div>
            <p>Chargement...</p>
          </div>
        ) : candidatures.length === 0 ? (
          <div className="text-center py-12 text-gray-500">
            <div className="text-4xl mb-3">📭</div>
            <p className="text-lg">Aucune candidature pour le moment</p>
            <p className="text-sm mt-1">Les candidatures apparaîtront ici quand quelqu&apos;un postulera</p>
          </div>
        ) : (
          <div className="space-y-3">
            {candidatures.map((c) => (
              <div key={c.id} className="card overflow-hidden">
                {/* Card header - always visible */}
                <button
                  onClick={() => setExpandedId(expandedId === c.id ? null : c.id)}
                  className="w-full text-left p-4 sm:p-5 hover:bg-gray-50 transition-colors"
                >
                  <div className="flex items-center justify-between gap-3">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="font-bold text-gray-900 text-lg">
                          {c.prenom} {c.nom}
                        </span>
                        <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${
                          c.revenusMenuels >= 1935
                            ? 'bg-green-100 text-green-800'
                            : c.revenusMenuels >= 1500
                            ? 'bg-yellow-100 text-yellow-800'
                            : 'bg-red-100 text-red-800'
                        }`}>
                          {c.revenusMenuels.toLocaleString('fr-FR')} €/mois
                        </span>
                        {c.peutFournirGarant && (
                          <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                            Garant ✓
                          </span>
                        )}
                      </div>
                      <div className="text-sm text-gray-500 mt-1">
                        {c.listingId === 'raismes-t3' ? 'T3 Raismes' : c.listingId} • {new Date(c.dateSubmission).toLocaleDateString('fr-FR', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' })}
                      </div>
                    </div>
                    <span className="text-gray-400 text-xl flex-shrink-0">
                      {expandedId === c.id ? '▲' : '▼'}
                    </span>
                  </div>
                </button>

                {/* Expanded details */}
                {expandedId === c.id && (
                  <div className="border-t border-gray-100 p-4 sm:p-5 bg-gray-50">
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-4">
                      <div>
                        <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide">Téléphone</p>
                        <a href={`tel:${c.telephone}`} className="text-primary-600 hover:underline font-medium">{c.telephone}</a>
                      </div>
                      <div>
                        <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide">Email</p>
                        <a href={`mailto:${c.email}`} className="text-primary-600 hover:underline font-medium text-sm break-all">{c.email}</a>
                      </div>
                      <div>
                        <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide">Revenus mensuels nets</p>
                        <p className="font-medium">{c.revenusMenuels.toLocaleString('fr-FR')} €</p>
                        <p className={`text-xs mt-0.5 ${
                          c.revenusMenuels >= 1935 ? 'text-green-600' : 'text-red-600'
                        }`}>
                          {c.revenusMenuels >= 1935
                            ? `≥ 3× loyer CC (1 935 €) ✓`
                            : `< 3× loyer CC (1 935 €) — ${Math.round((c.revenusMenuels / 1935) * 100)}% du seuil`}
                        </p>
                      </div>
                      <div>
                        <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide">Garant</p>
                        <p className="font-medium">{c.peutFournirGarant ? 'Oui ✓' : 'Non ✗'}</p>
                      </div>
                    </div>
                    {c.remarques && (
                      <div className="mb-4">
                        <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide">Remarques</p>
                        <p className="text-gray-700 mt-1 whitespace-pre-wrap">{c.remarques}</p>
                      </div>
                    )}
                    <div className="flex items-center justify-between pt-3 border-t border-gray-200">
                      <p className="text-xs text-gray-400">
                        Soumis le {new Date(c.dateSubmission).toLocaleString('fr-FR')}
                      </p>
                      {confirmDeleteId === c.id ? (
                        <div className="flex items-center gap-2">
                          <span className="text-sm text-red-600 font-medium">Supprimer ?</span>
                          <button
                            onClick={() => handleDelete(c.id)}
                            disabled={deletingId === c.id}
                            className="text-sm px-3 py-1.5 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors disabled:opacity-50"
                          >
                            {deletingId === c.id ? '⏳' : 'Oui'}
                          </button>
                          <button
                            onClick={() => setConfirmDeleteId(null)}
                            className="text-sm px-3 py-1.5 border border-gray-300 rounded-lg hover:bg-gray-100 transition-colors"
                          >
                            Non
                          </button>
                        </div>
                      ) : (
                        <button
                          onClick={() => setConfirmDeleteId(c.id)}
                          className="text-sm px-3 py-1.5 border border-red-300 text-red-600 rounded-lg hover:bg-red-50 transition-colors"
                        >
                          🗑️ Supprimer
                        </button>
                      )}
                    </div>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
