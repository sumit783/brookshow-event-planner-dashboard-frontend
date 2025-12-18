import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import type { Event } from '@/types';

interface EventInfoProps {
  event: Event;
}

export function EventInfo({ event }: EventInfoProps) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>About Event</CardTitle>
      </CardHeader>
      <CardContent>
        <p className="whitespace-pre-line text-muted-foreground leading-relaxed">
          {event.description}
        </p>
      </CardContent>
    </Card>
  );
}
