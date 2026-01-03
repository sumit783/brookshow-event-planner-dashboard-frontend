import { 
  PieChart, 
  Pie, 
  Cell, 
  Tooltip, 
  ResponsiveContainer 
} from 'recharts';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';

interface DistributionItem {
  name: string;
  value: number;
  color: string;
}

interface AudienceSegmentsProps {
  data: DistributionItem[];
}

export function AudienceSegments({ data }: AudienceSegmentsProps) {
  return (
    <Card className="border-none bg-card/30 shadow-premium backdrop-blur-xl border-t border-white/5">
      <CardHeader>
        <CardTitle className="text-xl">Audience Segments</CardTitle>
        <CardDescription>Ticket distribution by category</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="h-[250px] w-full">
          <ResponsiveContainer width="100%" height="100%">
            <PieChart>
              <Pie
                data={data}
                innerRadius={65}
                outerRadius={85}
                paddingAngle={10}
                dataKey="value"
                stroke="none"
              >
                {data.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={entry.color} />
                ))}
              </Pie>
              <Tooltip 
                contentStyle={{ borderRadius: '12px', border: 'none', backgroundColor: 'rgba(0,0,0,0.8)', color: '#fff' }}
              />
            </PieChart>
          </ResponsiveContainer>
        </div>
        <div className="mt-6 space-y-3">
          {data.map((item) => (
            <div key={item.name} className="flex items-center justify-between text-sm">
              <div className="flex items-center gap-2.5">
                <div className="h-2.5 w-2.5 rounded-full" style={{ backgroundColor: item.color }} />
                <span className="text-muted-foreground font-medium">{item.name}</span>
              </div>
              <span className="font-bold">{item.value} sold</span>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}
