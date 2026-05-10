import { useState, useEffect } from 'react';
import { useQuery } from '@tanstack/react-query';
import { useNavigate } from 'react-router-dom';
import { config } from '@/config';
import { ArtistProfile, Event, ArtistService, ArtistAvailabilityResponse } from '@/types';
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
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { MapContainer, TileLayer, Marker, useMapEvents } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import markerIcon2x from 'leaflet/dist/images/marker-icon-2x.png';
import markerIcon from 'leaflet/dist/images/marker-icon.png';
import markerShadow from 'leaflet/dist/images/marker-shadow.png';

delete (L.Icon.Default.prototype as any)._getIconUrl;
L.Icon.Default.mergeOptions({
  iconUrl: markerIcon,
  iconRetinaUrl: markerIcon2x,
  shadowUrl: markerShadow,
});

function MapClickHandler({ onClick }: { onClick: (lat: number, lng: number) => void }) {
  useMapEvents({
    click: (e) => onClick(e.latlng.lat, e.latlng.lng),
  });
  return null;
}

// Import from local UI components
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue
} from '@/components/ui/select';

interface ArtistBookingFormProps {
    artist: ArtistProfile;
    events: Event[];
    services?: ArtistService[];
    onSuccess?: () => void;
    onClose?: () => void;
}

export function ArtistBookingForm({ artist, events, services = [], onSuccess, onClose }: ArtistBookingFormProps) {
    const navigate = useNavigate();
    const [selectedEventId, setSelectedEventId] = useState('');
    const [selectedServiceId, setSelectedServiceId] = useState('');
    const [dateRange, setDateRange] = useState<DateRange | undefined>(undefined);
    const [startTime, setStartTime] = useState('10:00');
    const [endTime, setEndTime] = useState('10:00');
    const [availabilityData, setAvailabilityData] = useState<ArtistAvailabilityResponse | null>(null);
    const [checkingAvailability, setCheckingAvailability] = useState(false);
    const [loading, setLoading] = useState(false);
    const [dialogOpen, setDialogOpen] = useState(false);
    const [bookingType, setBookingType] = useState('select'); // 'select' | 'manual'
    const [manualData, setManualData] = useState({
        eventName: '',
        eventAddress: '',
        eventCity: '',
        eventState: '',
        eventCountry: '',
        eventPincode: '',
        eventLat: 19.076,
        eventLng: 72.8777,
        clientPhoneNumber: '',
        clientName: ''
    });

    const handleMapClick = async (lat: number, lng: number) => {
        setManualData(prev => ({ ...prev, eventLat: lat, eventLng: lng }));
        try {
            const response = await fetch(`https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lng}&addressdetails=1`);
            const data = await response.json();
            if (data && data.address) {
                const address = data.address;
                const city = address.city || address.town || address.village || address.suburb || '';
                const state = address.state || '';
                const country = address.country || '';
                const postcode = address.postcode || '';
                setManualData(prev => ({
                    ...prev,
                    eventAddress: data.display_name,
                    eventCity: city,
                    eventState: state,
                    eventCountry: country,
                    eventPincode: postcode
                }));
            }
        } catch (error) {
            console.error('Reverse geocoding error:', error);
        }
    };

    // Fetch Events using react-query for the booking selector
    const { data: bookingEvents = [], isLoading: loadingEvents } = useQuery({
        queryKey: ['planner-events'],
        queryFn: () => eventService.listEvents(),
        enabled: dialogOpen,
    });

    // Determine price
    const selectedService = services.find(s => s.id === selectedServiceId);

    // Auto-select first service
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
                    description: response.message || `Total price: ₹${response.price.toLocaleString()}`,
                });
            } else {
                toast({
                    title: "Artist Not Available",
                    description: response.message || "Conflict found for these dates.",
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
        if (bookingType === 'select' && !selectedEventId) return;
        if (!availabilityData?.available) return;

        const selectedEvent = bookingEvents.find(e => (e.id === selectedEventId || e._id === selectedEventId));

        setLoading(true);
        try {
            const bookingPayload: any = {
                artistId: artist._id,
                serviceId: selectedServiceId,
                startAt: availabilityData.duration?.start || '',
                endAt: availabilityData.duration?.end || '',
                advanceAmount: availabilityData.advance || 0,
                paidAmount: availabilityData.advance || 0
            };

            if (bookingType === 'select') {
                bookingPayload.eventId = selectedEventId;
                bookingPayload.eventName = selectedEvent?.title || 'Unknown Event';
            } else {
                bookingPayload.eventName = manualData.eventName;
                bookingPayload.eventAddress = manualData.eventAddress;
                bookingPayload.eventCity = manualData.eventCity;
                bookingPayload.eventState = manualData.eventState;
                bookingPayload.eventCountry = manualData.eventCountry;
                bookingPayload.eventPincode = manualData.eventPincode;
                bookingPayload.eventLat = manualData.eventLat;
                bookingPayload.eventLng = manualData.eventLng;
                bookingPayload.clientPhoneNumber = manualData.clientPhoneNumber;
                bookingPayload.clientName = manualData.clientName;
            }

            const response = await apiClient.createArtistBookingPayment(bookingPayload);
            if (!response.success || !response.booking) throw new Error(response.message || 'Payment initiation failed');

            const orderId = response.booking.razorpayOrderId || response.razorpayOrder?.id;
            if (!orderId) throw new Error('Missing Order ID');

            const loaded = await loadRazorpay();
            if (!loaded) throw new Error('Razorpay SDK failed to load');

            const options = {
                key: config.RAZORPAY_KEY_ID,
                amount: (availabilityData.advance || 0) * 100,
                currency: "INR",
                name: "BrookShow Event Planner",
                description: `Booking Advance for ${artist.userId.displayName}`,
                order_id: orderId,
                handler: async function (res: any) {
                    try {
                        setLoading(true);
                        const verifyRes = await apiClient.verifyArtistBookingPayment({
                            razorpay_order_id: res.razorpay_order_id,
                            razorpay_payment_id: res.razorpay_payment_id,
                            razorpay_signature: res.razorpay_signature
                        });

                        if (verifyRes.success) {
                            toast({ title: "Success!", description: "Booking confirmed." });
                            onSuccess?.();
                            onClose?.();
                            navigate('/profile');
                        } else {
                            throw new Error(verifyRes.message || 'Verification failed');
                        }
                    } catch (err: any) {
                        toast({ title: "Error", description: err.message, variant: "destructive" });
                    } finally {
                        setLoading(false);
                    }
                },
                prefill: {
                    name: "Planner",
                    email: "planner@example.com",
                    contact: "9999999999"
                },
                theme: { color: "#3399cc" }
            };

            const rzp = new (window as any).Razorpay(options);
            rzp.open();
        } catch (error: any) {
            toast({ title: "Booking Failed", description: error.message, variant: "destructive" });
            setLoading(false);
        }
    }

    function loadRazorpay() {
        return new Promise((resolve) => {
            const script = document.createElement('script');
            script.src = 'https://checkout.razorpay.com/v1/checkout.js';
            script.onload = () => resolve(true);
            script.onerror = () => resolve(false);
            document.body.appendChild(script);
        });
    }

    return (
        <div className="space-y-6">
            {/* Service Selector */}
            {services.length > 0 ? (
                <div className="space-y-2">
                    <Label className="text-primary font-semibold">Step 1: Select Service</Label>
                    <Select value={selectedServiceId} onValueChange={(v) => { setSelectedServiceId(v); setAvailabilityData(null); }}>
                        <SelectTrigger className="border-primary/50">
                            <SelectValue placeholder="Choose a service" />
                        </SelectTrigger>
                        <SelectContent>
                            {services.map(s => (
                                <SelectItem key={s.id} value={s.id}>
                                    <div className="flex justify-between items-center w-full gap-4">
                                        <span>{s.category}</span>
                                        <span className="text-xs text-muted-foreground">₹{s.price_for_planner.toLocaleString()}</span>
                                    </div>
                                </SelectItem>
                            ))}
                        </SelectContent>
                    </Select>
                </div>
            ) : (
                <div className="p-3 bg-yellow-50 border border-yellow-200 rounded-md text-sm text-yellow-800 flex items-center gap-2">
                    <AlertCircle className="h-4 w-4" /> Base artist price will be used.
                </div>
            )}

            {/* Date & Time Selection */}
            <div className={cn("space-y-4", services.length > 0 && !selectedServiceId && "opacity-50 pointer-events-none")}>
                <Label className="text-primary font-semibold">Step 2: Select Dates</Label>
                <div className="space-y-4">
                    <Popover>
                        <PopoverTrigger asChild>
                            <Button variant="outline" className={cn("w-full justify-start text-left font-normal", !dateRange && "text-muted-foreground")}>
                                <CalendarIcon className="mr-2 h-4 w-4" />
                                {dateRange?.from ? (dateRange.to ? `${format(dateRange.from, "LLL dd")} - ${format(dateRange.to, "LLL dd, y")}` : format(dateRange.from, "LLL dd, y")) : <span>Pick dates</span>}
                            </Button>
                        </PopoverTrigger>
                        <PopoverContent className="w-auto p-0" align="start">
                            <Calendar mode="range" selected={dateRange} onSelect={(r) => { setDateRange(r); setAvailabilityData(null); }} numberOfMonths={2} />
                        </PopoverContent>
                    </Popover>

                    <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-2">
                            <Label>Start Time</Label>
                            <Input type="time" value={startTime} onChange={(e) => { setStartTime(e.target.value); setAvailabilityData(null); }} />
                        </div>
                        <div className="space-y-2">
                            <Label>End Time</Label>
                            <Input type="time" value={endTime} onChange={(e) => { setEndTime(e.target.value); setAvailabilityData(null); }} />
                        </div>
                    </div>
                </div>

                <Button className="w-full" variant="outline" onClick={handleCheckAvailability} disabled={!selectedServiceId || !dateRange?.from || checkingAvailability}>
                    {checkingAvailability ? <Loader2 className="h-4 w-4 animate-spin mx-auto" /> : "Check Availability"}
                </Button>

                {/* Availability Result */}
                {availabilityData && (
                    <div className={cn("p-4 rounded-md border-2", availabilityData.available ? 'bg-green-50/50 border-green-500/50' : 'bg-red-50/50 border-red-500/50')}>
                        <div className="flex items-start gap-2 mb-3">
                            {availabilityData.available ? <CheckCircle2 className="h-5 w-5 text-green-600 mt-0.5" /> : <AlertCircle className="h-5 w-5 text-red-600 mt-0.5" />}
                            <div>
                                <h4 className="font-semibold text-sm">{availabilityData.available ? 'Available' : 'Not Available'}</h4>
                                <p className="text-xs text-muted-foreground mt-1">{availabilityData.message}</p>
                            </div>
                        </div>

                        {availabilityData.available && (
                            <div className="space-y-2 text-sm">
                                <div className="flex justify-between md:text-xs">
                                    <span className="text-muted-foreground">Base Price</span>
                                    <span>₹{(availabilityData.basePrice ?? 0).toLocaleString()}</span>
                                </div>
                                <div className="flex justify-between border-t pt-2 font-bold text-primary">
                                    <span>Advance to Pay</span>
                                    <span className="text-lg">₹{(availabilityData.advance ?? 0).toLocaleString()}</span>
                                </div>
                            </div>
                        )}
                    </div>
                )}

                {/* Book Now Button */}
                {availabilityData?.available && (
                    <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
                        <DialogTrigger asChild>
                            <Button className="w-full bg-gradient-to-r from-primary to-primary-600 shadow-md h-11" size="lg">
                                <Send className="mr-2 h-4 w-4" /> Book Now
                            </Button>
                        </DialogTrigger>
                        <DialogContent className="sm:max-w-[550px] max-h-[90vh] overflow-y-auto">
                            <DialogHeader>
                                <DialogTitle>Book Artist</DialogTitle>
                                <DialogDescription>Select an event or enter details manually.</DialogDescription>
                            </DialogHeader>
                            <div className="space-y-4 py-4">
                                <div className="bg-muted/50 p-4 rounded-lg text-sm space-y-2">
                                    <div className="flex justify-between">
                                        <span className="text-muted-foreground">Artist</span>
                                        <span className="font-medium">{artist.userId.displayName}</span>
                                    </div>
                                    <div className="flex justify-between text-primary font-bold border-t pt-2">
                                        <span>Advance Amount</span>
                                        <span>₹{(availabilityData.advance ?? 0).toLocaleString()}</span>
                                    </div>
                                </div>

                                <Tabs value={bookingType} onValueChange={setBookingType}>
                                    <TabsList className="grid w-full grid-cols-2">
                                        <TabsTrigger value="select">Select Event</TabsTrigger>
                                        <TabsTrigger value="manual">Add Manually</TabsTrigger>
                                    </TabsList>
                                    <TabsContent value="select" className="space-y-4 pt-4">
                                        <div className="space-y-2">
                                            <Label>Select Event</Label>
                                            {loadingEvents ? <Loader2 className="h-6 w-6 animate-spin mx-auto" /> : (
                                                <Select value={selectedEventId} onValueChange={setSelectedEventId}>
                                                    <SelectTrigger><SelectValue placeholder="Choose an event" /></SelectTrigger>
                                                    <SelectContent>
                                                        {bookingEvents.length > 0 ? bookingEvents.map(e => <SelectItem key={e._id || e.id} value={e._id || e.id}>{e.title}</SelectItem>) : <div className="p-2 text-center text-sm text-muted-foreground">No events found</div>}
                                                    </SelectContent>
                                                </Select>
                                            )}
                                        </div>
                                    </TabsContent>
                                    <TabsContent value="manual" className="space-y-4 pt-4">
                                        <div className="grid grid-cols-2 gap-4">
                                            <div className="space-y-2">
                                                <Label>Event Name</Label>
                                                <Input placeholder="Event Name" value={manualData.eventName} onChange={e => setManualData(p => ({...p, eventName: e.target.value}))} />
                                            </div>
                                            <div className="space-y-2">
                                                <Label>Client Name</Label>
                                                <Input placeholder="Client Name" value={manualData.clientName} onChange={e => setManualData(p => ({...p, clientName: e.target.value}))} />
                                            </div>
                                            <div className="space-y-2">
                                                <Label>Client Phone</Label>
                                                <Input placeholder="Phone Number" value={manualData.clientPhoneNumber} onChange={e => setManualData(p => ({...p, clientPhoneNumber: e.target.value}))} />
                                            </div>
                                            <div className="space-y-2">
                                                <Label>Pincode</Label>
                                                <Input placeholder="Pincode" value={manualData.eventPincode} onChange={e => setManualData(p => ({...p, eventPincode: e.target.value}))} />
                                            </div>
                                        </div>

                                        <div className="space-y-2">
                                            <Label>Location Map (Click to select)</Label>
                                            <div className="h-[200px] rounded-md overflow-hidden border">
                                                <MapContainer center={[manualData.eventLat, manualData.eventLng]} zoom={13} style={{ height: '100%', width: '100%' }}>
                                                    <TileLayer url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" />
                                                    <MapClickHandler onClick={handleMapClick} />
                                                    <Marker position={[manualData.eventLat, manualData.eventLng]} />
                                                </MapContainer>
                                            </div>
                                            <div className="text-xs text-muted-foreground flex justify-between">
                                                <span>Lat: {manualData.eventLat.toFixed(4)}</span>
                                                <span>Lng: {manualData.eventLng.toFixed(4)}</span>
                                            </div>
                                        </div>

                                        <div className="space-y-2">
                                            <Label>Event Address</Label>
                                            <Input placeholder="Full Address" value={manualData.eventAddress} onChange={e => setManualData(p => ({...p, eventAddress: e.target.value}))} />
                                        </div>
                                        <div className="grid grid-cols-3 gap-4">
                                            <div className="space-y-2">
                                                <Label>City</Label>
                                                <Input placeholder="City" value={manualData.eventCity} onChange={e => setManualData(p => ({...p, eventCity: e.target.value}))} />
                                            </div>
                                            <div className="space-y-2">
                                                <Label>State</Label>
                                                <Input placeholder="State" value={manualData.eventState} onChange={e => setManualData(p => ({...p, eventState: e.target.value}))} />
                                            </div>
                                            <div className="space-y-2">
                                                <Label>Country</Label>
                                                <Input placeholder="Country" value={manualData.eventCountry} onChange={e => setManualData(p => ({...p, eventCountry: e.target.value}))} />
                                            </div>
                                        </div>
                                    </TabsContent>
                                </Tabs>
                            </div>
                            <div className="flex gap-3 mt-2">
                                <Button variant="outline" className="flex-1" onClick={() => setDialogOpen(false)} disabled={loading}>Cancel</Button>
                                <Button className="flex-1" onClick={handleBooking} disabled={(bookingType === 'select' && !selectedEventId) || (bookingType === 'manual' && !manualData.eventName) || loading}>
                                    {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : "Confirm & Pay"}
                                </Button>
                            </div>
                        </DialogContent>
                    </Dialog>
                )}
            </div>
        </div>
    );
}
