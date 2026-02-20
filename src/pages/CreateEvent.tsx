import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { useNavigate } from 'react-router-dom';
import { Loader2, ArrowLeft } from 'lucide-react';

import { Button } from '@/components/ui/button';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { toast, useToast } from '@/hooks/use-toast';
import { eventService } from '@/services/event';

import EventBasicDetails from '@/components/create-event/EventBasicDetails';
import EventLocation from '@/components/create-event/EventLocation';
import EventSettings from '@/components/create-event/EventSettings';

const formSchema = z.object({
  title: z.string().min(2, 'Title must be at least 2 characters'),
  description: z.string().min(10, 'Description must be at least 10 characters'),
  venue: z.string().min(2, 'Venue is required'),
  address: z.string().min(5, 'Address is required'),
  city: z.string().min(2, 'City is required'),
  state: z.string().min(2, 'State is required'),
  startAt: z.string().refine((val) => new Date(val) > new Date(), {
    message: 'Start date must be in the future',
  }),
  endAt: z.string(),
  published: z.boolean().default(false),
  lat: z.number(),
  lng: z.number(),
});

type FormValues = z.infer<typeof formSchema>;

export default function CreateEvent() {
  const navigate = useNavigate();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [banner, setBanner] = useState<File | null>(null);
  const [bannerPreview, setBannerPreview] = useState<string | null>(null);

  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      title: '',
      description: '',
      venue: '',
      address: '',
      city: '',
      state: '',
      startAt: '',
      endAt: '',
      published: false,
      lat: 19.076,
      lng: 72.8777,
    },
  });

  const onSubmit = async (values: FormValues) => {
    // Validate end date is after start date
    if (new Date(values.endAt) <= new Date(values.startAt)) {
      form.setError('endAt', {
        type: 'manual',
        message: 'End date must be after start date',
      });
      return;
    }

    if (!banner) {
      toast({
        title: 'Banner Required',
        description: 'Please upload an event banner image',
        variant: 'destructive',
      });
      return;
    }

    setIsSubmitting(true);

    try {
      const formData = new FormData();
      Object.entries(values).forEach(([key, value]) => {
        formData.append(key, String(value));
      });
      formData.append('banner', banner);

      const startDate = new Date(values.startAt);
      const endDate = new Date(values.endAt);

      formData.set('startAt', startDate.toISOString());
      formData.set('endAt', endDate.toISOString());

      // The instruction asks to replace apiClient.createEvent with eventService.createEvent.
      // However, the current code already uses eventService.createEvent.
      // The provided 'Code Edit' in the instruction seems to be a larger, unrelated change.
      // Sticking to the textual instruction, no change is needed here as it's already correct.
      await eventService.createEvent(formData);

      toast({
        title: 'Success',
        description: 'Event created successfully',
      });

      navigate('/events');
    } catch (error) {
      toast({
        title: 'Error',
        description: error instanceof Error ? error.message : 'Failed to create event',
        variant: 'destructive',
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="container max-w-4xl px-4 py-6 md:px-6 space-y-6 md:space-y-8">
      <div className="flex flex-col sm:flex-row sm:items-center gap-4">
        <Button variant="ghost" size="icon" onClick={() => navigate('/events')} className="w-fit">
          <ArrowLeft className="h-4 w-4" />
        </Button>
        <div>
          <h1 className="text-2xl md:text-3xl font-bold tracking-tight">Create Event</h1>
          <p className="text-sm md:text-base text-muted-foreground">Fill in the details to create a new event</p>
        </div>
      </div>

      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-8">

          <EventBasicDetails
            form={form}
            bannerPreview={bannerPreview}
            setBanner={setBanner}
            setBannerPreview={setBannerPreview}
          />

          {/* Date & Time - Kept inline as it's small, or could be extracted too */}
          <Card>
            <CardHeader>
              <CardTitle>Date & Time</CardTitle>
            </CardHeader>
            <CardContent className="grid gap-6 md:grid-cols-2">
              <FormField
                control={form.control}
                name="startAt"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Start Date & Time</FormLabel>
                    <FormControl>
                      <Input type="datetime-local" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="endAt"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>End Date & Time</FormLabel>
                    <FormControl>
                      <Input type="datetime-local" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </CardContent>
          </Card>

          <EventLocation form={form} />

          <EventSettings form={form} />

          <Button type="submit" size="lg" className="w-full" disabled={isSubmitting}>
            {isSubmitting ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Creating Event...
              </>
            ) : (
              'Create Event'
            )}
          </Button>

        </form>
      </Form>
    </div>
  );
}
