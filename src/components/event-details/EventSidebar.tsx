import { Calendar, MapPin } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import type { Event } from '@/types';

interface EventSidebarProps {
  event: Event;
  stats: {
    revenue: number;
    sold: number;
  };
}

export function EventSidebar({ event, stats }: EventSidebarProps) {
  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Event Details</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-start gap-3">
            <Calendar className="mt-0.5 h-5 w-5 text-primary" />
            <div>
              <p className="font-medium">Date & Time</p>
              <p className="text-sm text-muted-foreground">
                {new Date(event.startAt).toLocaleDateString('en-US', { weekday: 'long', month: 'short', day: 'numeric', year: 'numeric' })}
              </p>
              <p className="text-sm text-muted-foreground">
                {new Date(event.startAt).toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' })} - {new Date(event.endAt).toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' })}
              </p>
            </div>
          </div>

          <div className="flex items-start gap-3">
            <MapPin className="mt-0.5 h-5 w-5 text-primary" />
            <div>
              <p className="font-medium">Location</p>
              <p className="text-sm text-muted-foreground">{event.venue}</p>
              <p className="text-sm text-muted-foreground">{event.address}</p>
              <p className="text-sm text-muted-foreground">{event.city}, {event.state}</p>
            </div>
          </div>

          <div className="overflow-hidden rounded-lg border aspect-video">
            <iframe
              width="100%"
              height="100%"
              style={{ border: 0 }}
              loading="lazy"
              allowFullScreen
              referrerPolicy="no-referrer-when-downgrade"
              src={`https://maps.google.com/maps?q=${event.lat},${event.lng}&z=15&output=embed`}
            ></iframe>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Sales Overview</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-2 lg:grid-cols-1 gap-4">
            <div className="space-y-1 p-3 rounded-lg bg-muted/30 border border-border/50">
              <p className="text-xs md:text-sm text-muted-foreground font-medium">Total Revenue</p>
              <p className="text-xl md:text-2xl font-bold">₹{stats.revenue.toLocaleString()}</p>
            </div>
            <div className="space-y-1 p-3 rounded-lg bg-muted/30 border border-border/50">
              <p className="text-xs md:text-sm text-muted-foreground font-medium">Tickets Sold</p>
              <p className="text-xl md:text-2xl font-bold">{stats.sold}</p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
