import { Calendar } from 'lucide-react';
import { config } from '@/config';
import type { Event } from '@/types';

interface EventBannerProps {
  event: Event;
}

export function EventBanner({ event }: EventBannerProps) {
  return (
    <div className="relative aspect-[21/9] w-full md:w-4/5 mx-auto overflow-hidden rounded-xl bg-muted/30 border">
      {event.bannerUrl ? (
        <img
          src={event.bannerUrl.startsWith('http://') || event.bannerUrl.startsWith('https://') || event.bannerUrl.startsWith('blob:') || event.bannerUrl.startsWith('data:') ? event.bannerUrl : `${config.API_BASE_URI}${event.bannerUrl.startsWith('/') ? '' : '/'}${event.bannerUrl}`}
          alt={event.title}
          className="h-full w-full object-cover"
          onError={(e) => {
            e.currentTarget.style.display = 'none';
            e.currentTarget.parentElement?.querySelector('.fallback-icon')?.classList.remove('hidden');
          }}
        />
      ) : null}
      <div className={`flex h-full items-center justify-center bg-gradient-to-br from-primary/5 to-accent/5 ${event.bannerUrl ? 'hidden fallback-icon' : ''}`}>
        <Calendar className="h-24 w-24 text-muted-foreground/20" />
      </div>
    </div>
  );
}
