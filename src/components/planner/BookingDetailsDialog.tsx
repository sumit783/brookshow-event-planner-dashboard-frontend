import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { format } from 'date-fns';
import { Loader2, MapPin, Calendar, CreditCard, User, Mail, Phone, AlertTriangle, Clock } from 'lucide-react';
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogHeader,
    DialogTitle,
    DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import {
    AlertDialog,
    AlertDialogAction,
    AlertDialogCancel,
    AlertDialogContent,
    AlertDialogDescription,
    AlertDialogFooter,
    AlertDialogHeader,
    AlertDialogTitle,
    AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { apiClient } from '@/services/apiClient';
import { config } from '@/config';
import { toast } from '@/hooks/use-toast';
import { BookingDetails } from '@/types';

interface BookingDetailsDialogProps {
    bookingId: string | null;
    open: boolean;
    onOpenChange: (open: boolean) => void;
}

export function BookingDetailsDialog({ bookingId, open, onOpenChange }: BookingDetailsDialogProps) {
    const queryClient = useQueryClient();
    const [cancelDialogOpen, setCancelDialogOpen] = useState(false);

    const { data, isLoading, error } = useQuery({
        queryKey: ['booking-details', bookingId],
        queryFn: () => apiClient.getBookingDetails(bookingId!),
        enabled: !!bookingId && open,
    });

    const cancelMutation = useMutation({
        mutationFn: () => apiClient.cancelBooking(bookingId!, 'cancelled'),
        onSuccess: () => {
            toast({
                title: "Booking Cancelled",
                description: "The booking has been successfully cancelled.",
            });
            queryClient.invalidateQueries({ queryKey: ['booked-artists'] });
            queryClient.invalidateQueries({ queryKey: ['booking-details', bookingId] });
            setCancelDialogOpen(false);
            onOpenChange(false);
        },
        onError: (error: any) => {
            toast({
                title: "Cancellation Failed",
                description: error.message || "Failed to cancel booking.",
                variant: "destructive",
            });
        }
    });

    const booking: BookingDetails | undefined = data?.booking;

    if (!open) return null;

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
                <DialogHeader>
                    <DialogTitle>Booking Details</DialogTitle>
                    <DialogDescription>
                        View complete details of your booking
                    </DialogDescription>
                </DialogHeader>

                {isLoading ? (
                    <div className="flex justify-center py-12">
                        <Loader2 className="h-8 w-8 animate-spin text-primary" />
                    </div>
                ) : error ? (
                    <div className="text-center py-8 text-red-500">
                        Failed to load booking details. Please try again.
                    </div>
                ) : booking ? (
                    <div className="space-y-6">
                        {/* Status Header */}
                        <div className="flex justify-between items-center bg-muted/30 p-4 rounded-lg">
                            <div>
                                <p className="text-sm text-muted-foreground">Booking ID</p>
                                <p className="font-mono font-medium">{booking._id}</p>
                            </div>
                            <div className="text-right">
                                <Badge className={
                                    booking.status === 'confirmed' ? 'bg-green-500' : 
                                    booking.status === 'cancelled' ? 'bg-red-500' : 'bg-yellow-500'
                                }>
                                    {booking.status.toUpperCase()}
                                </Badge>
                                <p className="text-xs text-muted-foreground mt-1">
                                    {format(new Date(booking.createdAt), 'PPP')}
                                </p>
                            </div>
                        </div>

                        {/* Artist Info */}
                        <div className="flex gap-4 items-start">
                            <img
                                src={`${config.API_BASE_URI}${booking.artistId.profileImage}` || "/placeholder-artist.jpg"}
                                alt={booking.artistId.userId.displayName}
                                className="w-20 h-20 rounded-lg object-cover"
                            />
                            <div>
                                <h3 className="text-lg font-bold">{booking.artistId.userId.displayName}</h3>
                                <div className="flex flex-wrap gap-2 mt-1">
                                    {booking.artistId.category.map((cat, i) => (
                                        <Badge key={i} variant="outline" className="text-xs">
                                            {cat}
                                        </Badge>
                                    ))}
                                </div>
                                <div className="flex items-center text-sm text-muted-foreground mt-2">
                                    <MapPin className="h-3 w-3 mr-1" />
                                    {booking.artistId.location.city}, {booking.artistId.location.state}
                                </div>
                            </div>
                        </div>

                        <Separator />

                        {/* Event & Schedule */}
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            <div>
                                <h4 className="font-semibold mb-3 flex items-center gap-2">
                                    <Calendar className="h-4 w-4" /> Event Details
                                </h4>
                                <div className="space-y-2 text-sm">
                                    <p><span className="text-muted-foreground">Event:</span> {booking.eventId.title}</p>
                                    <p><span className="text-muted-foreground">Venue:</span> {booking.eventId.venue}, {booking.eventId.city}</p>
                                    <p><span className="text-muted-foreground">Service:</span> {booking.serviceId.category} ({booking.serviceId.unit})</p>
                                </div>
                            </div>
                            <div>
                                <h4 className="font-semibold mb-3 flex items-center gap-2">
                                    <Clock className="h-4 w-4" /> Schedule
                                </h4>
                                <div className="space-y-2 text-sm">
                                    <p><span className="text-muted-foreground">Start:</span> {format(new Date(booking.startAt), 'PPP p')}</p>
                                    <p><span className="text-muted-foreground">End:</span> {format(new Date(booking.endAt), 'PPP p')}</p>
                                </div>
                            </div>
                        </div>

                        <Separator />

                        {/* Payment Details */}
                        <div>
                            <h4 className="font-semibold mb-3 flex items-center gap-2">
                                <CreditCard className="h-4 w-4" /> Payment Information
                            </h4>
                            <div className="bg-muted/30 p-4 rounded-lg space-y-3 text-sm">
                                <div className="flex justify-between">
                                    <span className="text-muted-foreground">Total Price</span>
                                    <span className="font-medium">₹{booking.totalPrice.toLocaleString()}</span>
                                </div>
                                <div className="flex justify-between">
                                    <span className="text-muted-foreground">Advance Paid</span>
                                    <span className="font-medium text-green-600">₹{booking.paidAmount.toLocaleString()}</span>
                                </div>
                                <div className="flex justify-between pt-2 border-t">
                                    <span className="font-semibold">Remaining Balance</span>
                                    <span className="font-bold">₹{(booking.totalPrice - booking.paidAmount).toLocaleString()}</span>
                                </div>
                                {booking.razorpayPaymentId && (
                                    <div className="text-xs text-muted-foreground mt-2 pt-2 border-t">
                                        Payment ID: <span className="font-mono">{booking.razorpayPaymentId}</span>
                                    </div>
                                )}
                            </div>
                        </div>

                        {/* Contact Info */}
                        {booking.artistId.userId.email && (
                             <div>
                                <h4 className="font-semibold mb-3 flex items-center gap-2">
                                    <User className="h-4 w-4" /> Contact
                                </h4>
                                <div className="space-y-2 text-sm">
                                    <p className="flex items-center gap-2">
                                        <Mail className="h-3 w-3 text-muted-foreground" /> 
                                        {booking.artistId.userId.email}
                                    </p>
                                    {booking.artistId.userId.phone && (
                                        <p className="flex items-center gap-2">
                                            <Phone className="h-3 w-3 text-muted-foreground" />
                                            {booking.artistId.userId.countryCode} {booking.artistId.userId.phone}
                                        </p>
                                    )}
                                </div>
                            </div>
                        )}
                        
                    </div>
                ) : null}

                <DialogFooter className="flex flex-col sm:flex-row gap-2 mt-6">
                    <Button variant="outline" onClick={() => onOpenChange(false)}>
                        Close
                    </Button>
                    
                    {booking && booking.status !== 'cancelled' && (
                         <AlertDialog open={cancelDialogOpen} onOpenChange={setCancelDialogOpen}>
                            <AlertDialogTrigger asChild>
                                <Button variant="destructive" className="sm:ml-auto">
                                    Cancel Booking
                                </Button>
                            </AlertDialogTrigger>
                            <AlertDialogContent>
                                <AlertDialogHeader>
                                    <AlertDialogTitle>Are you sure?</AlertDialogTitle>
                                    <AlertDialogDescription>
                                        This action cannot be undone. This will permanently cancel your booking with {booking.artistId.userId.displayName}.
                                        Start time is {format(new Date(booking.startAt), 'PPP')}.
                                    </AlertDialogDescription>
                                </AlertDialogHeader>
                                <AlertDialogFooter>
                                    <AlertDialogCancel>Dismiss</AlertDialogCancel>
                                    <AlertDialogAction 
                                        onClick={(e) => {
                                            e.preventDefault();
                                            cancelMutation.mutate();
                                        }}
                                        className="bg-red-600 hover:bg-red-700"
                                    >
                                        {cancelMutation.isPending ? (
                                            <>
                                                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                                Cancelling...
                                            </>
                                        ) : (
                                            "Confirm Cancellation"
                                        )}
                                    </AlertDialogAction>
                                </AlertDialogFooter>
                            </AlertDialogContent>
                        </AlertDialog>
                    )}
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
}
