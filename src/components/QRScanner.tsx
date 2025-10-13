import { useState, useEffect, useRef } from 'react';
import { Html5Qrcode } from 'html5-qrcode';
import { Camera, X, Scan, AlertCircle, CheckCircle, XCircle, Copy, Shield } from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { apiClient } from '@/services/apiClient';
import { storage, db } from '@/services/storage';
import { toast } from '@/hooks/use-toast';
import type { ScanLog, Ticket, Event } from '@/types';

interface ScanResult {
  log: ScanLog;
  ticket?: Ticket;
  event?: Event;
}

export function QRScanner() {
  const [isScanning, setIsScanning] = useState(false);
  const [hasPermission, setHasPermission] = useState<boolean | null>(null);
  const [scanResult, setScanResult] = useState<ScanResult | null>(null);
  const [manualInput, setManualInput] = useState('');
  const [scannerId, setScannerId] = useState('scanner-1');
  const [showPermissionDialog, setShowPermissionDialog] = useState(false);
  
  const scannerRef = useRef<Html5Qrcode | null>(null);
  const videoContainerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    loadScannerSettings();
    
    return () => {
      stopScanning();
    };
  }, []);

  async function loadScannerSettings() {
    const settings = await storage.get<any>(db.settings, 'scanner');
    if (settings?.scannerId) {
      setScannerId(settings.scannerId);
    }
  }

  async function requestCameraPermission() {
    setShowPermissionDialog(false);
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ video: true });
      stream.getTracks().forEach(track => track.stop());
      setHasPermission(true);
      startScanning();
      return true;
    } catch (error) {
      console.error('Camera permission denied:', error);
      setHasPermission(false);
      toast({
        title: 'Camera Access Denied',
        description: 'Please allow camera access to scan QR codes',
        variant: 'destructive',
      });
      return false;
    }
  }

  function handleOpenScanner() {
    if (hasPermission === false) {
      toast({
        title: 'Camera Permission Required',
        description: 'Please enable camera access in your browser settings',
        variant: 'destructive',
      });
      return;
    }
    
    if (hasPermission === null) {
      setShowPermissionDialog(true);
    } else {
      startScanning();
    }
  }

  async function startScanning() {
    try {
      const scanner = new Html5Qrcode('qr-reader');
      scannerRef.current = scanner;

      await scanner.start(
        { facingMode: 'environment' },
        {
          fps: 10,
          qrbox: { width: 250, height: 250 },
        },
        onScanSuccess,
        undefined
      );

      setIsScanning(true);
    } catch (error: any) {
      console.error('Failed to start scanner:', error);
      toast({
        title: 'Scanner Error',
        description: error.message || 'Failed to start camera',
        variant: 'destructive',
      });
    }
  }

  async function stopScanning() {
    if (scannerRef.current && isScanning) {
      try {
        await scannerRef.current.stop();
        scannerRef.current = null;
        setIsScanning(false);
      } catch (error) {
        console.error('Failed to stop scanner:', error);
      }
    }
  }

  async function onScanSuccess(decodedText: string) {
    await processQRCode(decodedText);
    await stopScanning();
  }

  async function processQRCode(qrData: string) {
    try {
      const scanLog = await apiClient.scanTicket(qrData, scannerId);
      
      let ticket: Ticket | undefined;
      let event: Event | undefined;

      if (scanLog.ticketId) {
        ticket = (await storage.get<Ticket>(db.tickets, scanLog.ticketId)) || undefined;
        if (ticket) {
          event = (await storage.get<Event>(db.events, ticket.eventId)) || undefined;
        }
      }

      setScanResult({ log: scanLog, ticket, event });

      // Show toast notification
      const resultConfig = {
        valid: {
          title: '✓ Valid Ticket',
          description: `Ticket scanned successfully for ${ticket?.buyerName}`,
          variant: 'default' as const,
        },
        duplicate: {
          title: '⚠ Duplicate Scan',
          description: scanLog.errorMessage || 'This ticket was already scanned',
          variant: 'destructive' as const,
        },
        invalid: {
          title: '✗ Invalid Ticket',
          description: scanLog.errorMessage || 'Ticket verification failed',
          variant: 'destructive' as const,
        },
        error: {
          title: '✗ Scan Error',
          description: scanLog.errorMessage || 'Unable to process QR code',
          variant: 'destructive' as const,
        },
      };

      const config = resultConfig[scanLog.result];
      toast(config);

    } catch (error: any) {
      toast({
        title: 'Scan Failed',
        description: error.message || 'Failed to process QR code',
        variant: 'destructive',
      });
    }
  }

  async function handleManualSubmit() {
    if (!manualInput.trim()) return;
    await processQRCode(manualInput);
    setManualInput('');
  }

  function clearResult() {
    setScanResult(null);
  }

  return (
    <div className="space-y-6">
      {/* Camera Permission Dialog */}
      {showPermissionDialog && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm animate-fade-in">
          <Card className="glass-modern max-w-md w-full mx-4 border-2 border-primary/30 shadow-neon-strong animate-scale-in">
            <CardHeader className="text-center pb-4">
              <div className="mx-auto mb-4 flex h-20 w-20 items-center justify-center rounded-full bg-gradient-primary shadow-glow pulse-glow">
                <Camera className="h-10 w-10 text-primary-foreground drop-shadow-glow" />
              </div>
              <CardTitle className="text-2xl font-bold">Camera Access Required</CardTitle>
              <CardDescription className="text-base mt-2">
                We need access to your camera to scan QR codes on tickets
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="glass rounded-lg p-4 space-y-3">
                <div className="flex items-start gap-3">
                  <Shield className="h-5 w-5 text-accent mt-0.5 flex-shrink-0" />
                  <div className="space-y-1">
                    <p className="text-sm font-medium">Your privacy matters</p>
                    <p className="text-xs text-muted-foreground">
                      We only access your camera when scanning. No recording or storage of video.
                    </p>
                  </div>
                </div>
                <div className="flex items-start gap-3">
                  <Scan className="h-5 w-5 text-accent mt-0.5 flex-shrink-0" />
                  <div className="space-y-1">
                    <p className="text-sm font-medium">Fast & secure scanning</p>
                    <p className="text-xs text-muted-foreground">
                      Instantly validate tickets with real-time QR code scanning.
                    </p>
                  </div>
                </div>
              </div>

              <div className="flex gap-3">
                <Button
                  variant="outline"
                  className="flex-1 hover:bg-white/10"
                  onClick={() => setShowPermissionDialog(false)}
                >
                  Cancel
                </Button>
                <Button
                  className="flex-1 bg-gradient-primary hover:shadow-glow transition-smooth"
                  onClick={requestCameraPermission}
                >
                  <Camera className="mr-2 h-4 w-4" />
                  Allow Camera
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Scanner Card */}
      <Card className="glass-modern border-primary/20 hover-glow overflow-hidden">
        <div className="absolute inset-0 bg-gradient-primary opacity-5 pointer-events-none" />
        <CardHeader className="relative">
          <CardTitle className="flex items-center gap-3 text-2xl">
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-gradient-primary shadow-glow">
              <Scan className="h-6 w-6 text-primary-foreground" />
            </div>
            QR Ticket Scanner
          </CardTitle>
          <CardDescription className="text-base">
            {hasPermission === false
              ? '⚠️ Camera access is required to scan tickets'
              : '📸 Scan ticket QR codes to validate entry'}
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4 relative">
          {/* Permission Alert */}
          {hasPermission === false && (
            <Alert variant="destructive" className="glass border-destructive/50 animate-fade-in">
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>
                Camera permission is required to scan QR codes. Please enable camera access in your browser
                settings and reload the page.
              </AlertDescription>
            </Alert>
          )}

          {/* Scanner Controls */}
          {!isScanning ? (
            <Button
              size="lg"
              className="w-full h-16 text-lg bg-gradient-primary hover:shadow-glow transition-smooth group"
              onClick={handleOpenScanner}
            >
              <Camera className="mr-3 h-6 w-6 group-hover:scale-110 transition-transform" />
              Open Camera Scanner
            </Button>
          ) : (
            <div className="space-y-4 animate-fade-in">
              {/* Video Container */}
              <div className="relative overflow-hidden rounded-xl border-2 border-primary/30 shadow-neon-strong">
                <div id="qr-reader" ref={videoContainerRef} className="w-full" />
                
                {/* Animated Scanner Overlay */}
                <div className="pointer-events-none absolute inset-0 flex items-center justify-center">
                  <div className="relative h-64 w-64">
                    {/* Corner brackets */}
                    <div className="absolute top-0 left-0 h-16 w-16 border-t-4 border-l-4 border-primary shadow-glow animate-pulse" />
                    <div className="absolute top-0 right-0 h-16 w-16 border-t-4 border-r-4 border-primary shadow-glow animate-pulse" />
                    <div className="absolute bottom-0 left-0 h-16 w-16 border-b-4 border-l-4 border-primary shadow-glow animate-pulse" />
                    <div className="absolute bottom-0 right-0 h-16 w-16 border-b-4 border-r-4 border-primary shadow-glow animate-pulse" />
                    
                    {/* Scanning line */}
                    <div className="absolute inset-x-0 h-1 bg-gradient-accent shadow-neon animate-pulse" 
                         style={{ animation: 'scan 2s ease-in-out infinite' }} />
                  </div>
                </div>
              </div>

              {/* Stop Button */}
              <Button 
                size="lg" 
                variant="destructive" 
                className="w-full h-14 shadow-medium hover:shadow-strong transition-smooth"
                onClick={stopScanning}
              >
                <X className="mr-2 h-5 w-5" />
                Stop Scanner
              </Button>
            </div>
          )}

          {/* Manual Input Fallback */}
          <div className="space-y-2 glass rounded-lg p-4">
            <p className="text-sm text-muted-foreground flex items-center gap-2">
              <Shield className="h-4 w-4 text-accent" />
              Or enter QR code manually:
            </p>
            <div className="flex gap-2">
              <Input
                placeholder="Paste QR code data here..."
                value={manualInput}
                onChange={(e) => setManualInput(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && handleManualSubmit()}
                className="bg-background/50 border-border/50 focus:border-primary transition-smooth"
              />
              <Button 
                onClick={handleManualSubmit} 
                disabled={!manualInput.trim()}
                className="bg-gradient-primary hover:shadow-glow transition-smooth"
              >
                Scan
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Scan Result */}
      {scanResult && (
        <Card className={`border-2 glass-ultra animate-scale-in ${
          scanResult.log.result === 'valid' 
            ? 'border-success/50 shadow-[0_0_30px_rgba(74,222,128,0.3)]' 
            : 'border-destructive/50 shadow-[0_0_30px_rgba(239,68,68,0.3)]'
        }`}>
          <CardHeader className="pb-3">
            <div className="flex items-start justify-between">
              <div className="flex items-center gap-4">
                <div className={`flex h-14 w-14 items-center justify-center rounded-full ${
                  scanResult.log.result === 'valid'
                    ? 'bg-success/20 shadow-[0_0_20px_rgba(74,222,128,0.4)]'
                    : 'bg-destructive/20 shadow-[0_0_20px_rgba(239,68,68,0.4)]'
                }`}>
                  {scanResult.log.result === 'valid' ? (
                    <CheckCircle className="h-8 w-8 text-success animate-scale-in" />
                  ) : (
                    <XCircle className="h-8 w-8 text-destructive animate-scale-in" />
                  )}
                </div>
                <div>
                  <CardTitle className="text-xl">
                    {scanResult.log.result === 'valid'
                      ? '✓ Valid Ticket'
                      : scanResult.log.result === 'duplicate'
                      ? '⚠ Duplicate Scan'
                      : '✗ Invalid Ticket'}
                  </CardTitle>
                  <CardDescription>
                    Scanned at {new Date(scanResult.log.timestamp).toLocaleTimeString()}
                  </CardDescription>
                </div>
              </div>
              <Button variant="ghost" size="icon" onClick={clearResult} className="hover:bg-white/10">
                <X className="h-4 w-4" />
              </Button>
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            {/* Ticket Details */}
            {scanResult.ticket && scanResult.event && (
              <div className="space-y-3 rounded-lg glass p-4 border border-primary/20 animate-fade-in">
                <div>
                  <p className="text-xs text-muted-foreground flex items-center gap-2">
                    <Scan className="h-3 w-3" />
                    Event
                  </p>
                  <p className="font-semibold text-lg">{scanResult.event.title}</p>
                </div>
                <div>
                  <p className="text-xs text-muted-foreground">Ticket Holder</p>
                  <p className="font-semibold">{scanResult.ticket.buyerName}</p>
                </div>
                <div>
                  <p className="text-xs text-muted-foreground">Ticket ID</p>
                  <p className="font-mono text-xs bg-background/50 px-2 py-1 rounded">{scanResult.ticket.id}</p>
                </div>
                {scanResult.ticket.scannedAt && scanResult.ticket.scannedAt !== scanResult.log.timestamp && (
                  <Alert variant="destructive" className="glass border-destructive/50">
                    <AlertCircle className="h-4 w-4" />
                    <AlertDescription>
                      Previously scanned at {new Date(scanResult.ticket.scannedAt).toLocaleString()}
                    </AlertDescription>
                  </Alert>
                )}
              </div>
            )}

            {/* Error Message */}
            {scanResult.log.errorMessage && (
              <Alert variant="destructive" className="glass border-destructive/50 animate-fade-in">
                <AlertCircle className="h-4 w-4" />
                <AlertDescription>{scanResult.log.errorMessage}</AlertDescription>
              </Alert>
            )}

            {/* Actions */}
            <div className="flex gap-2">
              <Button 
                variant="outline" 
                className="flex-1 hover:bg-white/10 transition-smooth" 
                onClick={clearResult}
              >
                Scan Next
              </Button>
              {scanResult.log.result === 'valid' && scanResult.ticket && (
                <Button 
                  variant="outline" 
                  className="hover:bg-white/10 transition-smooth"
                  onClick={() => {
                    navigator.clipboard.writeText(scanResult.ticket!.id);
                    toast({ title: 'Copied ticket ID' });
                  }}
                >
                  <Copy className="h-4 w-4" />
                </Button>
              )}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Scanner Info */}
      <Card className="glass border-primary/10">
        <CardHeader>
          <CardTitle className="text-sm flex items-center gap-2">
            <Shield className="h-4 w-4 text-accent" />
            Scanner Information
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-2 text-sm">
          <div className="flex justify-between">
            <span className="text-muted-foreground">Scanner ID</span>
            <span className="font-mono bg-background/50 px-2 py-0.5 rounded">{scannerId}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-muted-foreground">Camera Access</span>
            <Badge 
              variant={hasPermission ? 'default' : 'secondary'}
              className={hasPermission ? 'bg-success/20 text-success border-success/30' : ''}
            >
              {hasPermission === null ? 'Not Requested' : hasPermission ? 'Granted' : 'Denied'}
            </Badge>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
