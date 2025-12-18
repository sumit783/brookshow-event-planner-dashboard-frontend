import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Loader2, ArrowLeft } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { ArtistProfileHeader } from '@/components/artist-profile/ArtistProfileHeader';
import { ArtistProfileContent } from '@/components/artist-profile/ArtistProfileContent';
import { ArtistBookingSidebar } from '@/components/artist-profile/ArtistBookingSidebar';
import { artistService } from '@/services/artist';
import { eventService } from '@/services/event';
import { ArtistProfile as IArtistProfile, Event } from '@/types';
import { toast } from '@/hooks/use-toast';

export default function ArtistProfile() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  
  const [artist, setArtist] = useState<IArtistProfile | null>(null);
  const [events, setEvents] = useState<Event[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (id) {
      loadData(id);
    }
  }, [id]);

  async function loadData(artistId: string) {
    try {
      const [artistData, eventsData] = await Promise.all([
        artistService.getArtistById(artistId),
        eventService.listEvents()
      ]);
      setArtist(artistData);
      // Filter only published and future events if necessary, for now just published
      setEvents(eventsData.filter(e => e.published));
    } catch (error) {
      console.error(error);
      toast({
        title: "Error",
        description: "Failed to load artist profile.",
        variant: "destructive"
      });
      // Optionally redirect back
    } finally {
      setLoading(false);
    }
  }

  if (loading) {
    return (
      <div className="flex h-[80vh] items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (!artist) {
    return (
      <div className="flex flex-col items-center justify-center h-[60vh] gap-4">
        <h2 className="text-2xl font-bold">Artist not found</h2>
        <Button onClick={() => navigate('/artists')}>Back to Artists</Button>
      </div>
    );
  }

  return (
    <div className="space-y-6 animate-in fade-in duration-500">
      <Button variant="ghost" className="pl-0 gap-2 hover:bg-transparent hover:text-primary" onClick={() => navigate('/artists')}>
        <ArrowLeft className="h-4 w-4" /> Back to List
      </Button>

      <ArtistProfileHeader artist={artist} />

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2">
           <ArtistProfileContent artist={artist} />
        </div>
        <div className="lg:col-span-1">
           <ArtistBookingSidebar artist={artist} events={events} />
        </div>
      </div>
    </div>
  );
}
