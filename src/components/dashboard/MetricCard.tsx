import { LucideIcon } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';

interface MetricCardProps {
  label: string;
  value: string | number;
  change: string;
  icon: LucideIcon;
  color: string;
  bg: string;
}

export function MetricCard({ label, value, change, icon: Icon, color, bg }: MetricCardProps) {
  return (
    <Card className="border-none bg-card/40 shadow-premium backdrop-blur-sm group hover:bg-card/60 transition-colors">
      <CardContent className="p-6">
        <div className="flex items-center justify-between">
          <div className={`rounded-2xl p-3 ${bg} ${color}`}>
            <Icon className="h-6 w-6" />
          </div>
          <Badge variant="secondary" className="bg-white/5 text-xs font-semibold backdrop-blur-md uppercase tracking-wider">
            {change}
          </Badge>
        </div>
        <div className="mt-5">
          <p className="text-sm font-medium text-muted-foreground">{label}</p>
          <h3 className="text-3xl font-bold tracking-tight mt-1">{value}</h3>
        </div>
      </CardContent>
    </Card>
  );
}
