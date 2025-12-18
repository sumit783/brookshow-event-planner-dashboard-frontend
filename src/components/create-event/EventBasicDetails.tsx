import { UseFormReturn } from 'react-hook-form';
import { Upload } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';

// Define the form values type to match the main form schema (or importa it)
// Ideally this should be imported from a shared validation file, but for now we'll inline or use 'any' for the form wrapper to keep it simple, or better yet, generic.
// But to be type safe let's accept any.
interface EventBasicDetailsProps {
  form: UseFormReturn<any>;
  bannerPreview: string | null;
  setBanner: (file: File | null) => void;
  setBannerPreview: (url: string | null) => void;
}

export default function EventBasicDetails({ form, bannerPreview, setBanner, setBannerPreview }: EventBasicDetailsProps) {
  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setBanner(file);
      const reader = new FileReader();
      reader.onloadend = () => {
        setBannerPreview(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Basic Details</CardTitle>
        <CardDescription>Event title, description and banner</CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <FormField
          control={form.control}
          name="title"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Event Title</FormLabel>
              <FormControl>
                <Input placeholder="e.g. New Year Bash 2026" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="description"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Description</FormLabel>
              <FormControl>
                <Textarea placeholder="Describe your event..." className="min-h-[100px]" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <div className="space-y-2">
          <FormLabel>Event Banner</FormLabel>
          <div className="flex flex-col items-center justify-center rounded-md border border-dashed p-6 text-center">
             {bannerPreview ? (
              <div className="relative w-full max-w-sm aspect-video overflow-hidden rounded-lg">
                <img src={bannerPreview} alt="Preview" className="h-full w-full object-cover" />
                <Button
                  type="button"
                  variant="secondary"
                  size="sm"
                  className="absolute right-2 top-2"
                  onClick={() => {
                    setBanner(null);
                    setBannerPreview(null);
                  }}
                >
                  Change
                </Button>
              </div>
            ) : (
              <label className="cursor-pointer space-y-2">
                 <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-muted">
                  <Upload className="h-6 w-6 text-muted-foreground" />
                 </div>
                 <div className="text-sm text-muted-foreground">
                   <span className="font-semibold text-primary">Click to upload</span> or drag and drop
                 </div>
                 <input
                   type="file"
                   accept="image/*"
                   className="hidden"
                   onChange={handleImageChange}
                 />
              </label>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
