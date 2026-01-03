import { Link } from 'react-router-dom';
import { 
  Calendar, 
  Ticket, 
  ScanLine, 
  Users, 
  Activity 
} from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';

export function OperationalCenter() {
  const operations = [
    { to: '/events', label: 'Manage Events', icon: Calendar, color: 'hover:border-blue-500/50', desc: 'Schedules & Venues' },
    { to: '/tickets', label: 'Ticket Hub', icon: Ticket, color: 'hover:border-violet-500/50', desc: 'Pricing & Sales' },
    { to: '/scanner', label: 'Entry Point', icon: ScanLine, color: 'hover:border-amber-500/50', desc: 'Verify & Check-in' },
    { to: '/artists', label: 'Artist Desk', icon: Users, color: 'hover:border-emerald-500/50', desc: 'Talent Management' },
  ];

  return (
    <Card className="border-none bg-gradient-to-br from-primary/10 to-violet-500/5 shadow-premium backdrop-blur-xl overflow-hidden relative">
      <div className="absolute top-0 right-0 p-8 opacity-10 pointer-events-none">
        <Activity className="h-32 w-32" />
      </div>
      <CardHeader>
        <CardTitle>Control Center</CardTitle>
        <CardDescription>Quick access to operational modules</CardDescription>
      </CardHeader>
      <CardContent className="grid gap-4 grid-cols-2">
        {operations.map((action, i) => (
          <Link key={i} to={action.to} className="group">
            <Card className={`bg-background/40 border-white/5 backdrop-blur-md transition-all duration-300 hover:shadow-lg hover:-translate-y-1 ${action.color}`}>
              <CardContent className="p-4 flex flex-col gap-3">
                <div className="rounded-lg bg-white/5 p-2 w-fit group-hover:bg-primary/20 group-hover:text-primary transition-colors">
                  <action.icon className="h-5 w-5" />
                </div>
                <div>
                  <p className="font-bold text-sm tracking-tight">{action.label}</p>
                  <p className="text-[10px] text-muted-foreground mt-0.5 line-clamp-1">{action.desc}</p>
                </div>
              </CardContent>
            </Card>
          </Link>
        ))}
      </CardContent>
    </Card>
  );
}
