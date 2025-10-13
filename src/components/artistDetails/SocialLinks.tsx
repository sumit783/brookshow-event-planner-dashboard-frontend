import { Instagram, Twitter, Youtube } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface SocialLinksProps {
  instagram?: string;
  twitter?: string;
  youtube?: string;
}

export function SocialLinks({ instagram, twitter, youtube }: SocialLinksProps) {
  return (
    <div>
      <h2 className="text-2xl font-bold mb-3 bg-gradient-to-r from-white to-accent bg-clip-text text-transparent">
        Connect
      </h2>
      <div className="flex flex-wrap gap-3">
        {instagram && (
          <Button 
            variant="outline" 
            size="lg"
            className="glass-modern hover-neon"
            onClick={() => window.open(instagram, '_blank')}
          >
            <Instagram className="w-5 h-5 mr-2" />
            Instagram
          </Button>
        )}
        {twitter && (
          <Button 
            variant="outline" 
            size="lg"
            className="glass-modern hover-neon"
            onClick={() => window.open(twitter, '_blank')}
          >
            <Twitter className="w-5 h-5 mr-2" />
            Twitter
          </Button>
        )}
        {youtube && (
          <Button 
            variant="outline" 
            size="lg"
            className="glass-modern hover-neon"
            onClick={() => window.open(youtube, '_blank')}
          >
            <Youtube className="w-5 h-5 mr-2" />
            YouTube
          </Button>
        )}
      </div>
    </div>
  );
}
