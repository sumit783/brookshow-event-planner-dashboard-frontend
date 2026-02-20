import { useEffect, useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Loader2, Edit, Building2, Wallet, CheckCircle2, XCircle, Calendar, MapPin, User } from 'lucide-react';
import { apiClient } from '@/services/apiClient';
import { PlannerProfileResponse, BookedArtist } from '@/types';
import { toast } from '@/hooks/use-toast';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { format } from 'date-fns';
import { config } from '@/config';
import { BookedArtistCard } from '@/components/planner/BookedArtistCard';
import { BookingDetailsDialog } from '@/components/planner/BookingDetailsDialog';

export default function PlannerProfile() {
    const [profile, setProfile] = useState<PlannerProfileResponse | null>(null);
    const [loading, setLoading] = useState(true);
    const [selectedBookingId, setSelectedBookingId] = useState<string | null>(null);
    const [detailsOpen, setDetailsOpen] = useState(false);

    const { data: bookedArtistsData, isLoading: loadingArtists } = useQuery({
        queryKey: ['booked-artists'],
        queryFn: () => apiClient.getBookedArtists(),
    });

    const bookedArtists: BookedArtist[] = bookedArtistsData?.bookings || [];

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
        <div className="container mx-auto px-4 py-6 md:py-8 space-y-6 md:space-y-8 animate-fade-in">
            {/* Header Section */}
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                <div>
                    <h1 className="text-2xl md:text-3xl font-bold tracking-tight">Organization Profile</h1>
                    <p className="text-sm md:text-base text-muted-foreground mt-1">Manage your organization details and view bookings</p>
                </div>
                <Button className="w-full sm:w-auto gap-2 h-9 text-sm">
                    <Edit className="h-4 w-4" /> Edit Profile
                </Button>
            </div>

            <div className="grid gap-6 grid-cols-1 lg:grid-cols-3">
                {/* Profile Stats Card */}
                <Card className="lg:col-span-1 border-t-4 border-t-primary h-fit">
                    <CardHeader className="pb-4">
                        <CardTitle className="flex items-center gap-2 text-lg md:text-xl">
                            <Building2 className="h-5 w-5 text-primary" />
                            Organization Details
                        </CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-6">
                        <div className="flex flex-col items-center text-center p-4 bg-muted/20 rounded-xl">
                            <Avatar className="h-20 w-20 md:h-24 md:w-24 mb-4 border-2 border-primary/20">
                                <AvatarImage src={config.API_BASE_URI + profile.logoUrl} alt={profile.organization} />
                                <AvatarFallback className="text-2xl bg-primary/10 text-primary">
                                    {profile.organization.substring(0, 2).toUpperCase()}
                                </AvatarFallback>
                            </Avatar>
                            <h3 className="text-lg md:text-xl font-bold">{profile.organization}</h3>
                            <div className="flex items-center gap-2 mt-2">
                                {profile.verified ? (
                                    <Badge variant="secondary" className="bg-green-100 text-green-800 hover:bg-green-100 dark:bg-green-900/30 dark:text-green-400 text-[10px] md:text-xs">
                                        <CheckCircle2 className="w-3 h-3 mr-1" /> Verified
                                    </Badge>
                                ) : (
                                    <Badge variant="secondary" className="bg-yellow-100 text-yellow-800 hover:bg-yellow-100 dark:bg-yellow-900/30 dark:text-yellow-400 text-[10px] md:text-xs">
                                        Pending Verification
                                    </Badge>
                                )}
                            </div>
                        </div>

                        <div className="space-y-4">
                            <div className="flex justify-between items-center p-3 border rounded-xl bg-card shadow-sm">
                                <div className="flex items-center gap-2">
                                    <Wallet className="h-4 w-4 md:h-5 md:w-5 text-green-600" />
                                    <span className="font-medium text-sm md:text-base">Wallet Balance</span>
                                </div>
                                <span className={`text-base md:text-lg font-bold ${profile.walletBalance >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                                    ₹{profile.walletBalance.toLocaleString()}
                                </span>
                            </div>

                            <div className="text-xs md:text-sm text-muted-foreground space-y-2 px-1">
                                <div className="flex justify-between">
                                    <span>Joined</span>
                                    <span className="font-medium text-foreground">{format(new Date(profile.createdAt), 'PPP')}</span>
                                </div>
                                {profile.verificationNote && (
                                    <div className="p-3 bg-yellow-50 text-yellow-800 rounded-lg text-[11px] md:text-xs mt-2 dark:bg-yellow-900/20 dark:text-yellow-200">
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
                            <TabsTrigger value="bookings">Booked Artists ({bookedArtists.length || 0})</TabsTrigger>
                            <TabsTrigger value="documents">Documents</TabsTrigger>
                        </TabsList>

                        <TabsContent value="bookings" className="space-y-4">
                            {loadingArtists ? (
                                <div className="flex justify-center p-8">
                                    <Loader2 className="h-8 w-8 animate-spin text-primary" />
                                </div>
                            ) : bookedArtists.length > 0 ? (
                                <div className="space-y-4">
                                    {bookedArtists.map((booking) => (
                                        <BookedArtistCard
                                            key={booking._id}
                                            booking={booking}
                                            onViewDetails={(id) => {
                                                setSelectedBookingId(id);
                                                setDetailsOpen(true);
                                            }}
                                        />
                                    ))}
                                </div>
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

            <BookingDetailsDialog
                bookingId={selectedBookingId}
                open={detailsOpen}
                onOpenChange={setDetailsOpen}
            />
        </div>
    );
}
