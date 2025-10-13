import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { Calendar, Ticket, DollarSign, ScanLine, ArrowRight, TrendingUp, PlusCircle, Users } from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { apiClient } from '@/services/apiClient';
import { storage, db } from '@/services/storage';
import type { Event, TicketType, ScanLog } from '@/types';

export default function Dashboard() {
  const [metrics, setMetrics] = useState({
    upcomingEvents: 0,
    totalTicketsSold: 0,
    totalRevenue: 0,
    recentScans: 0,
  });
  const [recentEvents, setRecentEvents] = useState<Event[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadDashboard();
  }, []);

  async function loadDashboard() {
    try {
      const events = await apiClient.listEvents();
      const now = new Date();
      const upcoming = events.filter((e) => new Date(e.start) > now && e.published);

      const ticketTypes = await storage.getAll<TicketType>(db.ticketTypes);
      const totalSold = ticketTypes.reduce((sum, tt) => sum + tt.sold, 0);
      const totalRevenue = ticketTypes.reduce((sum, tt) => sum + tt.sold * tt.price, 0);

      const scanLogs = await storage.getAll<ScanLog>(db.scanLogs);
      const last24h = scanLogs.filter(
        (log) => new Date(log.timestamp) > new Date(Date.now() - 24 * 60 * 60 * 1000)
      );

      setMetrics({
        upcomingEvents: upcoming.length,
        totalTicketsSold: totalSold,
        totalRevenue,
        recentScans: last24h.length,
      });

      setRecentEvents(events.slice(0, 3));
    } catch (error) {
      console.error('Failed to load dashboard:', error);
    } finally {
      setLoading(false);
    }
  }

  const metricCards = [
    {
      title: 'Upcoming Events',
      value: metrics.upcomingEvents,
      icon: Calendar,
      color: 'from-primary to-primary-glow',
      link: '/events',
    },
    {
      title: 'Tickets Sold',
      value: metrics.totalTicketsSold,
      icon: Ticket,
      color: 'from-accent to-accent-hover',
      link: '/tickets',
    },
    {
      title: 'Total Revenue',
      value: `$${metrics.totalRevenue.toLocaleString()}`,
      icon: DollarSign,
      color: 'from-success to-success/80',
      link: '/reports',
    },
    {
      title: 'Scans (24h)',
      value: metrics.recentScans,
      icon: ScanLine,
      color: 'from-warning to-warning/80',
      link: '/scanner',
    },
  ];

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
          {[1, 2, 3, 4].map((i) => (
            <Card key={i} className="animate-pulse">
              <CardHeader className="h-32 bg-muted/50" />
            </Card>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      {/* Header */}
      <div>
        <h1 className="text-4xl font-bold tracking-tight">Dashboard</h1>
        <p className="mt-2 text-muted-foreground">
          Welcome back! Here's what's happening with your events.
        </p>
      </div>

      {/* Metrics Grid */}
      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
        {metricCards.map((metric) => {
          const Icon = metric.icon;
          return (
            <Link key={metric.title} to={metric.link}>
              <Card className="group relative overflow-hidden transition-all hover:shadow-elevated">
                <div
                  className={`absolute inset-0 bg-gradient-to-br ${metric.color} opacity-5 transition-opacity group-hover:opacity-10`}
                />
                <CardHeader className="pb-2">
                  <CardDescription className="flex items-center gap-2">
                    <Icon className="h-4 w-4" />
                    {metric.title}
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="flex items-end justify-between">
                    <div className="text-3xl font-bold">{metric.value}</div>
                    <TrendingUp className="h-5 w-5 text-muted-foreground" />
                  </div>
                </CardContent>
              </Card>
            </Link>
          );
        })}
      </div>

      {/* Recent Events */}
      <div className="grid gap-6 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Recent Events</CardTitle>
            <CardDescription>Your latest event activities</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {recentEvents.length === 0 ? (
              <p className="text-sm text-muted-foreground">No events yet. Create your first event!</p>
            ) : (
              recentEvents.map((event) => (
                <div key={event.id} className="flex items-start justify-between rounded-lg border p-4">
                  <div className="space-y-1">
                    <p className="font-medium">{event.title}</p>
                    <p className="text-sm text-muted-foreground">
                      {new Date(event.start).toLocaleDateString('en-US', {
                        month: 'short',
                        day: 'numeric',
                        year: 'numeric',
                      })}
                    </p>
                  </div>
                  <Link to={`/events/${event.id}`}>
                    <Button variant="ghost" size="sm">
                      View
                      <ArrowRight className="ml-2 h-4 w-4" />
                    </Button>
                  </Link>
                </div>
              ))
            )}
          </CardContent>
        </Card>

        {/* Quick Actions */}
        <Card>
          <CardHeader>
            <CardTitle>Quick Actions</CardTitle>
            <CardDescription>Get started with common tasks</CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            <Link to="/events/create">
              <Button variant="outline" className="w-full justify-start" size="lg">
                <PlusCircle className="mr-2 h-5 w-5" />
                Create New Event
              </Button>
            </Link>
            <Link to="/tickets">
              <Button variant="outline" className="w-full justify-start" size="lg">
                <Ticket className="mr-2 h-5 w-5" />
                Sell Tickets
              </Button>
            </Link>
            <Link to="/scanner">
              <Button variant="outline" className="w-full justify-start" size="lg">
                <ScanLine className="mr-2 h-5 w-5" />
                Scan Tickets
              </Button>
            </Link>
            <Link to="/artists">
              <Button variant="outline" className="w-full justify-start" size="lg">
                <Users className="mr-2 h-5 w-5" />
                Book Artists
              </Button>
            </Link>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
