import { ArtistProfile, Event, ArtistService } from '@/types';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { ArtistBookingForm } from './ArtistBookingForm';

interface ArtistBookingSidebarProps {
  artist: ArtistProfile;
  events: Event[];
  services?: ArtistService[];
}

export function ArtistBookingSidebar({ artist, events, services = [] }: ArtistBookingSidebarProps) {
  return (
    <Card className="sticky top-6 border-2 border-primary/20 shadow-lg hidden lg:block">
      <CardHeader className="bg-primary/5 pb-4">
        <CardTitle>Book Details</CardTitle>
        <CardDescription>Check availability and send booking request</CardDescription>
      </CardHeader>
      <CardContent className="pt-6">
        <ArtistBookingForm
          artist={artist}
          events={events}
          services={services}
        />
      </CardContent>
    </Card>
  );
}
