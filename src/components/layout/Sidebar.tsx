import { NavLink, Link } from 'react-router-dom';
import {
    Calendar,
    Wifi,
    WifiOff,
    AlertCircle,
    LogOut,
    RefreshCw,
    X,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { useSyncStatus } from '@/hooks/useSyncStatus';
import { useAuth } from '@/contexts/AuthContext';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { navItems } from './NavItems';

interface SidebarProps {
    onClose?: () => void;
    className?: string;
}

export function Sidebar({ onClose, className }: SidebarProps) {
    const { isOnline, pendingCount } = useSyncStatus();
    const { user, logout } = useAuth();

    return (
        <aside className={cn("flex h-full flex-col border-r border-border/50 glass-ultra", className)}>
            {/* Logo & Close Button (Mobile) */}
            <div className="flex h-16 items-center justify-between border-b border-sidebar-border/50 px-6">
                <Link to="/" className="flex items-center gap-2 transition-smooth hover:scale-105" onClick={onClose}>
                    <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-gradient-primary shadow-glow">
                        <Calendar className="h-6 w-6 text-primary-foreground drop-shadow-glow" />
                    </div>
                    <div className="flex flex-col">
                        <span className="text-sm font-bold text-sidebar-foreground">BrookShow</span>
                        <span className="text-xs bg-gradient-accent bg-clip-text text-transparent">Event Planner</span>
                    </div>
                </Link>
                {onClose && (
                    <Button variant="ghost" size="icon" className="lg:hidden" onClick={onClose}>
                        <X className="h-5 w-5" />
                    </Button>
                )}
            </div>

            {/* Navigation */}
            <nav className="flex-1 space-y-1 overflow-y-auto px-3 py-4">
                {navItems.map((item) => {
                    const Icon = item.icon;
                    return (
                        <NavLink
                            key={item.to}
                            to={item.to}
                            end={item.to === '/'}
                            onClick={onClose}
                            className={({ isActive }) =>
                                cn(
                                    'flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-smooth relative overflow-hidden group',
                                    isActive
                                        ? 'bg-gradient-primary text-sidebar-primary-foreground shadow-glow'
                                        : 'text-sidebar-foreground/80 hover:text-sidebar-foreground hover:bg-white/5'
                                )
                            }
                        >
                            <Icon className="h-5 w-5" />
                            {item.label}
                        </NavLink>
                    );
                })}
            </nav>

            {/* Status Footer */}
            <div className="border-t border-sidebar-border p-4 space-y-3">
                {/* User Info */}
                {user && (
                    <div className="px-2 py-1.5 rounded-md bg-sidebar-accent/50">
                        <div className="text-xs font-medium text-sidebar-foreground truncate">
                            {user.name || user.email}
                        </div>
                        <div className="text-xs text-sidebar-foreground/60 truncate">
                            {user.email}
                        </div>
                    </div>
                )}

                {/* Status */}
                <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                        {isOnline ? (
                            <>
                                <Wifi className="h-4 w-4 text-success" />
                                <span className="text-xs text-sidebar-foreground/70">Online</span>
                            </>
                        ) : (
                            <>
                                <WifiOff className="h-4 w-4 text-warning" />
                                <span className="text-xs text-sidebar-foreground/70">Offline</span>
                            </>
                        )}
                    </div>
                    {pendingCount > 0 && (
                        <Badge variant="secondary" className="text-xs">
                            <AlertCircle className="mr-1 h-3 w-3" />
                            {pendingCount} pending
                        </Badge>
                    )}
                </div>

                {/* Refresh Button */}
                <Button
                    variant="ghost"
                    size="sm"
                    className="w-full justify-start text-sidebar-foreground/80 hover:text-sidebar-foreground hover:bg-white/5"
                    onClick={() => window.location.reload()}
                >
                    <RefreshCw className="mr-2 h-4 w-4" />
                    Refresh
                </Button>

                {/* Logout Button */}
                <Button
                    variant="ghost"
                    size="sm"
                    className="w-full justify-start text-sidebar-foreground/80 hover:text-sidebar-foreground hover:bg-white/5"
                    onClick={logout}
                >
                    <LogOut className="mr-2 h-4 w-4" />
                    Logout
                </Button>
            </div>
        </aside>
    );
}
