import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { AddTicketDialog } from './AddTicketDialog';
import type { Event } from '@/types';

interface TicketListProps {
  event: Event;
  onTicketChanged: () => void;
}

export function TicketList({ event, onTicketChanged }: TicketListProps) {
  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-semibold">Tickets</h3>
        <AddTicketDialog eventId={event._id} onTicketAdded={onTicketChanged} />
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        {event.ticketData.map((ticket) => (
          <Card key={ticket.id}>
            <CardHeader className="pb-2">
              <CardTitle className="text-base font-medium">{ticket.title}</CardTitle>
              <CardDescription>
                ₹{ticket.price}
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Sold</span>
                  <span className="font-medium">{ticket.sold} / {ticket.quantity}</span>
                </div>
                <div className="h-2 overflow-hidden rounded-full bg-muted">
                  <div
                    className="h-full bg-primary transition-all"
                    style={{ width: `${(ticket.sold / ticket.quantity) * 100}%` }}
                  />
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
        {event.ticketData.length === 0 && (
          <div className="col-span-full rounded-lg border border-dashed p-8 text-center text-muted-foreground">
            No ticket types configured yet.
          </div>
        )}
      </div>
    </div>
  );
}
