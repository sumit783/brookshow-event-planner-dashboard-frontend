import { format } from 'date-fns';
import { MapPin, Calendar, Clock } from 'lucide-react';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { config } from '@/config';
import { BookedArtist } from '@/types';

interface BookedArtistCardProps {
    booking: BookedArtist;
    onViewDetails: (id: string) => void;
}

export function BookedArtistCard({ booking, onViewDetails }: BookedArtistCardProps) {
    return (
        <Card className="overflow-hidden hover:shadow-md transition-shadow">
            <div className="flex flex-col sm:flex-row">
                {/* Artist Image Side */}
                <div className="w-full sm:w-48 h-32 sm:h-auto relative bg-muted">
                    <img
                        src={`${config.API_BASE_URI}${booking.artistId.profileImage}` || "/placeholder-artist.jpg"}
                        alt={booking.artistId.userId.displayName}
                        className="w-full h-full object-cover"
                    />
                    <div className="absolute top-2 right-2 sm:hidden">
                        <Badge className={
                            booking.status === 'confirmed' ? 'bg-green-500' : 'bg-yellow-500'
                        }>{booking.status}</Badge>
                    </div>
                </div>

                {/* Details Side */}
                <div className="flex-1 p-4 sm:p-6 flex flex-col justify-between">
                    <div>
                        <div className="flex justify-between items-start mb-2">
                            <div>
                                <h3 className="text-lg font-bold flex items-center gap-2">
                                    {booking.artistId.userId.displayName}
                                    <span className="text-xs font-normal text-muted-foreground px-2 py-0.5 bg-muted rounded-full">
                                        {booking.serviceId.category}
                                    </span>
                                </h3>
                                <div className="flex items-center text-sm text-muted-foreground mt-1">
                                    <MapPin className="h-3 w-3 mr-1" />
                                    {booking.artistId.location.city}, {booking.artistId.location.state}
                                </div>
                            </div>
                            <div className="hidden sm:block text-right">
                                <Badge className={`mb-1 ${booking.status === 'confirmed' ? 'bg-green-500 hover:bg-green-600' : 'bg-yellow-500 hover:bg-yellow-600'
                                    }`}>
                                    {booking.status.toUpperCase()}
                                </Badge>
                                <div className="text-xs text-muted-foreground">
                                    {booking.paymentStatus === 'paid' ? 'Paid' : 'Payment Pending'}
                                </div>
                            </div>
                        </div>

                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mt-4 bg-muted/30 p-3 rounded-md text-sm">
                            <div>
                                <p className="text-muted-foreground mb-1">Event</p>
                                <p className="font-medium flex items-center gap-1">
                                    <Calendar className="h-3 w-3" />
                                    {booking.eventId.title}
                                </p>
                            </div>
                            <div>
                                <p className="text-muted-foreground mb-1">Booking Dates</p>
                                <p className="font-medium">
                                    {format(new Date(booking.startAt), 'MMM dd, HH:mm')} -
                                    {format(new Date(booking.endAt), 'HH:mm')}
                                </p>
                            </div>
                        </div>
                    </div>

                    <div className="flex justify-between items-end mt-4 pt-4 border-t">
                        <div className="text-sm">
                            <span className="text-muted-foreground">Booking ID:</span>
                            <span className="font-mono ml-2 text-xs">{booking._id.substring(0, 8)}...</span>
                        </div>
                        <div className="flex items-center gap-4">
                            <div className="text-right">
                                <span className="text-sm text-muted-foreground block">Total Paid</span>
                                <span className="text-xl font-bold text-primary">₹{booking.totalPrice.toLocaleString()}</span>
                            </div>
                            <Button variant="outline" size="sm" onClick={() => onViewDetails(booking._id)}>
                                View Details
                            </Button>
                        </div>
                    </div>
                </div>
            </div>
        </Card>
    );
}
