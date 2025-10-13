import { useState, useEffect } from 'react';
import { Save, Download, Upload, Trash2 } from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { storage, db } from '@/services/storage';
import { config } from '@/config';
import { toast } from '@/hooks/use-toast';
import { clearSyncedItems } from '@/services/syncQueue';

export default function Settings() {
  const [scannerSettings, setScannerSettings] = useState({
    scannerId: 'scanner-1',
    deviceName: 'Scanner 1',
  });

  const [offlineMode, setOfflineMode] = useState<boolean>(config.SIMULATE_OFFLINE);

  useEffect(() => {
    loadSettings();
  }, []);

  async function loadSettings() {
    const settings = await storage.get<any>(db.settings, 'scanner');
    if (settings) {
      setScannerSettings(settings);
    }
  }

  async function saveSettings() {
    try {
      await storage.set(db.settings, 'scanner', scannerSettings);
      toast({
        title: 'Settings Saved',
        description: 'Your settings have been updated',
      });
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Failed to save settings',
        variant: 'destructive',
      });
    }
  }

  async function exportData() {
    try {
      const events = await storage.getAll(db.events);
      const tickets = await storage.getAll(db.tickets);
      const scanLogs = await storage.getAll(db.scanLogs);

      const exportData = {
        events,
        tickets,
        scanLogs,
        exportedAt: new Date().toISOString(),
      };

      const blob = new Blob([JSON.stringify(exportData, null, 2)], {
        type: 'application/json',
      });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `brookshow-export-${Date.now()}.json`;
      link.click();
      URL.revokeObjectURL(url);

      toast({
        title: 'Data Exported',
        description: 'Your data has been downloaded',
      });
    } catch (error) {
      toast({
        title: 'Export Failed',
        description: 'Failed to export data',
        variant: 'destructive',
      });
    }
  }

  async function clearSyncQueue() {
    try {
      await clearSyncedItems();
      toast({
        title: 'Queue Cleared',
        description: 'Synced items have been removed',
      });
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Failed to clear sync queue',
        variant: 'destructive',
      });
    }
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-4xl font-bold">Settings</h1>
        <p className="mt-2 text-muted-foreground">
          Configure your scanner and app preferences
        </p>
      </div>

      {/* Scanner Settings */}
      <Card>
        <CardHeader>
          <CardTitle>Scanner Configuration</CardTitle>
          <CardDescription>Configure your ticket scanner device</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="scannerId">Scanner ID</Label>
            <Input
              id="scannerId"
              value={scannerSettings.scannerId}
              onChange={(e) =>
                setScannerSettings({ ...scannerSettings, scannerId: e.target.value })
              }
            />
            <p className="text-sm text-muted-foreground">
              Unique identifier for this scanner device
            </p>
          </div>

          <div className="space-y-2">
            <Label htmlFor="deviceName">Device Name</Label>
            <Input
              id="deviceName"
              value={scannerSettings.deviceName}
              onChange={(e) =>
                setScannerSettings({ ...scannerSettings, deviceName: e.target.value })
              }
            />
            <p className="text-sm text-muted-foreground">
              Friendly name for this device
            </p>
          </div>

          <Button onClick={saveSettings}>
            <Save className="mr-2 h-4 w-4" />
            Save Settings
          </Button>
        </CardContent>
      </Card>

      {/* Testing & Debug */}
      <Card>
        <CardHeader>
          <CardTitle>Testing & Debug</CardTitle>
          <CardDescription>Options for testing the app</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between">
            <div className="space-y-0.5">
              <Label>Simulate Offline Mode</Label>
              <p className="text-sm text-muted-foreground">
                Test offline functionality without disconnecting
              </p>
            </div>
            <Switch
              checked={offlineMode}
              onCheckedChange={(checked) => {
                setOfflineMode(checked);
                // Note: To fully enable offline mode, update config.SIMULATE_OFFLINE
                toast({
                  title: checked ? 'Offline Mode Enabled' : 'Offline Mode Disabled',
                  description: checked
                    ? 'Network requests will be blocked'
                    : 'Network requests will work normally',
                });
              }}
            />
          </div>

          <div className="flex items-center justify-between">
            <div className="space-y-0.5">
              <Label>Failure Rate</Label>
              <p className="text-sm text-muted-foreground">
                Current: {(config.SIMULATE_FAILURE_RATE * 100).toFixed(0)}% of requests fail
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Data Management */}
      <Card>
        <CardHeader>
          <CardTitle>Data Management</CardTitle>
          <CardDescription>Export, import, and manage your data</CardDescription>
        </CardHeader>
        <CardContent className="space-y-3">
          <Button variant="outline" className="w-full justify-start" onClick={exportData}>
            <Download className="mr-2 h-4 w-4" />
            Export All Data
          </Button>

          <Button variant="outline" className="w-full justify-start" onClick={clearSyncQueue}>
            <Trash2 className="mr-2 h-4 w-4" />
            Clear Synced Items
          </Button>
        </CardContent>
      </Card>

      {/* App Info */}
      <Card>
        <CardHeader>
          <CardTitle>Application Info</CardTitle>
        </CardHeader>
        <CardContent className="space-y-2 text-sm">
          <div className="flex justify-between">
            <span className="text-muted-foreground">Version</span>
            <span className="font-mono">{config.APP_VERSION}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-muted-foreground">Build</span>
            <span className="font-mono">PWA</span>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
