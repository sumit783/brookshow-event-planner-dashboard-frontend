import { Calendar } from 'lucide-react';
import { config } from '@/config';
import type { Event } from '@/types';

interface EventBannerProps {
  event: Event;
}

export function EventBanner({ event }: EventBannerProps) {
  return (
    <div className="relative aspect-[21/9] w-4/5 mx-auto overflow-hidden rounded-xl bg-muted/30">
      {event.bannerUrl ? (
        <img 
          src={`${config.API_BASE_URI}${event.bannerUrl}`} 
          alt={event.title} 
          className="h-full w-full object-cover" 
        />
      ) : (
        <div className="flex h-full items-center justify-center bg-gradient-to-br from-primary/5 to-accent/5">
          <Calendar className="h-24 w-24 text-muted-foreground/20" />
        </div>
      )}
    </div>
  );
}
