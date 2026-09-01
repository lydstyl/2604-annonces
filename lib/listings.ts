import type { RdvConfig } from './rdv';

// Types pour les annonces immobilières
export interface Listing {
  id: string
  type?: string // ex: 'T2', 'T3' — utilisé dans les emails
  title: string
  surface: number // surface habitable en m²
  description: string
  images: string[]
  videoId?: string
  location: string
  address: string // Adresse complète pour Google Maps
  mapEmbedUrl?: string // URL iframe Google Maps personnalisée (optionnel)
  calendarUrl?: string // Lien agenda Google de prise de RDV (défaut : agenda T3)
  rdv?: RdvConfig // Config de créneaux de visite intégrée (module RDV) — si présente, remplace le calendrier Google
  rdvHost?: { name: string; phone: string; email?: string } // Locataire qui réalise les visites (coordonnées ajoutées à l'event calendar + notification email)
  rdvBailleur?: { name: string; phone: string; email?: string } // Bailleur (coordonnées ajoutées à l'event calendar + emails candidat)
  price: {
    rent: number
    charges: number
    deposit: number
  }
  features: string[]
  conditions: string[]
  availableFrom: string
  mediaDisclaimer?: string // Avertissement sur les photos/vidéos
  faq: Array<{
    question: string
    answer: string
  }>
}

// Données de l'annonce Raismes T3
export const listings: Record<string, Listing> = {
  'raismes-t3': {
    id: 'raismes-t3',
    type: 'T3',
    title: 'Spacieux T3 de 85 m² – Raismes Centre – Disponible fin juin 2026',
    surface: 85,
    description: `📍 Situé en plein centre de Raismes, proche de toutes commodités (commerces, gare, bus, centre commercial de Petite Forêt).`,
    images: [
      '/images/2026-04-T3/PXL_20260415_145614796_832.jpg',
      '/images/2026-04-T3/PXL_20260415_145634280_832.jpg',
      '/images/2026-04-T3/PXL_20260415_145635345_832.jpg',
      '/images/2026-04-T3/PXL_20260415_145643483_832.jpg',
      '/images/2026-04-T3/PXL_20260415_145651882_832.jpg',
      '/images/2026-04-T3/PXL_20260415_145658475_832.jpg',
      '/images/2026-04-T3/PXL_20260415_145709028_832.jpg',
      '/images/2026-04-T3/PXL_20260415_145714356_832.jpg',
      '/images/2026-04-T3/PXL_20260415_145716608_832.jpg',
      '/images/2026-04-T3/PXL_20260415_145728011_832.jpg',
      '/images/2026-04-T3/PXL_20260415_145734245_832.jpg',
      '/images/2026-04-T3/PXL_20260415_145738069_832.jpg',
      '/images/2026-04-T3/PXL_20260415_145753185_832.jpg',
      '/images/2026-04-T3/PXL_20260415_145756369_832.jpg',
      '/images/2026-04-T3/PXL_20260415_145805618_832.jpg',
      '/images/2026-04-T3/PXL_20260415_145808263_832.jpg',
      '/images/2026-04-T3/PXL_20260415_145817482_832.jpg',
      '/images/2026-04-T3/PXL_20260415_145821009_832.jpg',
      '/images/2026-04-T3/PXL_20260415_145828176_832.jpg',
      '/images/2026-04-T3/PXL_20260415_145829841_832.jpg',
      '/images/2026-04-T3/PXL_20260415_145842002_832.jpg',
      '/images/2026-04-T3/PXL_20260415_145847611_832.jpg',
      '/images/2026-04-T3/PXL_20260415_145907473_832.jpg',
      '/images/2026-04-T3/PXL_20260415_145909073_832.jpg',
      '/images/2026-04-T3/PXL_20260415_145910370_832.jpg',
      '/images/2026-04-T3/PXL_20260415_145925234_832.jpg',
      '/images/2026-04-T3/PXL_20260415_145928104_832.jpg',
      '/images/2026-04-T3/PXL_20260415_145945638_832.jpg',
      '/images/2026-04-T3/PXL_20260415_145954119_832.jpg',
      '/images/2026-04-T3/PXL_20260415_150000530_832.jpg',
      '/images/2026-04-T3/PXL_20260415_150015703_832.jpg',
      '/images/2026-04-T3/PXL_20260415_150017868_832.jpg',
      '/images/2026-04-T3/PXL_20260415_150029015_832.jpg',
      '/images/2026-04-T3/PXL_20260415_150053575_832.jpg',
      '/images/2026-04-T3/PXL_20260415_150056705_832.jpg',
      '/images/2026-04-T3/PXL_20260415_150111597_832.jpg',
      '/images/2026-04-T3/PXL_20260415_150114529_832.jpg',
      '/images/2026-04-T3/PXL_20260415_150124562_832.jpg',
      '/images/2026-04-T3/PXL_20260415_150128153_832.jpg',
      '/images/2026-04-T3/PXL_20260415_150132123_832.jpg',
      '/images/2026-04-T3/PXL_20260415_150139954_832.jpg',
      '/images/2026-04-T3/PXL_20260415_150145724_832.jpg',
      '/images/2026-04-T3/PXL_20260415_150157391_832.jpg',
      '/images/2026-04-T3/PXL_20260415_150207028_832.jpg',
      '/images/2026-04-T3/PXL_20260415_150215265_832.jpg',
      '/images/2026-04-T3/PXL_20260415_150219418_832.jpg',
      '/images/2026-04-T3/PXL_20260415_150345326_832.jpg',
      '/images/2026-04-T3/PXL_20260415_150356458_832.jpg',
      '/images/2026-04-T3/PXL_20260415_150403944_832.jpg',
      '/images/2026-04-T3/PXL_20260415_150414407_832.jpg',
      '/images/2026-04-T3/PXL_20260415_150419105_832.jpg',
      '/images/2026-04-T3/PXL_20260415_150425961_832.jpg',
      '/images/2026-04-T3/PXL_20260415_150436991_832.jpg',
      '/images/2026-04-T3/PXL_20260415_150446140_832.jpg',
      '/images/2026-04-T3/PXL_20260415_150451137_832.jpg',
      '/images/2026-04-T3/PXL_20260415_150459577_832.jpg',
      '/images/2026-04-T3/PXL_20260415_150523192_832.jpg',
      '/images/2026-04-T3/PXL_20260415_150531279_832.jpg',
      '/images/2026-04-T3/PXL_20260415_150543415_832.jpg',
      '/images/2026-04-T3/PXL_20260415_150603787_832.jpg',
      '/images/2026-04-T3/PXL_20260415_150612217_832.jpg',
      '/images/2026-04-T3/PXL_20260415_150623972_832.jpg',
      '/images/2026-04-T3/PXL_20260415_150635541_832.jpg',
    ],
    videoId: 'ZCPuhAUlrrA',
    location: 'Raismes Centre',
    address: 'Bd Roger Claie, 59590 Raismes, France',
    mapEmbedUrl: 'https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d635.9327854818555!2d3.4846039697703786!3d50.390210298223806!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x47c2ee979f3b1fd3%3A0xb30f9e3dd17b1154!2sBd%20Roger%20Claie%2C%2059590%20Raismes!5e0!3m2!1sfr!2sfr!4v1776209220125!5m2!1sfr!2sfr',
    // Module RDV visite intégré : grille EXACTE de la booking page Google de Gabriel
    // (durée 15 min, timezone Europe/Paris). schedule : clé = jour getDay JS
    // (0=dimanche … 6=samedi), valeur = plages horaires du jour (concaténées, triées).
    // Mercredi (3) : aucune plage (jour fermé). Réservation de J+1 à J+30, sans
    // availableFrom (T3 disponible immédiatement). Gabriel fait les visites → PAS de rdvHost.
    rdv: {
      durationMinutes: 15,
      schedule: {
        0: [
          { startTime: '10:40', endTime: '11:10' },
          { startTime: '18:20', endTime: '18:50' },
        ],
        1: [{ startTime: '08:40', endTime: '09:10' }],
        2: [
          { startTime: '08:40', endTime: '09:10' },
          { startTime: '18:40', endTime: '19:25' },
        ],
        3: [], // mercredi : jour fermé
        4: [{ startTime: '18:40', endTime: '19:25' }],
        5: [
          { startTime: '08:40', endTime: '09:10' },
          { startTime: '18:40', endTime: '19:25' },
        ],
        6: [
          { startTime: '10:40', endTime: '11:10' },
          { startTime: '18:20', endTime: '18:50' },
        ],
      },
      minLeadDays: 1,
      maxLeadDays: 30,
      timezone: 'Europe/Paris',
    },
    // Bailleur (coordonnées ajoutées à l'event calendar) — Gabriel fait les visites lui-même
    rdvBailleur: {
      name: 'Gabriel',
      phone: '07 81 15 45 03',
      email: 'lydstyl@gmail.com',
    },
    price: {
      rent: 630,
      charges: 48,
      deposit: 630
    },
    mediaDisclaimer: 'Les photos et vidéos ne sont pas forcément récentes. Des changements ont pu apparaître dans le logement comme une nouvelle peinture sur certains murs.',
    features: [
      'Appartement lumineux de 85 m²',
      'Grande cuisine équipée avec branchements lave-vaisselle et lave-linge',
      'Salon spacieux',
      '2 chambres confortables',
      "Salle d'eau moderne avec douche et WC",
      'Chauffage au gaz (économique et performant)',
      'Volets roulants sur toutes les fenêtres',
      'Fibre optique disponible pour un Internet haut débit',
      'Stationnement facile à proximité'
    ],
    conditions: [
      'Revenus nets ≥ 3 × le loyer charges comprises',
      "Au moins 1 CDI dans le foyer (hors période d'essai)",
      'Dossier complet demandé'
    ],
    availableFrom: 'fin juin 2026',
    faq: [
      {
        question: 'Quelles sont les conditions pour obtenir ce logement ?',
        answer:
          "Voici les conditions d'acceptation de votre dossier, telles qu'exigées par l'assurance Garantie Loyers Impayés (GLI) :\n\n**✅ Critères de solvabilité**\n• **Revenus** : le loyer charges comprises (678 €/mois) doit représenter au maximum 33 % de vos revenus nets mensuels, soit des revenus d'au moins **~2 055 €/mois**\n• **Situation professionnelle** : CDI hors période d'essai ou fonctionnaire (un CDD avec au moins 12 mois restants peut être accepté si le taux d'effort est ≤ 25 %)\n• **Allocations CAF** : prises en compte à hauteur de 50 % maximum\n• **Exclusions** : demandeur d'emploi ou bénéficiaire du RSA exclu\n\n**📄 Dossier complet à fournir**\n1. Pièce d'identité (CNI ou passeport)\n2. 3 derniers bulletins de salaire\n3. Contrat de travail\n4. Dernier avis d'imposition\n5. Justificatif de domicile actuel\n6. RIB\n\n**💡 Alternative : garantie Visale**\nSi vos revenus sont inférieurs au seuil GLI, la garantie Visale (caution gratuite d'Action Logement) peut être acceptée en alternative. Les revenus doivent alors atteindre environ **3× le loyer, soit 2 034 €/mois**."
      },
      {
        question: 'Quand puis-je visiter le logement ?',
        answer:
          'Les visites sont organisées sur rendez-vous. Après avoir soumis votre candidature, nous vous contacterons pour organiser une visite si votre profil correspond aux critères.'
      },
      {
        question: 'Quels documents dois-je fournir pour le dossier ?',
        answer:
          "Vous devrez fournir : pièce d'identité, 3 derniers bulletins de salaire, contrat de travail, avis d'imposition, justificatif de domicile actuel, et RIB."
      },
      {
        question: "Quel est le DPE (Diagnostic de Performance Énergétique) de ce logement ?",
        answer:
          "Le DPE de ce logement est classé C. Cette étiquette énergétique indique une consommation d'énergie modérée, ce qui représente un bon équilibre entre confort et efficacité énergétique. Le chauffage au gaz permet de maîtriser les coûts énergétiques."
      },
      {
        question: 'Y a-t-il un garage ?',
        answer:
          "Non, le logement ne dispose pas d'un garage privatif. En revanche, le stationnement est facile et gratuit dans la rue à proximité immédiate de l'appartement."
      },
      {
        question: 'Y a-t-il une baignoire ?',
        answer:
          "Non, il n'y a pas de baignoire, mais il y a une douche dans la salle d'eau."
      },
      {
        question: 'Y a-t-il un balcon ?',
        answer:
          'Oui, le logement dispose d\'un balcon.'
      },
      {
        question: 'Les animaux sont-ils acceptés ?',
        answer:
          'Par principe, les animaux de compagnie ne sont pas acceptés. Toutefois, le propriétaire reste ouvert à la discussion au cas par cas : les chats sont par exemple acceptés. L\'accord dépendra de la nature de l\'animal et de la solidité de votre dossier.'
      },
      {
        question: 'Y a-t-il un parking ?',
        answer:
          "Le stationnement est facile et gratuit dans la rue à proximité immédiate de l'appartement."
      },
      {
        question: 'Les charges incluent quoi ?',
        answer:
          "Les charges de 48 €/mois (pour une personne) couvrent l'eau froide (27,63 €/mois) et la taxe d'ordures ménagères (20,46 €/mois). Les charges sont sujettes à régularisation annuelle en fonction de la consommation réelle. L'électricité et le gaz restent à la charge du locataire."
      },
      {
        question: 'Quel est le montant minimum de revenus requis ?',
        answer:
          'Vos revenus nets mensuels doivent être au moins égaux à 3 fois le loyer charges comprises, soit 2 034 €/mois (678 € × 3). Si vos revenus sont inférieurs, un garant solvable peut compenser.'
      },
      {
        question: 'Le garant est-il obligatoire ?',
        answer:
          "Le garant n'est pas obligatoire si vos revenus atteignent au moins 3 fois le loyer charges comprises (2 034 €/mois). En revanche, si vos revenus sont inférieurs à ce seuil, un garant est fortement recommandé pour que votre dossier puisse être accepté."
      },
      {
        question: 'Quelles sont les superficies des pièces ?',
        answer:
          "Voici le détail des surfaces par pièce (loi Carrez) :\n\n• **Séjour** — 30,37 m²\n• **Chambre 2** — 17,81 m²\n• **Cuisine** — 11,59 m²\n• **Chambre 1** — 11,72 m²\n• **Dégagement** — 10,68 m²\n• **Salle de bain** — 3,34 m²\n\nSoit environ **85 m²** au total (surface Carrez). La surface au sol est identique pour chaque pièce."
      },
      {
        question: "Quels sont les critères et pièces demandées par l'assurance Garantie Loyers Impayés (GLI) ?",
        answer:
          "Voici ce que l'assurance GLI exigera pour accepter votre dossier :\n\n**✅ Critères obligatoires**\n• **Revenus** : loyer CC ≤ 33 % des revenus nets mensuels du foyer\n• **Solvabilité** : revenus nets ≥ 3× le loyer charges comprises (soit ~2 055 € pour 678 €/mois)\n• **Contrat de travail** : CDI hors période d'essai (ou fonctionnaire titulaire, ou CDD si revenus très confortables)\n• **Garant** (recommandé) : revenus du garant ≥ 3× le loyer\n\n**📄 Pièces à fournir**\n1. Carte d'identité ou passeport\n2. Contrat de travail + justificatif de fin de période d'essai\n3. 3 dernières fiches de paie\n4. Dernier avis d'imposition ou avis de situation\n5. Justificatif de domicile actuel\n6. RIB pour le prélèvement des loyers\n7. Si garant : sa pièce d'identité + avis d'imposition + justificatif de domicile\n\n**⚠️ Motifs de refus fréquents**\n• CDD sans CDI derrière\n• Période d'essai en cours\n• Fichage Banque de France (interdit bancaire)\n• Ratio revenus/loyer > 33 %\n• Travailleur indépendant avec moins de 2 ans d'activité (sauf bilans solides)"
      }
    ]
  },
  // T2 n°5 – 32 B rue Henri Durre, Raismes (SCI LOGIS ANGE)
  'appt5': {
    id: 'appt5',
    type: 'T2',
    title: 'T2 lumineux de 57 m² – Raismes Centre – Disponible fin octobre 2026',
    surface: 57,
    description: `📍 Situé au 32 B rue Henri Durre, en plein centre de Raismes, proche de toutes commodités (commerces, gare, bus, centre commercial de Petite Forêt).`,
    images: [
      '/images/2026-04-appt5/appt5-01.jpg',
      '/images/2026-04-appt5/appt5-02.jpg',
      '/images/2026-04-appt5/appt5-03.jpg',
      '/images/2026-04-appt5/appt5-04.jpg',
      '/images/2026-04-appt5/appt5-05.jpg',
      '/images/2026-04-appt5/appt5-06.jpg',
      '/images/2026-04-appt5/appt5-07.jpg',
      '/images/2026-04-appt5/appt5-08.jpg',
      '/images/2026-04-appt5/appt5-09.jpg',
      '/images/2026-04-appt5/appt5-10.jpg',
      '/images/2026-04-appt5/appt5-11.jpg',
      '/images/2026-04-appt5/appt5-12.jpg',
      '/images/2026-04-appt5/appt5-13.jpg',
      '/images/2026-04-appt5/appt5-14.jpg',
      '/images/2026-04-appt5/appt5-15.jpg',
    ],
    videoId: '_YqCHD4vFo8',
    location: 'Raismes',
    address: '32 B rue Henri Durre, 59590 Raismes, France',
    // Module RDV visite intégré : créneaux de 15 min, lundi à vendredi 18h30→19h30,
    // réservation de J+1 à J+21 (heure Europe/Paris), pas de visite avant le 17 août 2026
    rdv: {
      durationMinutes: 15,
      days: [1, 2, 3, 4, 5],
      startTime: '18:30',
      endTime: '19:30',
      minLeadDays: 1,
      maxLeadDays: 21,
      timezone: 'Europe/Paris',
      availableFrom: '2026-08-17',
    },
    // Bailleur (coordonnées ajoutées à l'event calendar)
    rdvBailleur: {
      name: 'Gabriel',
      phone: '07 81 15 45 03',
      email: 'lydstyl@gmail.com',
    },
    // Locataire actuel qui réalise les visites de l'appartement
    rdvHost: {
      name: 'M. Janot',
      phone: '07 68 34 97 79',
      email: 'janot59590@gmail.com',
    },
    price: {
      rent: 500,
      charges: 50,
      deposit: 500,
    },
    mediaDisclaimer:
      'La video de visite date de 2019 : elle donne une bonne idee du logement mais l appartement a pu evoluer depuis (les photos sont plus recentes).',
    features: [
      'Appartement T2 lumineux de 57 m²',
      'Cuisine équipée (9 caissons, évier, plaques de cuisson, hotte)',
      'Salon spacieux',
      '1 chambre confortable',
      "Salle d'eau avec douche et WC",
      'Chauffage individuel au gaz (économique)',
      'Fenêtres PVC double vitrage',
      'Stationnement facile et gratuit dans la rue',
      "Magasin de fruits et légumes au pied de l'immeuble, centre commercial Petite Forêt à 6 min",
      'Gare et stations de bus à proximité',
    ],
    conditions: [
      'Revenus nets ≥ 3 × le loyer charges comprises',
      "Au moins 1 CDI dans le foyer (hors période d'essai)",
      'Dossier complet demandé',
    ],
    availableFrom: 'fin octobre 2026',
    faq: [
      {
        question: 'Quelles sont les conditions pour obtenir ce logement ?',
        answer:
          "Voici les conditions d'acceptation de votre dossier, telles qu'exigées par l'assurance Garantie Loyers Impayés (GLI) :\n\n**✅ Critères de solvabilité**\n• **Revenus** : le loyer charges comprises (550 €/mois) doit représenter au maximum 33 % de vos revenus nets mensuels, soit des revenus d'au moins **~1 667 €/mois**\n• **Situation professionnelle** : CDI hors période d'essai ou fonctionnaire (un CDD avec au moins 12 mois restants peut être accepté si le taux d'effort est ≤ 25 %)\n• **Allocations CAF** : prises en compte à hauteur de 50 % maximum\n• **Exclusions** : demandeur d'emploi ou bénéficiaire du RSA exclu\n\n**📄 Dossier complet à fournir**\n1. Pièce d'identité (CNI ou passeport)\n2. 3 derniers bulletins de salaire\n3. Contrat de travail\n4. Dernier avis d'imposition\n5. Justificatif de domicile actuel\n6. RIB\n\n**💡 Alternative : garantie Visale**\nSi vos revenus sont inférieurs au seuil GLI, la garantie Visale (caution gratuite d'Action Logement) peut être acceptée en alternative. Les revenus doivent alors atteindre environ **3× le loyer, soit 1 650 €/mois**.",
      },
      {
        question: 'Quand puis-je visiter le logement ?',
        answer:
          'Les visites sont organisées sur rendez-vous. Après avoir soumis votre candidature, nous vous contacterons pour organiser une visite si votre profil correspond aux critères.',
      },
      {
        question: 'Quels documents dois-je fournir pour le dossier ?',
        answer:
          "Vous devrez fournir : pièce d'identité, 3 derniers bulletins de salaire, contrat de travail, avis d'imposition, justificatif de domicile actuel, et RIB.",
      },
      {
        question: "Quel est le DPE (Diagnostic de Performance Énergétique) de ce logement ?",
        answer:
          "Le DPE a été établi le 14/11/2024 (valable jusqu'au 13/11/2034). La consommation énergétique estimée est d'environ 22 933 kWh/an, soit des coûts annuels d'énergie estimés entre **2 040 € et 2 800 €/an** (étiquette énergétique F). Le chauffage est assuré par une chaudière individuelle au gaz.",
      },
      {
        question: 'Quelles sont les superficies des pièces ?',
        answer:
          "Voici le détail des surfaces par pièce (loi Carrez) :\n\n• **Entrée** — 10,80 m²\n• **Séjour** — 16,56 m²\n• **Chambre** — 15,67 m²\n• **Cuisine** — 9,57 m²\n• **Salle de bain** — 4,79 m²\n\nSoit **57,39 m²** au total (surface Carrez), pour 71,39 m² de surface au sol.",
      },
      {
        question: 'Y a-t-il une baignoire ?',
        answer:
          "Non, il n'y a pas de baignoire, mais il y a une douche dans la salle de bain.",
      },
      {
        question: 'Les animaux sont-ils acceptés ?',
        answer:
          "Par principe, les animaux de compagnie ne sont pas acceptés. Toutefois, le propriétaire reste ouvert à la discussion au cas par cas : les chats sont par exemple acceptés. L'accord dépendra de la nature de l'animal et de la solidité de votre dossier.",
      },
      {
        question: 'Y a-t-il un parking ?',
        answer:
          "Le stationnement est facile et gratuit dans la rue à proximité immédiate de l'appartement.",
      },
      {
        question: 'Les charges incluent quoi ?',
        answer:
          "Les charges de 50 €/mois couvrent : l'eau froide dans le logement (basée sur la consommation moyenne d'une personne, ajustable si vous êtes plus), l'entretien des parties communes (femme de ménage + électricité), et la taxe d'ordures ménagères. L'électricité et le gaz restent à la charge du locataire.",
      },
      {
        question: 'Quel est le montant minimum de revenus requis ?',
        answer:
          'Vos revenus nets mensuels doivent être au moins égaux à 3 fois le loyer charges comprises, soit 1 650 €/mois (550 € × 3). Si vos revenus sont inférieurs, un garant solvable peut compenser.',
      },
      {
        question: 'Le garant est-il obligatoire ?',
        answer:
          "Le garant n'est pas obligatoire si vos revenus atteignent au moins 3 fois le loyer charges comprises (1 650 €/mois). En revanche, si vos revenus sont inférieurs à ce seuil, un garant est fortement recommandé pour que votre dossier puisse être accepté.",
      },
    ],
  }
}

// Fonction pour récupérer une annonce par son ID
export function getListingById(id: string): Listing | undefined {
  return listings[id]
}

// Fonction pour récupérer toutes les annonces
export function getAllListings(): Listing[] {
  return Object.values(listings)
}

// Carte affichée sur la home page
export interface ListingCard {
  id: string
  href: string
  type: string
  title: string
  surface: number
  rentChargesComprises: number
  location: string
  coverImage: string | null // null si aucune photo dispo
}

// Projette les annonces en cartes pour la home page
export function getListingCards(): ListingCard[] {
  return getAllListings().map((listing) => ({
    id: listing.id,
    href: `/annonce/${listing.id}`,
    type: listing.type ?? 'Logement',
    title: listing.title,
    surface: listing.surface,
    rentChargesComprises: listing.price.rent + listing.price.charges,
    location: listing.location,
    coverImage: listing.images.length > 0 ? listing.images[0] : null,
  }))
}

// Cartes des annonces ACTIVES pour la home page : exclut les annonces en pause
// (statut persisté dans data/paused-listings.json, voir lib/pause.ts)
export function getActiveListingCards(pausedIds: string[]): ListingCard[] {
  return getListingCards().filter((card) => !pausedIds.includes(card.id))
}
