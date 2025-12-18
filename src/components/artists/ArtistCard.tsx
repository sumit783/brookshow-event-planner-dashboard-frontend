import { MapPin, Star, Users, ArrowRight } from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Artist } from '@/types';
import { config } from '@/config';
import { Link } from 'react-router-dom';

interface ArtistCardProps {
  artist: Artist;
}

export function ArtistCard({ artist }: ArtistCardProps) {
  // Construct image URL properly
  const imageUrl = artist.image ? `${config.API_BASE_URI}${artist.image}` : null;

  return (
    <Card className="group overflow-hidden border-none shadow-lg bg-card/50 backdrop-blur-sm transition-all hover:scale-[1.02] hover:shadow-xl hover:bg-card/80">
      {/* Artist Image & Gradient Overlay */}
      <div className="relative h-56 overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent z-10" />
        {imageUrl ? (
          <img 
            src={imageUrl} 
            alt={artist.name} 
            className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-110" 
          />
        ) : (
          <div className="flex h-full items-center justify-center bg-muted">
            <Users className="h-16 w-16 text-muted-foreground/30" />
          </div>
        )}
        
        {/* Floating Content on Image */}
        <div className="absolute top-3 right-3 z-20">
           {artist.rating > 0 && (
            <Badge className="bg-yellow-500/90 text-white border-none shadow-sm backdrop-blur-md">
              <Star className="mr-1 h-3 w-3 fill-current" />
              {artist.rating}
            </Badge>
           )}
        </div>
        
        <div className="absolute bottom-4 left-4 z-20 text-white">
           <h3 className="font-bold text-lg leading-tight mb-1">{artist.name}</h3>
           <Badge variant="secondary" className="bg-white/20 hover:bg-white/30 text-white border-none backdrop-blur-md text-xs">
             {artist.category}
           </Badge>
        </div>
      </div>

      <CardContent className="p-4 space-y-4">
        <div className="flex items-center text-sm text-muted-foreground">
          <MapPin className="h-4 w-4 mr-1 text-primary" />
          {artist.location}
        </div>

        {/* Specialties Chips */}
        {artist.specialties && artist.specialties.length > 0 && (
           <div className="flex flex-wrap gap-1.5">
             {artist.specialties.slice(0, 3).map((spec, i) => (
               <span key={i} className="text-[10px] uppercase tracking-wider font-semibold bg-primary/5 text-primary px-2 py-1 rounded-sm">
                 {spec}
               </span>
             ))}
             {artist.specialties.length > 3 && (
               <span className="text-[10px] text-muted-foreground px-1 py-1">+{artist.specialties.length - 3}</span>
             )}
           </div>
        )}
        
        <div className="flex items-end justify-between pt-2">
          <div>
            <p className="text-xs text-muted-foreground uppercase tracking-wide">Starting from</p>
            <p className="text-xl font-bold text-primary">
              ₹{artist.price.toLocaleString()}
            </p>
          </div>
          
          <Button asChild size="sm" className="rounded-full px-4 group-hover:bg-primary group-hover:text-primary-foreground transition-colors">
            <Link to={`/artists/${artist.id}`}>
              View Details <ArrowRight className="ml-2 h-3 w-3 group-hover:translate-x-1 transition-transform" />
            </Link>
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
