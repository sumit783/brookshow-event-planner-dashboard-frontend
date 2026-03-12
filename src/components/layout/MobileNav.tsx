import { Link } from 'react-router-dom';
import logo from '@/assets/logo.webp';
import { Calendar, Menu } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface MobileNavProps {
    onMenuClick: () => void;
}

export function MobileNav({ onMenuClick }: MobileNavProps) {
    return (
        <header className="sticky top-0 z-30 flex h-16 items-center justify-between border-b border-border/50 bg-background/80 px-6 backdrop-blur-md lg:hidden">
            <Link to="/" className="flex items-center gap-2 transition-smooth hover:scale-105">
                <img src={logo} alt="BrookShow" className="h-12 w-auto object-contain" />
            </Link>

            <Button variant="ghost" size="icon" onClick={onMenuClick}>
                <Menu className="h-6 w-6" />
                <span className="sr-only">Toggle Menu</span>
            </Button>
        </header>
    );
}
