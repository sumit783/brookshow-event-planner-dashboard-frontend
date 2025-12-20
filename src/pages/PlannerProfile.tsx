import { useEffect, useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Loader2, Edit, Building2, Wallet, CheckCircle2, XCircle, Calendar, MapPin, User } from 'lucide-react';
import { apiClient } from '@/services/apiClient';
import { PlannerProfileResponse } from '@/types';
import { toast } from '@/hooks/use-toast';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { format } from 'date-fns';
import { config } from '@/config';

export default function PlannerProfile() {
    const [profile, setProfile] = useState<PlannerProfileResponse | null>(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        fetchProfile();
    }, []);

    async function fetchProfile() {
        try {
            const data = await apiClient.getPlannerProfile();
            setProfile(data);
        } catch (error: any) {
            toast({
                title: "Error",
                description: error.message || "Failed to load profile",
                variant: "destructive"
            });
        } finally {
            setLoading(false);
        }
    }

    if (loading) {
        return (
            <div className="flex h-[50vh] items-center justify-center">
                <Loader2 className="h-8 w-8 animate-spin text-primary" />
            </div>
        );
    }

    if (!profile) {
        return (
            <div className="flex h-[50vh] flex-col items-center justify-center gap-4">
                <h2 className="text-xl font-semibold">Profile not found</h2>
                <Button onClick={() => window.location.reload()}>Retry</Button>
            </div>
        );
    }

    return (
        <div className="container mx-auto py-8 space-y-8 animate-fade-in">
            {/* Header Section */}
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                <div>
                    <h1 className="text-3xl font-bold tracking-tight">Organization Profile</h1>
                    <p className="text-muted-foreground mt-1">Manage your organization details and view bookings</p>
                </div>
                <Button className="gap-2">
                    <Edit className="h-4 w-4" /> Edit Profile
                </Button>
            </div>

            <div className="grid gap-6 md:grid-cols-3">
                {/* Profile Stats Card */}
                <Card className="md:col-span-1 border-t-4 border-t-primary">
                    <CardHeader>
                        <CardTitle className="flex items-center gap-2">
                            <Building2 className="h-5 w-5 text-primary" />
                            Organization Details
                        </CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-6">
                        <div className="flex flex-col items-center text-center p-4 bg-muted/20 rounded-lg">
                            <Avatar className="h-24 w-24 mb-4 border-2 border-primary/20">
                                <AvatarImage src={profile.logoUrl} alt={profile.organization} />
                                <AvatarFallback className="text-2xl bg-primary/10 text-primary">
                                    {profile.organization.substring(0, 2).toUpperCase()}
                                </AvatarFallback>
                            </Avatar>
                            <h3 className="text-xl font-bold">{profile.organization}</h3>
                            <div className="flex items-center gap-2 mt-2">
                                {profile.verified ? (
                                    <Badge variant="secondary" className="bg-green-100 text-green-800 hover:bg-green-100 dark:bg-green-900/30 dark:text-green-400">
                                        <CheckCircle2 className="w-3 h-3 mr-1" /> Verified
                                    </Badge>
                                ) : (
                                    <Badge variant="secondary" className="bg-yellow-100 text-yellow-800 hover:bg-yellow-100 dark:bg-yellow-900/30 dark:text-yellow-400">
                                        Pending Verification
                                    </Badge>
                                )}
                            </div>
                        </div>

                        <div className="space-y-4">
                            <div className="flex justify-between items-center p-3 border rounded-lg bg-card shadow-sm">
                                <div className="flex items-center gap-2">
                                    <Wallet className="h-5 w-5 text-green-600" />
                                    <span className="font-medium">Wallet Balance</span>
                                </div>
                                <span className={`text-lg font-bold ${profile.walletBalance >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                                    ₹{profile.walletBalance.toLocaleString()}
                                </span>
                            </div>

                            <div className="text-sm text-muted-foreground space-y-2 px-1">
                                <div className="flex justify-between">
                                    <span>Joined</span>
                                    <span className="font-medium text-foreground">{format(new Date(profile.createdAt), 'PPP')}</span>
                                </div>
                                {profile.verificationNote && (
                                    <div className="p-3 bg-yellow-50 text-yellow-800 rounded-md text-xs mt-2 dark:bg-yellow-900/20 dark:text-yellow-200">
                                        <span className="font-semibold block mb-1">Verification Note:</span>
                                        {profile.verificationNote}
                                    </div>
                                )}
                            </div>
                        </div>
                    </CardContent>
                </Card>

                {/* Booked Artists Section */}
                <div className="md:col-span-2">
                    <Tabs defaultValue="bookings" className="w-full">
                        <TabsList className="mb-4">
                            <TabsTrigger value="bookings">Booked Artists ({profile.bookedArtists.length})</TabsTrigger>
                            <TabsTrigger value="documents">Documents</TabsTrigger>
                        </TabsList>

                        <TabsContent value="bookings" className="space-y-4">
                            {profile.bookedArtists.length > 0 ? (
                                profile.bookedArtists.map((booking) => (
                                    <Card key={booking._id} className="overflow-hidden hover:shadow-md transition-shadow">
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
                                                            <p className="text-xs text-muted-foreground ml-4 mt-0.5 truncate max-w-[150px]">
                                                                {booking.eventId.venue}, {booking.eventId.city}
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
                                                    <div className="text-right">
                                                        <span className="text-sm text-muted-foreground block">Total Paid</span>
                                                        <span className="text-xl font-bold text-primary">₹{booking.totalPrice.toLocaleString()}</span>
                                                    </div>
                                                </div>
                                            </div>
                                        </div>
                                    </Card>
                                ))
                            ) : (
                                <div className="text-center py-12 bg-muted/20 rounded-lg border-2 border-dashed">
                                    <User className="h-10 w-10 text-muted-foreground mx-auto mb-3" />
                                    <h3 className="text-lg font-medium">No Booked Artists Yet</h3>
                                    <p className="text-muted-foreground max-w-sm mx-auto mt-1">
                                        Discover talented artists for your upcoming events and book them directly.
                                    </p>
                                    <Button variant="outline" className="mt-4" onClick={() => window.location.href = '/artists'}>
                                        Browse Artists
                                    </Button>
                                </div>
                            )}
                        </TabsContent>

                        <TabsContent value="documents">
                            <div className="flex items-center justify-center p-12 bg-muted/20 rounded-lg border-2 border-dashed">
                                <p className="text-muted-foreground">No documents uploaded</p>
                            </div>
                        </TabsContent>
                    </Tabs>
                </div>
            </div>
        </div>
    );
}
