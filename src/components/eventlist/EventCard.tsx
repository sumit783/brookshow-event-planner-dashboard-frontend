import { Link } from 'react-router-dom';
import { Calendar, MapPin, Eye, Edit } from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import type { Event } from '@/types';
import { config } from '@/config';

interface EventCardProps {
  event: Event;
}

export function EventCard({ event }: EventCardProps) {
  function getEventStatus(event: Event): { label: string; variant: 'default' | 'secondary' | 'outline' } {
    const now = new Date();
    const start = new Date(event.startAt);
    const end = new Date(event.endAt);

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

  const status = getEventStatus(event);
  
  // Calculate stats from ticketData
  const stats = (event.ticketData || []).reduce(
    (acc, ticket) => ({
      sold: acc.sold + ticket.sold,
      total: acc.total + ticket.quantity,
    }),
    { sold: 0, total: 0 }
  );
  const soldPercentage = stats.total > 0 ? (stats.sold / stats.total) * 100 : 0;

  return (
    <Card className="group overflow-hidden transition-all hover:shadow-elevated">
      {/* Event Image or Placeholder */}
      <div className="relative h-48 overflow-hidden bg-gradient-to-br from-primary/10 to-accent/10">
        {event.bannerUrl ? (
          <img src={`${config.API_BASE_URI}${event.bannerUrl}`} alt={event.title} className="h-full w-full object-cover" />
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
          <span className="flex items-center gap-2 text-sm">
            <Calendar className="h-4 w-4" />
            {new Date(event.startAt).toLocaleDateString('en-IN', {
              month: 'short',
              day: 'numeric',
              year: 'numeric',
            })}
          </span>
          <span className="flex items-center gap-2 text-sm">
            <MapPin className="h-4 w-4" />
            {event.venue}, {event.city}
          </span>
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
          <Link to={`/events/${event._id}`} className="flex-1">
            <Button variant="outline" size="sm" className="w-full">
              <Eye className="mr-2 h-4 w-4" />
              View
            </Button>
          </Link>
          <Link to={`/events/${event._id}/edit`} className="flex-1">
            <Button variant="outline" size="sm" className="w-full">
              <Edit className="mr-2 h-4 w-4" />
              Edit
            </Button>
          </Link>
        </div>
      </CardContent>
    </Card>
  );
}
