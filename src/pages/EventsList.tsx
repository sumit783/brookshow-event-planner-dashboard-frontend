import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { Calendar, MapPin, Eye, Edit, Trash2, CheckCircle, Clock, Archive } from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { apiClient } from '@/services/apiClient';
import { storage, db } from '@/services/storage';
import { toast } from '@/hooks/use-toast';
import type { Event, TicketType } from '@/types';

export default function EventsList() {
  const [events, setEvents] = useState<Event[]>([]);
  const [ticketStats, setTicketStats] = useState<Record<string, { sold: number; total: number }>>({});
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadEvents();
  }, []);

  async function loadEvents() {
    try {
      const eventsData = await apiClient.listEvents();
      const ticketTypes = await storage.getAll<TicketType>(db.ticketTypes);

      const stats: Record<string, { sold: number; total: number }> = {};
      ticketTypes.forEach((tt) => {
        if (!stats[tt.eventId]) {
          stats[tt.eventId] = { sold: 0, total: 0 };
        }
        stats[tt.eventId].sold += tt.sold;
        stats[tt.eventId].total += tt.quantity;
      });

      setEvents(eventsData.sort((a, b) => new Date(b.start).getTime() - new Date(a.start).getTime()));
      setTicketStats(stats);
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

  function getEventStatus(event: Event): { label: string; variant: 'default' | 'secondary' | 'outline' } {
    const now = new Date();
    const start = new Date(event.start);
    const end = new Date(event.end);

    if (!event.published) {
      return { label: 'Draft', variant: 'outline' };
    }
    if (now > end) {
      return { label: 'Past', variant: 'secondary' };
    }
    if (now >= start && now <= end) {
      return { label: 'Ongoing', variant: 'default' };
    }
    return { label: 'Upcoming', variant: 'default' };
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
              <CardHeader className="h-48 bg-muted/50" />
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
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {events.map((event) => {
            const status = getEventStatus(event);
            const stats = ticketStats[event.id] || { sold: 0, total: 0 };
            const soldPercentage = stats.total > 0 ? (stats.sold / stats.total) * 100 : 0;

            return (
              <Card key={event.id} className="group overflow-hidden transition-all hover:shadow-elevated">
                {/* Event Image or Placeholder */}
                <div className="relative h-48 overflow-hidden bg-gradient-to-br from-primary/10 to-accent/10">
                  {event.images[0] ? (
                    <img src={event.images[0]} alt={event.title} className="h-full w-full object-cover" />
                  ) : (
                    <div className="flex h-full items-center justify-center">
                      <Calendar className="h-16 w-16 text-muted-foreground/30" />
                    </div>
                  )}
                  <div className="absolute right-2 top-2">
                    <Badge variant={status.variant}>{status.label}</Badge>
                  </div>
                </div>

                <CardHeader>
                  <CardTitle className="line-clamp-1">{event.title}</CardTitle>
                  <CardDescription className="space-y-1">
                    <div className="flex items-center gap-2 text-sm">
                      <Calendar className="h-4 w-4" />
                      {new Date(event.start).toLocaleDateString('en-US', {
                        month: 'short',
                        day: 'numeric',
                        year: 'numeric',
                      })}
                    </div>
                    <div className="flex items-center gap-2 text-sm">
                      <MapPin className="h-4 w-4" />
                      {event.venue}
                    </div>
                  </CardDescription>
                </CardHeader>

                <CardContent className="space-y-4">
                  {/* Ticket Stats */}
                  {stats.total > 0 && (
                    <div className="space-y-2">
                      <div className="flex justify-between text-sm">
                        <span className="text-muted-foreground">Tickets Sold</span>
                        <span className="font-medium">
                          {stats.sold} / {stats.total}
                        </span>
                      </div>
                      <div className="h-2 overflow-hidden rounded-full bg-muted">
                        <div
                          className="h-full bg-gradient-to-r from-primary to-accent transition-all"
                          style={{ width: `${soldPercentage}%` }}
                        />
                      </div>
                    </div>
                  )}

                  {/* Actions */}
                  <div className="flex gap-2">
                    <Link to={`/events/${event.id}`} className="flex-1">
                      <Button variant="outline" size="sm" className="w-full">
                        <Eye className="mr-2 h-4 w-4" />
                        View
                      </Button>
                    </Link>
                    <Link to={`/events/${event.id}/edit`} className="flex-1">
                      <Button variant="outline" size="sm" className="w-full">
                        <Edit className="mr-2 h-4 w-4" />
                        Edit
                      </Button>
                    </Link>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
}
