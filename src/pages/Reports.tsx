import { useEffect, useState } from 'react';
import { Download, FileText, Calendar as CalendarIcon } from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { storage, db } from '@/services/storage';
import { toast } from '@/hooks/use-toast';
import type { ScanLog, Ticket, Event, TicketType } from '@/types';

export default function Reports() {
  const [scanLogs, setScanLogs] = useState<ScanLog[]>([]);
  const [tickets, setTickets] = useState<Ticket[]>([]);
  const [events, setEvents] = useState<Event[]>([]);
  const [ticketTypes, setTicketTypes] = useState<TicketType[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadData();
  }, []);

  async function loadData() {
    try {
      const [logsData, ticketsData, eventsData, typesData] = await Promise.all([
        storage.getAll<ScanLog>(db.scanLogs),
        storage.getAll<Ticket>(db.tickets),
        storage.getAll<Event>(db.events),
        storage.getAll<TicketType>(db.ticketTypes),
      ]);

      setScanLogs(logsData.sort((a, b) => 
        new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()
      ));
      setTickets(ticketsData);
      setEvents(eventsData);
      setTicketTypes(typesData);
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Failed to load reports',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  }

  function exportScansToCSV() {
    try {
      const headers = ['Timestamp', 'Scanner ID', 'Ticket ID', 'Result', 'Synced', 'Error'];
      const rows = scanLogs.map(log => [
        new Date(log.timestamp).toISOString(),
        log.scannerId,
        log.ticketId || '',
        log.result,
        log.synced ? 'Yes' : 'No',
        log.errorMessage || '',
      ]);

      const csv = [headers, ...rows]
        .map(row => row.map(cell => `"${cell}"`).join(','))
        .join('\n');

      const blob = new Blob([csv], { type: 'text/csv' });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `scan-logs-${Date.now()}.csv`;
      link.click();
      URL.revokeObjectURL(url);

      toast({
        title: 'Export Complete',
        description: 'Scan logs exported to CSV',
      });
    } catch (error) {
      toast({
        title: 'Export Failed',
        description: 'Failed to export scan logs',
        variant: 'destructive',
      });
    }
  }

  function exportSalesToCSV() {
    try {
      const headers = ['Event', 'Ticket Type', 'Buyer Name', 'Email', 'Phone', 'Issued At', 'Scanned'];
      const rows = tickets.map(ticket => {
        const event = events.find(e => e.id === ticket.eventId);
        const ticketType = ticketTypes.find(tt => tt.id === ticket.ticketTypeId);
        return [
          event?.title || '',
          ticketType?.title || '',
          ticket.buyerName,
          ticket.buyerEmail,
          ticket.buyerPhone,
          new Date(ticket.issuedAt).toISOString(),
          ticket.scanned ? 'Yes' : 'No',
        ];
      });

      const csv = [headers, ...rows]
        .map(row => row.map(cell => `"${cell}"`).join(','))
        .join('\n');

      const blob = new Blob([csv], { type: 'text/csv' });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `ticket-sales-${Date.now()}.csv`;
      link.click();
      URL.revokeObjectURL(url);

      toast({
        title: 'Export Complete',
        description: 'Sales data exported to CSV',
      });
    } catch (error) {
      toast({
        title: 'Export Failed',
        description: 'Failed to export sales data',
        variant: 'destructive',
      });
    }
  }

  const validScans = scanLogs.filter(log => log.result === 'valid').length;
  const invalidScans = scanLogs.filter(log => log.result === 'invalid').length;
  const duplicateScans = scanLogs.filter(log => log.result === 'duplicate').length;
  const unsyncedScans = scanLogs.filter(log => !log.synced).length;

  const totalRevenue = ticketTypes.reduce((sum, tt) => sum + (tt.sold * tt.price), 0);

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <h1 className="text-4xl font-bold">Reports</h1>
        </div>
        <div className="grid gap-6 md:grid-cols-2">
          {[1, 2].map((i) => (
            <Card key={i} className="animate-pulse">
              <CardHeader className="h-32 bg-muted/50" />
            </Card>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-4xl font-bold">Reports</h1>
        <p className="mt-2 text-muted-foreground">
          View analytics and export data
        </p>
      </div>

      {/* Summary Cards */}
      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="pb-2">
            <CardDescription>Total Scans</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">{scanLogs.length}</div>
            <p className="text-xs text-muted-foreground mt-1">
              {validScans} valid, {invalidScans} invalid
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardDescription>Tickets Sold</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">{tickets.length}</div>
            <p className="text-xs text-muted-foreground mt-1">
              {tickets.filter(t => t.scanned).length} scanned
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardDescription>Revenue</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">${totalRevenue.toLocaleString()}</div>
            <p className="text-xs text-muted-foreground mt-1">
              From {ticketTypes.length} ticket types
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardDescription>Pending Sync</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">{unsyncedScans}</div>
            <p className="text-xs text-muted-foreground mt-1">
              Unsynced scan logs
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Export Actions */}
      <Card>
        <CardHeader>
          <CardTitle>Export Data</CardTitle>
          <CardDescription>Download reports in CSV format</CardDescription>
        </CardHeader>
        <CardContent className="space-y-3">
          <Button
            variant="outline"
            className="w-full justify-start"
            onClick={exportScansToCSV}
            disabled={scanLogs.length === 0}
          >
            <Download className="mr-2 h-4 w-4" />
            Export Scan Logs ({scanLogs.length} records)
          </Button>

          <Button
            variant="outline"
            className="w-full justify-start"
            onClick={exportSalesToCSV}
            disabled={tickets.length === 0}
          >
            <Download className="mr-2 h-4 w-4" />
            Export Ticket Sales ({tickets.length} records)
          </Button>
        </CardContent>
      </Card>

      {/* Recent Scans */}
      <Card>
        <CardHeader>
          <CardTitle>Recent Scans</CardTitle>
          <CardDescription>Latest ticket scan activity</CardDescription>
        </CardHeader>
        <CardContent>
          {scanLogs.length === 0 ? (
            <p className="text-sm text-muted-foreground">No scans yet</p>
          ) : (
            <div className="space-y-3">
              {scanLogs.slice(0, 10).map((log) => {
                const resultColors = {
                  valid: 'bg-success text-success-foreground',
                  invalid: 'bg-destructive text-destructive-foreground',
                  duplicate: 'bg-warning text-warning-foreground',
                  error: 'bg-muted text-muted-foreground',
                };

                return (
                  <div key={log.id} className="flex items-center justify-between rounded-lg border p-3">
                    <div className="space-y-1">
                      <div className="flex items-center gap-2">
                        <Badge className={resultColors[log.result]}>
                          {log.result}
                        </Badge>
                        {!log.synced && (
                          <Badge variant="outline">Pending Sync</Badge>
                        )}
                      </div>
                      <p className="text-xs text-muted-foreground">
                        Scanner: {log.scannerId}
                      </p>
                      {log.errorMessage && (
                        <p className="text-xs text-destructive">{log.errorMessage}</p>
                      )}
                    </div>
                    <div className="text-right">
                      <p className="text-sm font-medium">
                        {new Date(log.timestamp).toLocaleTimeString()}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        {new Date(log.timestamp).toLocaleDateString()}
                      </p>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Sales by Event */}
      <Card>
        <CardHeader>
          <CardTitle>Sales by Event</CardTitle>
          <CardDescription>Revenue breakdown per event</CardDescription>
        </CardHeader>
        <CardContent>
          {events.length === 0 ? (
            <p className="text-sm text-muted-foreground">No events yet</p>
          ) : (
            <div className="space-y-4">
              {events.map((event) => {
                const eventTicketTypes = ticketTypes.filter(tt => tt.eventId === event.id);
                const eventRevenue = eventTicketTypes.reduce((sum, tt) => sum + (tt.sold * tt.price), 0);
                const totalSold = eventTicketTypes.reduce((sum, tt) => sum + tt.sold, 0);

                if (totalSold === 0) return null;

                return (
                  <div key={event.id} className="space-y-2">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="font-medium">{event.title}</p>
                        <p className="text-sm text-muted-foreground">
                          {new Date(event.start).toLocaleDateString()}
                        </p>
                      </div>
                      <div className="text-right">
                        <p className="font-bold">${eventRevenue.toLocaleString()}</p>
                        <p className="text-sm text-muted-foreground">{totalSold} sold</p>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
