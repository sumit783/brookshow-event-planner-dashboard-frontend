import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Calendar, DollarSign } from 'lucide-react';

interface BookingCalendarProps {
  artistName: string;
  price?: number;
}

export function BookingCalendar({ artistName, price }: BookingCalendarProps) {
  return (
    <Card className="glass-modern sticky top-24">
      <CardHeader>
        <CardTitle className="bg-gradient-to-r from-white to-accent bg-clip-text text-transparent">
          Book {artistName}
        </CardTitle>
        <CardDescription>
          Check availability and send booking request
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {price && (
          <div className="p-4 glass rounded-lg">
            <div className="flex items-center justify-between">
              <span className="text-muted-foreground">Starting Rate</span>
              <div className="flex items-center gap-1 text-2xl font-bold">
                <DollarSign className="w-5 h-5" />
                {price.toLocaleString()}
              </div>
            </div>
          </div>
        )}
        
        <Button className="w-full bg-gradient-primary shadow-neon-strong hover:scale-105 transition-smooth">
          <Calendar className="w-4 h-4 mr-2" />
          Request Booking
        </Button>
        
        <p className="text-xs text-muted-foreground text-center">
          Booking requests are typically responded to within 24 hours
        </p>
      </CardContent>
    </Card>
  );
}
