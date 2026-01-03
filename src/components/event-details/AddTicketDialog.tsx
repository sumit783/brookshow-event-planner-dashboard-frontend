import { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { Loader2, Plus, Edit } from 'lucide-react';

import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { toast } from '@/hooks/use-toast';
import { eventService } from '@/services/event';
import type { TicketType } from '@/types';

const formSchema = z.object({
  title: z.string().min(2, 'Title must be at least 2 characters'),
  price: z.coerce.number().min(0, 'Price must be non-negative'),
  quantity: z.coerce.number().min(1, 'Quantity must be at least 1'),
  salesStart: z.string(),
  salesEnd: z.string(),
});

type FormValues = z.infer<typeof formSchema>;

interface AddTicketDialogProps {
  eventId: string;
  onTicketAdded: () => void;
  ticket?: TicketType;
}

export function AddTicketDialog({ eventId, onTicketAdded, ticket }: AddTicketDialogProps) {
  const [open, setOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const isEditMode = !!ticket;

  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      title: '',
      price: 0,
      quantity: 100,
      salesStart: '',
      salesEnd: '',
    },
  });

  // Helper to format date for datetime-local input
  const formatDateForInput = (dateString: string | undefined) => {
    if (!dateString) return '';
    try {
      const date = new Date(dateString);
      if (isNaN(date.getTime())) return '';
      
      // Get local date parts to avoid UTC shifting in the input
      const year = date.getFullYear();
      const month = String(date.getMonth() + 1).padStart(2, '0');
      const day = String(date.getDate()).padStart(2, '0');
      const hours = String(date.getHours()).padStart(2, '0');
      const minutes = String(date.getMinutes()).padStart(2, '0');
      
      return `${year}-${month}-${day}T${hours}:${minutes}`;
    } catch {
      return '';
    }
  };

  // Update form values when ticket changes (for edit mode)
  useEffect(() => {
    if (ticket && open) {
      form.reset({
        title: ticket.title,
        price: ticket.price,
        quantity: ticket.quantity,
        salesStart: formatDateForInput(ticket.salesStart),
        salesEnd: formatDateForInput(ticket.salesEnd),
      });
    } else if (!ticket && open) {
      form.reset({
        title: '',
        price: 0,
        quantity: 100,
        salesStart: '',
        salesEnd: '',
      });
    }
  }, [ticket, open, form]);

  const onSubmit = async (values: FormValues) => {
    setIsSubmitting(true);
    try {
      // Create explicit payload to avoid TS "optional property" spreading issues
      const payload: Omit<TicketType, 'id' | 'sold'> = {
        eventId,
        title: values.title,
        price: values.price,
        quantity: values.quantity,
        salesStart: new Date(values.salesStart).toISOString(),
        salesEnd: new Date(values.salesEnd).toISOString(),
      };

      if (isEditMode && ticket) {
        await eventService.updateTicketType(ticket.id, payload);
        toast({
          title: 'Success',
          description: 'Ticket type updated successfully',
        });
      } else {
        await eventService.createTicketType(payload);
        toast({
          title: 'Success',
          description: 'Ticket type created successfully',
        });
      }

      setOpen(false);
      form.reset();
      onTicketAdded();
    } catch (error) {
      toast({
        title: 'Error',
        description: error instanceof Error ? error.message : `Failed to ${isEditMode ? 'update' : 'create'} ticket`,
        variant: 'destructive',
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        {isEditMode ? (
          <Button variant="ghost" size="icon" className="h-8 w-8 text-muted-foreground hover:text-primary">
            <Edit className="h-4 w-4" />
          </Button>
        ) : (
          <Button size="sm" className="gap-2">
            <Plus className="h-4 w-4" />
            Add Ticket
          </Button>
        )}
      </DialogTrigger>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>{isEditMode ? 'Edit Ticket Type' : 'Add Ticket Type'}</DialogTitle>
          <DialogDescription>
            {isEditMode ? 'Update the details for this ticket tier.' : 'Create a new ticket tier for your event.'}
          </DialogDescription>
        </DialogHeader>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <FormField
              control={form.control}
              name="title"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Ticket Name</FormLabel>
                  <FormControl>
                    <Input placeholder="e.g. VIP Pass" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <div className="grid grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="price"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Price (₹)</FormLabel>
                    <FormControl>
                      <Input type="number" min="0" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="quantity"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Quantity</FormLabel>
                    <FormControl>
                      <Input type="number" min="1" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="salesStart"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Sales Start</FormLabel>
                    <FormControl>
                      <Input type="datetime-local" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="salesEnd"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Sales End</FormLabel>
                    <FormControl>
                      <Input type="datetime-local" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <DialogFooter>
              <Button type="submit" disabled={isSubmitting}>
                {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                {isEditMode ? 'Update Ticket' : 'Create Ticket'}
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
