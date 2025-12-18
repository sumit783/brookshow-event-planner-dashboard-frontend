import { useState, useCallback, useEffect, useRef } from 'react';
import { UseFormReturn } from 'react-hook-form';
import { GoogleMap, Marker, useJsApiLoader, Autocomplete } from '@react-google-maps/api';
import { Loader2, Crosshair, Search, MapPin } from 'lucide-react';
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

interface EventLocationProps {
  form: UseFormReturn<any>;
}

const mapContainerStyle = {
  width: '100%',
  height: '400px',
  borderRadius: '0.5rem',
};

const defaultCenter = {
  lat: 19.076,
  lng: 72.8777,
};

const libraries: ("places" | "geometry" | "drawing" | "visualization")[] = ["places"];

export default function EventLocation({ form }: EventLocationProps) {
  const [map, setMap] = useState<google.maps.Map | null>(null);
  const [autocomplete, setAutocomplete] = useState<google.maps.places.Autocomplete | null>(null);
  const [loadingLocation, setLoadingLocation] = useState(false);
  
  const { isLoaded } = useJsApiLoader({
    id: 'google-map-script',
    googleMapsApiKey: import.meta.env.VITE_GOOGLE_MAPS_API_KEY || '',
    libraries,
  });

  const lat = form.watch('lat');
  const lng = form.watch('lng');
  const [center, setCenter] = useState(defaultCenter);

  // Update map center when form values change (e.g. from current location)
  useEffect(() => {
    if (lat && lng) {
      setCenter({ lat, lng });
    }
  }, [lat, lng]);

  const onLoad = useCallback(function callback(map: google.maps.Map) {
    setMap(map);
  }, []);

  const onUnmount = useCallback(function callback() {
    setMap(null);
  }, []);

  const onAutocompleteLoad = useCallback((autocompleteInstance: google.maps.places.Autocomplete) => {
    setAutocomplete(autocompleteInstance);
  }, []);

  const onPlaceChanged = () => {
    if (autocomplete) {
      const place = autocomplete.getPlace();
      
      if (!place.geometry || !place.geometry.location) {
        toast({
          title: "Place not found",
          description: "No details available for input: '" + place.name + "'",
          variant: "destructive"
        });
        return;
      }

      // Update coordinates
      const newLat = place.geometry.location.lat();
      const newLng = place.geometry.location.lng();
      
      form.setValue('lat', newLat, { shouldDirty: true });
      form.setValue('lng', newLng, { shouldDirty: true });
      setCenter({ lat: newLat, lng: newLng });

      // Parse Address Components
      let address = "";
      let city = "";
      let state = "";
      
      if (place.address_components) {
        // Construct basic address
        const streetNumber = place.address_components.find(c => c.types.includes("street_number"))?.long_name || "";
        const route = place.address_components.find(c => c.types.includes("route"))?.long_name || "";
        address = `${streetNumber} ${route}`.trim();
        if (!address) address = place.formatted_address || "";

        // City (Locality > Administrative Area 2)
        city = place.address_components.find(c => c.types.includes("locality"))?.long_name ||
               place.address_components.find(c => c.types.includes("administrative_area_level_2"))?.long_name || "";

        // State (Administrative Area 1)
        state = place.address_components.find(c => c.types.includes("administrative_area_level_1"))?.long_name || "";
      }

      // Auto-fill form fields
      if (place.name) form.setValue('venue', place.name, { shouldDirty: true });
      if (address) form.setValue('address', address, { shouldDirty: true });
      if (city) form.setValue('city', city, { shouldDirty: true });
      if (state) form.setValue('state', state, { shouldDirty: true });

      toast({
        title: "Location Selected",
        description: `Updated venue details for ${place.name}`,
      });
    }
  };

  const onMapClick = useCallback((e: google.maps.MapMouseEvent) => {
    if (e.latLng) {
      const newLat = e.latLng.lat();
      const newLng = e.latLng.lng();
      form.setValue('lat', newLat, { shouldDirty: true });
      form.setValue('lng', newLng, { shouldDirty: true });
    }
  }, [form]);

  const onMarkerDragEnd = useCallback((e: google.maps.MapMouseEvent) => {
    if (e.latLng) {
      form.setValue('lat', e.latLng.lat(), { shouldDirty: true });
      form.setValue('lng', e.latLng.lng(), { shouldDirty: true });
    }
  }, [form]);

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
        setCenter({ lat: newLat, lng: newLng });
        
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
        
        {/* Map Section */}
        <div className="space-y-4">
           {isLoaded ? (
            <div className="relative border rounded-lg overflow-hidden h-[400px]">
               <GoogleMap
                mapContainerStyle={mapContainerStyle}
                center={center}
                zoom={15}
                onLoad={onLoad}
                onUnmount={onUnmount}
                onClick={onMapClick}
                options={{
                  streetViewControl: false,
                  mapTypeControl: false,
                  fullscreenControl: false,
                }}
               >
                 {lat && lng && (
                   <Marker
                     position={{ lat, lng }}
                     draggable={true}
                     onDragEnd={onMarkerDragEnd}
                   />
                 )}

                 {/* Autocomplete Search Box inside Map */}
                 <div className="absolute top-4 left-4 right-16 z-10 max-w-sm">
                   <Autocomplete
                     onLoad={onAutocompleteLoad}
                     onPlaceChanged={onPlaceChanged}
                   >
                     <div className="relative">
                       <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                       <input
                         type="text"
                         placeholder="Search venue..."
                         className="flex h-9 w-full rounded-md border border-input bg-background pl-9 pr-3 py-1 text-sm shadow-sm transition-colors file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:cursor-not-allowed disabled:opacity-50"
                         style={{ 
                           boxShadow: "0 2px 6px rgba(0,0,0,0.3)",
                           width: "100%",
                         }}
                       />
                     </div>
                   </Autocomplete>
                 </div>
               </GoogleMap>
               
               <Button 
                type="button" 
                variant="secondary" 
                size="sm"
                className="absolute top-4 right-4 shadow-md bg-white hover:bg-gray-100 text-black z-10 h-9 w-9 p-0"
                onClick={getCurrentLocation} 
                disabled={loadingLocation}
                title="Use Current Location"
               >
                {loadingLocation ? <Loader2 className="h-4 w-4 animate-spin" /> : <Crosshair className="h-4 w-4" />}
              </Button>
            </div>
           ) : (
             <div className="h-[400px] w-full flex items-center justify-center bg-muted rounded-lg border">
               <div className="flex flex-col items-center gap-2 text-muted-foreground">
                 <Loader2 className="h-8 w-8 animate-spin" />
                 <p>Loading Map...</p>
               </div>
             </div>
           )}
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

        {/* Lat/Lng hidden or visible tiny for debugging, currently visible */}
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
