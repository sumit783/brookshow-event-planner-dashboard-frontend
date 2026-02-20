import { useEffect, useState } from 'react';
import { useNavigate, useParams, Link } from 'react-router-dom';
import { ArrowLeft, Edit, Share2, Calendar, MapPin, Clock, Users, Ticket, BarChart3, Globe, AlertCircle } from 'lucide-react';

import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Skeleton } from '@/components/ui/skeleton';
import { toast } from '@/hooks/use-toast';
import { apiClient } from '@/services/apiClient';
import { eventService } from '@/services/event';
import type { Event } from '@/types';

import { EventHeader } from '@/components/event-details/EventHeader';
import { EventBanner } from '@/components/event-details/EventBanner';
import { EventInfo } from '@/components/event-details/EventInfo';
import { TicketList } from '@/components/event-details/TicketList';
import { EventSidebar } from '@/components/event-details/EventSidebar';

export default function EventDetails() {
  const { id } = useParams<{ id: string }>();
  const [event, setEvent] = useState<Event | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (id) {
      loadEvent(id);
    }
  }, [id]);

  async function loadEvent(eventId: string) {
    try {
      const data = await eventService.getEvent(eventId);
      setEvent(data);
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Failed to load event details',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  }

  function getEventStatus(event: Event) {
    const now = new Date();
    const start = new Date(event.startAt);
    const end = new Date(event.endAt);

    if (!event.published) return { label: 'Draft', variant: 'outline' as const };
    if (now > end) return { label: 'Past', variant: 'secondary' as const };
    if (now >= start && now <= end) return { label: 'Ongoing', variant: 'default' as const };
    return { label: 'Upcoming', variant: 'default' as const };
  }

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="flex items-center gap-4">
          <Skeleton className="h-10 w-10 rounded-full" />
          <div className="space-y-2">
            <Skeleton className="h-8 w-64" />
            <Skeleton className="h-4 w-32" />
          </div>
        </div>
        <Skeleton className="h-[300px] w-full rounded-xl" />
        <div className="grid gap-6 md:grid-cols-3">
          <Skeleton className="h-32" />
          <Skeleton className="h-32" />
          <Skeleton className="h-32" />
        </div>
      </div>
    );
  }

  if (!event) {
    return (
      <div className="flex flex-col items-center justify-center py-16 text-center">
        <Calendar className="h-16 w-16 text-muted-foreground/30" />
        <h2 className="mt-4 text-2xl font-bold">Event not found</h2>
        <p className="mt-2 text-muted-foreground">The event you are looking for does not exist or has been removed.</p>
        <Link to="/events" className="mt-6">
          <Button>Back to Events</Button>
        </Link>
      </div>
    );
  }

  const status = getEventStatus(event);

  // Calculate stats from ticketData
  const stats = event.ticketData.reduce(
    (acc, ticket) => ({
      sold: acc.sold + ticket.sold,
      total: acc.total + ticket.quantity,
      revenue: acc.revenue + (ticket.sold * ticket.price),
    }),
    { sold: 0, total: 0, revenue: 0 }
  );

  return (
    <div className="container max-w-7xl px-4 py-6 md:px-6 space-y-6 md:space-y-8 pb-10">
      <EventHeader event={event} status={status} />
      <EventBanner event={event} />

      <div className="grid gap-6 lg:grid-cols-3">
        {/* Main Content */}
        <div className="lg:col-span-2 space-y-6">
          <EventInfo event={event} />
          <TicketList event={event} onTicketChanged={() => loadEvent(event._id)} />
        </div>

        {/* Sidebar Info */}
        <div className="space-y-6">
          <EventSidebar event={event} stats={stats} />
        </div>
      </div>
    </div>
  );
}
