import { QRScanner } from '@/components/QRScanner';

export default function ScannerPage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-4xl font-bold">Ticket Scanner</h1>
        <p className="mt-2 text-muted-foreground">
          Validate tickets at event entrance
        </p>
      </div>

      <QRScanner />
    </div>
  );
}
