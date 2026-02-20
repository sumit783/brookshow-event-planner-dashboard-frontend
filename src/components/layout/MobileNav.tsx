import { Link } from 'react-router-dom';
import { Calendar, Menu } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface MobileNavProps {
    onMenuClick: () => void;
}

export function MobileNav({ onMenuClick }: MobileNavProps) {
    return (
        <header className="sticky top-0 z-30 flex h-16 items-center justify-between border-b border-border/50 bg-background/80 px-6 backdrop-blur-md lg:hidden">
            <Link to="/" className="flex items-center gap-2 transition-smooth hover:scale-105">
                <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-gradient-primary shadow-glow">
                    <Calendar className="h-5 w-5 text-primary-foreground drop-shadow-glow" />
                </div>
                <div className="flex flex-col">
                    <span className="text-sm font-bold text-foreground">BrookShow</span>
                    <span className="text-[10px] leading-tight bg-gradient-accent bg-clip-text text-transparent">Event Planner</span>
                </div>
            </Link>

            <Button variant="ghost" size="icon" onClick={onMenuClick}>
                <Menu className="h-6 w-6" />
                <span className="sr-only">Toggle Menu</span>
            </Button>
        </header>
    );
}
