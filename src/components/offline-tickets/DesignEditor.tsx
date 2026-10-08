import React, { useRef } from 'react';
import { OfflineTicketDesignConfig } from '@/types';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Slider } from '@/components/ui/slider';
import { Switch } from '@/components/ui/switch';
import {
  Upload,
  Image as ImageIcon,
  ZoomIn,
  Move,
  Palette,
  Trash2,
  Sparkles,
  Maximize2,
  RefreshCw,
} from 'lucide-react';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';

interface DesignEditorProps {
  config: OfflineTicketDesignConfig;
  onChange: (updated: Partial<OfflineTicketDesignConfig>) => void;
}

export const DesignEditor: React.FC<DesignEditorProps> = ({ config, onChange }) => {
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (event) => {
        onChange({ bgImageUrl: event.target?.result as string });
      };
      reader.readAsDataURL(file);
    }
  };

  const handleRemoveImage = () => {
    onChange({ bgImageUrl: undefined });
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const presetThemes = [
    { name: 'Dark Cyberpunk', bg: '#090a0f', text: '#ffffff', accent: '#6366f1' },
    { name: 'Gold Luxury VIP', bg: '#17140f', text: '#fef3c7', accent: '#f59e0b' },
    { name: 'Emerald Gala', bg: '#061a14', text: '#ecfdf5', accent: '#10b981' },
    { name: 'Electric Sunset', bg: '#1c0f1a', text: '#fdf2f8', accent: '#ec4899' },
    { name: 'Minimal White', bg: '#ffffff', text: '#09090b', accent: '#2563eb' },
  ];

  return (
    <div className="space-y-6">
      {/* 1. Background Image Upload & Fitting */}
      <div className="space-y-4 rounded-xl border border-white/10 bg-card/30 p-4">
        <div className="flex items-center justify-between">
          <Label className="text-sm font-bold flex items-center gap-2">
            <ImageIcon className="h-4 w-4 text-primary" />
            Ticket Background & Artwork
          </Label>
          {config.bgImageUrl && (
            <Button
              variant="ghost"
              size="sm"
              onClick={handleRemoveImage}
              className="h-7 text-xs text-destructive hover:bg-destructive/10"
            >
              <Trash2 className="h-3 w-3 mr-1" />
              Remove
            </Button>
          )}
        </div>

        <input
          ref={fileInputRef}
          type="file"
          accept="image/*"
          className="hidden"
          onChange={handleImageUpload}
        />

        {!config.bgImageUrl ? (
          <div
            onClick={() => fileInputRef.current?.click()}
            className="border-2 border-dashed border-white/20 hover:border-primary/50 hover:bg-primary/5 rounded-xl p-6 text-center cursor-pointer transition-all"
          >
            <Upload className="h-8 w-8 mx-auto text-muted-foreground mb-2" />
            <p className="text-sm font-semibold">Click to upload your ticket artwork</p>
            <p className="text-xs text-muted-foreground mt-1">PNG, JPG or WebP (High resolution recommended)</p>
          </div>
        ) : (
          <div className="space-y-4">
            <div className="flex items-center gap-3">
              <div className="h-12 w-12 rounded-lg border overflow-hidden bg-black shrink-0">
                <img src={config.bgImageUrl} alt="Artwork thumbnail" className="h-full w-full object-cover" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-xs font-semibold truncate">Custom Background Uploaded</p>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => fileInputRef.current?.click()}
                  className="h-6 text-[10px] mt-1"
                >
                  Change Image
                </Button>
              </div>
            </div>

            {/* Fit Mode */}
            <div className="space-y-1.5">
              <Label className="text-xs text-muted-foreground">Fitting Mode</Label>
              <Select
                value={config.bgFitMode}
                onValueChange={(val: any) => onChange({ bgFitMode: val })}
              >
                <SelectTrigger className="h-8 text-xs">
                  <SelectValue placeholder="Select fit mode" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="cover">Cover (Fill & Crop nicely)</SelectItem>
                  <SelectItem value="contain">Contain (Show whole image)</SelectItem>
                  <SelectItem value="fill">Fill / Stretch to fit</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Zoom / Scale */}
            <div className="space-y-1.5">
              <div className="flex justify-between text-xs">
                <span className="text-muted-foreground flex items-center gap-1">
                  <ZoomIn className="h-3 w-3" /> Zoom Scale
                </span>
                <span className="font-mono">{config.bgZoom.toFixed(2)}x</span>
              </div>
              <Slider
                min={0.5}
                max={2.5}
                step={0.05}
                value={[config.bgZoom]}
                onValueChange={([val]) => onChange({ bgZoom: val })}
              />
            </div>

            {/* Offset X & Y */}
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <div className="flex justify-between text-xs">
                  <span className="text-muted-foreground">Position X</span>
                  <span className="font-mono">{config.bgOffsetX}%</span>
                </div>
                <Slider
                  min={-50}
                  max={50}
                  step={1}
                  value={[config.bgOffsetX]}
                  onValueChange={([val]) => onChange({ bgOffsetX: val })}
                />
              </div>

              <div className="space-y-1.5">
                <div className="flex justify-between text-xs">
                  <span className="text-muted-foreground">Position Y</span>
                  <span className="font-mono">{config.bgOffsetY}%</span>
                </div>
                <Slider
                  min={-50}
                  max={50}
                  step={1}
                  value={[config.bgOffsetY]}
                  onValueChange={([val]) => onChange({ bgOffsetY: val })}
                />
              </div>
            </div>

            {/* Reset transform button */}
            <Button
              variant="ghost"
              size="sm"
              onClick={() => onChange({ bgZoom: 1, bgOffsetX: 0, bgOffsetY: 0 })}
              className="w-full h-7 text-[11px] text-muted-foreground"
            >
              <RefreshCw className="h-3 w-3 mr-1" /> Reset Image Position
            </Button>
          </div>
        )}
      </div>

      {/* 2. Color Scheme & Themes */}
      <div className="space-y-4 rounded-xl border border-white/10 bg-card/30 p-4">
        <Label className="text-sm font-bold flex items-center gap-2">
          <Palette className="h-4 w-4 text-primary" />
          Colors & Theme Presets
        </Label>

        {/* Theme presets chips */}
        <div className="flex flex-wrap gap-1.5">
          {presetThemes.map((theme, i) => (
            <button
              key={i}
              type="button"
              onClick={() =>
                onChange({
                  bgColor: theme.bg,
                  textColor: theme.text,
                  accentColor: theme.accent,
                })
              }
              className="text-[11px] px-2.5 py-1 rounded-full border border-white/10 hover:border-white/30 flex items-center gap-1.5 transition-all bg-muted/40 hover:bg-muted"
            >
              <span className="h-2 w-2 rounded-full" style={{ backgroundColor: theme.accent }} />
              <span>{theme.name}</span>
            </button>
          ))}
        </div>

        <div className="grid grid-cols-3 gap-2 pt-2">
          <div className="space-y-1">
            <Label className="text-[11px] text-muted-foreground">Base Color</Label>
            <div className="flex items-center gap-1.5">
              <input
                type="color"
                value={config.bgColor}
                onChange={(e) => onChange({ bgColor: e.target.value })}
                className="h-7 w-7 rounded cursor-pointer border-0 bg-transparent"
              />
              <span className="text-[10px] font-mono">{config.bgColor}</span>
            </div>
          </div>

          <div className="space-y-1">
            <Label className="text-[11px] text-muted-foreground">Accent Color</Label>
            <div className="flex items-center gap-1.5">
              <input
                type="color"
                value={config.accentColor}
                onChange={(e) => onChange({ accentColor: e.target.value })}
                className="h-7 w-7 rounded cursor-pointer border-0 bg-transparent"
              />
              <span className="text-[10px] font-mono">{config.accentColor}</span>
            </div>
          </div>

          <div className="space-y-1">
            <Label className="text-[11px] text-muted-foreground">Text Color</Label>
            <div className="flex items-center gap-1.5">
              <input
                type="color"
                value={config.textColor}
                onChange={(e) => onChange({ textColor: e.target.value })}
                className="h-7 w-7 rounded cursor-pointer border-0 bg-transparent"
              />
              <span className="text-[10px] font-mono">{config.textColor}</span>
            </div>
          </div>
        </div>
      </div>

      {/* 3. Text & Branding Customization */}
      <div className="space-y-3 rounded-xl border border-white/10 bg-card/30 p-4">
        <Label className="text-sm font-bold flex items-center gap-2">
          <Sparkles className="h-4 w-4 text-primary" />
          Custom Text & Branding
        </Label>

        <div className="space-y-2">
          <div className="space-y-1">
            <Label className="text-xs text-muted-foreground">Top Header / Badge Text</Label>
            <Input
              value={config.headerText || ''}
              onChange={(e) => onChange({ headerText: e.target.value })}
              placeholder="e.g. BROOKSHOW OFFICIAL EVENT PASS"
              className="h-8 text-xs"
            />
          </div>

          <div className="space-y-1">
            <Label className="text-xs text-muted-foreground">Sub-header / Tagline</Label>
            <Input
              value={config.tagline || ''}
              onChange={(e) => onChange({ tagline: e.target.value })}
              placeholder="e.g. Live in Mumbai • Exclusive Concert Experience"
              className="h-8 text-xs"
            />
          </div>
        </div>
      </div>

      {/* 4. Display Toggles */}
      <div className="space-y-3 rounded-xl border border-white/10 bg-card/30 p-4">
        <Label className="text-sm font-bold">Element Visibility</Label>

        <div className="grid grid-cols-2 gap-3 text-xs">
          <div className="flex items-center justify-between">
            <span>Event Name</span>
            <Switch
              checked={config.showEventName}
              onCheckedChange={(val) => onChange({ showEventName: val })}
            />
          </div>

          <div className="flex items-center justify-between">
            <span>Date & Time</span>
            <Switch
              checked={config.showEventDate}
              onCheckedChange={(val) => onChange({ showEventDate: val })}
            />
          </div>

          <div className="flex items-center justify-between">
            <span>Venue / Location</span>
            <Switch
              checked={config.showVenue}
              onCheckedChange={(val) => onChange({ showVenue: val })}
            />
          </div>

          <div className="flex items-center justify-between">
            <span>Ticket Type Badge</span>
            <Switch
              checked={config.showTicketType}
              onCheckedChange={(val) => onChange({ showTicketType: val })}
            />
          </div>

          <div className="flex items-center justify-between">
            <span>Price Tag</span>
            <Switch
              checked={config.showPrice}
              onCheckedChange={(val) => onChange({ showPrice: val })}
            />
          </div>

          <div className="flex items-center justify-between">
            <span>QR Code</span>
            <Switch
              checked={config.showQrCode}
              onCheckedChange={(val) => onChange({ showQrCode: val })}
            />
          </div>

          <div className="flex items-center justify-between">
            <span>Ticket Serial Number</span>
            <Switch
              checked={config.showTicketNumber}
              onCheckedChange={(val) => onChange({ showTicketNumber: val })}
            />
          </div>
        </div>
      </div>
    </div>
  );
};
