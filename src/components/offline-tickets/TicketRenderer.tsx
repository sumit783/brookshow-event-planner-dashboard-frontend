import React from 'react';
import QRCode from 'qrcode';
import { TicketLayoutPreset, OfflineTicketDesignConfig, GeneratedOfflineTicket } from '@/types';
import { Calendar, MapPin, Tag, Sparkles } from 'lucide-react';

interface TicketRendererProps {
  ticket: GeneratedOfflineTicket;
  preset: TicketLayoutPreset;
  config: OfflineTicketDesignConfig;
  scale?: number;
  className?: string;
  id?: string;
}

export const TicketRenderer: React.FC<TicketRendererProps> = ({
  ticket,
  preset,
  config,
  scale = 1,
  className = '',
  id,
}) => {
  const isVertical = preset.orientation === 'vertical';
  const isSquare = preset.orientation === 'square';
  const hasStub = preset.hasStub;

  // Background style computation
  const backgroundStyle: React.CSSProperties = {
    backgroundColor: config.bgColor || '#18181b',
    color: config.textColor || '#ffffff',
  };

  const imageTransform = `translate(${config.bgOffsetX || 0}%, ${config.bgOffsetY || 0}%) scale(${config.bgZoom || 1})`;

  return (
    <div
      id={id}
      className={`ticket-renderer-container relative overflow-hidden rounded-xl border border-white/15 shadow-2xl transition-all print:shadow-none print:border-black select-none ${className}`}
      style={{
        ...backgroundStyle,
        aspectRatio: `${preset.aspectRatio}`,
        width: '100%',
        maxWidth: preset.widthMm ? `${preset.widthMm}mm` : undefined,
      }}
    >
      {/* Background Graphic Layer */}
      {config.bgImageUrl && (
        <div 
          className="absolute inset-0 overflow-hidden pointer-events-none z-0"
          style={{
            WebkitPrintColorAdjust: 'exact',
            printColorAdjust: 'exact',
          }}
        >
          <img
            src={config.bgImageUrl}
            alt="Ticket Background"
            crossOrigin="anonymous"
            className="w-full h-full"
            style={{
              objectFit: config.bgFitMode,
              transform: imageTransform,
              transformOrigin: 'center center',
              WebkitPrintColorAdjust: 'exact',
              printColorAdjust: 'exact',
            }}
          />
          {/* Subtle contrast gradient */}
          <div
            className="absolute inset-0"
            style={{
              background: `linear-gradient(135deg, rgba(0,0,0,0.55) 0%, rgba(0,0,0,0.3) 50%, rgba(0,0,0,0.65) 100%)`,
              WebkitPrintColorAdjust: 'exact',
              printColorAdjust: 'exact',
            }}
          />
        </div>
      )}

      {/* Decorative Brand Watermark / Accent Mesh */}
      <div
        className="absolute -right-16 -top-16 h-48 w-48 rounded-full blur-3xl opacity-30 pointer-events-none z-0"
        style={{ backgroundColor: config.accentColor || '#6366f1' }}
      />
      <div
        className="absolute -left-16 -bottom-16 h-48 w-48 rounded-full blur-3xl opacity-20 pointer-events-none z-0"
        style={{ backgroundColor: config.accentColor || '#6366f1' }}
      />

      {/* Main Content Layout */}
      {hasStub ? (
        <div className="relative z-10 flex h-full w-full">
          {/* Main Body */}
          <div
            className="flex flex-col justify-between p-2.5 sm:p-3.5 md:p-4 min-h-0 overflow-hidden"
            style={{ width: `${100 - (preset.stubWidthPercent || 25)}%` }}
          >
            {/* Header / Brand info */}
            <div className="space-y-0.5 sm:space-y-1">
              <div className="flex items-center justify-between gap-1.5">
                <div className="flex items-center gap-1 min-w-0">
                  <span
                    className="inline-block h-1.5 w-1.5 rounded-full shrink-0"
                    style={{ backgroundColor: config.accentColor || '#6366f1' }}
                  />
                  <span className="text-[9px] sm:text-[10px] md:text-xs font-bold uppercase tracking-wider opacity-85 truncate">
                    {config.headerText || 'BROOKSHOW OFFICIAL EVENT PASS'}
                  </span>
                </div>
                {config.showTicketType && (
                  <span
                    className="text-[8px] sm:text-[9px] md:text-[10px] font-bold px-1.5 py-0.5 rounded-full uppercase tracking-wider shrink-0"
                    style={{
                      backgroundColor: `${config.accentColor || '#6366f1'}33`,
                      color: config.accentColor || '#a5b4fc',
                      border: `1px solid ${config.accentColor || '#6366f1'}66`,
                    }}
                  >
                    {ticket.ticketTypeName || 'GENERAL ADMISSION'}
                  </span>
                )}
              </div>

              {config.showEventName && (
                <h2 className="text-xs sm:text-base md:text-lg lg:text-xl font-black tracking-tight line-clamp-1 leading-snug">
                  {ticket.eventTitle || 'Grand Event Title'}
                </h2>
              )}

              {config.tagline && (
                <p className="text-[8px] sm:text-[9px] md:text-[10px] opacity-75 font-medium line-clamp-1">
                  {config.tagline}
                </p>
              )}
            </div>

            {/* Event Details: Date & Venue */}
            <div className="grid grid-cols-2 gap-1.5 sm:gap-2 my-auto py-0.5 text-[9px] sm:text-[10px] md:text-xs min-h-0">
              {config.showEventDate && (
                <div className="flex items-start gap-1 min-w-0">
                  <Calendar
                    className="h-3 w-3 mt-0.5 shrink-0"
                    style={{ color: config.accentColor || '#818cf8' }}
                  />
                  <div className="min-w-0">
                    <span className="text-[7.5px] sm:text-[8.5px] uppercase tracking-wider block opacity-60 font-semibold leading-tight">
                      Date & Time
                    </span>
                    <span className="font-semibold leading-tight block truncate text-[8.5px] sm:text-[10px] md:text-xs">
                      {ticket.eventDate
                        ? new Date(ticket.eventDate).toLocaleDateString('en-IN', {
                            weekday: 'short',
                            month: 'short',
                            day: 'numeric',
                            year: 'numeric',
                          })
                        : 'Dec 31, 2026'}
                    </span>
                  </div>
                </div>
              )}

              {config.showVenue && (
                <div className="flex items-start gap-1 min-w-0">
                  <MapPin
                    className="h-3 w-3 mt-0.5 shrink-0"
                    style={{ color: config.accentColor || '#818cf8' }}
                  />
                  <div className="min-w-0">
                    <span className="text-[7.5px] sm:text-[8.5px] uppercase tracking-wider block opacity-60 font-semibold leading-tight">
                      Location / Venue
                    </span>
                    <span className="font-semibold leading-tight block truncate text-[8.5px] sm:text-[10px] md:text-xs">
                      {ticket.eventVenue || 'Venue Name, City'}
                    </span>
                  </div>
                </div>
              )}
            </div>

            {/* Footer Row: Buyer / Price / Serial */}
            <div className="flex items-end justify-between pt-1 sm:pt-1.5 border-t border-white/10 text-[8.5px] sm:text-[10px] md:text-xs">
              <div className="flex flex-col min-w-0 pr-1">
                {ticket.buyerName && (
                  <span className="font-medium text-[8px] sm:text-[9px] md:text-[10px] truncate">
                    Holder: <strong className="font-bold">{ticket.buyerName}</strong>
                  </span>
                )}
                {config.showTicketNumber && (
                  <span className="font-mono text-[7.5px] sm:text-[8.5px] opacity-70 tracking-wider truncate">
                    #{ticket.ticketNumber || 'TKT-000001'}
                  </span>
                )}
              </div>

              {config.showPrice && ticket.ticketPrice > 0 && (
                <div className="text-right shrink-0">
                  <span className="text-[7.5px] sm:text-[8px] block opacity-60 uppercase font-semibold leading-none">Price</span>
                  <span
                    className="text-xs sm:text-sm md:text-base font-black tracking-tight leading-none block mt-0.5"
                    style={{ color: config.accentColor || '#a5b4fc' }}
                  >
                    ₹{ticket.ticketPrice.toLocaleString('en-IN')}
                  </span>
                </div>
              )}
            </div>
          </div>

          {/* Perforated Divider */}
          <div className="relative flex flex-col justify-between items-center w-0 border-r-2 border-dashed border-white/30 my-1.5 shrink-0">
            <div className="absolute -top-3 -left-2.5 h-5 w-5 rounded-full bg-background border border-white/20" />
            <div className="absolute -bottom-3 -left-2.5 h-5 w-5 rounded-full bg-background border border-white/20" />
          </div>

          {/* Tear-off Stub Section */}
          <div
            className="flex flex-col items-center justify-between p-2 sm:p-3 text-center bg-black/35 backdrop-blur-xs min-h-0 overflow-hidden"
            style={{ width: `${preset.stubWidthPercent || 25}%` }}
          >
            <div className="w-full flex justify-between items-center text-[7.5px] sm:text-[8.5px] uppercase tracking-widest opacity-60 font-mono leading-none">
              <span>STUB</span>
              <span className="truncate max-w-[50%]">#{ticket.ticketNumber ? ticket.ticketNumber.slice(-4) : '0001'}</span>
            </div>

            {/* QR Code */}
            {config.showQrCode && (
              <div className="my-auto flex flex-col items-center justify-center py-0.5">
                <div className="p-1 bg-white rounded-md shadow-md">
                  {ticket.qrDataUrl ? (
                    <img
                      src={ticket.qrDataUrl}
                      alt="Ticket QR Code"
                      className="w-11 h-11 sm:w-14 sm:h-14 md:w-16 md:h-16 object-contain"
                    />
                  ) : (
                    <div className="w-11 h-11 sm:w-14 sm:h-14 md:w-16 md:h-16 bg-muted flex items-center justify-center text-[7px] text-muted-foreground font-mono">
                      QR
                    </div>
                  )}
                </div>
                <span className="mt-0.5 font-mono text-[7px] sm:text-[8px] opacity-75 tracking-wider leading-none">
                  SCAN ENTRY
                </span>
              </div>
            )}

            <div className="text-[7.5px] sm:text-[8.5px] font-mono opacity-80 leading-tight w-full truncate">
              <p className="truncate font-semibold">{ticket.ticketTypeName || 'Standard'}</p>
              <p className="opacity-60 truncate">{ticket.ticketId ? ticket.ticketId.slice(0, 8) : 'PASS'}</p>
            </div>
          </div>
        </div>
      ) : isVertical ? (
        /* Vertical / Lanyard / Roll Format */
        <div className="relative z-10 flex flex-col justify-between h-full p-3 sm:p-4 md:p-5 text-center min-h-0 overflow-hidden">
          {/* Top Header */}
          <div className="space-y-1">
            <div className="flex items-center justify-center gap-1 mb-0.5">
              <Sparkles
                className="h-2.5 w-2.5"
                style={{ color: config.accentColor || '#a5b4fc' }}
              />
              <span className="text-[8.5px] sm:text-[9.5px] md:text-[11px] font-bold uppercase tracking-wider opacity-85 truncate">
                {config.headerText || 'OFFICIAL EVENT PASS'}
              </span>
            </div>

            {config.showTicketType && (
              <div className="inline-block">
                <span
                  className="text-[8px] sm:text-[9px] md:text-[10px] font-bold px-2 py-0.5 rounded-full uppercase tracking-wider"
                  style={{
                    backgroundColor: `${config.accentColor || '#6366f1'}33`,
                    color: config.accentColor || '#a5b4fc',
                    border: `1px solid ${config.accentColor || '#6366f1'}66`,
                  }}
                >
                  {ticket.ticketTypeName || 'VIP ALL ACCESS'}
                </span>
              </div>
            )}

            {config.showEventName && (
              <h2 className="text-xs sm:text-sm md:text-base font-black tracking-tight line-clamp-2 leading-snug">
                {ticket.eventTitle || 'Grand Event Title'}
              </h2>
            )}
          </div>

          {/* QR Code Centerpiece */}
          {config.showQrCode && (
            <div className="my-auto flex flex-col items-center py-1">
              <div className="p-1.5 bg-white rounded-lg shadow-lg">
                {ticket.qrDataUrl ? (
                  <img
                    src={ticket.qrDataUrl}
                    alt="Ticket QR Code"
                    className="w-16 h-16 sm:w-20 sm:h-20 md:w-24 md:h-24 object-contain"
                  />
                ) : (
                  <div className="w-16 h-16 sm:w-20 sm:h-20 md:w-24 md:h-24 bg-muted flex items-center justify-center text-xs text-muted-foreground font-mono">
                    QR CODE
                  </div>
                )}
              </div>
              <span className="mt-1 font-mono text-[8px] sm:text-[9px] opacity-75 tracking-wider">
                #{ticket.ticketNumber || 'TKT-000001'}
              </span>
            </div>
          )}

          {/* Bottom Details */}
          <div className="space-y-0.5 sm:space-y-1 text-[9px] sm:text-[10px] md:text-xs border-t border-white/10 pt-1.5">
            {config.showEventDate && (
              <div className="flex items-center justify-center gap-1 font-semibold truncate">
                <Calendar className="h-3 w-3 opacity-70 shrink-0" />
                <span className="truncate">
                  {ticket.eventDate
                    ? new Date(ticket.eventDate).toLocaleDateString('en-IN', {
                        month: 'short',
                        day: 'numeric',
                        year: 'numeric',
                      })
                    : 'Dec 31, 2026'}
                </span>
              </div>
            )}

            {config.showVenue && (
              <div className="flex items-center justify-center gap-1 opacity-80 truncate text-[8.5px] sm:text-[9.5px]">
                <MapPin className="h-3 w-3 opacity-70 shrink-0" />
                <span className="truncate">{ticket.eventVenue || 'Venue Name'}</span>
              </div>
            )}

            <div className="flex justify-between items-center text-[8px] sm:text-[9px] font-mono opacity-75 pt-0.5">
              <span className="truncate">{ticket.buyerName || 'Pass Holder'}</span>
              {config.showPrice && ticket.ticketPrice > 0 && (
                <span className="font-bold text-[10px] sm:text-xs shrink-0" style={{ color: config.accentColor || '#a5b4fc' }}>
                  ₹{ticket.ticketPrice}
                </span>
              )}
            </div>
          </div>
        </div>
      ) : (
        /* Square Format (3.5" x 3.5") */
        <div className="relative z-10 flex flex-col justify-between h-full p-2.5 sm:p-3.5 md:p-4 min-h-0 overflow-hidden">
          <div className="flex justify-between items-start gap-1">
            <div className="min-w-0">
              <span className="text-[8px] sm:text-[9px] uppercase tracking-wider opacity-75 font-bold block truncate">
                {config.headerText || 'EVENT ACCESS'}
              </span>
              <h2 className="text-xs sm:text-sm md:text-base font-black tracking-tight line-clamp-1 mt-0.5">
                {ticket.eventTitle || 'Grand Event Title'}
              </h2>
            </div>
            {config.showTicketType && (
              <span
                className="text-[7.5px] sm:text-[8.5px] font-bold px-1.5 py-0.5 rounded uppercase shrink-0"
                style={{
                  backgroundColor: `${config.accentColor || '#6366f1'}33`,
                  color: config.accentColor || '#a5b4fc',
                }}
              >
                {ticket.ticketTypeName || 'PASS'}
              </span>
            )}
          </div>

          {/* QR and Details in Split Square Layout */}
          <div className="flex items-center justify-between gap-2 my-auto">
            {config.showQrCode && (
              <div className="p-1 bg-white rounded-md shadow-md shrink-0">
                {ticket.qrDataUrl ? (
                  <img
                    src={ticket.qrDataUrl}
                    alt="Ticket QR Code"
                    className="w-12 h-12 sm:w-14 sm:h-14 md:w-16 md:h-16 object-contain"
                  />
                ) : (
                  <div className="w-12 h-12 sm:w-14 sm:h-14 md:w-16 md:h-16 bg-muted flex items-center justify-center text-[7px] font-mono">
                    QR
                  </div>
                )}
              </div>
            )}

            <div className="space-y-0.5 text-[8.5px] sm:text-[9.5px] md:text-[10.5px] min-w-0 flex-1">
              {config.showEventDate && (
                <p className="font-semibold leading-tight truncate">
                  📅{' '}
                  {ticket.eventDate
                    ? new Date(ticket.eventDate).toLocaleDateString('en-IN', {
                        month: 'short',
                        day: 'numeric',
                        year: 'numeric',
                      })
                    : 'Dec 31, 2026'}
                </p>
              )}
              {config.showVenue && (
                <p className="opacity-80 truncate leading-tight">
                  📍 {ticket.eventVenue || 'Venue'}
                </p>
              )}
              {ticket.buyerName && (
                <p className="opacity-80 truncate text-[8px] sm:text-[9px]">
                  👤 {ticket.buyerName}
                </p>
              )}
            </div>
          </div>

          <div className="flex justify-between items-end border-t border-white/10 pt-1 text-[8px] sm:text-[9px] font-mono opacity-75">
            <span className="truncate">#{ticket.ticketNumber || 'TKT-000001'}</span>
            {config.showPrice && ticket.ticketPrice > 0 && (
              <span className="font-bold text-xs shrink-0" style={{ color: config.accentColor || '#a5b4fc' }}>
                ₹{ticket.ticketPrice}
              </span>
            )}
          </div>
        </div>
      )}
    </div>
  );
};
