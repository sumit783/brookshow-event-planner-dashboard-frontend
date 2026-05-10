import { useState } from 'react';
import { format } from 'date-fns';
import { cn } from '@/lib/utils';
import { MapPin, Calendar, Clock, Loader2 } from 'lucide-react';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { config } from '@/config';
import { BookedArtist } from '@/types';
import { apiClient } from '@/services/apiClient';
import { toast } from '@/hooks/use-toast';

interface BookedArtistCardProps {
    booking: BookedArtist;
    onViewDetails: (id: string) => void;
}

export function BookedArtistCard({ booking, onViewDetails }: BookedArtistCardProps) {
    const [paying, setPaying] = useState(false);

    const loadRazorpay = () => {
        return new Promise((resolve) => {
            const script = document.createElement('script');
            script.src = 'https://checkout.razorpay.com/v1/checkout.js';
            script.onload = () => resolve(true);
            script.onerror = () => resolve(false);
            document.body.appendChild(script);
        });
    };

    const handlePayNow = async () => {
        setPaying(true);
        try {
            const response = await apiClient.payAdvance(booking._id);
            if (!response.success || !response.razorpayOrder) {
                throw new Error(response.message || 'Failed to initiate payment');
            }

            const isLoaded = await loadRazorpay();
            if (!isLoaded) {
                throw new Error('Razorpay SDK failed to load');
            }

            const options = {
                key: config.RAZORPAY_KEY_ID,
                amount: response.razorpayOrder.amount,
                currency: response.razorpayOrder.currency,
                name: "BrookShow Event Planner",
                description: `Advance payment for booking ${booking._id}`,
                order_id: response.razorpayOrder.id,
                handler: async function (res: any) {
                    try {
                        setPaying(true);
                        const verifyRes = await apiClient.verifyArtistBookingPayment({
                            razorpay_order_id: res.razorpay_order_id,
                            razorpay_payment_id: res.razorpay_payment_id,
                            razorpay_signature: res.razorpay_signature
                        });

                        if (verifyRes.success) {
                            toast({
                                title: "Payment Successful",
                                description: "Your advance payment has been confirmed.",
                            });
                            // Refresh the page to reflect changes
                            window.location.reload();
                        } else {
                            throw new Error(verifyRes.message || 'Payment verification failed');
                        }
                    } catch (err: any) {
                        toast({
                            title: "Verification Error",
                            description: err.message,
                            variant: "destructive"
                        });
                    } finally {
                        setPaying(false);
                    }
                },
                prefill: {
                    name: "Planner",
                    email: "planner@example.com", // These should ideally come from profile context if available
                },
                theme: {
                    color: "#3399cc"
                }
            };

            const rzp = new (window as any).Razorpay(options);
            rzp.open();
        } catch (error: any) {
            toast({
                title: "Payment Error",
                description: error.message || "Something went wrong",
                variant: "destructive"
            });
        } finally {
            setPaying(false);
        }
    };

    return (
        <Card className="overflow-hidden hover:shadow-md transition-shadow">
            <div className="flex flex-col sm:flex-row">
                {/* Artist Image Side */}
                {/* Artist Image Side */}
                <div className="w-full sm:w-40 md:w-48 h-40 sm:h-auto relative bg-muted shrink-0">
                    <img
                        src={booking.artistId.profileImage?.startsWith('http') ? booking.artistId.profileImage : (`${config.API_BASE_URI}${booking.artistId.profileImage}` || "/placeholder-artist.jpg")}
                        alt={booking.artistId.userId.displayName}
                        className="w-full h-full object-cover"
                    />
                    <div className="absolute top-2 right-2 sm:hidden">
                        <Badge className={cn(
                            "text-[10px] px-2 h-5",
                            booking.status === 'confirmed' ? 'bg-green-500 hover:bg-green-600' : 'bg-yellow-500 hover:bg-yellow-600'
                        )}>{booking.status.toUpperCase()}</Badge>
                    </div>
                </div>

                {/* Details Side */}
                <div className="flex-1 p-4 sm:p-5 md:p-6 flex flex-col justify-between min-w-0">
                    <div>
                        <div className="flex justify-between items-start mb-3">
                            <div className="min-w-0">
                                <h3 className="text-base md:text-lg font-bold flex flex-wrap items-center gap-2">
                                    <span className="truncate">{booking.artistId.userId.displayName}</span>
                                    <span className="text-[10px] font-normal text-muted-foreground px-2 py-0.5 bg-muted rounded-full">
                                        {booking.serviceId.category}
                                    </span>
                                </h3>
                                <div className="flex items-center text-xs text-muted-foreground mt-1">
                                    <MapPin className="h-3 w-3 mr-1 shrink-0" />
                                    <span className="truncate">{booking.artistId.location.city}, {booking.artistId.location.state}</span>
                                </div>
                            </div>
                            <div className="hidden sm:block text-right shrink-0">
                                <Badge className={cn(
                                    "mb-1 text-[10px] md:text-xs",
                                    booking.status === 'confirmed' ? 'bg-green-500 hover:bg-green-600' : 'bg-yellow-500 hover:bg-yellow-600'
                                )}>
                                    {booking.status.toUpperCase()}
                                </Badge>
                                <div className="text-[10px] text-muted-foreground">
                                    {booking.paymentStatus === 'paid' ? 'Paid' : 'Payment Pending'}
                                </div>
                            </div>
                        </div>

                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 md:gap-4 mt-2 bg-muted/30 p-3 rounded-lg text-xs md:text-sm">
                            <div className="min-w-0">
                                <p className="text-muted-foreground mb-0.5 text-[10px] md:text-xs uppercase tracking-wider">Event</p>
                                <p className="font-medium flex items-center gap-1 truncate">
                                    <Calendar className="h-3 w-3 shrink-0" />
                                    <span className="truncate">{booking.eventId.title}</span>
                                </p>
                            </div>
                            <div>
                                <p className="text-muted-foreground mb-0.5 text-[10px] md:text-xs uppercase tracking-wider">Booking Dates</p>
                                <p className="font-medium flex items-center gap-1">
                                    <Clock className="h-3 w-3 shrink-0" />
                                    <span>
                                        {format(new Date(booking.startAt), 'MMM dd')} | {format(new Date(booking.startAt), 'HH:mm')}
                                    </span>
                                </p>
                            </div>
                        </div>
                    </div>

                    <div className="flex flex-col sm:flex-row justify-between items-start sm:items-end mt-4 pt-4 border-t gap-4">
                        <div className="flex flex-col">
                            <span className="text-[10px] text-muted-foreground uppercase tracking-wider">Booking ID</span>
                            <span className="font-mono text-[11px] font-medium">{booking._id.substring(0, 12)}...</span>
                        </div>
                    <div className="flex items-center justify-between w-full sm:w-auto gap-4 md:gap-6">
                        <div className="text-left sm:text-right">
                            <span className="text-[10px] text-muted-foreground block uppercase tracking-wider">Total Paid</span>
                            <span className="text-lg md:text-xl font-bold text-primary">₹{booking.totalPrice.toLocaleString()}</span>
                        </div>
                        <div className="flex gap-2">
                            {booking.status === 'pending' && booking.paymentStatus === 'unpaid' && (
                                <Button
                                    size="sm"
                                    className="h-9 px-4 text-xs font-semibold bg-green-600 hover:bg-green-700 text-white"
                                    onClick={handlePayNow}
                                    disabled={paying}
                                >
                                    {paying ? <Loader2 className="h-3 w-3 animate-spin mr-1" /> : null}
                                    Pay Now
                                </Button>
                            )}
                            <Button
                                variant="outline"
                                size="sm"
                                className="h-9 px-4 text-xs font-semibold"
                                onClick={() => onViewDetails(booking._id)}
                            >
                                Details
                            </Button>
                        </div>
                    </div>
                    </div>
                </div>
            </div>
        </Card>
    );
}
