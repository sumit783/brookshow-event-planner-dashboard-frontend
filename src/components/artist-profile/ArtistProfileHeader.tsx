import { MapPin, Star, BadgeCheck } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { ArtistProfile } from '@/types';
import { config } from '@/config';

interface ArtistProfileHeaderProps {
  artist: ArtistProfile;
}

export function ArtistProfileHeader({ artist }: ArtistProfileHeaderProps) {
  const imageUrl = artist.media.find(m => m.isCover)?.url || artist.profileImage;
  const fullImageUrl = imageUrl ? `${config.API_BASE_URI}${imageUrl}` : null;

  return (
    <div className="relative h-64 md:h-80 w-full overflow-hidden rounded-xl">
      {/* Background Image/Blur */}
      <div className="absolute inset-0 bg-primary/10">
        {fullImageUrl && (
          <img 
            src={fullImageUrl} 
            alt={artist.userId?.displayName} 
            className="h-full w-full object-cover blur-sm opacity-50"
          />
        )}
        <div className="absolute inset-0 bg-gradient-to-t from-black/80 to-transparent" />
      </div>

      {/* Content */}
      <div className="absolute bottom-0 left-0 p-6 md:p-8 w-full">
        <div className="flex flex-col md:flex-row gap-6 items-end">
          {/* Profile Image */}
          <div className="h-24 w-24 md:h-32 md:w-32 rounded-full border-4 border-background overflow-hidden shadow-xl bg-background">
             {fullImageUrl ? (
                <img src={fullImageUrl} alt={artist.userId?.displayName} className="h-full w-full object-cover" />
             ) : (
                <div className="h-full w-full flex items-center justify-center bg-muted text-muted-foreground text-3xl font-bold">
                  {artist.userId?.displayName.charAt(0)}
                </div>
             )}
          </div>

          {/* Details */}
          <div className="flex-1 text-white space-y-2 mb-2">
             <div className="flex items-center gap-2">
               <h1 className="text-3xl md:text-4xl font-bold">{artist.userId?.displayName}</h1>
               {artist.isVerified && <BadgeCheck className="h-6 w-6 text-blue-400" />}
             </div>
             
             <div className="flex flex-wrap gap-3 text-sm md:text-base text-gray-200">
               {artist.category.map((cat, i) => (
                 <Badge key={i} variant="secondary" className="bg-white/20 hover:bg-white/30 text-white border-none">{cat}</Badge>
               ))}
               <div className="flex items-center gap-1">
                 <MapPin className="h-4 w-4" />
                 {artist.location?.city}, {artist.location?.state}
               </div>
             </div>
          </div>
        </div>
      </div>
    </div>
  );
}
