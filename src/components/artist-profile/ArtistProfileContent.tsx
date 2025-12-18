import { ArtistProfile } from '@/types';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { config } from '@/config';

interface ArtistProfileContentProps {
  artist: ArtistProfile;
}

export function ArtistProfileContent({ artist }: ArtistProfileContentProps) {
  const images = artist.media.filter(m => m.type === 'image');

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
      {images.length > 0 && (
        <Card>
          <CardHeader>
             <CardTitle>Media Gallery</CardTitle>
          </CardHeader>
          <CardContent>
             <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                {images.map((img) => (
                  <div key={img._id} className="aspect-square rounded-md overflow-hidden bg-muted">
                    <img 
                      src={`${config.API_BASE_URI}${img.url}`} 
                      alt="Artist Media" 
                      className="h-full w-full object-cover hover:scale-105 transition-transform"
                    />
                  </div>
                ))}
             </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
