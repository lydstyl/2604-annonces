interface VideoEmbedProps {
  videoId: string;
  title?: string;
}

export default function VideoEmbed({ videoId, title = 'Vidéo' }: VideoEmbedProps) {
  return (
    <div className="relative w-full overflow-hidden rounded-xl shadow-lg">
      <div className="relative aspect-video w-full">
        <iframe
          src={`https://www.youtube.com/embed/${videoId}`}
          title={title}
          allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
          allowFullScreen
          className="absolute inset-0 w-full h-full"
        />
      </div>
    </div>
  );
}
