import { Link } from 'react-router-dom';
import { ArrowLeft, Edit, MoreVertical, Share2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { toast } from '@/hooks/use-toast';
import type { Event } from '@/types';

interface EventHeaderProps {
  event: Event;
  status: { label: string; variant: 'default' | 'secondary' | 'outline' };
}

export function EventHeader({ event, status }: EventHeaderProps) {
  return (
    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
      <div className="flex items-center gap-3 md:gap-4">
        <Link to="/events">
          <Button variant="ghost" size="icon" className="h-9 w-9">
            <ArrowLeft className="h-5 w-5" />
          </Button>
        </Link>
        <div className="min-w-0">
          <div className="flex flex-wrap items-center gap-2 md:gap-3">
            <h1 className="text-2xl md:text-3xl font-bold tracking-tight truncate">{event.title}</h1>
            <Badge variant={status.variant} className="shrink-0">{status.label}</Badge>
          </div>
          <p className="text-sm text-muted-foreground">Created on {new Date(event.createdAt).toLocaleDateString()}</p>
        </div>
      </div>
      <div className="flex items-center gap-2 sm:ml-auto">
        <Link to={`/events/edit/${event._id}`} className="flex-1 sm:flex-none">
          <Button variant="outline" className="w-full sm:w-auto">
            <Edit className="mr-2 h-4 w-4" />
            <span className="hidden xs:inline">Edit Event</span>
            <span className="xs:hidden">Edit</span>
          </Button>
        </Link>
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" size="icon">
              <MoreVertical className="h-5 w-5" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuItem onClick={() => {
              navigator.clipboard.writeText(window.location.href);
              toast({ title: 'Link copied', description: 'Event link copied to clipboard' });
            }}>
              <Share2 className="mr-2 h-4 w-4" />
              Share Link
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </div>
  );
}
