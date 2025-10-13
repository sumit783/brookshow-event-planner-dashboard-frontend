import { Star, MapPin, Calendar, Award } from 'lucide-react';
import { Badge } from '@/components/ui/badge';

interface ProfileHeaderProps {
  image: string;
  name: string;
  category: string;
  rating?: number;
  location: string;
  stats?: {
    events: number;
    experience: string;
  };
  verified?: boolean;
}

export function ProfileHeader({ image, name, category, rating, location, stats, verified }: ProfileHeaderProps) {
  return (
    <div className="flex flex-col sm:flex-row gap-6">
      <div className="relative w-32 h-32 sm:w-40 sm:h-40 rounded-2xl overflow-hidden shadow-glow flex-shrink-0">
        <img src={image} alt={name} className="w-full h-full object-cover" />
        <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent" />
      </div>
      
      <div className="flex-1 space-y-4">
        <div>
          <div className="flex items-center gap-3 mb-2">
            <h1 className="text-3xl sm:text-4xl font-bold bg-gradient-to-r from-white via-accent to-primary bg-clip-text text-transparent">
              {name}
            </h1>
            {verified && (
              <Badge className="bg-success">
                <Star className="w-3 h-3 mr-1 fill-current" />
                Verified
              </Badge>
            )}
          </div>
          <div className="flex flex-wrap items-center gap-3">
            <Badge variant="outline" className="bg-accent/20 border-accent/30 text-accent">
              {category}
            </Badge>
            {rating && (
              <div className="flex items-center gap-1 text-yellow-400">
                <Star className="w-4 h-4 fill-current" />
                <span className="font-bold">{rating}</span>
              </div>
            )}
          </div>
        </div>
        
        <div className="flex items-center gap-2 text-muted-foreground">
          <MapPin className="w-4 h-4 text-accent" />
          <span>{location}</span>
        </div>

        {stats && (
          <div className="flex flex-wrap gap-4">
            <div className="flex items-center gap-2 px-4 py-2 glass-modern rounded-lg">
              <Calendar className="w-4 h-4 text-accent" />
              <div>
                <div className="text-xs text-muted-foreground">Events</div>
                <div className="font-bold">{stats.events}+</div>
              </div>
            </div>
            <div className="flex items-center gap-2 px-4 py-2 glass-modern rounded-lg">
              <Award className="w-4 h-4 text-accent" />
              <div>
                <div className="text-xs text-muted-foreground">Experience</div>
                <div className="font-bold">{stats.experience}</div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
