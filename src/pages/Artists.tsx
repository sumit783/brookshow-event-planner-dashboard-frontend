import { useEffect, useState, useMemo } from 'react';
import { artistService } from '@/services/artist';
import { toast } from '@/hooks/use-toast';
import type { Artist } from '@/types';
import { ArtistFilters } from '@/components/artists/ArtistFilters';
import { ArtistList } from '@/components/artists/ArtistList';

export default function Artists() {
  const [artists, setArtists] = useState<Artist[]>([]);
  const [loading, setLoading] = useState(true);
  
  const [searchQuery, setSearchQuery] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('all');
  const [cityFilter, setCityFilter] = useState('all');

  useEffect(() => {
    loadData();
  }, []);

  async function loadData() {
    try {
      const artistsData = await artistService.fetchArtists();
      setArtists(artistsData);
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Failed to load artists',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  }

  // Client-side filtering
  const filteredArtists = useMemo(() => {
    return artists.filter(artist => {
      const matchesSearch = artist.name.toLowerCase().includes(searchQuery.toLowerCase()) || 
                            (artist.category && artist.category.toLowerCase().includes(searchQuery.toLowerCase()));
      const matchesCategory = categoryFilter === 'all' || artist.category === categoryFilter;
      // Location check - artist.location vs cityFilter
      const matchesCity = cityFilter === 'all' || (artist.location && artist.location.toLowerCase().includes(cityFilter.toLowerCase()));
      
      return matchesSearch && matchesCategory && matchesCity;
    });
  }, [artists, searchQuery, categoryFilter, cityFilter]);

  const categories = useMemo(() => Array.from(new Set(artists.map(a => a.category).filter(Boolean))), [artists]);
  const cities = useMemo(() => {
    // Extract city from location string if possible, or just use location
    return Array.from(new Set(artists.map(a => a.location ? a.location.split(',')[0].trim() : '').filter(Boolean)));
  }, [artists]);

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
      <ArtistFilters 
        searchQuery={searchQuery}
        setSearchQuery={setSearchQuery}
        categoryFilter={categoryFilter}
        setCategoryFilter={setCategoryFilter}
        cityFilter={cityFilter}
        setCityFilter={setCityFilter}
        categories={categories}
        cities={cities}
      />

      {/* Artists Grid */}
      <ArtistList 
        artists={filteredArtists} 
        loading={loading}
      />
    </div>
  );
}
