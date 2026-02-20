import { useState, useCallback, useEffect } from 'react';
import { UseFormReturn } from 'react-hook-form';
import { MapContainer, TileLayer, Marker, useMap, useMapEvents } from 'react-leaflet';
import L from 'leaflet';
import { Loader2, Crosshair, Search } from 'lucide-react';
import {
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { toast } from '@/hooks/use-toast';
import { cn } from '@/lib/utils';
import 'leaflet/dist/leaflet.css';

// Fix for default marker icons in Leaflet with Vite
import markerIcon2x from 'leaflet/dist/images/marker-icon-2x.png';
import markerIcon from 'leaflet/dist/images/marker-icon.png';
import markerShadow from 'leaflet/dist/images/marker-shadow.png';

delete (L.Icon.Default.prototype as any)._getIconUrl;
L.Icon.Default.mergeOptions({
  iconUrl: markerIcon,
  iconRetinaUrl: markerIcon2x,
  shadowUrl: markerShadow,
});

interface EventLocationProps {
  form: UseFormReturn<any>;
}

const defaultCenter: [number, number] = [19.076, 72.8777];

// Helper to update map view when coordinates change
function ChangeView({ center }: { center: [number, number] }) {
  const map = useMap();
  useEffect(() => {
    map.setView(center, map.getZoom());
  }, [center, map]);
  return null;
}

// Map events handler
function MapClickHandler({ onClick }: { onClick: (lat: number, lng: number) => void }) {
  useMapEvents({
    click: (e) => {
      onClick(e.latlng.lat, e.latlng.lng);
    },
  });
  return null;
}

export default function EventLocation({ form }: EventLocationProps) {
  const [loadingLocation, setLoadingLocation] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [isSearching, setIsSearching] = useState(false);

  const lat = form.watch('lat');
  const lng = form.watch('lng');
  const [center, setCenter] = useState<[number, number]>(defaultCenter);

  // Update map center when form values change
  useEffect(() => {
    if (lat && lng) {
      setCenter([lat, lng]);
    }
  }, [lat, lng]);

  const handleSearch = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!searchQuery.trim()) return;

    setIsSearching(true);
    try {
      const response = await fetch(
        `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(searchQuery)}`
      );
      const data = await response.json();

      if (data && data.length > 0) {
        const place = data[0];
        const newLat = parseFloat(place.lat);
        const newLng = parseFloat(place.lon);

        form.setValue('lat', newLat, { shouldDirty: true });
        form.setValue('lng', newLng, { shouldDirty: true });
        setCenter([newLat, newLng]);

        // Auto-fill venue if it's descriptive
        const displayName = place.display_name;
        const namePart = displayName.split(',')[0];

        form.setValue('venue', namePart, { shouldDirty: true });
        form.setValue('address', displayName, { shouldDirty: true });

        toast({
          title: "Location Found",
          description: `Set location to ${namePart}`,
        });
      } else {
        toast({
          title: "Place not found",
          description: "No results matched your search.",
          variant: "destructive"
        });
      }
    } catch (error) {
      toast({
        title: "Search Error",
        description: "Failed to connect to search service.",
        variant: "destructive"
      });
    } finally {
      setIsSearching(false);
    }
  };

  const handleMapClick = (newLat: number, newLng: number) => {
    form.setValue('lat', newLat, { shouldDirty: true });
    form.setValue('lng', newLng, { shouldDirty: true });
  };

  const getCurrentLocation = () => {
    if (!navigator.geolocation) {
      toast({
        title: 'Error',
        description: 'Geolocation is not supported by your browser',
        variant: 'destructive',
      });
      return;
    }

    setLoadingLocation(true);
    navigator.geolocation.getCurrentPosition(
      (position) => {
        const newLat = position.coords.latitude;
        const newLng = position.coords.longitude;
        form.setValue('lat', newLat, { shouldDirty: true });
        form.setValue('lng', newLng, { shouldDirty: true });
        setCenter([newLat, newLng]);

        toast({
          title: 'Location Updated',
          description: 'Coordinates set to your current location',
        });
        setLoadingLocation(false);
      },
      (error) => {
        toast({
          title: 'Error',
          description: 'Unable to retrieve your location',
          variant: 'destructive',
        });
        setLoadingLocation(false);
      }
    );
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Location</CardTitle>
        <CardDescription>Search for the venue or select location on map</CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">

        <div className="space-y-4">
          <div className="relative border rounded-lg overflow-hidden h-[300px] md:h-[400px] z-0">
            <MapContainer
              center={center}
              zoom={13}
              style={{ height: '100%', width: '100%' }}
              zoomControl={false}
            >
              <ChangeView center={center} />
              <TileLayer
                attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
                url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
              />
              <MapClickHandler onClick={handleMapClick} />
              {lat && lng && (
                <Marker
                  position={[lat, lng]}
                  draggable={true}
                  eventHandlers={{
                    dragend: (e) => {
                      const marker = e.target;
                      const position = marker.getLatLng();
                      form.setValue('lat', position.lat, { shouldDirty: true });
                      form.setValue('lng', position.lng, { shouldDirty: true });
                    },
                  }}
                />
              )}
            </MapContainer>

            {/* Free Search Box overlay */}
            <form
              onSubmit={handleSearch}
              className="absolute top-3 left-3 right-12 z-[1000] sm:max-w-sm flex items-center gap-2"
            >
              <div className="relative flex-1">
                <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                <Input
                  type="text"
                  placeholder="Search venue (e.g. Gateway of India)"
                  className="pl-9 bg-background/95 backdrop-blur-sm shadow-md h-9 border-border/50"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                />
              </div>
              <Button
                type="submit"
                size="sm"
                className="h-9 px-3 bg-primary/90 hover:bg-primary backdrop-blur-sm"
                disabled={isSearching}
              >
                {isSearching ? <Loader2 className="h-4 w-4 animate-spin" /> : 'Go'}
              </Button>
            </form>

            <Button
              type="button"
              variant="secondary"
              size="sm"
              className="absolute top-3 right-3 shadow-md bg-white hover:bg-gray-100 text-black z-[1000] h-9 w-9 p-0"
              onClick={getCurrentLocation}
              disabled={loadingLocation}
              title="Use Current Location"
            >
              {loadingLocation ? <Loader2 className="h-4 w-4 animate-spin" /> : <Crosshair className="h-4 w-4" />}
            </Button>
          </div>
        </div>

        {/* Address Fields */}
        <div className="grid gap-6 md:grid-cols-2">
          <FormField
            control={form.control}
            name="venue"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Venue Name</FormLabel>
                <FormControl>
                  <Input placeholder="e.g. Grand Hall" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          <FormField
            control={form.control}
            name="city"
            render={({ field }) => (
              <FormItem>
                <FormLabel>City</FormLabel>
                <FormControl>
                  <Input placeholder="e.g. Mumbai" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>

        <div className="grid gap-6 md:grid-cols-2">
          <FormField
            control={form.control}
            name="state"
            render={({ field }) => (
              <FormItem>
                <FormLabel>State</FormLabel>
                <FormControl>
                  <Input placeholder="e.g. Maharashtra" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          <FormField
            control={form.control}
            name="address"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Full Address</FormLabel>
                <FormControl>
                  <Input placeholder="Street address" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>

        <div className="flex items-end gap-4">
          <div className="grid flex-1 gap-6 md:grid-cols-2">
            <FormField
              control={form.control}
              name="lat"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Latitude</FormLabel>
                  <FormControl>
                    <Input type="number" step="any" placeholder="19.0760" {...field} onChange={e => field.onChange(parseFloat(e.target.value))} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="lng"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Longitude</FormLabel>
                  <FormControl>
                    <Input type="number" step="any" placeholder="72.8777" {...field} onChange={e => field.onChange(parseFloat(e.target.value))} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
          </div>
        </div>
        <p className="text-xs text-muted-foreground">
          Search for a venue above or click on the map to manually pin the location.
        </p>
      </CardContent>
    </Card>
  );
}
