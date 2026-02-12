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
    <div className="flex items-center justify-between">
      <div className="flex items-center gap-4">
        <Link to="/events">
          <Button variant="ghost" size="icon">
            <ArrowLeft className="h-5 w-5" />
          </Button>
        </Link>
        <div>
          <div className="flex items-center gap-3">
            <h1 className="text-3xl font-bold">{event.title}</h1>
            <Badge variant={status.variant}>{status.label}</Badge>
          </div>
          <p className="text-muted-foreground">Created on {new Date(event.createdAt).toLocaleDateString()}</p>
        </div>
      </div>
      <div className="flex items-center gap-2">
         <Link to={`/events/edit/${event._id}`}>
          <Button variant="outline">
            <Edit className="mr-2 h-4 w-4" />
            Edit Event
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
