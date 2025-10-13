import { useEffect, useState } from 'react';
import { Search, MapPin, Star, Send, Users } from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { apiClient } from '@/services/apiClient';
import { toast } from '@/hooks/use-toast';
import type { Artist, Event } from '@/types';

export default function Artists() {
  const [artists, setArtists] = useState<Artist[]>([]);
  const [events, setEvents] = useState<Event[]>([]);
  const [loading, setLoading] = useState(true);
  
  const [searchQuery, setSearchQuery] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('all');
  const [cityFilter, setCityFilter] = useState('all');
  
  const [selectedArtist, setSelectedArtist] = useState<Artist | null>(null);
  const [selectedEventId, setSelectedEventId] = useState('');

  useEffect(() => {
    loadData();
  }, []);

  useEffect(() => {
    searchArtists();
  }, [searchQuery, categoryFilter, cityFilter]);

  async function loadData() {
    try {
      const eventsData = await apiClient.listEvents();
      setEvents(eventsData.filter(e => e.published));
      await searchArtists();
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Failed to load data',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  }

  async function searchArtists() {
    try {
      const results = await apiClient.searchArtists({
        query: searchQuery,
        category: categoryFilter !== 'all' ? categoryFilter : undefined,
        city: cityFilter !== 'all' ? cityFilter : undefined,
      });
      setArtists(results);
    } catch (error) {
      console.error('Failed to search artists:', error);
    }
  }

  async function handleBooking() {
    if (!selectedArtist || !selectedEventId) {
      toast({
        title: 'Error',
        description: 'Please select an artist and event',
        variant: 'destructive',
      });
      return;
    }

    try {
      const event = events.find(e => e.id === selectedEventId);
      if (!event) return;

      await apiClient.createBooking({
        eventId: selectedEventId,
        artistId: selectedArtist.id,
        proposedDate: event.start.split('T')[0],
        proposedTime: event.start.split('T')[1]?.substring(0, 5) || '18:00',
        price: selectedArtist.price_for_event_planner,
      });

      toast({
        title: 'Booking Request Sent',
        description: `Booking request for ${selectedArtist.name} has been submitted`,
      });

      setSelectedArtist(null);
      setSelectedEventId('');
    } catch (error: any) {
      toast({
        title: 'Booking Failed',
        description: error.message || 'Failed to create booking',
        variant: 'destructive',
      });
    }
  }

  const categories = Array.from(new Set(artists.map(a => a.category)));
  const cities = Array.from(new Set(artists.map(a => a.city)));

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <h1 className="text-4xl font-bold">Book Artists</h1>
        </div>
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {[1, 2, 3].map((i) => (
            <Card key={i} className="animate-pulse">
              <CardHeader className="h-48 bg-muted/50" />
            </Card>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-4xl font-bold">Book Artists</h1>
        <p className="mt-2 text-muted-foreground">
          Search and book artists for your events
        </p>
      </div>

      {/* Search & Filters */}
      <Card>
        <CardHeader>
          <CardTitle>Search Artists</CardTitle>
          <CardDescription>Filter by name, category, or location</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid gap-4 md:grid-cols-3">
            <div className="space-y-2">
              <Label htmlFor="search">Search</Label>
              <div className="relative">
                <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                <Input
                  id="search"
                  placeholder="Artist name or bio..."
                  className="pl-10"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label>Category</Label>
              <Select value={categoryFilter} onValueChange={setCategoryFilter}>
                <SelectTrigger>
                  <SelectValue placeholder="All categories" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All categories</SelectItem>
                  {categories.map((cat) => (
                    <SelectItem key={cat} value={cat}>
                      {cat}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label>City</Label>
              <Select value={cityFilter} onValueChange={setCityFilter}>
                <SelectTrigger>
                  <SelectValue placeholder="All cities" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All cities</SelectItem>
                  {cities.map((city) => (
                    <SelectItem key={city} value={city}>
                      {city}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Artists Grid */}
      {artists.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-16">
            <Users className="h-16 w-16 text-muted-foreground/50" />
            <h3 className="mt-4 text-lg font-semibold">No artists found</h3>
            <p className="mt-2 text-sm text-muted-foreground">
              Try adjusting your search filters
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {artists.map((artist) => (
            <Card
              key={artist.id}
              className={`group cursor-pointer transition-all hover:shadow-elevated ${
                selectedArtist?.id === artist.id ? 'ring-2 ring-primary' : ''
              }`}
              onClick={() => setSelectedArtist(artist)}
            >
              {/* Artist Image */}
              <div className="relative h-48 overflow-hidden bg-gradient-to-br from-primary/10 to-accent/10">
                {artist.imageUrl ? (
                  <img src={artist.imageUrl} alt={artist.name} className="h-full w-full object-cover" />
                ) : (
                  <div className="flex h-full items-center justify-center">
                    <Users className="h-16 w-16 text-muted-foreground/30" />
                  </div>
                )}
                {artist.verified && (
                  <div className="absolute right-2 top-2">
                    <Badge className="bg-success">
                      <Star className="mr-1 h-3 w-3" />
                      Verified
                    </Badge>
                  </div>
                )}
              </div>

              <CardHeader>
                <CardTitle className="line-clamp-1">{artist.name}</CardTitle>
                <CardDescription className="space-y-1">
                  <div className="flex items-center gap-2 text-sm">
                    <Badge variant="outline">{artist.category}</Badge>
                  </div>
                  <div className="flex items-center gap-2 text-sm">
                    <MapPin className="h-4 w-4" />
                    {artist.city}
                  </div>
                </CardDescription>
              </CardHeader>

              <CardContent className="space-y-3">
                <p className="line-clamp-2 text-sm text-muted-foreground">{artist.bio}</p>
                
                <div className="rounded-lg border bg-muted/50 p-3">
                  <p className="text-xs text-muted-foreground">Event Planner Rate</p>
                  <p className="text-2xl font-bold">
                    ${artist.price_for_event_planner.toLocaleString()}
                  </p>
                </div>

                <Button
                  variant="outline"
                  className="w-full glass-modern hover-neon"
                  onClick={(e) => {
                    e.stopPropagation();
                    const navigate = () => window.location.href = `/artists/${artist.id}`;
                    navigate();
                  }}
                >
                  View Details
                </Button>

                {selectedArtist?.id === artist.id && (
                  <div className="animate-in fade-in">
                    <Badge className="w-full justify-center bg-primary">Selected</Badge>
                  </div>
                )}
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* Booking Form */}
      {selectedArtist && (
        <Card className="border-2 border-primary">
          <CardHeader>
            <CardTitle>Book {selectedArtist.name}</CardTitle>
            <CardDescription>Select an event for this artist</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label>Event</Label>
              <Select value={selectedEventId} onValueChange={setSelectedEventId}>
                <SelectTrigger>
                  <SelectValue placeholder="Select an event" />
                </SelectTrigger>
                <SelectContent>
                  {events.map((event) => (
                    <SelectItem key={event.id} value={event.id}>
                      {event.title} - {new Date(event.start).toLocaleDateString()}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="rounded-lg border bg-muted/50 p-4">
              <div className="space-y-2">
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Artist</span>
                  <span className="font-medium">{selectedArtist.name}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Rate</span>
                  <span className="font-medium">
                    ${selectedArtist.price_for_event_planner.toLocaleString()}
                  </span>
                </div>
                {selectedEventId && (
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">Event</span>
                    <span className="font-medium">
                      {events.find(e => e.id === selectedEventId)?.title}
                    </span>
                  </div>
                )}
              </div>
            </div>

            <div className="flex gap-2">
              <Button
                variant="outline"
                className="flex-1"
                onClick={() => {
                  setSelectedArtist(null);
                  setSelectedEventId('');
                }}
              >
                Cancel
              </Button>
              <Button
                className="flex-1 bg-gradient-to-r from-primary to-primary-glow"
                onClick={handleBooking}
                disabled={!selectedEventId}
              >
                <Send className="mr-2 h-4 w-4" />
                Send Booking Request
              </Button>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
