import {
  DollarSign,
  PlusCircle,
  Zap,
  Calendar,
  Ticket,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { eventService } from '@/services/event';
import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
// New Modular Components
import { MetricCard } from '@/components/dashboard/MetricCard';
import { RevenueForecast } from '@/components/dashboard/RevenueForecast';
import { AudienceSegments } from '@/components/dashboard/AudienceSegments';
import { ActiveProjects } from '@/components/dashboard/ActiveProjects';
import { OperationalCenter } from '@/components/dashboard/OperationalCenter';

// Icon mapping for live metrics
const ICON_MAP: Record<string, any> = {
  DollarSign,
  Ticket,
  Calendar,
  Zap,
};

export default function Dashboard() {
  const [loading, setLoading] = useState(true);
  const [metrics, setMetrics] = useState<any[]>([]);
  const [revenueData, setRevenueData] = useState<any[]>([]);
  const [ticketDistribution, setTicketDistribution] = useState<any[]>([]);
  const [recentEvents, setRecentEvents] = useState<any[]>([]);

  useEffect(() => {
    loadDashboard();
  }, []);

  async function loadDashboard() {
    try {
      const [metricsData, revenueData, distributionData, recentEventsData] = await Promise.all([
        eventService.getDashboardMetrics(),
        eventService.getDashboardRevenue(),
        eventService.getDashboardTicketDistribution(),
        eventService.getDashboardRecentEvents()
      ]);
      setMetrics(metricsData);
      setRevenueData(revenueData);
      setTicketDistribution(distributionData);
      setRecentEvents(recentEventsData);
    } catch (error) {
      console.error('Failed to load dashboard data:', error);
    } finally {
      // Simulate slightly longer loading for smooth transition
      setTimeout(() => setLoading(false), 500);
    }
  }

  if (loading) {
    return (
      <div className="space-y-8 animate-pulse p-2">
        <div className="grid gap-6 grid-cols-2 lg:grid-cols-4">
          {[1, 2, 3, 4].map((i) => (
            <Card key={i} className="h-32 bg-muted/20 border-none shadow-sm" />
          ))}
        </div>
        <div className="grid gap-6 lg:grid-cols-3">
          <Card className="lg:col-span-2 h-[400px] bg-muted/20 border-none" />
          <Card className="h-[400px] bg-muted/20 border-none" />
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-8 pb-10 animate-in fade-in slide-in-from-bottom-4 duration-700">
      {/* Hero / Header Section */}
      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div>
          <h1 className="bg-gradient-to-r from-primary to-violet-400 bg-clip-text text-4xl font-extrabold tracking-tight text-transparent">
            Executive Overview
          </h1>
          <p className="text-muted-foreground mt-1">
            Welcome back! Here's a summary of your organization's real-time performance.
          </p>
        </div>
      </div>

      {/* Metrics Section */}
      <div className="grid gap-4 grid-cols-2 lg:grid-cols-4">
        {metrics.map((metric, i) => (
          <MetricCard
            key={i}
            {...metric}
            icon={ICON_MAP[metric.icon] || Calendar}
          />
        ))}
      </div>

      {/* Analytics Row */}
      <div className="grid gap-6 lg:grid-cols-3">
        <RevenueForecast data={revenueData} />
        <AudienceSegments data={ticketDistribution} />
      </div>

      {/* Bottom Section */}
      <div className="grid gap-6 lg:grid-cols-2">
        <ActiveProjects events={recentEvents} />
        <OperationalCenter />
      </div>
    </div>
  );
}
