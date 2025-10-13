import { useEffect, useState } from 'react';
import { Download, Share2, ShoppingCart } from 'lucide-react';
import QRCode from 'qrcode';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { apiClient } from '@/services/apiClient';
import { storage, db } from '@/services/storage';
import { toast } from '@/hooks/use-toast';
import type { Event, TicketType, Ticket } from '@/types';

export default function TicketSales() {
  const [events, setEvents] = useState<Event[]>([]);
  const [selectedEventId, setSelectedEventId] = useState('');
  const [ticketTypes, setTicketTypes] = useState<TicketType[]>([]);
  const [selectedTicketTypeId, setSelectedTicketTypeId] = useState('');
  const [issuedTicket, setIssuedTicket] = useState<Ticket | null>(null);
  const [qrDataUrl, setQrDataUrl] = useState('');
  
  const [buyerInfo, setBuyerInfo] = useState({
    name: '',
    email: '',
    phone: '',
  });

  useEffect(() => {
    loadEvents();
  }, []);

  useEffect(() => {
    if (selectedEventId) {
      loadTicketTypes();
    }
  }, [selectedEventId]);

  async function loadEvents() {
    try {
      const eventsData = await apiClient.listEvents();
      const published = eventsData.filter(e => e.published);
      setEvents(published);
      
      if (published.length > 0 && !selectedEventId) {
        setSelectedEventId(published[0].id);
      }
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Failed to load events',
        variant: 'destructive',
      });
    }
  }

  async function loadTicketTypes() {
    try {
      const types = await apiClient.listTicketTypes(selectedEventId);
      setTicketTypes(types);
      
      if (types.length > 0) {
        setSelectedTicketTypeId(types[0].id);
      }
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Failed to load ticket types',
        variant: 'destructive',
      });
    }
  }

  async function handlePurchase(e: React.FormEvent) {
    e.preventDefault();
    
    if (!selectedEventId || !selectedTicketTypeId) {
      toast({
        title: 'Error',
        description: 'Please select an event and ticket type',
        variant: 'destructive',
      });
      return;
    }

    try {
      // Purchase ticket
      const ticket = await apiClient.purchaseTicket(
        selectedEventId,
        selectedTicketTypeId,
        buyerInfo
      );

      // Generate QR code
      const qrUrl = await QRCode.toDataURL(ticket.qrPayload, {
        width: 400,
        margin: 2,
      });

      // Update ticket with QR data URL
      await storage.set(db.tickets, ticket.id, {
        ...ticket,
        qrDataUrl: qrUrl,
      });

      setIssuedTicket({ ...ticket, qrDataUrl: qrUrl });
      setQrDataUrl(qrUrl);

      // Reset form
      setBuyerInfo({ name: '', email: '', phone: '' });
      
      // Reload ticket types to update inventory
      await loadTicketTypes();

      toast({
        title: 'Ticket Issued',
        description: 'Ticket purchased successfully',
      });
    } catch (error: any) {
      toast({
        title: 'Purchase Failed',
        description: error.message || 'Failed to purchase ticket',
        variant: 'destructive',
      });
    }
  }

  function downloadQR() {
    if (!qrDataUrl) return;
    
    const link = document.createElement('a');
    link.href = qrDataUrl;
    link.download = `ticket-${issuedTicket?.id}.png`;
    link.click();
  }

  function shareQR() {
    const message = `Your ticket for ${events.find(e => e.id === selectedEventId)?.title}\n\nTicket ID: ${issuedTicket?.id}\n\nShow this QR code at the entrance.`;
    const whatsappUrl = `https://wa.me/?text=${encodeURIComponent(message)}`;
    window.open(whatsappUrl, '_blank');
  }

  const selectedEvent = events.find(e => e.id === selectedEventId);
  const selectedTicketType = ticketTypes.find(tt => tt.id === selectedTicketTypeId);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-4xl font-bold">Ticket Sales</h1>
        <p className="mt-2 text-muted-foreground">Sell tickets and manage inventory</p>
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        {/* Purchase Form */}
        <Card>
          <CardHeader>
            <CardTitle>New Ticket Purchase</CardTitle>
            <CardDescription>Process a ticket sale</CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handlePurchase} className="space-y-4">
              {/* Event Selection */}
              <div className="space-y-2">
                <Label>Event</Label>
                <Select value={selectedEventId} onValueChange={setSelectedEventId}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select event" />
                  </SelectTrigger>
                  <SelectContent>
                    {events.map((event) => (
                      <SelectItem key={event.id} value={event.id}>
                        {event.title}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {/* Ticket Type Selection */}
              <div className="space-y-2">
                <Label>Ticket Type</Label>
                <Select value={selectedTicketTypeId} onValueChange={setSelectedTicketTypeId}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select ticket type" />
                  </SelectTrigger>
                  <SelectContent>
                    {ticketTypes.map((tt) => (
                      <SelectItem key={tt.id} value={tt.id}>
                        {tt.title} - ${tt.price} ({tt.quantity - tt.sold} left)
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                
                {selectedTicketType && (
                  <div className="flex gap-2 text-sm">
                    <Badge variant={selectedTicketType.quantity - selectedTicketType.sold > 10 ? 'default' : 'destructive'}>
                      {selectedTicketType.quantity - selectedTicketType.sold} / {selectedTicketType.quantity} available
                    </Badge>
                  </div>
                )}
              </div>

              {/* Buyer Information */}
              <div className="space-y-4 rounded-lg border bg-muted/50 p-4">
                <p className="text-sm font-medium">Buyer Information</p>
                
                <div className="space-y-2">
                  <Label htmlFor="name">Full Name</Label>
                  <Input
                    id="name"
                    value={buyerInfo.name}
                    onChange={(e) => setBuyerInfo({ ...buyerInfo, name: e.target.value })}
                    required
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="email">Email</Label>
                  <Input
                    id="email"
                    type="email"
                    value={buyerInfo.email}
                    onChange={(e) => setBuyerInfo({ ...buyerInfo, email: e.target.value })}
                    required
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="phone">Phone Number</Label>
                  <Input
                    id="phone"
                    type="tel"
                    value={buyerInfo.phone}
                    onChange={(e) => setBuyerInfo({ ...buyerInfo, phone: e.target.value })}
                    required
                  />
                </div>
              </div>

              {/* Submit */}
              <Button
                type="submit"
                size="lg"
                className="w-full bg-gradient-to-r from-primary to-primary-glow"
                disabled={!selectedEventId || !selectedTicketTypeId}
              >
                <ShoppingCart className="mr-2 h-5 w-5" />
                Issue Ticket - ${selectedTicketType?.price || 0}
              </Button>
            </form>
          </CardContent>
        </Card>

        {/* Issued Ticket */}
        {issuedTicket && (
          <Card className="border-2 border-success">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <span className="text-success">✓</span>
                Ticket Issued
              </CardTitle>
              <CardDescription>Ticket ready for delivery</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {/* QR Code */}
              <div className="flex justify-center">
                <div className="rounded-lg border bg-white p-4">
                  <img src={qrDataUrl} alt="Ticket QR Code" className="h-64 w-64" />
                </div>
              </div>

              {/* Ticket Info */}
              <div className="space-y-2 rounded-lg border bg-muted/50 p-4">
                <div>
                  <p className="text-sm text-muted-foreground">Event</p>
                  <p className="font-semibold">{selectedEvent?.title}</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Buyer</p>
                  <p className="font-semibold">{issuedTicket.buyerName}</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Ticket ID</p>
                  <p className="font-mono text-xs">{issuedTicket.id}</p>
                </div>
              </div>

              {/* Actions */}
              <div className="flex gap-2">
                <Button variant="outline" className="flex-1" onClick={downloadQR}>
                  <Download className="mr-2 h-4 w-4" />
                  Download
                </Button>
                <Button variant="outline" className="flex-1" onClick={shareQR}>
                  <Share2 className="mr-2 h-4 w-4" />
                  WhatsApp
                </Button>
              </div>

              {/* Clear */}
              <Button
                variant="secondary"
                className="w-full"
                onClick={() => {
                  setIssuedTicket(null);
                  setQrDataUrl('');
                }}
              >
                Issue Another Ticket
              </Button>
            </CardContent>
          </Card>
        )}
      </div>

      {/* Inventory Overview */}
      {ticketTypes.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Inventory Overview</CardTitle>
            <CardDescription>Current ticket availability</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {ticketTypes.map((tt) => {
                const available = tt.quantity - tt.sold;
                const percentage = (tt.sold / tt.quantity) * 100;
                
                return (
                  <div key={tt.id} className="space-y-2">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="font-medium">{tt.title}</p>
                        <p className="text-sm text-muted-foreground">${tt.price}</p>
                      </div>
                      <Badge variant={available > 10 ? 'default' : available > 0 ? 'secondary' : 'destructive'}>
                        {available} left
                      </Badge>
                    </div>
                    <div className="h-2 overflow-hidden rounded-full bg-muted">
                      <div
                        className="h-full bg-gradient-to-r from-primary to-accent transition-all"
                        style={{ width: `${percentage}%` }}
                      />
                    </div>
                  </div>
                );
              })}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
