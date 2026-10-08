import React from 'react';
import { TicketLayoutPreset, TicketLayoutCategory } from '@/types';
import { TICKET_LAYOUT_PRESETS } from '@/constants/ticketLayouts';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Check, Scissors, Sparkles, Layers, Maximize2 } from 'lucide-react';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';

interface LayoutSelectorProps {
  selectedLayoutId: string;
  onSelectLayout: (preset: TicketLayoutPreset) => void;
}

export const LayoutSelector: React.FC<LayoutSelectorProps> = ({
  selectedLayoutId,
  onSelectLayout,
}) => {
  const [activeCategory, setActiveCategory] = React.useState<string>('all');

  const categories = [
    { id: 'all', label: 'All Layouts' },
    { id: 'stub', label: 'Stub / Tear-off' },
    { id: 'medium_large', label: 'Medium & Large' },
    { id: 'vip', label: 'Premium & VIP' },
    { id: 'specialized', label: 'Specialized' },
  ];

  const filteredPresets = activeCategory === 'all'
    ? TICKET_LAYOUT_PRESETS
    : TICKET_LAYOUT_PRESETS.filter((p) => p.category === activeCategory);

  return (
    <div className="space-y-4">
      {/* Category Tabs */}
      <Tabs value={activeCategory} onValueChange={setActiveCategory} className="w-full">
        <TabsList className="grid grid-cols-2 md:grid-cols-5 h-auto p-1 bg-muted/40">
          {categories.map((cat) => (
            <TabsTrigger
              key={cat.id}
              value={cat.id}
              className="text-xs py-2 data-[state=active]:bg-primary data-[state=active]:text-primary-foreground font-medium"
            >
              {cat.label}
            </TabsTrigger>
          ))}
        </TabsList>
      </Tabs>

      {/* Grid of Layout Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3.5">
        {filteredPresets.map((preset) => {
          const isSelected = preset.id === selectedLayoutId;

          return (
            <Card
              key={preset.id}
              onClick={() => onSelectLayout(preset)}
              className={`cursor-pointer transition-all duration-200 hover:scale-[1.02] border-2 relative overflow-hidden ${
                isSelected
                  ? 'border-primary shadow-glow bg-primary/5 dark:bg-primary/10'
                  : 'border-white/10 hover:border-white/25 bg-card/40'
              }`}
            >
              {isSelected && (
                <div className="absolute top-2 right-2 z-20 flex h-6 w-6 items-center justify-center rounded-full bg-primary text-primary-foreground shadow-md animate-scale-in">
                  <Check className="h-3.5 w-3.5 stroke-[3]" />
                </div>
              )}

              <CardContent className="p-3.5 space-y-3">
                {/* Visual Aspect Ratio Mockup Wireframe */}
                <div className="h-28 w-full rounded-lg bg-black/40 border border-white/10 flex items-center justify-center p-3 relative overflow-hidden">
                  <div
                    className="border-2 border-dashed rounded flex items-center justify-between p-1 relative shadow-sm transition-all"
                    style={{
                      aspectRatio: `${preset.aspectRatio}`,
                      maxWidth: '100%',
                      maxHeight: '100%',
                      borderColor: isSelected ? 'hsl(var(--primary))' : 'rgba(255,255,255,0.3)',
                      backgroundColor: isSelected ? 'hsl(var(--primary) / 0.15)' : 'rgba(255,255,255,0.03)',
                    }}
                  >
                    {/* Visual Stub representation */}
                    {preset.hasStub && (
                      <>
                        <div className="flex-1 flex flex-col justify-center px-1">
                          <div className="h-1.5 w-12 bg-white/40 rounded-sm mb-1" />
                          <div className="h-1 w-8 bg-white/20 rounded-sm" />
                        </div>
                        <div className="h-full border-r border-dashed border-white/40 mx-1 flex items-center justify-center">
                          <Scissors className="h-2 w-2 text-white/50 -rotate-90 -mr-1" />
                        </div>
                        <div
                          className="flex flex-col items-center justify-center bg-black/30 rounded px-1"
                          style={{ width: `${preset.stubWidthPercent || 25}%` }}
                        >
                          <div className="h-3 w-3 bg-white/60 rounded-xs" />
                        </div>
                      </>
                    )}

                    {!preset.hasStub && preset.orientation === 'vertical' && (
                      <div className="w-full h-full flex flex-col items-center justify-between py-1">
                        <div className="h-1 w-8 bg-white/40 rounded-sm" />
                        <div className="h-5 w-5 bg-white/60 rounded-xs" />
                        <div className="h-1 w-6 bg-white/20 rounded-sm" />
                      </div>
                    )}

                    {!preset.hasStub && preset.orientation === 'square' && (
                      <div className="w-full h-full flex items-center justify-between p-1">
                        <div className="space-y-1">
                          <div className="h-1.5 w-6 bg-white/40 rounded-sm" />
                          <div className="h-1 w-4 bg-white/20 rounded-sm" />
                        </div>
                        <div className="h-4 w-4 bg-white/60 rounded-xs" />
                      </div>
                    )}
                  </div>
                </div>

                {/* Info and Dimensions */}
                <div>
                  <div className="flex items-center justify-between gap-1 mb-1">
                    <h4 className="font-bold text-sm tracking-tight truncate">{preset.name}</h4>
                    <Badge variant="outline" className="text-[10px] px-1.5 py-0 h-4 border-primary/30 text-primary shrink-0">
                      {preset.dimensionsInch}
                    </Badge>
                  </div>
                  <p className="text-[11px] text-muted-foreground line-clamp-2 leading-relaxed">
                    {preset.description}
                  </p>
                </div>

                <div className="flex items-center justify-between pt-1 border-t border-white/5 text-[10px] text-muted-foreground">
                  <span>{preset.dimensionsMm}</span>
                  <span className="font-medium text-foreground/80">{preset.categoryLabel}</span>
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>
    </div>
  );
};
