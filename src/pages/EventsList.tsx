import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { Calendar, Plus } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { apiClient } from '@/services/apiClient';
import { eventService } from '@/services/event';
import { toast } from '@/hooks/use-toast';
import { Event } from '@/types';
import { EventsGrid } from '@/components/eventlist/EventsGrid';
import { Card, CardContent } from '@/components/ui/card'; // Re-adding Card and CardContent as they are used later in the code

export default function EventsList() {
  const [events, setEvents] = useState<Event[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadEvents();
  }, []);

  async function loadEvents() {
    try {
      const data = await eventService.listEvents();
      setEvents(data);
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Failed to load events',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  }

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <h1 className="text-4xl font-bold">Events</h1>
        </div>
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {[1, 2, 3].map((i) => (
            <Card key={i} className="animate-pulse">
              <CardContent className="h-48 bg-muted/50 p-0" />
            </Card>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-4xl font-bold">Events</h1>
          <p className="mt-2 text-muted-foreground">Manage your events and track performance</p>
        </div>
        <Link to="/events/create">
          <Button size="lg" className="bg-gradient-to-r from-primary to-primary-glow">
            Create Event
          </Button>
        </Link>
      </div>

      {/* Events Grid */}
      {events.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-16">
            <Calendar className="h-16 w-16 text-muted-foreground/50" />
            <h3 className="mt-4 text-lg font-semibold">No events yet</h3>
            <p className="mt-2 text-sm text-muted-foreground">Get started by creating your first event</p>
            <Link to="/events/create">
              <Button className="mt-6">Create Event</Button>
            </Link>
          </CardContent>
        </Card>
      ) : (
        <EventsGrid events={events} />
      )}
    </div>
  );
}
