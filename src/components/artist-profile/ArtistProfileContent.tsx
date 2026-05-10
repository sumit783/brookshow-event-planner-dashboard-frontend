import { ArtistProfile } from '@/types';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { config } from '@/config';

interface ArtistProfileContentProps {
  artist: ArtistProfile;
}

export function ArtistProfileContent({ artist }: ArtistProfileContentProps) {
  const mediaItems = artist.media;

  return (
    <div className="space-y-6">
      {/* Bio */}
      <Card>
        <CardHeader>
          <CardTitle>About</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-muted-foreground leading-relaxed whitespace-pre-wrap">
            {artist.bio || "No bio available."}
          </p>
        </CardContent>
      </Card>

      {/* Gallery */}
      {mediaItems.length > 0 && (
        <Card>
          <CardHeader>
             <CardTitle>Media Gallery</CardTitle>
          </CardHeader>
          <CardContent>
             <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                {mediaItems.map((media) => (
                  <div key={media._id} className="aspect-square rounded-md overflow-hidden bg-muted relative group">
                    {media.type === 'video' ? (
                      <video
                        src={media.url.startsWith('http') ? media.url : `${config.API_BASE_URI}${media.url}`}
                        className="h-full w-full object-cover"
                        controls
                        preload="none"
                      />
                    ) : (
                      <img 
                        src={media.url.startsWith('http') ? media.url : `${config.API_BASE_URI}${media.url}`} 
                        alt="Artist Media" 
                        loading="lazy"
                        className="h-full w-full object-cover hover:scale-105 transition-transform"
                      />
                    )}
                  </div>
                ))}
             </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
