import { Users } from 'lucide-react';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { ArtistCard } from './ArtistCard';
import { Artist } from '@/types';

interface ArtistListProps {
  artists: Artist[];
  loading: boolean;
}

export function ArtistList({ artists, loading }: ArtistListProps) {
  if (loading) {
    return (
      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
        {[1, 2, 3].map((i) => (
          <Card key={i} className="animate-pulse">
            <CardHeader className="h-48 bg-muted/50" />
            <CardContent className="h-32" />
          </Card>
        ))}
      </div>
    );
  }

  if (artists.length === 0) {
    return (
      <Card>
        <CardContent className="flex flex-col items-center justify-center py-16">
          <Users className="h-16 w-16 text-muted-foreground/50" />
          <h3 className="mt-4 text-lg font-semibold">No artists found</h3>
          <p className="mt-2 text-sm text-muted-foreground">
            Try adjusting your search filters
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
      {artists.map((artist) => (
        <ArtistCard
          key={artist.id}
          artist={artist}
        />
      ))}
    </div>
  );
}
