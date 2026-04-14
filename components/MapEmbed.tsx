'use client';

interface MapEmbedProps {
  location: string;
  embedUrl?: string; // URL iframe personnalisée (prioritaire si fournie)
  zoom?: number;
}

export default function MapEmbed({ location, embedUrl, zoom = 15 }: MapEmbedProps) {
  // Si une URL embed personnalisée est fournie, l'utiliser en priorité
  let mapSrc = embedUrl;

  // Sinon, utiliser l'ancienne logique avec ou sans API key
  if (!mapSrc) {
    const apiKey = process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY || '';
    const encodedLocation = encodeURIComponent(location);

    mapSrc = apiKey
      ? `https://www.google.com/maps/embed/v1/place?key=${apiKey}&q=${encodedLocation}&zoom=${zoom}`
      : `https://www.google.com/maps?q=${encodedLocation}&output=embed`;
  }

  return (
    <div className="relative w-full overflow-hidden rounded-xl shadow-lg">
      <div className="relative aspect-video w-full">
        <iframe
          src={mapSrc}
          title={`Carte - ${location}`}
          loading="lazy"
          allowFullScreen
          className="absolute inset-0 w-full h-full border-0"
          referrerPolicy="no-referrer-when-downgrade"
        />
      </div>
    </div>
  );
}
