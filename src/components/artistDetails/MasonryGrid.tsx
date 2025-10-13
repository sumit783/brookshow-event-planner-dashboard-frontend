import { Play } from 'lucide-react';

interface MasonryGridProps {
  images: string[];
  videos?: string[];
}

export function MasonryGrid({ images, videos = [] }: MasonryGridProps) {
  const allMedia = [
    ...images.map(img => ({ type: 'image' as const, src: img })),
    ...videos.map(vid => ({ type: 'video' as const, src: vid })),
  ];

  return (
    <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
      {allMedia.slice(0, 12).map((media, index) => (
        <div
          key={index}
          className={`group relative overflow-hidden rounded-xl shadow-medium hover:shadow-glow transition-all duration-500 hover:scale-105 ${
            index % 5 === 0 ? 'md:col-span-2 md:row-span-2' : ''
          }`}
          style={{
            aspectRatio: index % 5 === 0 ? '1/1' : '4/3'
          }}
        >
          <img
            src={media.src}
            alt={`Portfolio ${index + 1}`}
            className="w-full h-full object-cover"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
          
          {media.type === 'video' && (
            <div className="absolute inset-0 flex items-center justify-center">
              <div className="w-16 h-16 rounded-full bg-white/20 backdrop-blur-sm flex items-center justify-center group-hover:scale-110 transition-transform">
                <Play className="w-8 h-8 text-white fill-white" />
              </div>
            </div>
          )}
        </div>
      ))}
    </div>
  );
}
