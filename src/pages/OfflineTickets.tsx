import React, { useEffect, useState, useRef } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { eventService } from '@/services/event';
import { offlineTicketService } from '@/services/offlineTicketService';
import { TICKET_LAYOUT_PRESETS } from '@/constants/ticketLayouts';
import { TicketRenderer } from '@/components/offline-tickets/TicketRenderer';
import { LayoutSelector } from '@/components/offline-tickets/LayoutSelector';
import { DesignEditor } from '@/components/offline-tickets/DesignEditor';
import { EditOfflineTicketDialog } from '@/components/offline-tickets/EditOfflineTicketDialog';
import {
  Event,
  TicketType,
  TicketLayoutPreset,
  OfflineTicketDesignConfig,
  GeneratedOfflineTicket,
} from '@/types';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { toast } from '@/hooks/use-toast';
import {
  Printer,
  Download,
  Layers,
  Sparkles,
  Ticket as TicketIcon,
  CheckCircle2,
  Share2,
  Eye,
  Sliders,
  Calendar,
  FileDown,
  Loader2,
  RefreshCw,
  Plus,
  Edit,
  Trash2,
  Search,
  ArrowLeft,
  QrCode,
  Tag,
  User,
  Phone,
  MapPin,
} from 'lucide-react';
import QRCode from 'qrcode';

export default function OfflineTickets() {
  const location = useLocation();
  const navigate = useNavigate();

  // Mode: 'list' (view all created tickets) or 'create' (designer studio)
  const [viewMode, setViewMode] = useState<'list' | 'create'>('list');

  // Events & Filter
  const [events, setEvents] = useState<Event[]>([]);
  const [selectedEventId, setSelectedEventId] = useState<string>('all');
  const [selectedEvent, setSelectedEvent] = useState<Event | null>(null);
  const [ticketTypes, setTicketTypes] = useState<TicketType[]>([]);
  const [selectedTicketTypeId, setSelectedTicketTypeId] = useState<string>('');
  const [loadingEvents, setLoadingEvents] = useState(true);

  // All Created Tickets List
  const [allTickets, setAllTickets] = useState<GeneratedOfflineTicket[]>([]);
  const [loadingTickets, setLoadingTickets] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [ticketListViewType, setTicketListViewType] = useState<'by-event' | 'cards'>('by-event');

  // Editing Ticket Modal
  const [editingTicket, setEditingTicket] = useState<GeneratedOfflineTicket | null>(null);
  const [editDialogOpen, setEditDialogOpen] = useState(false);

  // Preview Modal / Single Ticket Print
  const [previewSingleTicket, setPreviewSingleTicket] = useState<GeneratedOfflineTicket | null>(null);

  // Batch Generation State
  const [quantity, setQuantity] = useState<number>(10);
  const [buyerName, setBuyerName] = useState<string>('');
  const [buyerPhone, setBuyerPhone] = useState<string>('');
  const [isGenerating, setIsGenerating] = useState(false);
  const [generatedBatch, setGeneratedBatch] = useState<GeneratedOfflineTicket[]>([]);

  // Selected Preset
  const [selectedPreset, setSelectedPreset] = useState<TicketLayoutPreset>(TICKET_LAYOUT_PRESETS[0]);

  // Design Configuration
  const [designConfig, setDesignConfig] = useState<OfflineTicketDesignConfig>({
    layoutId: TICKET_LAYOUT_PRESETS[0].id,
    bgFitMode: 'cover',
    bgZoom: 1,
    bgOffsetX: 0,
    bgOffsetY: 0,
    bgColor: '#13151c',
    accentColor: '#6366f1',
    textColor: '#ffffff',
    headerText: 'BROOKSHOW OFFICIAL EVENT PASS',
    tagline: 'Exclusive Live Access • Keep Stub Intact',
    showEventName: true,
    showEventDate: true,
    showVenue: true,
    showTicketType: true,
    showPrice: true,
    showQrCode: true,
    showTicketNumber: true,
  });

  // Active Tab inside Designer
  const [activeStudioTab, setActiveStudioTab] = useState<'layout' | 'design' | 'generate'>('layout');

  // Mock preview ticket
  const [mockPreviewTicket, setMockPreviewTicket] = useState<GeneratedOfflineTicket>({
    ticketId: '66e12a4b89f1d0123456789a',
    ticketNumber: 'OFF-EVT-2026-0001',
    eventId: '',
    eventTitle: 'Sample Gala Concert 2026',
    eventDate: new Date(Date.now() + 86400000 * 7).toISOString(),
    eventVenue: 'Grand Arena, Mumbai',
    ticketTypeName: 'VIP Platinum Pass',
    ticketPrice: 2500,
    qrPayload: 'https://brookshow.com/verify/sample',
    qrDataUrl: '',
    buyerName: 'Sample Attendee',
    createdAt: new Date().toISOString(),
  });

  // Load Initial Events & Tickets
  useEffect(() => {
    loadEventsAndTickets();
  }, []);

  // Map of eventId to its saved design config
  const [eventDesigns, setEventDesigns] = useState<Record<string, OfflineTicketDesignConfig>>({});

  // Helper to get formatted banner URL from event
  const getEventBannerUrl = (bannerUrl?: string) => {
    if (!bannerUrl) return undefined;
    if (
      bannerUrl.startsWith('http://') ||
      bannerUrl.startsWith('https://') ||
      bannerUrl.startsWith('data:') ||
      bannerUrl.startsWith('blob:')
    ) {
      return bannerUrl;
    }
    const backendBase = (import.meta.env.VITE_BACKEND_URL || import.meta.env.VITE_API_URL || 'http://localhost:5000').replace(/\/+$/, '');
    return `${backendBase}${bannerUrl.startsWith('/') ? '' : '/'}${bannerUrl}`;
  };

  // Helper to get design config for a specific event
  const getDesignForEvent = (eventItem: Event): OfflineTicketDesignConfig => {
    const eventId = eventItem._id || eventItem.id;
    if (eventDesigns[eventId]) {
      return eventDesigns[eventId];
    }
    const bannerFullUrl = getEventBannerUrl(eventItem.bannerUrl);
    return {
      ...designConfig,
      bgImageUrl: bannerFullUrl || designConfig.bgImageUrl,
    };
  };

  // Update preview ticket when event changes
  useEffect(() => {
    if (selectedEventId && selectedEventId !== 'all' && events.length > 0) {
      const found = events.find((e) => e._id === selectedEventId || e.id === selectedEventId);
      if (found) {
        setSelectedEvent(found);
        setTicketTypes(found.ticketData || []);

        const firstType = found.ticketData?.[0];
        if (firstType) {
          setSelectedTicketTypeId(firstType.id);
        }

        // Generate mockup QR for preview
        const dummyPayload = JSON.stringify({
          ticketId: '66e12a4b89f1d0123456789a',
          eventId: found._id || found.id,
          buyerName: buyerName || 'Guest Attendee',
          isOffline: true,
        });

        QRCode.toDataURL(dummyPayload, { width: 300, margin: 1 }).then((url) => {
          setMockPreviewTicket({
            ticketId: '66e12a4b89f1d0123456789a',
            ticketNumber: `OFF-${found.title.slice(0, 3).toUpperCase()}-2026-0001`,
            eventId: found._id || found.id,
            eventTitle: found.title,
            eventDate: found.startAt,
            eventVenue: `${found.venue || ''}${found.city ? ', ' + found.city : ''}`,
            ticketTypeName: firstType?.title || 'General Admission',
            ticketPrice: firstType?.price || 0,
            qrPayload: dummyPayload,
            qrDataUrl: url,
            buyerName: buyerName || 'VIP Guest',
            createdAt: new Date().toISOString(),
          });
        });

        // Load saved design if any
        offlineTicketService.getSavedDesign(found._id || found.id).then((saved) => {
          const bannerFullUrl = getEventBannerUrl(found.bannerUrl);
          if (saved) {
            const merged = {
              ...saved,
              bgImageUrl: saved.bgImageUrl || bannerFullUrl,
            };
            setDesignConfig(merged);
            setEventDesigns((prev) => ({ ...prev, [found._id || found.id]: merged }));
            const preset = TICKET_LAYOUT_PRESETS.find((p) => p.id === saved.layoutId);
            if (preset) setSelectedPreset(preset);
          } else if (bannerFullUrl) {
            setDesignConfig((prev) => ({
              ...prev,
              bgImageUrl: bannerFullUrl,
            }));
            setEventDesigns((prev) => ({
              ...prev,
              [found._id || found.id]: {
                ...prev[found._id || found.id],
                bgImageUrl: bannerFullUrl,
              } as OfflineTicketDesignConfig,
            }));
          }
        });
      }
    }
  }, [selectedEventId, events]);

  async function loadEventsAndTickets() {
    try {
      setLoadingEvents(true);
      const data = await eventService.listEvents();
      setEvents(data);

      // Pre-load all saved designs for each event from storage
      const designsMap: Record<string, OfflineTicketDesignConfig> = {};
      for (const evt of data) {
        const eid = evt._id || evt.id;
        const saved = await offlineTicketService.getSavedDesign(eid);
        const bannerFullUrl = getEventBannerUrl(evt.bannerUrl);
        if (saved) {
          designsMap[eid] = {
            ...saved,
            bgImageUrl: saved.bgImageUrl || bannerFullUrl,
          };
        } else if (bannerFullUrl) {
          designsMap[eid] = {
            ...designConfig,
            bgImageUrl: bannerFullUrl,
          };
        }
      }
      setEventDesigns(designsMap);

      const searchParams = new URLSearchParams(location.search);
      const eventIdParam = searchParams.get('eventId');

      if (eventIdParam && data.some((e) => e._id === eventIdParam || e.id === eventIdParam)) {
        setSelectedEventId(eventIdParam);
      }

      await refreshTicketList(eventIdParam || undefined);
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Failed to load offline tickets data',
        variant: 'destructive',
      });
    } finally {
      setLoadingEvents(false);
    }
  }

  async function refreshTicketList(filterEventId?: string) {
    try {
      setLoadingTickets(true);
      const tickets = await offlineTicketService.listOfflineTickets(
        filterEventId && filterEventId !== 'all' ? filterEventId : undefined
      );
      setAllTickets(tickets);
    } catch (e) {
      console.error('Failed to load tickets', e);
    } finally {
      setLoadingTickets(false);
    }
  }

  // Handle Event Filter Change in List View
  const handleEventFilterChange = (val: string) => {
    setSelectedEventId(val);
    refreshTicketList(val);
  };

  // Handle Select Preset
  const handleSelectPreset = (preset: TicketLayoutPreset) => {
    setSelectedPreset(preset);
    setDesignConfig((prev) => ({ ...prev, layoutId: preset.id }));
    toast({
      title: 'Layout Selected',
      description: `Switched to "${preset.name}" (${preset.dimensionsInch})`,
    });
  };

  // Handle Design Config change
  const handleDesignConfigChange = (updated: Partial<OfflineTicketDesignConfig>) => {
    setDesignConfig((prev) => ({ ...prev, ...updated }));
  };

  // Handle Generate Batch
  const handleGenerateTickets = async () => {
    if (!selectedEventId || selectedEventId === 'all') {
      toast({ title: 'Event Required', description: 'Please select a specific event first', variant: 'destructive' });
      return;
    }

    try {
      setIsGenerating(true);
      const batch = await offlineTicketService.generateOfflineTickets({
        eventId: selectedEventId,
        ticketTypeId: selectedTicketTypeId,
        quantity: Number(quantity) || 1,
        buyerName: buyerName.trim() || undefined,
        buyerPhone: buyerPhone.trim() || undefined,
        designConfig,
      });

      setGeneratedBatch(batch);
      await refreshTicketList(selectedEventId);
      toast({
        title: '✓ Offline Tickets Generated',
        description: `Successfully generated ${batch.length} printable tickets with QR codes!`,
      });
    } catch (err: any) {
      toast({
        title: 'Generation Failed',
        description: err.message || 'Could not generate tickets',
        variant: 'destructive',
      });
    } finally {
      setIsGenerating(false);
    }
  };

  // Handle Save Ticket Edits
  const handleSaveTicketEdit = async (
    ticketId: string,
    updates: { buyerName: string; buyerPhone: string; ticketTypeName: string; ticketPrice: number }
  ) => {
    try {
      await offlineTicketService.updateOfflineTicket(ticketId, updates);
      await refreshTicketList(selectedEventId !== 'all' ? selectedEventId : undefined);
      toast({
        title: '✓ Ticket Updated',
        description: 'Ticket details and QR code updated successfully.',
      });
    } catch (e: any) {
      toast({
        title: 'Update Failed',
        description: e.message || 'Failed to update ticket',
        variant: 'destructive',
      });
    }
  };

  // Loading state for batch deletion
  const [isDeletingAll, setIsDeletingAll] = useState(false);

  // Handle Delete Single Ticket
  const handleDeleteTicket = async (ticketId: string) => {
    if (confirm('Are you sure you want to delete this offline ticket?')) {
      await offlineTicketService.deleteOfflineTicket(ticketId);
      await refreshTicketList(selectedEventId !== 'all' ? selectedEventId : undefined);
      toast({ title: 'Ticket Deleted' });
    }
  };

  // Handle Delete All Filtered/Generated Tickets
  const handleDeleteAllTickets = async (ticketsToDelete?: GeneratedOfflineTicket[]) => {
    const targetTickets = ticketsToDelete && ticketsToDelete.length > 0 ? ticketsToDelete : filteredTickets;
    if (!targetTickets || targetTickets.length === 0) return;

    const count = targetTickets.length;
    const confirmMessage = `Are you sure you want to delete all ${count} offline tickets? This action cannot be undone.`;

    if (window.confirm(confirmMessage)) {
      try {
        setIsDeletingAll(true);
        await offlineTicketService.deleteAllOfflineTickets(targetTickets);
        await refreshTicketList(selectedEventId !== 'all' ? selectedEventId : undefined);
        toast({
          title: '✓ Offline Tickets Deleted',
          description: `Successfully removed ${count} offline tickets.`,
        });
      } catch (err: any) {
        toast({
          title: 'Deletion Failed',
          description: err.message || 'Could not delete all tickets',
          variant: 'destructive',
        });
      } finally {
        setIsDeletingAll(false);
      }
    }
  };

  // Tickets specifically designated for printing
  const [printTargetTickets, setPrintTargetTickets] = useState<GeneratedOfflineTicket[] | null>(null);

  // Print Handlers
  const handlePrint = (ticketsToPrint?: GeneratedOfflineTicket[]) => {
    // Explicitly determine which tickets to print for this print job
    let targets: GeneratedOfflineTicket[];
    if (ticketsToPrint && ticketsToPrint.length > 0) {
      targets = ticketsToPrint;
    } else if (viewMode === 'create' && generatedBatch.length > 0) {
      targets = generatedBatch;
    } else if (filteredTickets.length > 0) {
      targets = filteredTickets;
    } else {
      targets = [mockPreviewTicket];
    }

    setPrintTargetTickets(targets);

    setTimeout(() => {
      window.print();
      // Clean up after print dialog closes or completes so stale targets don't persist
      setPrintTargetTickets(null);
    }, 250);
  };

  // Filtered tickets based on search query
  const filteredTickets = allTickets.filter((t) => {
    const q = searchQuery.toLowerCase();
    return (
      t.ticketNumber.toLowerCase().includes(q) ||
      t.buyerName?.toLowerCase().includes(q) ||
      t.eventTitle.toLowerCase().includes(q) ||
      t.ticketTypeName.toLowerCase().includes(q) ||
      t.ticketId.toLowerCase().includes(q)
    );
  });

  return (
    <div className="space-y-6 pb-12 animate-fade-in">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-white/10 pb-5">
        <div className="flex items-center gap-3">
          <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-gradient-primary shadow-glow">
            <TicketIcon className="h-6 w-6 text-primary-foreground" />
          </div>
          <div>
            <h1 className="text-2xl md:text-3xl font-extrabold tracking-tight">
              Offline Tickets & Passes
            </h1>
            <p className="text-xs md:text-sm text-muted-foreground mt-0.5">
              Manage created offline passes, edit attendee details, customize formats, and print batches
            </p>
          </div>
        </div>

        {/* Action Button: Create / Back Toggle */}
        <div className="flex items-center gap-3">
          {viewMode === 'list' ? (
            <Button
              onClick={() => {
                if (selectedEventId === 'all' && events.length > 0) {
                  setSelectedEventId(events[0]._id || events[0].id);
                }
                setViewMode('create');
              }}
              size="lg"
              className="bg-gradient-primary hover:shadow-glow font-bold gap-2 text-sm"
            >
              <Plus className="h-4 w-4" />
              Create & Design Tickets
            </Button>
          ) : (
            <Button
              variant="outline"
              onClick={() => setViewMode('list')}
              size="lg"
              className="gap-2 text-sm border-white/20"
            >
              <ArrowLeft className="h-4 w-4" />
              Back to Created Tickets
            </Button>
          )}
        </div>
      </div>

      {/* VIEW 1: CREATED TICKETS LIST & MANAGEMENT */}
      {viewMode === 'list' && (
        <div className="space-y-6 animate-fade-in">
          {/* Filter & Search Bar */}
          <div className="flex flex-col sm:flex-row items-center justify-between gap-3 bg-card/40 p-4 rounded-xl border border-white/10 backdrop-blur-md">
            <div className="flex flex-col sm:flex-row items-center gap-3 w-full sm:w-auto">
              {/* Event Filter */}
              <div className="w-full sm:w-60">
                <Select value={selectedEventId} onValueChange={handleEventFilterChange}>
                  <SelectTrigger className="h-9 text-xs font-semibold">
                    <SelectValue placeholder="All Events" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Events ({events.length})</SelectItem>
                    {events.map((evt) => (
                      <SelectItem key={evt._id || evt.id} value={evt._id || evt.id}>
                        {evt.title}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {/* Search Bar */}
              <div className="relative w-full sm:w-72">
                <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Search by name, serial, event, tier..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-8 h-9 text-xs"
                />
              </div>
            </div>

            {/* Quick Stats, Delete All & Print Selected */}
            <div className="flex flex-wrap items-center gap-2 w-full sm:w-auto justify-between sm:justify-end">
              <Badge variant="secondary" className="text-xs px-3 py-1 font-mono">
                {filteredTickets.length} Tickets Found
              </Badge>
              {filteredTickets.length > 0 && (
                <div className="flex items-center gap-2">
                  <Button
                    onClick={() => handleDeleteAllTickets()}
                    disabled={isDeletingAll}
                    variant="outline"
                    size="sm"
                    className="h-9 text-xs gap-1.5 border-rose-500/30 text-rose-400 hover:bg-rose-500/10 hover:border-rose-500/50"
                  >
                    {isDeletingAll ? (
                      <Loader2 className="h-3.5 w-3.5 animate-spin" />
                    ) : (
                      <Trash2 className="h-3.5 w-3.5" />
                    )}
                    Delete All ({filteredTickets.length})
                  </Button>

                  <Button
                    onClick={() => handlePrint()}
                    variant="outline"
                    size="sm"
                    className="h-9 text-xs gap-1.5 border-emerald-500/40 text-emerald-400 hover:bg-emerald-500/10"
                  >
                    <Printer className="h-3.5 w-3.5" />
                    Print Filtered ({filteredTickets.length})
                  </Button>
                </div>
              )}
            </div>
          </div>

          {/* View Sub-mode Switcher & Action bar */}
          <div className="flex items-center justify-between gap-4">
            <div className="flex items-center gap-2">
              <span className="text-xs text-muted-foreground font-semibold">View as:</span>
              <div className="inline-flex p-1 bg-card/60 border border-white/10 rounded-lg">
                
                <Button
                  size="sm"
                  variant={ticketListViewType === 'by-event' ? 'default' : 'ghost'}
                  onClick={() => setTicketListViewType('by-event')}
                  className="h-7 text-xs px-2.5 font-medium"
                >
                  <Layers className="h-3.5 w-3.5 mr-1" />
                  1 Pass per Event ({events.length})
                </Button>
                <Button
                  size="sm"
                  variant={ticketListViewType === 'cards' ? 'default' : 'ghost'}
                  onClick={() => setTicketListViewType('cards')}
                  className="h-7 text-xs px-2.5 font-medium"
                >
                  <TicketIcon className="h-3.5 w-3.5 mr-1" />
                  All Created Passes ({filteredTickets.length})
                </Button>
              </div>
            </div>

            {filteredTickets.length > 0 && (
              <span className="text-xs text-muted-foreground font-mono">
                Showing {filteredTickets.length} created offline passes
              </span>
            )}
          </div>

          {/* LOADING STATE */}
          {loadingTickets || loadingEvents ? (
            <div className="flex items-center justify-center py-20">
              <Loader2 className="h-8 w-8 animate-spin text-primary" />
            </div>
          ) : ticketListViewType === 'cards' ? (
            /* SUB-VIEW 1: ALL CREATED TICKETS (INDIVIDUAL PASSES WITH QR) */
            filteredTickets.length === 0 ? (
              <Card className="border-dashed border-white/10 bg-card/20 text-center py-16">
                <CardContent className="space-y-4">
                  <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-2xl bg-primary/10 text-primary">
                    <TicketIcon className="h-8 w-8" />
                  </div>
                  <div>
                    <h3 className="text-lg font-bold">No Created Tickets Found</h3>
                    <p className="text-xs text-muted-foreground mt-1 max-w-md mx-auto">
                      {searchQuery
                        ? 'No tickets match your search query. Try searching with a different attendee name or serial.'
                        : 'You have not created any offline tickets yet. Click "Create & Design Tickets" above to generate your first batch.'}
                    </p>
                  </div>
                  <Button
                    onClick={() => {
                      if (selectedEventId === 'all' && events.length > 0) {
                        setSelectedEventId(events[0]._id || events[0].id);
                      }
                      setViewMode('create');
                    }}
                    className="bg-gradient-primary hover:shadow-glow text-xs"
                  >
                    <Plus className="h-4 w-4 mr-1.5" />
                    Create First Batch
                  </Button>
                </CardContent>
              </Card>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
                {filteredTickets.map((ticket) => (
                  <Card
                    key={ticket.ticketId}
                    className="border border-white/10 bg-card/40 hover:border-primary/40 hover:bg-card/60 transition-all group overflow-hidden shadow-lg flex flex-col justify-between"
                  >
                    <CardContent className="p-4 space-y-3.5 flex-1">
                      {/* Top Row: Event & Serial */}
                      <div className="flex items-start justify-between gap-2">
                        <div className="min-w-0">
                          <span className="text-[10px] font-mono tracking-wider text-primary font-bold block truncate">
                            {ticket.ticketNumber}
                          </span>
                          <h4 className="font-bold text-sm tracking-tight truncate group-hover:text-primary transition-colors">
                            {ticket.eventTitle}
                          </h4>
                        </div>
                        <Badge variant="outline" className="text-[10px] font-semibold border-primary/30 text-primary shrink-0">
                          {ticket.ticketTypeName}
                        </Badge>
                      </div>

                      {/* Visual QR & Attendee Details */}
                      <div className="flex items-center gap-3 bg-black/40 p-2.5 rounded-lg border border-white/5">
                        {ticket.qrDataUrl ? (
                          <div className="p-1 bg-white rounded shrink-0 shadow">
                            <img src={ticket.qrDataUrl} alt="QR" className="h-14 w-14 object-contain" />
                          </div>
                        ) : (
                          <div className="h-14 w-14 bg-muted flex items-center justify-center text-[9px] rounded font-mono">
                            QR
                          </div>
                        )}

                        <div className="space-y-1 text-xs min-w-0 flex-1">
                          <div className="flex items-center gap-1.5 font-medium truncate">
                            <User className="h-3 w-3 text-muted-foreground shrink-0" />
                            <span className="truncate">{ticket.buyerName || 'Walk-in Attendee'}</span>
                          </div>
                          {ticket.buyerPhone && (
                            <div className="flex items-center gap-1.5 text-muted-foreground text-[11px] truncate">
                              <Phone className="h-3 w-3 shrink-0" />
                              <span>{ticket.buyerPhone}</span>
                            </div>
                          )}
                          <div className="flex items-center gap-1.5 text-muted-foreground text-[11px] truncate">
                            <Calendar className="h-3 w-3 shrink-0" />
                            <span>
                              {ticket.eventDate
                                ? new Date(ticket.eventDate).toLocaleDateString('en-IN', {
                                    month: 'short',
                                    day: 'numeric',
                                    year: 'numeric',
                                  })
                                : 'Date TBA'}
                            </span>
                          </div>
                        </div>
                      </div>

                      {/* Mini Rendered Ticket Preview */}
                      <div className="pt-1">
                        {(() => {
                          const matchingEvent = events.find((e) => (e._id || e.id) === ticket.eventId);
                          const resolvedConfig = matchingEvent ? getDesignForEvent(matchingEvent) : designConfig;
                          const resolvedPreset = TICKET_LAYOUT_PRESETS.find((p) => p.id === resolvedConfig.layoutId) || selectedPreset;
                          return (
                            <TicketRenderer
                              ticket={ticket}
                              preset={resolvedPreset}
                              config={resolvedConfig}
                              className="scale-95 origin-center"
                            />
                          );
                        })()}
                      </div>
                    </CardContent>

                    {/* Footer Row: Price & Actions */}
                    <div className="flex items-center justify-between p-4 pt-2 border-t border-white/5 text-xs bg-black/20">
                      <div>
                        <span className="text-[10px] text-muted-foreground uppercase tracking-wider block">Price</span>
                        <span className="font-extrabold text-sm text-foreground">
                          ₹{ticket.ticketPrice.toLocaleString('en-IN')}
                        </span>
                      </div>

                      <div className="flex items-center gap-1.5">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => {
                            setEditingTicket(ticket);
                            setEditDialogOpen(true);
                          }}
                          className="h-8 px-2.5 text-xs hover:bg-primary/10 hover:text-primary"
                        >
                          <Edit className="h-3.5 w-3.5 mr-1" />
                          Edit
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => {
                            setSelectedEventId(ticket.eventId);
                            handlePrint([ticket]);
                          }}
                          className="h-8 px-2 text-xs border-emerald-500/30 text-emerald-400 hover:bg-emerald-500/10"
                        >
                          <Printer className="h-3.5 w-3.5" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => handleDeleteTicket(ticket.ticketId)}
                          className="h-8 w-8 text-muted-foreground hover:text-destructive hover:bg-destructive/10"
                        >
                          <Trash2 className="h-3.5 w-3.5" />
                        </Button>
                      </div>
                    </div>
                  </Card>
                ))}
              </div>
            )
          ) : (
            /* SUB-VIEW 2: 1 PASS PER EVENT GROUPING */
            events.length === 0 ? (
              <Card className="border-dashed border-white/10 bg-card/20 text-center py-16">
                <CardContent className="space-y-4">
                  <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-2xl bg-primary/10 text-primary">
                    <Calendar className="h-8 w-8" />
                  </div>
                  <div>
                    <h3 className="text-lg font-bold">No Events Found</h3>
                    <p className="text-xs text-muted-foreground mt-1 max-w-md mx-auto">
                      Create an event first to start generating and customizing offline tickets and stubs.
                    </p>
                  </div>
                  <Button
                    onClick={() => navigate('/events/create')}
                    className="bg-gradient-primary hover:shadow-glow text-xs"
                  >
                    <Plus className="h-4 w-4 mr-1.5" />
                    Create Event
                  </Button>
                </CardContent>
              </Card>
            ) : (
              <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
                {events
                  .filter((evt) => {
                    const eventId = evt._id || evt.id;
                    if (selectedEventId !== 'all' && eventId !== selectedEventId) return false;
                    if (searchQuery.trim()) {
                      const q = searchQuery.toLowerCase();
                      const matchesTitle = evt.title?.toLowerCase().includes(q);
                      const matchesVenue = evt.venue?.toLowerCase().includes(q) || evt.city?.toLowerCase().includes(q);
                      const hasMatchingTicket = allTickets.some(
                        (t) => (t.eventId === eventId) && (
                          t.ticketNumber.toLowerCase().includes(q) ||
                          t.buyerName?.toLowerCase().includes(q) ||
                          t.ticketTypeName.toLowerCase().includes(q)
                        )
                      );
                      return matchesTitle || matchesVenue || hasMatchingTicket;
                    }
                    return true;
                  })
                  .map((eventItem) => {
                    const eventId = eventItem._id || eventItem.id;
                    const eventTickets = allTickets.filter((t) => t.eventId === eventId);
                    const representativeTicket = eventTickets[0] || {
                      ticketId: `mock-${eventId}`,
                      ticketNumber: `OFF-${eventItem.title.slice(0, 3).toUpperCase()}-PASS`,
                      eventId: eventId,
                      eventTitle: eventItem.title,
                      eventDate: eventItem.startAt,
                      eventVenue: `${eventItem.venue || ''}${eventItem.city ? ', ' + eventItem.city : ''}`,
                      ticketTypeName: eventItem.ticketData?.[0]?.title || 'General Pass',
                      ticketPrice: eventItem.ticketData?.[0]?.price || 0,
                      qrPayload: `https://brookshow.com/verify/${eventId}`,
                      qrDataUrl: '',
                      buyerName: 'Official Event Pass',
                      createdAt: eventItem.createdAt || new Date().toISOString(),
                    };

                    return (
                      <Card
                        key={eventId}
                        className="border border-white/10 bg-card/40 hover:border-primary/40 hover:bg-card/60 transition-all group overflow-hidden shadow-xl"
                      >
                        {/* Event Header & Stats */}
                        <CardHeader className="p-4 pb-3 border-b border-white/5 flex flex-row items-center justify-between gap-2">
                          <div className="min-w-0 flex-1">
                            <div className="flex items-center gap-2">
                              <span className="text-[10px] font-mono font-bold uppercase tracking-wider text-primary">
                                Event Pass
                              </span>
                              {eventTickets.length > 0 ? (
                                <Badge className="bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 text-[10px] py-0 px-2">
                                  {eventTickets.length} Generated Passes
                                </Badge>
                              ) : (
                                <Badge variant="outline" className="text-muted-foreground text-[10px] py-0 px-2">
                                  Design Ready (0 Generated)
                                </Badge>
                              )}
                            </div>
                            <CardTitle className="text-base font-bold truncate mt-0.5 group-hover:text-primary transition-colors">
                              {eventItem.title}
                            </CardTitle>
                            <CardDescription className="text-xs truncate flex items-center gap-1.5 mt-0.5">
                              <Calendar className="h-3 w-3 text-muted-foreground shrink-0" />
                              {eventItem.startAt
                                ? new Date(eventItem.startAt).toLocaleDateString('en-IN', {
                                    weekday: 'short',
                                    month: 'short',
                                    day: 'numeric',
                                    year: 'numeric',
                                  })
                                : 'Date TBA'}
                              {eventItem.venue && (
                                <>
                                  <span className="text-white/20">•</span>
                                  <MapPin className="h-3 w-3 text-muted-foreground shrink-0" />
                                  <span className="truncate">{eventItem.venue}</span>
                                </>
                              )}
                            </CardDescription>
                          </div>

                          {/* Top Actions: Create / Design */}
                          <div className="flex items-center gap-1.5 shrink-0">
                            <Button
                              size="sm"
                              variant="default"
                              onClick={() => {
                                setSelectedEventId(eventId);
                                setViewMode('create');
                              }}
                              className="bg-primary/20 text-primary border border-primary/30 hover:bg-primary hover:text-white h-8 text-xs font-semibold gap-1"
                            >
                              <Sparkles className="h-3.5 w-3.5" />
                              Customize / Generate
                            </Button>
                          </div>
                        </CardHeader>

                        <CardContent className="p-4 space-y-4">
                          {/* 1 Ticket Visual Representation for this Event with Backend Image */}
                          <div className="w-full rounded-xl overflow-hidden shadow-md bg-black/40 border border-white/5 p-2 flex items-center justify-center">
                            <div className="w-full transform transition-transform hover:scale-[1.01]">
                              <TicketRenderer
                                ticket={representativeTicket}
                                preset={
                                  TICKET_LAYOUT_PRESETS.find((p) => p.id === getDesignForEvent(eventItem).layoutId) ||
                                  selectedPreset
                                }
                                config={getDesignForEvent(eventItem)}
                              />
                            </div>
                          </div>

                          {/* Event Pass Footer & Quick Batch Actions */}
                          <div className="flex flex-wrap items-center justify-between gap-3 pt-2 border-t border-white/5 text-xs">
                            <div className="flex items-center gap-3">
                              <div>
                                <span className="text-[10px] text-muted-foreground uppercase tracking-wider block">
                                  Ticket Tiers
                                </span>
                                <span className="font-semibold text-foreground text-xs">
                                  {eventItem.ticketData?.length || 1} Types (From ₹
                                  {Math.min(...(eventItem.ticketData?.map((t) => t.price) || [0])).toLocaleString('en-IN')})
                                </span>
                              </div>
                              <div className="border-l border-white/10 pl-3">
                                <span className="text-[10px] text-muted-foreground uppercase tracking-wider block">
                                  Current Layout
                                </span>
                                <span className="font-mono text-xs text-primary font-medium">
                                  {selectedPreset.name}
                                </span>
                              </div>
                            </div>

                            <div className="flex items-center gap-2">
                              {eventTickets.length > 0 ? (
                                <>
                                  <Button
                                    variant="outline"
                                    size="sm"
                                    onClick={() => {
                                      setEditingTicket(eventTickets[0]);
                                      setEditDialogOpen(true);
                                    }}
                                    className="h-8 text-xs gap-1 hover:bg-primary/10 hover:text-primary"
                                  >
                                    <Edit className="h-3.5 w-3.5" />
                                    Edit Pass
                                  </Button>
                                  <Button
                                    variant="outline"
                                    size="sm"
                                    onClick={() => {
                                      setSelectedEventId(eventId);
                                      handlePrint(eventTickets);
                                    }}
                                    className="h-8 text-xs gap-1 border-emerald-500/40 text-emerald-400 hover:bg-emerald-500/10"
                                  >
                                    <Printer className="h-3.5 w-3.5" />
                                    Print ({eventTickets.length})
                                  </Button>
                                  <Button
                                    variant="ghost"
                                    size="icon"
                                    disabled={isDeletingAll}
                                    onClick={() => handleDeleteAllTickets(eventTickets)}
                                    title={`Delete all ${eventTickets.length} tickets for this event`}
                                    className="h-8 w-8 text-muted-foreground hover:text-destructive hover:bg-destructive/10"
                                  >
                                    <Trash2 className="h-3.5 w-3.5" />
                                  </Button>
                                </>
                              ) : (
                                <Button
                                  size="sm"
                                  onClick={() => {
                                    setSelectedEventId(eventId);
                                    setViewMode('create');
                                    setActiveStudioTab('generate');
                                  }}
                                  className="h-8 text-xs bg-gradient-primary hover:shadow-glow font-semibold gap-1"
                                >
                                  <Plus className="h-3.5 w-3.5" />
                                  Generate Passes
                                </Button>
                              )}
                            </div>
                          </div>
                        </CardContent>
                      </Card>
                    );
                  })}
              </div>
            )
          )}
        </div>
      )}

      {/* VIEW 2: TICKET DESIGNER STUDIO & GENERATOR */}
      {viewMode === 'create' && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start animate-fade-in">
          {/* Left Column: Editor Tabs */}
          <div className="lg:col-span-6 xl:col-span-5 space-y-6">
            <Tabs value={activeStudioTab} onValueChange={(val: any) => setActiveStudioTab(val)} className="w-full">
              <TabsList className="grid grid-cols-3 h-11 p-1 bg-card/60 border border-white/10 backdrop-blur-md rounded-xl">
                <TabsTrigger
                  value="layout"
                  className="text-xs flex items-center gap-1.5 data-[state=active]:bg-primary data-[state=active]:text-primary-foreground font-semibold"
                >
                  <Layers className="h-3.5 w-3.5" />
                  1. Layouts
                </TabsTrigger>
                <TabsTrigger
                  value="design"
                  className="text-xs flex items-center gap-1.5 data-[state=active]:bg-primary data-[state=active]:text-primary-foreground font-semibold"
                >
                  <Sliders className="h-3.5 w-3.5" />
                  2. Design & Fit
                </TabsTrigger>
                <TabsTrigger
                  value="generate"
                  className="text-xs flex items-center gap-1.5 data-[state=active]:bg-primary data-[state=active]:text-primary-foreground font-semibold"
                >
                  <Printer className="h-3.5 w-3.5" />
                  3. Batch Print
                </TabsTrigger>
              </TabsList>

              {/* TAB 1: Layout Selection */}
              <TabsContent value="layout" className="mt-4 space-y-4">
                <Card className="glass-modern border-white/10">
                  <CardHeader className="pb-3">
                    <CardTitle className="text-base font-bold flex items-center gap-2">
                      <Layers className="h-4 w-4 text-primary" />
                      Select Ticket Size & Layout Format
                    </CardTitle>
                    <CardDescription className="text-xs">
                      Choose from standard tear-off stubs, raffle formats, large event passes, VIP keepsakes, and roll tickets.
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <LayoutSelector
                      selectedLayoutId={selectedPreset.id}
                      onSelectLayout={handleSelectPreset}
                    />

                    <div className="mt-6 flex justify-end">
                      <Button
                        onClick={() => setActiveStudioTab('design')}
                        className="bg-gradient-primary hover:shadow-glow text-xs h-9"
                      >
                        Continue to Design & Fit →
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              </TabsContent>

              {/* TAB 2: Design Editor & Fitting */}
              <TabsContent value="design" className="mt-4 space-y-4">
                <Card className="glass-modern border-white/10">
                  <CardHeader className="pb-3">
                    <CardTitle className="text-base font-bold flex items-center gap-2">
                      <Sliders className="h-4 w-4 text-primary" />
                      Customize & Fit Ticket Artwork
                    </CardTitle>
                    <CardDescription className="text-xs">
                      Upload your background artwork, adjust zoom/offset positions, change color themes, and toggle fields.
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <DesignEditor
                      config={designConfig}
                      onChange={handleDesignConfigChange}
                    />

                    <div className="flex justify-between pt-4 border-t border-white/10">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => setActiveStudioTab('layout')}
                        className="text-xs"
                      >
                        ← Back to Layouts
                      </Button>
                      <Button
                        onClick={() => setActiveStudioTab('generate')}
                        className="bg-gradient-primary hover:shadow-glow text-xs h-9"
                      >
                        Proceed to Generate Batch →
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              </TabsContent>

              {/* TAB 3: Batch Generation & Issue */}
              <TabsContent value="generate" className="mt-4 space-y-4">
                <Card className="glass-modern border-white/10">
                  <CardHeader className="pb-3">
                    <CardTitle className="text-base font-bold flex items-center gap-2">
                      <Printer className="h-4 w-4 text-primary" />
                      Batch Generation & Print Setup
                    </CardTitle>
                    <CardDescription className="text-xs">
                      Generate unique QR security serials for every printed pass.
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    {/* Target Event */}
                    <div className="space-y-1.5">
                      <Label className="text-xs">Event</Label>
                      <Select
                        value={selectedEventId}
                        onValueChange={(val) => {
                          setSelectedEventId(val);
                          refreshTicketList(val);
                        }}
                      >
                        <SelectTrigger className="h-9 text-xs">
                          <SelectValue placeholder="Select event" />
                        </SelectTrigger>
                        <SelectContent>
                          {events.map((evt) => (
                            <SelectItem key={evt._id || evt.id} value={evt._id || evt.id}>
                              {evt.title}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>

                    {/* Ticket Type Selection */}
                    <div className="space-y-1.5">
                      <Label className="text-xs">Ticket Tier / Category</Label>
                      <Select
                        value={selectedTicketTypeId}
                        onValueChange={setSelectedTicketTypeId}
                      >
                        <SelectTrigger className="h-9 text-xs">
                          <SelectValue placeholder="Select ticket tier" />
                        </SelectTrigger>
                        <SelectContent>
                          {ticketTypes.map((tt) => (
                            <SelectItem key={tt.id} value={tt.id}>
                              {tt.title} — ₹{tt.price} ({tt.quantity - tt.sold} available)
                            </SelectItem>
                          ))}
                          {ticketTypes.length === 0 && (
                            <SelectItem value="standard">General Admission (Offline)</SelectItem>
                          )}
                        </SelectContent>
                      </Select>
                    </div>

                    {/* Quantity */}
                    <div className="space-y-1.5">
                      <div className="flex justify-between">
                        <Label className="text-xs">Number of Tickets to Print</Label>
                        <span className="text-xs font-mono text-primary font-bold">{quantity} tickets</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <Input
                          type="number"
                          min={1}
                          max={500}
                          value={quantity}
                          onChange={(e) => setQuantity(Math.max(1, parseInt(e.target.value) || 1))}
                          className="h-9 text-xs"
                        />
                        <div className="flex gap-1">
                          {[5, 20, 50, 100].map((num) => (
                            <Button
                              key={num}
                              type="button"
                              variant="outline"
                              size="sm"
                              onClick={() => setQuantity(num)}
                              className="h-9 text-xs px-2.5"
                            >
                              +{num}
                            </Button>
                          ))}
                        </div>
                      </div>
                    </div>

                    {/* Optional Guest / Channel Info */}
                    <div className="space-y-3 rounded-xl border border-white/5 bg-muted/20 p-3">
                      <p className="text-xs font-semibold text-muted-foreground">
                        Batch Tagging / Walk-in Buyer (Optional)
                      </p>
                      <div className="grid grid-cols-2 gap-2">
                        <Input
                          placeholder="Buyer / Outlet Name"
                          value={buyerName}
                          onChange={(e) => setBuyerName(e.target.value)}
                          className="h-8 text-xs"
                        />
                        <Input
                          placeholder="Phone Number"
                          value={buyerPhone}
                          onChange={(e) => setBuyerPhone(e.target.value)}
                          className="h-8 text-xs"
                        />
                      </div>
                    </div>

                    {/* Generate Button */}
                    <Button
                      onClick={handleGenerateTickets}
                      disabled={isGenerating}
                      size="lg"
                      className="w-full bg-gradient-primary hover:shadow-glow font-bold h-11 text-sm transition-all"
                    >
                      {isGenerating ? (
                        <>
                          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                          Generating {quantity} Unique Passes...
                        </>
                      ) : (
                        <>
                          <Sparkles className="mr-2 h-4 w-4" />
                          Generate & Prepare {quantity} Offline Tickets
                        </>
                      )}
                    </Button>
                  </CardContent>
                </Card>
              </TabsContent>
            </Tabs>
          </div>

          {/* Right Column: Interactive Live Preview & Print Grid */}
          <div className="lg:col-span-6 xl:col-span-7 space-y-6">
            {/* Live Preview Container */}
            <Card className="glass-ultra border-primary/20 overflow-hidden shadow-2xl">
              <CardHeader className="p-4 border-b border-white/10 flex flex-row items-center justify-between">
                <div>
                  <CardTitle className="text-base font-bold flex items-center gap-2">
                    <Eye className="h-4 w-4 text-primary" />
                    Live Preview
                  </CardTitle>
                  <CardDescription className="text-xs">
                    {selectedPreset.name} • {selectedPreset.dimensionsInch} ({selectedPreset.dimensionsMm})
                  </CardDescription>
                </div>
                <Badge variant="outline" className="text-[10px] uppercase font-mono tracking-wider border-primary/40 text-primary">
                  {selectedPreset.hasStub ? 'With Tear-off Stub' : 'Seamless Pass'}
                </Badge>
              </CardHeader>
              <CardContent className="p-4 md:p-8 bg-black/40 flex items-center justify-center min-h-[320px]">
                <div className="w-full max-w-xl transition-all duration-300">
                  <TicketRenderer
                    ticket={mockPreviewTicket}
                    preset={selectedPreset}
                    config={designConfig}
                  />
                </div>
              </CardContent>
            </Card>

            {/* Generated Batch Print Preview */}
            {generatedBatch.length > 0 && (
              <Card className="border-2 border-primary/40 glass-ultra shadow-neon-strong animate-scale-in">
                <CardHeader className="p-4 border-b border-white/10 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                  <div>
                    <CardTitle className="text-base font-bold flex items-center gap-2 text-primary">
                      <CheckCircle2 className="h-5 w-5 text-emerald-400" />
                      Generated Batch Ready ({generatedBatch.length} Tickets)
                    </CardTitle>
                    <CardDescription className="text-xs">
                      Each pass contains a distinct cryptographically serialized QR code matching event dates & venues.
                    </CardDescription>
                  </div>

                  <div className="flex items-center gap-2">
                    <Button
                      onClick={() => handlePrint(generatedBatch)}
                      className="bg-emerald-600 hover:bg-emerald-700 text-white font-bold h-9 text-xs shadow-md gap-1.5"
                    >
                      <Printer className="h-4 w-4" />
                      Print All ({generatedBatch.length})
                    </Button>
                  </div>
                </CardHeader>

                <CardContent className="p-4 space-y-4 max-h-[500px] overflow-y-auto">
                  <div className="grid grid-cols-1 gap-4 print:grid-cols-1">
                    {generatedBatch.map((t, idx) => (
                      <div key={t.ticketId} className="relative group">
                        <div className="absolute top-2 left-2 z-20 bg-black/70 backdrop-blur-xs text-[10px] font-mono px-2 py-0.5 rounded text-white border border-white/20">
                          Ticket #{idx + 1}
                        </div>
                        <TicketRenderer
                          ticket={t}
                          preset={selectedPreset}
                          config={designConfig}
                        />
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            )}
          </div>
        </div>
      )}

      {/* Edit Ticket Modal Dialog */}
      <EditOfflineTicketDialog
        ticket={editingTicket}
        open={editDialogOpen}
        onOpenChange={setEditDialogOpen}
        onSave={handleSaveTicketEdit}
      />

      {/* Hidden Print Container for High-Fidelity Paper Output */}
      <div className="hidden print:block print:w-full print:p-0">
        <style>{`
          @media print {
            body * {
              visibility: hidden;
            }
            #printable-tickets-area, #printable-tickets-area * {
              visibility: visible;
            }
            #printable-tickets-area {
              position: absolute;
              left: 0;
              top: 0;
              width: 100%;
              margin: 0;
              padding: 0;
            }
            .ticket-print-page {
              page-break-after: always;
              page-break-inside: avoid;
              break-after: page;
              display: flex;
              justify-content: center;
              align-items: center;
              padding: 10mm 0;
              margin: 0 auto;
            }
          }
        `}</style>
        <div id="printable-tickets-area">
          {(printTargetTickets && printTargetTickets.length > 0
            ? printTargetTickets
            : viewMode === 'create' && generatedBatch.length > 0
            ? generatedBatch
            : filteredTickets.length > 0
            ? filteredTickets
            : [mockPreviewTicket]
          ).map((t) => {
            const matchingEvent = events.find((e) => (e._id || e.id) === t.eventId);
            const resolvedConfig = matchingEvent
              ? getDesignForEvent(matchingEvent)
              : t.eventId === selectedEventId
              ? designConfig
              : designConfig;
            const resolvedPreset =
              TICKET_LAYOUT_PRESETS.find((p) => p.id === resolvedConfig.layoutId) || selectedPreset;

            const printWidthStyle = resolvedPreset.widthMm
              ? `${resolvedPreset.widthMm}mm`
              : '100%';

            return (
              <div key={t.ticketId} className="ticket-print-page">
                <div style={{ width: printWidthStyle, maxWidth: '100%' }}>
                  <TicketRenderer
                    ticket={t}
                    preset={resolvedPreset}
                    config={resolvedConfig}
                  />
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
