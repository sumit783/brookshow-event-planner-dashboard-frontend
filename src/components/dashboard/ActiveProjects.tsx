import { ChevronRight, Target } from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { useNavigate } from 'react-router-dom';
  
interface Event {
  id: string;
  title: string;
  date: string;
  venue: string;
  status: string;
  progress: number;
}

interface ActiveProjectsProps {
  events: Event[];
}

export function ActiveProjects({ events }: ActiveProjectsProps) {
  const navigate = useNavigate();

  return (
    <Card className="border-none bg-card/30 shadow-premium backdrop-blur-xl">
      <CardHeader className="flex flex-row items-center justify-between">
        <div>
          <CardTitle>Active Projects</CardTitle>
          <CardDescription>Monitor your live event status</CardDescription>
        </div>
        <Button variant="ghost" size="sm" className="text-xs hover:bg-white/5 hover:text-white" onClick={() => {navigate('/events')}}>
          View All <ChevronRight className="ml-1 h-3 w-3" />
        </Button>
      </CardHeader>
      <CardContent className="space-y-4">
        {events.map((event) => (
          <div key={event.id} className="group flex items-center justify-between rounded-2xl border border-white/5 bg-white/5 p-4 transition-all hover:bg-white/10 hover:border-white/10">
            <div className="flex items-center gap-4">
              <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-primary/20 text-primary font-bold shadow-inner">
                <Target className="h-5 w-5" />
              </div>
              <div className="space-y-0.5">
                <p className="font-semibold group-hover:text-primary transition-colors">{event.title}</p>
                <p className="text-xs text-muted-foreground">
                  {event.venue} • {new Date(event.date).toLocaleDateString()}
                </p>
              </div>
            </div>
            <div className="text-right">
              <Badge variant="outline" className="border-white/10 bg-white/5 text-[10px]">
                {event.status}
              </Badge>
              <div className="mt-2 w-20 h-1 bg-white/5 rounded-full overflow-hidden">
                <div 
                  className="h-full bg-primary transition-all duration-1000" 
                  style={{ width: `${event.progress}%` }} 
                />
              </div>
            </div>
          </div>
        ))}
      </CardContent>
    </Card>
  );
}
