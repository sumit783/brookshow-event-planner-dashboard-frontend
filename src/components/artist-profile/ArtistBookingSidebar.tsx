import { useState, useEffect, useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import { useNavigate } from 'react-router-dom';
import { config } from '@/config';
import { ArtistProfile, Event, ArtistService, ArtistAvailabilityResponse } from '@/types';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Send, CheckCircle2, Calendar as CalendarIcon, AlertCircle, Loader2 } from 'lucide-react';
import { apiClient } from '@/services/apiClient';
import { artistService } from '@/services/artist';
import { eventService } from '@/services/event';
import { toast } from '@/hooks/use-toast';
import { format } from 'date-fns';
import { Calendar } from '@/components/ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { DateRange } from 'react-day-picker';
import { cn } from '@/lib/utils';

interface ArtistBookingSidebarProps {
  artist: ArtistProfile;
  events: Event[];
  services?: ArtistService[];
}

export function ArtistBookingSidebar({ artist, events, services = [] }: ArtistBookingSidebarProps) {
  const navigate = useNavigate();
  const [selectedEventId, setSelectedEventId] = useState('');
  const [selectedServiceId, setSelectedServiceId] = useState('');
  const [dateRange, setDateRange] = useState<DateRange | undefined>(undefined);
  const [startTime, setStartTime] = useState('10:00');
  const [endTime, setEndTime] = useState('10:00');
  const [availabilityData, setAvailabilityData] = useState<ArtistAvailabilityResponse | null>(null);
  const [checkingAvailability, setCheckingAvailability] = useState(false);
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [dialogOpen, setDialogOpen] = useState(false);

  // Fetch Events using react-query
  const { data: bookingEvents = [], isLoading: loadingEvents } = useQuery({
    queryKey: ['planner-events'],
    queryFn: () => eventService.listEvents(),
    enabled: dialogOpen, // Only fetch when dialog opens
  });
  
  // Determine price based on availability data or selected service or fallback to artist base price
  const selectedService = services.find(s => s.id === selectedServiceId);
  const price = availabilityData
    ? availabilityData.price
    : (selectedService ? selectedService.price_for_planner : (artist.price_for_event_planner || 0));

  // Auto-select first service if available and none selected
  useEffect(() => {
    if (services.length > 0 && !selectedServiceId) {
      setSelectedServiceId(services[0].id);
    }
  }, [services, selectedServiceId]);

  async function handleCheckAvailability() {
    if (!selectedServiceId || !dateRange?.from || !dateRange?.to) {
      toast({
        title: "Missing Information",
        description: "Please select a service and a date range.",
        variant: "destructive"
      });
      return;
    }

    setCheckingAvailability(true);
    try {
      const startDateStr = format(dateRange.from, 'yyyy-MM-dd');
      const endDateStr = format(dateRange.to, 'yyyy-MM-dd');

      const response = await artistService.checkArtistAvailability(
        artist._id,
        selectedServiceId,
        startDateStr,
        endDateStr,
        startTime,
        endTime
      );

      setAvailabilityData(response);

      if (response.available) {
        toast({
          title: "Artist Available!",
          description: response.message || `Total price: ₹${response.price.toLocaleString()} for the requested range.`,
        });
      } else {
        toast({
          title: "Artist Not Available",
          description: response.message || "The artist has a conflicting booking for these dates.",
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

    const selectedEvent = bookingEvents.find(e => (e.id === selectedEventId || e._id === selectedEventId));

    setLoading(true);
    try {
      // 1. Create Booking & Get Order ID
      const bookingPayload = {
        artistId: artist._id,
        serviceId: selectedServiceId,
        eventId: selectedEventId,
        eventName: selectedEvent?.title || 'Unknown Event',
        startAt: availabilityData.duration?.start || '',
        endAt: availabilityData.duration?.end || '',
        advanceAmount: availabilityData.advance || 0,
        paidAmount: availabilityData.advance || 0 // Assuming full advance is paid now
      };

      const response = await apiClient.createArtistBookingPayment(bookingPayload);

      if (!response.success || !response.booking) {
         throw new Error(response.message || 'Failed to initiate booking payment');
      }

      const { razorpayOrderId, booking } = response.booking; // or response.booking.razorpayOrderId depending on structure.
      // Based on user provided JSON: 
      // response: { success: true, booking: { ..., razorpayOrderId: "..." }, razorpayOrder: { ... } }
      const orderId = response.booking.razorpayOrderId || response.razorpayOrder?.id;

      if (!orderId) {
          throw new Error('Invalid server response: Missing Order ID');
      }

      // 2. Load Razorpay SDK
      const res = await loadRazorpay();
      if (!res) {
          throw new Error('Razorpay SDK failed to load. Are you online?');
      }

      // 3. Open Razorpay Options
      const options = {
          key: config.RAZORPAY_KEY_ID, // Enter the Key ID generated from the Dashboard
          amount: (availabilityData.advance || 0) * 100, // Amount is in currency subunits. Default currency is INR.
          currency: "INR",
          name: "BrookShow Event Planner",
          description: `Booking Advance for ${artist.userId.displayName}`,
          image: "https://brookshow.com/logo.png", // optional
          order_id: orderId,
          handler: async function (response: any) {
              try {
                  setLoading(true);
                  // 4. Verify Payment
                  const verificationData = {
                      razorpay_order_id: response.razorpay_order_id,
                      razorpay_payment_id: response.razorpay_payment_id,
                      razorpay_signature: response.razorpay_signature
                  };

                  const verifyRes = await apiClient.verifyArtistBookingPayment(verificationData);
                  
                  if (verifyRes.success) {
                      setSuccess(true);
                      setDialogOpen(false);
                      toast({
                          title: "Payment Successful!",
                          description: "Your booking has been confirmed.",
                      });
                      
                      // Redirect to planner dashboard/profile after a short delay
                      setTimeout(() => {
                           navigate('/profile'); // Redirect to planner profile
                      }, 2000);

                  } else {
                      throw new Error(verifyRes.message || 'Payment verification failed');
                  }
              } catch (verifyError: any) {
                  toast({
                      title: "Verification Failed",
                      description: verifyError.message || "Payment verification failed",
                      variant: "destructive"
                  });
              } finally {
                  setLoading(false);
              }
          },
          prefill: {
              name: "Planner Name", // We could fetch planner details if needed
              email: "planner@example.com",
              contact: "9999999999"
          },
          notes: {
              address: "Event Planner Corporate Office"
          },
          theme: {
              color: "#3399cc"
          }
      };

      const paymentObject = new window.Razorpay(options);
      paymentObject.open();

    } catch (error: any) {
      toast({
        title: "Booking Failed",
        description: error.message || "Something went wrong.",
        variant: "destructive"
      });
      setLoading(false); // Only set loading false on error, success handled in callback
    }
  }

  function loadRazorpay() {
    return new Promise((resolve) => {
      const script = document.createElement('script');
      script.src = 'https://checkout.razorpay.com/v1/checkout.js';
      script.onload = () => {
        resolve(true);
      };
      script.onerror = () => {
        resolve(false);
      };
      document.body.appendChild(script);
    });
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
            setDateRange(undefined);
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

        {/* Service Selector */}
        {services.length > 0 ? (
          <div className="space-y-2">
            <Label className="text-primary font-semibold">Step 1: Select Service</Label>
            <Select value={selectedServiceId} onValueChange={(value) => {
              setSelectedServiceId(value);
              setAvailabilityData(null); 
            }}>
              <SelectTrigger className="border-primary/50 focus:ring-primary">
                <SelectValue placeholder="Choose a service" />
              </SelectTrigger>
              <SelectContent>
                {services.map(service => (
                  <SelectItem key={service.id} value={service.id}>
                    <div className="flex justify-between items-center w-full gap-4">
                      <span>{service.category}</span>
                      <span className="text-xs text-muted-foreground font-mono">
                         ₹{service.price_for_planner.toLocaleString()}/{service.unit}
                      </span>
                    </div>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        ) : (
          <div className="p-3 bg-yellow-50 border border-yellow-200 rounded-md text-sm text-yellow-800 flex items-center gap-2">
            <AlertCircle className="h-4 w-4" />
            No specific services listed. Using base artist price.
          </div>
        )}

        <div className={`space-y-4 ${services.length > 0 && !selectedServiceId ? 'opacity-50 pointer-events-none' : ''}`}>
          <Label className="text-primary font-semibold">Step 2: Select Dates</Label>
          
          <div className="space-y-4">
            <div className="grid gap-2">
              <Popover>
                <PopoverTrigger asChild>
                  <Button
                    id="date"
                    variant={"outline"}
                    className={cn(
                      "w-full justify-start text-left font-normal",
                      !dateRange && "text-muted-foreground"
                    )}
                  >
                    <CalendarIcon className="mr-2 h-4 w-4" />
                    {dateRange?.from ? (
                      dateRange.to ? (
                        <>
                          {format(dateRange.from, "LLL dd, y")} -{" "}
                          {format(dateRange.to, "LLL dd, y")}
                        </>
                      ) : (
                        format(dateRange.from, "LLL dd, y")
                      )
                    ) : (
                      <span>Pick a date range</span>
                    )}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0" align="start">
                  <Calendar
                    initialFocus
                    mode="range"
                    defaultMonth={dateRange?.from}
                    selected={dateRange}
                    onSelect={(range) => {
                      setDateRange(range);
                      setAvailabilityData(null);
                    }}
                    numberOfMonths={2}
                  />
                </PopoverContent>
              </Popover>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="start-time">Start Time</Label>
                <Input
                  id="start-time"
                  type="time"
                  value={startTime}
                  onChange={(e) => {
                    setStartTime(e.target.value);
                    setAvailabilityData(null);
                  }}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="end-time">End Time</Label>
                <Input
                  id="end-time"
                  type="time"
                  value={endTime}
                  onChange={(e) => {
                    setEndTime(e.target.value);
                    setAvailabilityData(null);
                  }}
                />
              </div>
            </div>
          </div>

          <Button
            className="w-full"
            variant="outline"
            onClick={handleCheckAvailability}
            disabled={!selectedServiceId || !dateRange?.from || !dateRange?.to || checkingAvailability}
          >
            {checkingAvailability ? "Checking..." : (
              <>
                <CalendarIcon className="mr-2 h-4 w-4" /> Check Availability
              </>
            )}
          </Button>

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
                  <p className="text-xs text-muted-foreground mt-1">
                    {availabilityData.message}
                  </p>
                </div>
              </div>

              {availabilityData.available && (
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span className="text-muted-foreground text-xs">Base Price</span>
                    <span className="font-medium text-xs">₹{(availabilityData.basePrice ?? 0).toLocaleString()}</span>
                  </div>
                  <div className="flex justify-between pt-2 border-t">
                    <span className="font-semibold">Total Price</span>
                    <span className="font-bold">₹{(availabilityData.price ?? 0).toLocaleString()}</span>
                  </div>
                  <div className="flex justify-between pt-1 text-primary">
                    <span className="font-semibold">Advance to Pay</span>
                    <span className="font-bold text-lg">₹{(availabilityData.advance ?? 0).toLocaleString()}</span>
                  </div>
                  <div className="text-[10px] text-muted-foreground text-right italic">
                    Unit: {availabilityData.unit}
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
                  <Send className="mr-2 h-4 w-4" /> Book Now (Advance: ₹{(availabilityData.advance ?? 0).toLocaleString()})
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
                  <div className="bg-muted/50 p-3 rounded-md space-y-2 text-sm">
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Artist</span>
                      <span className="font-medium">{artist.userId.displayName}</span>
                    </div>
                    {availabilityData.duration && (
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">Dates</span>
                        <span className="font-medium text-xs">
                          {new Date(availabilityData.duration.start).toLocaleDateString()} to {new Date(availabilityData.duration.end).toLocaleDateString()}
                        </span>
                      </div>
                    )}
                    <div className="flex justify-between text-primary font-bold pt-1 border-t border-primary/20">
                      <span>Total Price</span>
                      <span>₹{(availabilityData.price ?? 0).toLocaleString()}</span>
                    </div>
                    <div className="flex justify-between text-primary font-bold">
                      <span>Advance to Pay</span>
                      <span>₹{(availabilityData.advance ?? 0).toLocaleString()}</span>
                    </div>
                  </div>

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
                              <SelectItem key={event._id || event.id} value={event._id || event.id}>
                                {event.title}
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
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" /> booking...
                      </>
                    ) : (
                      <>
                        <Send className="mr-2 h-4 w-4" /> Book Now
                      </>
                    )}
                  </Button>
                </div>
              </DialogContent>
            </Dialog>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
