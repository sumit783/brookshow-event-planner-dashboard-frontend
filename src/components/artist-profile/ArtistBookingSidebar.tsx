import { useState, useEffect } from 'react';
import { ArtistProfile, Event } from '@/types';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { Send, CheckCircle2 } from 'lucide-react';
import { apiClient } from '@/services/apiClient';
import { toast } from '@/hooks/use-toast';

interface ArtistBookingSidebarProps {
  artist: ArtistProfile;
  events: Event[];
}

export function ArtistBookingSidebar({ artist, events }: ArtistBookingSidebarProps) {
  const [selectedEventId, setSelectedEventId] = useState('');
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);

  // Fallback to a default price if missing in profile, or 0.
  // The User added price_for_event_planner to type, but API example didn't have it.
  const price = artist.price_for_event_planner || 0; 

  async function handleBooking() {
     if (!selectedEventId) return;
     
     const event = events.find(e => e._id === selectedEventId);
     if (!event) return;

     setLoading(true);
     try {
       await apiClient.createBooking({
        eventId: selectedEventId,
        artistId: artist._id,
        proposedDate: event.startAt.split('T')[0],
        proposedTime: event.startAt.split('T')[1]?.substring(0, 5) || '18:00',
        price: price,
       });

       setSuccess(true);
       toast({
        title: "Request Sent!",
        description: "Artist has been notified.",
       });
     } catch (error: any) {
       toast({
        title: "Booking Failed",
        description: error.message || "Something went wrong.",
        variant: "destructive"
       });
     } finally {
       setLoading(false);
     }
  }

  if (success) {
    return (
      <Card className="border-green-500/50 bg-green-50/10">
        <CardContent className="pt-6 flex flex-col items-center text-center space-y-2">
           <CheckCircle2 className="h-12 w-12 text-green-500" />
           <h3 className="text-xl font-bold">Request Sent!</h3>
           <p className="text-sm text-muted-foreground">You can track the status in your dashboard.</p>
           <Button variant="outline" className="mt-4" onClick={() => setSuccess(false)}>Book Another Event</Button>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="sticky top-6 border-2 border-primary/20 shadow-lg">
      <CardHeader className="bg-primary/5 pb-4">
        <CardTitle>Book Details</CardTitle>
        <CardDescription>Send a booking request</CardDescription>
      </CardHeader>
      <CardContent className="space-y-6 pt-6">
        
        {/* Price Display */}
        <div className="flex justify-between items-center pb-4 border-b">
           <span className="text-muted-foreground">Base Rate</span>
           <span className="text-2xl font-bold">
             {price > 0 ? `₹${price.toLocaleString()}` : 'Contact for Price'}
           </span>
        </div>

        {/* Event Selector */}
        <div className="space-y-2">
          <Label>Select Event</Label>
          <Select value={selectedEventId} onValueChange={setSelectedEventId}>
            <SelectTrigger>
               <SelectValue placeholder="Choose an upcoming event" />
            </SelectTrigger>
            <SelectContent>
              {events.length > 0 ? (
                events.map(event => (
                  <SelectItem key={event._id} value={event._id}>
                    {event.title}
                  </SelectItem>
                ))
              ) : (
                <div className="p-2 text-sm text-muted-foreground text-center">No upcoming events found</div>
              )}
            </SelectContent>
          </Select>
        </div>

        {/* Dynamic Details based on selection */}
        {selectedEventId && (
          <div className="text-sm space-y-2 bg-muted/50 p-3 rounded-md">
             <div className="flex justify-between">
                <span className="text-muted-foreground">Date</span>
                <span>{new Date(events.find(e => e._id === selectedEventId)?.startAt!).toLocaleDateString()}</span>
             </div>
             <div className="flex justify-between">
                <span className="text-muted-foreground">Location</span>
                <span className="max-w-[150px] truncate ml-2 text-right">
                  {events.find(e => e._id === selectedEventId)?.venue}
                </span>
             </div>
          </div>
        )}

        <Button 
          className="w-full bg-gradient-to-r from-primary to-primary-glow hover:opacity-90" 
          size="lg"
          onClick={handleBooking}
          disabled={!selectedEventId || loading}
        >
          {loading ? "Sending..." : (
            <>
              <Send className="mr-2 h-4 w-4" /> Send Request
            </>
          )}
        </Button>
      </CardContent>
    </Card>
  );
}
