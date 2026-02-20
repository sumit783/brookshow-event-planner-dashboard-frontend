import { Link } from 'react-router-dom';
import {
  Calendar,
  Ticket,
  ScanLine,
  Users,
  Activity
} from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { cn } from '@/lib/utils';

export function OperationalCenter() {
  const operations = [
    { to: '/events', label: 'Manage Events', icon: Calendar, color: 'hover:border-blue-500/50', desc: 'Schedules & Venues' },
    { to: '/tickets', label: 'Ticket Hub', icon: Ticket, color: 'hover:border-violet-500/50', desc: 'Pricing & Sales' },
    { to: '/scanner', label: 'Entry Point', icon: ScanLine, color: 'hover:border-amber-500/50', desc: 'Verify & Check-in' },
    { to: '/artists', label: 'Artist Desk', icon: Users, color: 'hover:border-emerald-500/50', desc: 'Talent Management' },
  ];

  return (
    <Card className="border border-border/50 bg-background/40 shadow-premium backdrop-blur-xl overflow-hidden relative glass-ultra group/main">
      <div className="absolute -top-12 -right-12 p-8 opacity-[0.03] pointer-events-none transition-transform duration-700 group-hover/main:scale-110 group-hover/main:rotate-12">
        <Activity className="h-64 w-64" />
      </div>

      <CardHeader className="pb-4">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-gradient-primary shadow-glow">
            <Activity className="h-5 w-5 text-primary-foreground drop-shadow-glow" />
          </div>
          <div>
            <CardTitle className="text-xl font-bold tracking-tight">Operational Hub</CardTitle>
            <CardDescription className="text-xs uppercase tracking-wider font-semibold opacity-70">Control Center</CardDescription>
          </div>
        </div>
      </CardHeader>

      <CardContent className="grid gap-4 grid-cols-2 mt-2">
        {operations.map((action, i) => (
          <Link key={i} to={action.to} className="group">
            <Card className={cn(
              "bg-white/5 border-border/40 transition-all duration-300 hover:shadow-glow hover:-translate-y-1 overflow-hidden relative",
              action.color
            )}>
              <div className="absolute inset-0 bg-gradient-primary opacity-0 group-hover:opacity-[0.03] transition-opacity" />
              <CardContent className="p-4 flex flex-col gap-3">
                <div className="rounded-lg bg-white/5 p-2.5 w-fit group-hover:bg-gradient-primary group-hover:text-primary-foreground group-hover:shadow-glow transition-all duration-300">
                  <action.icon className="h-5 w-5" />
                </div>
                <div>
                  <p className="font-bold text-sm tracking-tight text-foreground/90">{action.label}</p>
                  <p className="text-[10px] text-muted-foreground mt-0.5 line-clamp-1 font-medium">{action.desc}</p>
                </div>
              </CardContent>
            </Card>
          </Link>
        ))}
      </CardContent>
    </Card>
  );
}
