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
      '/images/1 800x450_191017-IMG_20191017_085354.jpg',
      '/images/2 800x450_190420-IMG_20190420_102927.jpg',
      '/images/3 800x450_190420-IMG_20190420_102730.jpg'
    ],
    videoId: 'CLYk4N3QttI',
    location: 'Raismes Centre',
    address: 'Bd Roger Claie, 59590 Raismes, France',
    mapEmbedUrl: 'https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d635.9327854818555!2d3.4846039697703786!3d50.390210298223806!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x47c2ee979f3b1fd3%3A0xb30f9e3dd17b1154!2sBd%20Roger%20Claie%2C%2059590%20Raismes!5e0!3m2!1sfr!2sfr!4v1776209220125!5m2!1sfr!2sfr',
    price: {
      rent: 610,
      charges: 35,
      deposit: 610
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
        question: 'Les animaux sont-ils acceptés ?',
        answer:
          'Les animaux de compagnie ne sont pas acceptés dans ce logement.'
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
