// Types pour les annonces immobilières
export interface Listing {
  id: string
  title: string
  description: string
  images: string[]
  videoId?: string
  location: string
  address: string // Adresse complète pour Google Maps
  mapEmbedUrl?: string // URL iframe Google Maps personnalisée (optionnel)
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
    title: 'Spacieux T3 de 85 m² – Raismes Centre – Disponible de suite',
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
    price: {
      rent: 630,
      charges: 35,
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
    availableFrom: 'aujourd’hui',
    faq: [
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
          "Les charges de 35€/mois couvrent l'entretien des parties communes et l'eau. L'électricité et le gaz sont à la charge du locataire."
      },
      {
        question: 'Quel est le montant minimum de revenus requis ?',
        answer:
          'Vos revenus nets mensuels doivent être au moins égaux à 3 fois le loyer charges comprises, soit 1 935 €/mois (665 € × 3). Si vos revenus sont inférieurs, un garant solvable peut compenser.'
      },
      {
        question: 'Le garant est-il obligatoire ?',
        answer:
          "Le garant n'est pas obligatoire si vos revenus atteignent au moins 3 fois le loyer charges comprises (1 935 €/mois). En revanche, si vos revenus sont inférieurs à ce seuil, un garant est fortement recommandé pour que votre dossier puisse être accepté."
      }
    ]
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
