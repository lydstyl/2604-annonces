'use client';

import { useState, useEffect, useCallback } from 'react';

// Types
interface Candidature {
  id: string;
  listingId: string;
  nom: string;
  prenom: string;
  telephone: string;
  email: string;
  revenusMenuels: number;
  peutFournirGarant: boolean;
  cdiPlus3Mois?: boolean;
  dateAmenagement?: string;
  remarques: string;
  dateSubmission: string;
  source?: string;
  pseudoSource?: string;
  sourceId?: string;
  statut?: string;
}

interface Lead {
  id: string;
  pseudo: string;
  source: string;
  message: string;
  annonceId: string;
  dateMessage: string;
  emailId?: string;
  repondu: boolean;
  dateReponse?: string;
  candidatureId?: string;
  statut: string;
}

type Tab = 'candidatures' | 'leads';

// Source badge colors
const sourceBadge: Record<string, { bg: string; text: string; label: string }> = {
  leboncoin: { bg: 'bg-orange-100', text: 'text-orange-800', label: '🟠 LeBonCoin' },
  facebook: { bg: 'bg-blue-100', text: 'text-blue-800', label: '🔵 Facebook' },
  formulaire: { bg: 'bg-green-100', text: 'text-green-800', label: '🟢 Formulaire' },
  autre: { bg: 'bg-gray-100', text: 'text-gray-800', label: '⚪ Autre' },
};

// Statut badge colors for leads
const leadStatutBadge: Record<string, { bg: string; text: string; label: string }> = {
  nouveau: { bg: 'bg-yellow-100', text: 'text-yellow-800', label: '🟡 Nouveau' },
  repondu: { bg: 'bg-blue-100', text: 'text-blue-800', label: '🔵 Répondu' },
  converti: { bg: 'bg-green-100', text: 'text-green-800', label: '🟢 Converti' },
  perdu: { bg: 'bg-red-100', text: 'text-red-800', label: '🔴 Perdu' },
};

// Statut badge colors for candidatures
const candidatureStatutBadge: Record<string, { bg: string; text: string; label: string }> = {
  nouveau: { bg: 'bg-yellow-100', text: 'text-yellow-800', label: 'Nouveau' },
  contacte: { bg: 'bg-blue-100', text: 'text-blue-800', label: 'Contacté' },
  formulaire_recu: { bg: 'bg-indigo-100', text: 'text-indigo-800', label: 'Formulaire reçu' },
  en_etude: { bg: 'bg-purple-100', text: 'text-purple-800', label: 'En étude' },
  visite_planifiee: { bg: 'bg-cyan-100', text: 'text-cyan-800', label: 'Visite planifiée' },
  accepte: { bg: 'bg-green-100', text: 'text-green-800', label: 'Accepté' },
  refuse: { bg: 'bg-red-100', text: 'text-red-800', label: 'Refusé' },
};

export default function AdminPage() {
  const [authenticated, setAuthenticated] = useState(false);
  const [password, setPassword] = useState('');
  const [authError, setAuthError] = useState('');
  const [candidatures, setCandidatures] = useState<Candidature[]>([]);
  const [leads, setLeads] = useState<Lead[]>([]);
  const [loading, setLoading] = useState(false);
  const [activeTab, setActiveTab] = useState<Tab>('leads');
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [expandedLeadId, setExpandedLeadId] = useState<string | null>(null);
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
      console.error('Error fetching candidatures:', err);
    }
    setLoading(false);
  }, [password]);

  const fetchLeads = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/admin/leads', {
        headers: { 'x-admin-auth': password },
      });
      if (res.ok) {
        const data = await res.json();
        setLeads(data);
      }
    } catch (err) {
      console.error('Error fetching leads:', err);
    }
    setLoading(false);
  }, [password]);

  const fetchData = useCallback(() => {
    if (activeTab === 'candidatures') fetchCandidatures();
    else fetchLeads();
  }, [activeTab, fetchCandidatures, fetchLeads]);

  useEffect(() => {
    if (authenticated) {
      fetchData();
    }
  }, [authenticated, fetchData]);

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

  const handleDeleteCandidature = async (id: string) => {
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

  const handleDeleteLead = async (id: string) => {
    setDeletingId(id);
    try {
      const res = await fetch('/api/admin/leads', {
        method: 'DELETE',
        headers: {
          'Content-Type': 'application/json',
          'x-admin-auth': password,
        },
        body: JSON.stringify({ id }),
      });
      if (res.ok) {
        setLeads((prev) => prev.filter((l) => l.id !== id));
      }
    } catch (err) {
      console.error('Error deleting lead:', err);
    }
    setDeletingId(null);
    setConfirmDeleteId(null);
  };

  const handleUpdateLeadStatut = async (id: string, statut: string) => {
    try {
      const res = await fetch('/api/admin/leads', {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          'x-admin-auth': password,
        },
        body: JSON.stringify({ id, statut }),
      });
      if (res.ok) {
        const updated = await res.json();
        setLeads((prev) => prev.map((l) => (l.id === id ? updated : l)));
      }
    } catch (err) {
      console.error('Error updating lead:', err);
    }
  };

  const handleUpdateCandidatureStatut = async (id: string, statut: string) => {
    try {
      const res = await fetch('/api/admin/candidatures', {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          'x-admin-auth': password,
        },
        body: JSON.stringify({ id, statut }),
      });
      if (res.ok) {
        const updated = await res.json();
        setCandidatures((prev) => prev.map((c) => (c.id === id ? updated : c)));
      }
    } catch (err) {
      console.error('Error updating candidature:', err);
    }
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
            <h1 className="text-xl sm:text-2xl font-bold text-gray-900">📋 Administration</h1>
          </div>
          <div className="flex items-center gap-3">
            <button
              onClick={fetchData}
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

        {/* Tabs */}
        <div className="container-custom flex gap-1 pb-2">
          <button
            onClick={() => { setActiveTab('leads'); setExpandedId(null); setExpandedLeadId(null); }}
            className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
              activeTab === 'leads'
                ? 'bg-primary-100 text-primary-800'
                : 'text-gray-600 hover:bg-gray-100'
            }`}
          >
            💬 Leads ({leads.length})
          </button>
          <button
            onClick={() => { setActiveTab('candidatures'); setExpandedId(null); setExpandedLeadId(null); }}
            className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
              activeTab === 'candidatures'
                ? 'bg-primary-100 text-primary-800'
                : 'text-gray-600 hover:bg-gray-100'
            }`}
          >
            📋 Candidatures ({candidatures.length})
          </button>
        </div>
      </div>

      {/* Content */}
      <div className="container-custom py-6">
        {loading && (activeTab === 'leads' ? leads.length === 0 : candidatures.length === 0) ? (
          <div className="text-center py-12 text-gray-500">
            <div className="text-4xl mb-3">⏳</div>
            <p>Chargement...</p>
          </div>
        ) : activeTab === 'leads' ? (
          // ============ LEADS TAB ============
          leads.length === 0 ? (
            <div className="text-center py-12 text-gray-500">
              <div className="text-4xl mb-3">📭</div>
              <p className="text-lg">Aucun lead pour le moment</p>
              <p className="text-sm mt-1">Les messages LeBonCoin, Facebook, etc. apparaîtront ici</p>
            </div>
          ) : (
            <div className="space-y-3">
              {leads.map((l) => {
                const src = sourceBadge[l.source] || sourceBadge.autre;
                const st = leadStatutBadge[l.statut] || leadStatutBadge.nouveau;
                return (
                  <div key={l.id} className="card overflow-hidden">
                    {/* Card header */}
                    <button
                      onClick={() => setExpandedLeadId(expandedLeadId === l.id ? null : l.id)}
                      className="w-full text-left p-4 sm:p-5 hover:bg-gray-50 transition-colors"
                    >
                      <div className="flex items-center justify-between gap-3">
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 flex-wrap">
                            <span className="font-bold text-gray-900 text-lg">{l.pseudo}</span>
                            <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${src.bg} ${src.text}`}>
                              {src.label}
                            </span>
                            <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${st.bg} ${st.text}`}>
                              {st.label}
                            </span>
                            {l.repondu && (
                              <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
                                ✉️ Répondu
                              </span>
                            )}
                          </div>
                          <div className="text-sm text-gray-500 mt-1">
                            {l.annonceId === 'raismes-t3' ? 'T3 Raismes' : l.annonceId} • {new Date(l.dateMessage).toLocaleDateString('fr-FR', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' })}
                          </div>
                          <p className="text-sm text-gray-600 mt-1 line-clamp-2">{l.message}</p>
                        </div>
                        <span className="text-gray-400 text-xl flex-shrink-0">
                          {expandedLeadId === l.id ? '▲' : '▼'}
                        </span>
                      </div>
                    </button>

                    {/* Expanded details */}
                    {expandedLeadId === l.id && (
                      <div className="border-t border-gray-100 p-4 sm:p-5 bg-gray-50">
                        <div className="mb-4">
                          <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide">Message</p>
                          <p className="text-gray-700 mt-1 whitespace-pre-wrap">{l.message}</p>
                        </div>

                        {l.candidatureId && (
                          <div className="mb-4">
                            <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide">Candidature liée</p>
                            <p className="text-primary-600 text-sm font-medium">{l.candidatureId}</p>
                          </div>
                        )}

                        {l.emailId && (
                          <div className="mb-4">
                            <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide">Email ID</p>
                            <p className="text-gray-500 text-xs font-mono">{l.emailId}</p>
                          </div>
                        )}

                        {/* Status selector */}
                        <div className="mb-4">
                          <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-2">Statut</p>
                          <select
                            value={l.statut}
                            onChange={(e) => handleUpdateLeadStatut(l.id, e.target.value)}
                            className="text-sm px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500"
                          >
                            <option value="nouveau">🟡 Nouveau</option>
                            <option value="repondu">🔵 Répondu</option>
                            <option value="converti">🟢 Converti</option>
                            <option value="perdu">🔴 Perdu</option>
                          </select>
                        </div>

                        <div className="flex items-center justify-between pt-3 border-t border-gray-200">
                          <p className="text-xs text-gray-400">
                            Reçu le {new Date(l.dateMessage).toLocaleString('fr-FR')}
                            {l.dateReponse && ` • Répondu le ${new Date(l.dateReponse).toLocaleString('fr-FR')}`}
                          </p>
                          {confirmDeleteId === l.id ? (
                            <div className="flex items-center gap-2">
                              <span className="text-sm text-red-600 font-medium">Supprimer ?</span>
                              <button
                                onClick={() => handleDeleteLead(l.id)}
                                disabled={deletingId === l.id}
                                className="text-sm px-3 py-1.5 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors disabled:opacity-50"
                              >
                                {deletingId === l.id ? '⏳' : 'Oui'}
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
                              onClick={() => setConfirmDeleteId(l.id)}
                              className="text-sm px-3 py-1.5 border border-red-300 text-red-600 rounded-lg hover:bg-red-50 transition-colors"
                            >
                              🗑️ Supprimer
                            </button>
                          )}
                        </div>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          )
        ) : (
          // ============ CANDIDATURES TAB ============
          candidatures.length === 0 ? (
            <div className="text-center py-12 text-gray-500">
              <div className="text-4xl mb-3">📭</div>
              <p className="text-lg">Aucune candidature pour le moment</p>
              <p className="text-sm mt-1">Les candidatures apparaîtront ici quand quelqu&apos;un postulera</p>
            </div>
          ) : (
            <div className="space-y-3">
              {candidatures.map((c) => {
                const cst = c.statut ? (candidatureStatutBadge[c.statut] || candidatureStatutBadge.nouveau) : null;
                const csrc = c.source ? (sourceBadge[c.source] || sourceBadge.autre) : null;
                return (
                  <div key={c.id} className="card overflow-hidden">
                    {/* Card header */}
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
                            {c.cdiPlus3Mois && (
                              <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-purple-100 text-purple-800">
                                CDI &gt; 3 mois ✓
                              </span>
                            )}
                            {csrc && (
                              <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${csrc.bg} ${csrc.text}`}>
                                {csrc.label}
                              </span>
                            )}
                            {c.pseudoSource && (
                              <span className="text-xs text-gray-500">via {c.pseudoSource}</span>
                            )}
                            {cst && (
                              <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${cst.bg} ${cst.text}`}>
                                {cst.label}
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
                          <div>
                            <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide">CDI &gt; 3 mois</p>
                            <p className="font-medium">{c.cdiPlus3Mois ? 'Oui ✓' : 'Non ✗'}</p>
                          </div>
                          {c.dateAmenagement && (
                            <div>
                              <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide">Date d&apos;aménagement souhaitée</p>
                              <p className="font-medium">{new Date(c.dateAmenagement).toLocaleDateString('fr-FR')}</p>
                            </div>
                          )}
                        </div>

                        {/* Status selector for candidature */}
                        <div className="mb-4">
                          <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-2">Statut</p>
                          <select
                            value={c.statut || 'nouveau'}
                            onChange={(e) => handleUpdateCandidatureStatut(c.id, e.target.value)}
                            className="text-sm px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500"
                          >
                            <option value="nouveau">Nouveau</option>
                            <option value="contacte">Contacté</option>
                            <option value="formulaire_recu">Formulaire reçu</option>
                            <option value="en_etude">En étude</option>
                            <option value="visite_planifiee">Visite planifiée</option>
                            <option value="accepte">Accepté</option>
                            <option value="refuse">Refusé</option>
                          </select>
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
                                onClick={() => handleDeleteCandidature(c.id)}
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
                );
              })}
            </div>
          )
        )}
      </div>
    </div>
  );
}
