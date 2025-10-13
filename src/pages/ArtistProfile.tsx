import { useParams, useNavigate } from "react-router-dom";
import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { ArrowLeft, Star, MapPin } from "lucide-react";
import { BookingCalendar } from "@/components/artistDetails/BookingCalendar";
import { MasonryGrid } from "@/components/artistDetails/MasonryGrid";
import { ProfileHeader } from "@/components/artistDetails/ProfileHeader";
import { AboutSection } from "@/components/artistDetails/AboutSection";
import { Specialties } from "@/components/artistDetails/Specialties";
import { SocialLinks } from "@/components/artistDetails/SocialLinks";
import { apiClient } from "@/services/apiClient";
import type { Artist } from "@/types";
import artist1 from "@/assets/artist-1.jpg";
import artist2 from "@/assets/artist-2.jpg";
import artist3 from "@/assets/artist-3.jpg";
import artist4 from "@/assets/artist-4.jpg";

export default function ArtistProfile() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [artist, setArtist] = useState<Artist | null>(null);
  const [relatedArtists, setRelatedArtists] = useState<Artist[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    window.scrollTo({ top: 0, left: 0, behavior: "instant" as ScrollBehavior });
    loadArtist();
  }, [id]);

  async function loadArtist() {
    if (!id) return;
    
    try {
      setLoading(true);
      const results = await apiClient.searchArtists({});
      const foundArtist = results.find(a => a.id === id);
      setArtist(foundArtist || null);
      
      if (foundArtist) {
        const related = results
          .filter(a => a.id !== id && a.category === foundArtist.category)
          .slice(0, 4);
        setRelatedArtists(related);
      }
    } catch (error) {
      console.error('Failed to load artist:', error);
    } finally {
      setLoading(false);
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <div className="animate-pulse text-2xl font-bold">Loading...</div>
        </div>
      </div>
    );
  }

  if (!artist) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold mb-4">Artist Not Found</h1>
          <Button onClick={() => navigate('/artists')}>Go Back to Artists</Button>
        </div>
      </div>
    );
  }

  // Portfolio images - rotate through available images
  const portfolioImages = [artist1, artist2, artist3, artist4, artist1, artist2, artist3, artist4];
  
  // Mock specialties based on category
  const getSpecialties = (category: string) => {
    const specialtyMap: Record<string, string[]> = {
      'DJ': ['House', 'Techno', 'Progressive'],
      'Singer': ['Jazz', 'Soul', 'R&B'],
      'Band': ['Rock', 'Blues', 'Alternative'],
      'Dancer': ['Contemporary', 'Hip Hop', 'Ballet'],
    };
    return specialtyMap[category] || [category, 'Live Performance', 'Studio'];
  };

  return (
    <div className="min-h-screen bg-background">
      <div className="pt-20">
        {/* Hero Section */}
        <section className="relative py-16 md:py-20 lg:py-24 px-4 sm:px-6 overflow-hidden">
          {/* Background Effects */}
          <div className="absolute inset-0">
            <div className="absolute inset-0 bg-gradient-dark/20 moving-bg"></div>
            {[...Array(15)].map((_, i) => (
              <div
                key={i}
                className="absolute w-2 h-2 bg-accent/30 rounded-full floating-card"
                style={{
                  left: `${Math.random() * 100}%`,
                  top: `${Math.random() * 100}%`,
                  animationDelay: `${Math.random() * 4}s`,
                }}
              />
            ))}
          </div>

          <div className="relative z-10 container mx-auto max-w-7xl">
            {/* Back Button */}
            <Button 
              variant="outline" 
              onClick={() => navigate('/artists')}
              className="mb-8 glass-modern hover-neon gap-2"
            >
              <ArrowLeft className="w-4 h-4" />
              Back to Artists
            </Button>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 lg:gap-12">
              {/* Artist Info */}
              <div className="lg:col-span-2">
                <Card className="bg-gradient-to-br from-background/95 to-background/90 backdrop-blur-2xl border border-white/10">
                  <CardHeader>
                    <ProfileHeader
                      image={artist.imageUrl}
                      name={artist.name}
                      category={artist.category}
                      rating={4.8}
                      location={artist.city}
                      stats={{
                        events: Math.floor(Math.random() * 200) + 100,
                        experience: `${Math.floor(Math.random() * 10) + 5}+ Years`
                      }}
                      verified={artist.verified}
                    />
                  </CardHeader>
                  
                  <CardContent className="space-y-6">
                    <AboutSection bio={artist.bio} />
                    <Separator className="bg-white/10" />
                    <Specialties specialties={getSpecialties(artist.category)} />
                    <Separator className="bg-white/10" />
                    <SocialLinks 
                      instagram={`https://instagram.com/${artist.name.toLowerCase().replace(/\s+/g, '')}`}
                      twitter={`https://twitter.com/${artist.name.toLowerCase().replace(/\s+/g, '')}`}
                      youtube={`https://youtube.com/${artist.name.toLowerCase().replace(/\s+/g, '')}`}
                    />
                  </CardContent>
                </Card>
              </div>

              {/* Booking Calendar */}
              <div>
                <BookingCalendar 
                  artistName={artist.name}
                  price={artist.price_for_event_planner}
                />
              </div>
            </div>
          </div>
        </section>

        {/* Portfolio Section */}
        <section className="py-16 md:py-20 px-4 sm:px-6">
          <div className="container mx-auto max-w-7xl">
            <div className="text-center mb-12">
              <h2 className="text-4xl font-bold mb-4 bg-gradient-to-r from-white via-accent to-primary bg-clip-text text-transparent">
                Portfolio
              </h2>
              <p className="text-xl text-muted-foreground">
                Explore {artist.name}'s work and performances
              </p>
            </div>
            
            <MasonryGrid 
              images={portfolioImages}
              videos={[artist2, artist3]}
            />
          </div>
        </section>

        {/* Recommended Artists */}
        {relatedArtists.length > 0 && (
          <section className="py-16 md:py-20 px-4 sm:px-6">
            <div className="container mx-auto max-w-7xl">
              <div className="text-center mb-12">
                <h2 className="text-4xl font-bold mb-4 bg-gradient-to-r from-white via-accent to-primary bg-clip-text text-transparent">
                  Similar Artists
                </h2>
                <p className="text-xl text-muted-foreground">
                  You may also like these performers
                </p>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 sm:gap-8 items-stretch">
                {relatedArtists.map((rec, index) => (
                  <div 
                    key={rec.id}
                    className="group relative fade-in-scale h-full"
                    style={{ animationDelay: `${index * 0.1}s` }}
                  >
                    <div className="absolute -inset-0.5 bg-gradient-to-r from-primary via-accent to-secondary rounded-[1.5rem] opacity-0 group-hover:opacity-100 transition-all duration-700"></div>
                    
                    <div className="relative bg-gradient-to-br from-background/95 via-background/90 to-background/95 backdrop-blur-2xl rounded-[1.3rem] overflow-hidden border border-white/10 group-hover:border-accent/30 shadow-xl group-hover:shadow-accent/20 transition-all duration-700 transform md:group-hover:scale-[1.02] h-full flex flex-col">
                      <div className="relative overflow-hidden">
                        <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-transparent to-transparent z-10"></div>
                        <img
                          src={rec.imageUrl}
                          alt={rec.name}
                          className="w-full h-48 sm:h-56 md:h-60 object-cover group-hover:scale-110 transition-all duration-1000 filter group-hover:brightness-110"
                        />
                        {rec.verified && (
                          <div className="absolute top-4 right-4 bg-gradient-to-r from-yellow-400/90 to-orange-500/90 backdrop-blur-xl rounded-xl px-3 py-2 border border-yellow-300/30 shadow-lg z-20">
                            <div className="flex items-center space-x-1">
                              <Star className="w-4 h-4 text-white fill-current" />
                              <span className="text-sm font-bold text-white">Verified</span>
                            </div>
                          </div>
                        )}
                      </div>

                      <div className="relative p-6 bg-gradient-to-t from-background/98 to-background/95 flex-1 flex flex-col">
                        <div className="mb-4">
                          <h3 className="text-xl font-bold font-heading mb-2 bg-gradient-to-r from-white via-accent to-primary bg-clip-text text-transparent leading-tight">
                            {rec.name}
                          </h3>
                          <div className="inline-flex items-center px-3 py-1 bg-gradient-to-r from-accent/20 to-primary/20 rounded-full border border-accent/30 backdrop-blur-sm">
                            <span className="text-accent font-bold text-xs tracking-wide uppercase">
                              {rec.category}
                            </span>
                          </div>
                        </div>
                        <div className="flex items-center mb-4 p-2 bg-gradient-to-r from-muted/30 to-muted/20 rounded-lg border border-white/10">
                          <MapPin className="w-4 h-4 mr-2 text-accent" />
                          <span className="text-foreground/80 font-medium text-sm">{rec.city}</span>
                        </div>

                        <div className="mt-auto">
                          <Button 
                            className="w-full bg-gradient-primary shadow-neon-strong hover:scale-105 transition-smooth"
                            onClick={() => navigate(`/artists/${rec.id}`)}
                          >
                            View Details
                          </Button>
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </section>
        )}
      </div>
    </div>
  );
}
