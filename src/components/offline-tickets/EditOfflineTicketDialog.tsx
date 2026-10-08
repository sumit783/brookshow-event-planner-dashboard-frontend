import React, { useState, useEffect } from 'react';
import { GeneratedOfflineTicket } from '@/types';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Edit, User, Phone, Tag, DollarSign, Save } from 'lucide-react';

interface EditOfflineTicketDialogProps {
  ticket: GeneratedOfflineTicket | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSave: (ticketId: string, updates: { buyerName: string; buyerPhone: string; ticketTypeName: string; ticketPrice: number }) => Promise<void>;
}

export const EditOfflineTicketDialog: React.FC<EditOfflineTicketDialogProps> = ({
  ticket,
  open,
  onOpenChange,
  onSave,
}) => {
  const [buyerName, setBuyerName] = useState('');
  const [buyerPhone, setBuyerPhone] = useState('');
  const [ticketTypeName, setTicketTypeName] = useState('');
  const [ticketPrice, setTicketPrice] = useState<number>(0);
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    if (ticket) {
      setBuyerName(ticket.buyerName || '');
      setBuyerPhone(ticket.buyerPhone || '');
      setTicketTypeName(ticket.ticketTypeName || 'General Admission');
      setTicketPrice(ticket.ticketPrice || 0);
    }
  }, [ticket]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!ticket) return;

    try {
      setIsSubmitting(true);
      await onSave(ticket.ticketId, {
        buyerName: buyerName.trim(),
        buyerPhone: buyerPhone.trim(),
        ticketTypeName: ticketTypeName.trim(),
        ticketPrice: Number(ticketPrice) || 0,
      });
      onOpenChange(false);
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!ticket) return null;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md glass-ultra border-white/20">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-lg">
            <Edit className="h-5 w-5 text-primary" />
            Edit Ticket #{ticket.ticketNumber}
          </DialogTitle>
          <DialogDescription className="text-xs">
            Update attendee details, tier category, or pricing for this offline ticket.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4 py-2">
          {/* Ticket ID & Event Non-editable Badge */}
          <div className="rounded-lg bg-black/40 border border-white/10 p-3 space-y-1 text-xs">
            <div className="flex justify-between text-muted-foreground">
              <span>Event:</span>
              <span className="font-semibold text-foreground truncate max-w-[200px]">{ticket.eventTitle}</span>
            </div>
            <div className="flex justify-between text-muted-foreground font-mono">
              <span>Ticket ID:</span>
              <span>{ticket.ticketId}</span>
            </div>
          </div>

          {/* Attendee Name */}
          <div className="space-y-1.5">
            <Label className="text-xs flex items-center gap-1.5">
              <User className="h-3.5 w-3.5 text-primary" />
              Ticket Holder / Buyer Name
            </Label>
            <Input
              value={buyerName}
              onChange={(e) => setBuyerName(e.target.value)}
              placeholder="e.g. Rahul Sharma / VIP Desk"
              className="h-9 text-xs"
              required
            />
          </div>

          {/* Attendee Phone */}
          <div className="space-y-1.5">
            <Label className="text-xs flex items-center gap-1.5">
              <Phone className="h-3.5 w-3.5 text-primary" />
              Contact Phone (Optional)
            </Label>
            <Input
              value={buyerPhone}
              onChange={(e) => setBuyerPhone(e.target.value)}
              placeholder="e.g. +91 98765 43210"
              className="h-9 text-xs"
            />
          </div>

          {/* Tier and Price */}
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label className="text-xs flex items-center gap-1.5">
                <Tag className="h-3.5 w-3.5 text-primary" />
                Ticket Tier
              </Label>
              <Input
                value={ticketTypeName}
                onChange={(e) => setTicketTypeName(e.target.value)}
                placeholder="VIP / Standard"
                className="h-9 text-xs"
                required
              />
            </div>

            <div className="space-y-1.5">
              <Label className="text-xs flex items-center gap-1.5">
                <DollarSign className="h-3.5 w-3.5 text-primary" />
                Price (₹)
              </Label>
              <Input
                type="number"
                min={0}
                value={ticketPrice}
                onChange={(e) => setTicketPrice(parseFloat(e.target.value) || 0)}
                className="h-9 text-xs"
              />
            </div>
          </div>

          <DialogFooter className="pt-2">
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => onOpenChange(false)}
              className="text-xs"
            >
              Cancel
            </Button>
            <Button
              type="submit"
              size="sm"
              disabled={isSubmitting}
              className="bg-gradient-primary hover:shadow-glow text-xs"
            >
              <Save className="h-3.5 w-3.5 mr-1.5" />
              {isSubmitting ? 'Saving...' : 'Save Changes'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
};
