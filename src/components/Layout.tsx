import { ReactNode } from 'react';
import { NavLink, Link } from 'react-router-dom';
import {
  LayoutDashboard,
  Calendar,
  PlusCircle,
  Users,
  User,
  Wifi,
  WifiOff,
  AlertCircle,
  LogOut,
  Wallet,
  RefreshCw,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { useSyncStatus } from '@/hooks/useSyncStatus';
import { useAuth } from '@/contexts/AuthContext';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';

interface LayoutProps {
  children: ReactNode;
}

const navItems = [
  { to: '/', label: 'Dashboard', icon: LayoutDashboard },
  { to: '/events', label: 'Events', icon: Calendar },
  { to: '/artists', label: 'Book Artist', icon: PlusCircle },
  { to: '/employees', label: 'Employees', icon: Users },
  { to: '/wallet', label: 'Wallet', icon: Wallet },
  { to: '/profile', label: 'Profile', icon: User },
];

export function Layout({ children }: LayoutProps) {
  const { isOnline, pendingCount } = useSyncStatus();
  const { user, logout } = useAuth();

  return (
    <div className="flex min-h-screen w-full bg-gradient-dark">
      {/* Sidebar */}
      <aside className="fixed left-0 top-0 z-40 h-screen w-64 border-r border-border/50 glass-ultra">
        <div className="flex h-full flex-col">
          {/* Logo */}
          <div className="flex h-16 items-center justify-center border-b border-sidebar-border/50 px-6">
            <Link to="/" className="flex items-center gap-2 transition-smooth hover:scale-105">
              <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-gradient-primary shadow-glow">
                <Calendar className="h-6 w-6 text-primary-foreground drop-shadow-glow" />
              </div>
              <div className="flex flex-col">
                <span className="text-sm font-bold text-sidebar-foreground">BrookShow</span>
                <span className="text-xs bg-gradient-accent bg-clip-text text-transparent">Event Planner</span>
              </div>
            </Link>
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
        </div>
      </aside>

      {/* Main Content */}
      <main className="ml-64 flex-1 min-h-screen">
        <div className="container mx-auto px-6 py-8">{children}</div>
      </main>
    </div>
  );
}
