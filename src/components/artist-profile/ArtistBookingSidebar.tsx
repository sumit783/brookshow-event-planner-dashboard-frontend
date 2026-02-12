import { useState, useEffect } from 'react';
import { ArtistProfile, Event, ArtistService, ArtistAvailabilityResponse } from '@/types';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Send, CheckCircle2, Calendar, AlertCircle, Loader2 } from 'lucide-react';
import { apiClient } from '@/services/apiClient';
import { artistService } from '@/services/artist';
import { eventService } from '@/services/event';
import { toast } from '@/hooks/use-toast';

interface ArtistBookingSidebarProps {
  artist: ArtistProfile;
  events: Event[];
  services?: ArtistService[];
}

export function ArtistBookingSidebar({ artist, events, services = [] }: ArtistBookingSidebarProps) {
  const [selectedEventId, setSelectedEventId] = useState('');
  const [selectedServiceId, setSelectedServiceId] = useState('');
  const [startDateTime, setStartDateTime] = useState('');
  const [endDateTime, setEndDateTime] = useState('');
  const [availabilityData, setAvailabilityData] = useState<ArtistAvailabilityResponse | null>(null);
  const [checkingAvailability, setCheckingAvailability] = useState(false);
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [bookingEvents, setBookingEvents] = useState<Event[]>([]);
  const [loadingEvents, setLoadingEvents] = useState(false);

  // Determine price based on availability data or selected service or fallback to artist base price
  const selectedService = services.find(s => s.id === selectedServiceId);
  const price = availabilityData
    ? availabilityData.pricing.totalPrice
    : (selectedService ? selectedService.price_for_planner : (artist.price_for_event_planner || 0));

  // Auto-select first service if available and none selected
  useEffect(() => {
    if (services.length > 0 && !selectedServiceId) {
      setSelectedServiceId(services[0].id);
    }
  }, [services, selectedServiceId]);

  // Fetch events when dialog opens
  useEffect(() => {
    if (dialogOpen && bookingEvents.length === 0) {
      fetchBookingEvents();
    }
  }, [dialogOpen]);

  async function fetchBookingEvents() {
    setLoadingEvents(true);
    try {
      const eventsList = await eventService.listEventsForBooking();
      setBookingEvents(eventsList);
    } catch (error: any) {
      toast({
        title: "Failed to Load Events",
        description: error.message || "Could not fetch events list.",
        variant: "destructive"
      });
    } finally {
      setLoadingEvents(false);
    }
  }

  async function handleCheckAvailability() {
    if (!selectedServiceId || !startDateTime || !endDateTime) {
      toast({
        title: "Missing Information",
        description: "Please select a service and enter both start and end dates.",
        variant: "destructive"
      });
      return;
    }

    // Validate dates
    const start = new Date(startDateTime);
    const end = new Date(endDateTime);
    if (end <= start) {
      toast({
        title: "Invalid Dates",
        description: "End date must be after start date.",
        variant: "destructive"
      });
      return;
    }

    setCheckingAvailability(true);
    try {
      const response = await artistService.checkArtistAvailability(
        artist._id,
        selectedServiceId,
        startDateTime,
        endDateTime
      );

      setAvailabilityData(response);

      if (response.available) {
        toast({
          title: "Artist Available!",
          description: `Total price: ₹${response.pricing.totalPrice.toLocaleString()} for ${response.pricing.units} ${response.service.unit}(s)`,
        });
      } else {
        toast({
          title: "Artist Not Available",
          description: "The artist has a conflicting booking for these dates.",
          variant: "destructive"
        });
      }
    } catch (error: any) {
      toast({
        title: "Check Failed",
        description: error.message || "Failed to check availability.",
        variant: "destructive"
      });
      setAvailabilityData(null);
    } finally {
      setCheckingAvailability(false);
    }
  }

  async function handleBooking() {
    if (!selectedEventId) {
      toast({
        title: "Missing Information",
        description: "Please select an event.",
        variant: "destructive"
      });
      return;
    }

    if (!availabilityData) {
      toast({
        title: "Check Availability First",
        description: "Please check availability before booking.",
        variant: "destructive"
      });
      return;
    }

    if (!availabilityData.available) {
      toast({
        title: "Artist Not Available",
        description: "Cannot book - artist is not available for selected dates.",
        variant: "destructive"
      });
      return;
    }

    setLoading(true);
    try {
      const response = await apiClient.createArtistBooking({
        artistId: artist._id,
        serviceId: selectedServiceId, // Ensure this is available in scope or state
        eventId: selectedEventId,
        startAt: availabilityData.requestedDates.startAt,
        endAt: availabilityData.requestedDates.endAt,
      });

      if (response.success) {
        setSuccess(true);
        setDialogOpen(false);
        toast({
          title: "Booking Confirmed!",
          description: response.message || "Artist booking created successfully.",
        });
      } else {
        throw new Error(response.message || 'Booking failed');
      }

    } catch (error: any) {
      toast({
        title: "Booking Failed",
        description: error.message || "Something went wrong.",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  }

  if (success) {
    return (
      <Card className="border-green-500/50 bg-green-50/10">
        <CardContent className="pt-6 flex flex-col items-center text-center space-y-2">
          <CheckCircle2 className="h-12 w-12 text-green-500" />
          <h3 className="text-xl font-bold">Request Sent!</h3>
          <p className="text-sm text-muted-foreground">You can track the status in your dashboard.</p>
          <Button variant="outline" className="mt-4" onClick={() => {
            setSuccess(false);
            setAvailabilityData(null);
            setStartDateTime('');
            setEndDateTime('');
            setSelectedEventId('');
          }}>Book Another Event</Button>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="sticky top-6 border-2 border-primary/20 shadow-lg">
      <CardHeader className="bg-primary/5 pb-4">
        <CardTitle>Book Details</CardTitle>
        <CardDescription>Check availability and send booking request</CardDescription>
      </CardHeader>
      <CardContent className="space-y-6 pt-6">

        {/* Service Selector (Only if services exist) */}
        {services.length > 0 && (
          <div className="space-y-2">
            <Label>Select Service</Label>
            <Select value={selectedServiceId} onValueChange={(value) => {
              setSelectedServiceId(value);
              setAvailabilityData(null); // Reset availability when service changes
            }}>
              <SelectTrigger>
                <SelectValue placeholder="Choose a service" />
              </SelectTrigger>
              <SelectContent>
                {services.map(service => (
                  <SelectItem key={service.id} value={service.id}>
                    {service.category} ({service.unit})
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        )}

        {/* Date and Time Inputs */}
        <div className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="start-datetime">Start Date & Time</Label>
            <Input
              id="start-datetime"
              type="datetime-local"
              value={startDateTime}
              onChange={(e) => {
                setStartDateTime(e.target.value);
                setAvailabilityData(null); // Reset availability when dates change
              }}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="end-datetime">End Date & Time</Label>
            <Input
              id="end-datetime"
              type="datetime-local"
              value={endDateTime}
              onChange={(e) => {
                setEndDateTime(e.target.value);
                setAvailabilityData(null); // Reset availability when dates change
              }}
            />
          </div>
        </div>

        {/* Check Availability Button */}
        <Button
          className="w-full"
          variant="outline"
          onClick={handleCheckAvailability}
          disabled={!selectedServiceId || !startDateTime || !endDateTime || checkingAvailability}
        >
          {checkingAvailability ? "Checking..." : (
            <>
              <Calendar className="mr-2 h-4 w-4" /> Check Availability
            </>
          )}
        </Button>

        {/* Availability Result */}
        {availabilityData && (
          <div className={`p-4 rounded-md border-2 ${availabilityData.available
            ? 'bg-green-50/50 border-green-500/50'
            : 'bg-red-50/50 border-red-500/50'
            }`}>
            <div className="flex items-start gap-2 mb-3">
              {availabilityData.available ? (
                <CheckCircle2 className="h-5 w-5 text-green-600 mt-0.5" />
              ) : (
                <AlertCircle className="h-5 w-5 text-red-600 mt-0.5" />
              )}
              <div className="flex-1">
                <h4 className="font-semibold text-sm">
                  {availabilityData.available ? 'Available' : 'Not Available'}
                </h4>
                {!availabilityData.available && availabilityData.conflictingBooking && (
                  <p className="text-xs text-muted-foreground mt-1">
                    Artist has a conflicting booking
                  </p>
                )}
              </div>
            </div>

            {availabilityData.available && (
              <div className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Price per {availabilityData.service.unit}</span>
                  <span className="font-medium">₹{(availabilityData.pricing.pricePerUnit ?? 0).toLocaleString()}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Number of {availabilityData.service.unit}s</span>
                  <span className="font-medium">{availabilityData.pricing.units}</span>
                </div>
                <div className="flex justify-between pt-2 border-t">
                  <span className="font-semibold">Total Price</span>
                  <span className="font-bold">₹{(availabilityData.pricing.totalPrice ?? 0).toLocaleString()}</span>
                </div>
                <div className="flex justify-between pt-1 text-primary">
                  <span className="font-semibold">Advance to Pay</span>
                  <span className="font-bold text-lg">₹{(availabilityData.pricing.advance ?? 0).toLocaleString()}</span>
                </div>
              </div>
            )}
          </div>
        )}

        {/* Book Now Button - Only shown when artist is available */}
        {availabilityData && availabilityData.available && (
          <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
            <DialogTrigger asChild>
              <Button
                className="w-full bg-gradient-to-r from-primary to-primary-glow hover:opacity-90"
                size="lg"
              >
                <Send className="mr-2 h-4 w-4" /> Book Now
              </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-[500px]">
              <DialogHeader>
                <DialogTitle>Select Event for Booking</DialogTitle>
                <DialogDescription>
                  Choose which event you want to book this artist for
                </DialogDescription>
              </DialogHeader>

              <div className="space-y-4 py-4">
                {/* Booking Summary */}
                <div className="bg-muted/50 p-3 rounded-md space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Artist</span>
                    <span className="font-medium">{artist.userId.displayName}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Service</span>
                    <span className="font-medium">{availabilityData.service.category}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Total Price</span>
                    <span className="font-medium">₹{(availabilityData.pricing.totalPrice ?? 0).toLocaleString()}</span>
                  </div>
                  <div className="flex justify-between text-primary font-bold pt-1 border-t border-primary/20">
                    <span>Advance to Pay</span>
                    <span>₹{(availabilityData.pricing.advance ?? 0).toLocaleString()}</span>
                  </div>
                </div>

                {/* Event Selector */}
                <div className="space-y-2">
                  <Label>Select Event</Label>
                  {loadingEvents ? (
                    <div className="flex items-center justify-center py-8">
                      <Loader2 className="h-6 w-6 animate-spin text-primary" />
                    </div>
                  ) : (
                    <Select value={selectedEventId} onValueChange={setSelectedEventId}>
                      <SelectTrigger>
                        <SelectValue placeholder="Choose an event" />
                      </SelectTrigger>
                      <SelectContent>
                        {bookingEvents.length > 0 ? (
                          bookingEvents.map(event => (
                            <SelectItem key={event.id} value={event.id}>
                              <div className="flex flex-col">
                                <span className="font-medium">{event.title}</span>
                                <span className="text-xs text-muted-foreground">
                                  {new Date(event.startAt).toLocaleDateString()}
                                </span>
                              </div>
                            </SelectItem>
                          ))
                        ) : (
                          <div className="p-2 text-sm text-muted-foreground text-center">
                            No events found
                          </div>
                        )}
                      </SelectContent>
                    </Select>
                  )}
                </div>

                {/* Selected Event Details */}
                {selectedEventId && (
                  <div className="text-sm space-y-2 bg-muted/50 p-3 rounded-md">
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Event Date</span>
                      <span>{new Date(bookingEvents.find(e => e.id === selectedEventId)?.startAt!).toLocaleDateString()}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Status</span>
                      <span className="text-green-600 font-medium">
                        {bookingEvents.find(e => e.id === selectedEventId)?.published ? 'Published' : 'Draft'}
                      </span>
                    </div>
                  </div>
                )}
              </div>

              <div className="flex gap-3">
                <Button
                  variant="outline"
                  className="flex-1"
                  onClick={() => setDialogOpen(false)}
                  disabled={loading}
                >
                  Cancel
                </Button>
                <Button
                  className="flex-1"
                  onClick={handleBooking}
                  disabled={!selectedEventId || loading}
                >
                  {loading ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" /> Sending...
                    </>
                  ) : (
                    <>
                      <Send className="mr-2 h-4 w-4" /> Send Request
                    </>
                  )}
                </Button>
              </div>
            </DialogContent>
          </Dialog>
        )}
      </CardContent>
    </Card>
  );
}
