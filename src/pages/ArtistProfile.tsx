import { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Loader2, ArrowLeft, Send } from 'lucide-react';
import { useQuery } from '@tanstack/react-query';
import { Button } from '@/components/ui/button';
import { ArtistProfileHeader } from '@/components/artist-profile/ArtistProfileHeader';
import { ArtistProfileContent } from '@/components/artist-profile/ArtistProfileContent';
import { ArtistBookingSidebar } from '@/components/artist-profile/ArtistBookingSidebar';
import { ArtistBookingForm } from '@/components/artist-profile/ArtistBookingForm';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger
} from '@/components/ui/dialog';
import { artistService } from '@/services/artist';
import { eventService } from '@/services/event';
import { toast } from '@/hooks/use-toast';

export default function ArtistProfile() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [isMobileBookingOpen, setIsMobileBookingOpen] = useState(false);

  // Fetch Artist Profile
  const {
    data: artist,
    isLoading: loadingArtist,
    isError: artistError
  } = useQuery({
    queryKey: ['artist', id],
    queryFn: () => artistService.getArtistById(id!),
    enabled: !!id,
  });

  // Fetch Events
  const {
    data: events = [],
    isLoading: loadingEvents
  } = useQuery({
    queryKey: ['events'],
    queryFn: () => eventService.listEvents(),
    select: (data) => data.filter(e => e.published),
  });

  // Fetch Services
  const {
    data: services = [],
    isLoading: loadingServices
  } = useQuery({
    queryKey: ['artist-services', id],
    queryFn: () => artistService.getArtistServices(id!),
    enabled: !!id,
  });

  const loading = loadingArtist || loadingEvents || loadingServices;

  if (loading) {
    return (
      <div className="flex h-[80vh] items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (artistError || !artist) {
    return (
      <div className="flex flex-col items-center justify-center h-[60vh] gap-4">
        <h2 className="text-2xl font-bold">Artist not found</h2>
        <Button onClick={() => navigate('/artists')}>Back to Artists</Button>
      </div>
    );
  }

  return (
    <div className="relative space-y-6 animate-in fade-in duration-500 pb-24 lg:pb-0">
      <Button variant="ghost" className="pl-0 gap-2 hover:bg-transparent hover:text-primary" onClick={() => navigate('/artists')}>
        <ArrowLeft className="h-4 w-4" /> Back to List
      </Button>

      <ArtistProfileHeader artist={artist} />

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2">
          <ArtistProfileContent artist={artist} />
        </div>
        <div className="lg:col-span-1">
          <ArtistBookingSidebar artist={artist} events={events} services={services} />
        </div>
      </div>

      {/* Mobile Sticky Booking Button */}
      <div className="fixed bottom-0 left-0 right-0 p-4 bg-background/80 backdrop-blur-md border-t lg:hidden z-50">
        <Dialog open={isMobileBookingOpen} onOpenChange={setIsMobileBookingOpen}>
          <DialogTrigger asChild>
            <Button className="w-full bg-gradient-to-r from-primary to-primary-glow h-12 text-lg font-semibold shadow-lg shadow-primary/20">
              <Send className="mr-2 h-5 w-5" /> Book Now
            </Button>
          </DialogTrigger>
          <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-[500px]">
            <DialogHeader>
              <DialogTitle>Book {artist.userId.displayName}</DialogTitle>
            </DialogHeader>
            <div className="py-2">
              <ArtistBookingForm
                artist={artist}
                events={events}
                services={services}
                onClose={() => setIsMobileBookingOpen(false)}
              />
            </div>
          </DialogContent>
        </Dialog>
      </div>
    </div>
  );
}
