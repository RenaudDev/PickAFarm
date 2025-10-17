/**
 * Farm Information Editor Page
 * Story 2.5: Dashboard UX Restructure & Farm Information Editor
 *
 * Route: /dashboard/farmer/farm-info
 *
 * Allows farmers to edit their farm information with bidirectional sync to Zoho CRM.
 * Features client and server-side validation, geocoding on address changes.
 */

'use client';

import { useEffect, useState } from 'react';
import { useAuth } from '@clerk/nextjs';
import { useRouter } from 'next/navigation';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { toast } from 'sonner';
import DashboardLayout from '@/components/farmer/dashboard-layout';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import { Skeleton } from '@/components/ui/skeleton';
import { Loader2, Save, AlertCircle } from 'lucide-react';

// Zod validation schema for farm data
const farmSchema = z.object({
  name: z.string().min(1, 'Farm name is required'),
  description: z
    .union([z.string().min(10, 'Description must be at least 10 characters'), z.literal('')])
    .optional(),
  street: z.string().min(1, 'Street address is required'),
  city: z.string().min(1, 'City is required'),
  state: z.string().min(1, 'State is required'),
  postal_code: z
    .string()
    .regex(/^\d{5}(-\d{4})?$/, 'Invalid ZIP code (use format: 12345 or 12345-6789)')
    .optional()
    .or(z.literal('')),
  country: z.string().optional().or(z.literal('')),
  phone: z
    .string()
    .regex(/^[\d\s\-()+ ]*$/, 'Invalid phone number')
    .optional()
    .or(z.literal('')),
  email: z.string().email('Invalid email').optional().or(z.literal('')),
  website: z.string().url('Invalid URL').optional().or(z.literal('')),
  monday_hours: z.string().optional().or(z.literal('')),
  tuesday_hours: z.string().optional().or(z.literal('')),
  wednesday_hours: z.string().optional().or(z.literal('')),
  thursday_hours: z.string().optional().or(z.literal('')),
  friday_hours: z.string().optional().or(z.literal('')),
  saturday_hours: z.string().optional().or(z.literal('')),
  sunday_hours: z.string().optional().or(z.literal('')),
  categories: z.array(z.string()).optional(),
  type: z.string().optional().or(z.literal('')),
  amenities: z.array(z.string()).optional(),
  varieties: z.array(z.string()).optional(),
  pet_friendly: z.boolean().optional(),
  price_range: z.string().optional().or(z.literal('')),
  payment_methods: z.array(z.string()).optional(),
  opening_date: z.string().optional().nullable(),
  closing_date: z.string().optional().nullable(),
});

type FarmFormData = z.infer<typeof farmSchema>;

interface FarmData extends FarmFormData {
  slug: string;
  latitude: number | null;
  longitude: number | null;
}

export default function FarmInfoPage() {
  const { getToken } = useAuth();
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [farmData, setFarmData] = useState<FarmData | null>(null);

  const form = useForm<FarmFormData>({
    resolver: zodResolver(farmSchema),
    defaultValues: {
      name: '',
      description: '',
      street: '',
      city: '',
      state: '',
      postal_code: '',
      country: 'United States',
      phone: '',
      email: '',
      website: '',
      monday_hours: '',
      tuesday_hours: '',
      wednesday_hours: '',
      thursday_hours: '',
      friday_hours: '',
      saturday_hours: '',
      sunday_hours: '',
      categories: [],
      type: '',
      amenities: [],
      varieties: [],
      pet_friendly: false,
      price_range: '',
      payment_methods: [],
      opening_date: null,
      closing_date: null,
    },
  });

  // Fetch farm data on mount
  useEffect(() => {
    async function fetchFarmData() {
      try {
        const token = await getToken();
        const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/farmer/farm`, {
          method: 'GET',
          headers: {
            Authorization: `Bearer ${token}`,
            'Content-Type': 'application/json',
          },
        });

        if (!response.ok) {
          const errorData = await response.json().catch(() => ({ error: 'Unknown error' }));
          throw new Error(errorData.error || `HTTP ${response.status}: ${response.statusText}`);
        }

        const data = await response.json();
        setFarmData(data.farm);

        // Populate form with fetched data
        Object.keys(data.farm).forEach((key) => {
          if (key !== 'slug' && key !== 'latitude' && key !== 'longitude') {
            form.setValue(key as keyof FarmFormData, data.farm[key]);
          }
        });
      } catch (err) {
        console.error('Farm data fetch error:', err);
        setError(err instanceof Error ? err.message : 'Failed to fetch farm data');
        toast.error('Failed to load farm data');
      } finally {
        setLoading(false);
      }
    }

    fetchFarmData();
  }, [getToken, form]);

  // Form submission handler
  const onSubmit = async (data: FarmFormData) => {
    setSubmitting(true);

    try {
      const token = await getToken();
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/farmer/farm`, {
        method: 'PUT',
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(data),
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({ error: 'Unknown error' }));
        throw new Error(errorData.error || 'Failed to update farm information');
      }

      const result = await response.json();

      // Show success message
      toast.success('Farm information updated successfully!');

      // If verification status changed to Active
      if (result.verification?.status === 'Active') {
        toast.success('🎉 Your farm is now verified!');
      }

      // Redirect back to dashboard
      setTimeout(() => {
        router.push('/dashboard/farmer');
      }, 1500);
    } catch (err) {
      console.error('Farm update error:', err);
      toast.error(err instanceof Error ? err.message : 'An error occurred. Please try again.');
    } finally {
      setSubmitting(false);
    }
  };

  // Loading state
  if (loading) {
    return (
      <DashboardLayout>
        <div className="p-6 space-y-6">
          <Skeleton className="h-8 w-64" />
          <Skeleton className="h-96" />
        </div>
      </DashboardLayout>
    );
  }

  // Error state
  if (error) {
    return (
      <DashboardLayout>
        <div className="p-6">
          <Card className="border-red-200 bg-red-50">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-red-900">
                <AlertCircle className="h-5 w-5" />
                Error Loading Farm Data
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-red-800">{error}</p>
              <Button onClick={() => router.push('/dashboard/farmer')} className="mt-4">
                Back to Dashboard
              </Button>
            </CardContent>
          </Card>
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout>
      <div className="p-6 max-w-4xl mx-auto space-y-6">
        {/* Page Header */}
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Edit Farm Information</h1>
          <p className="text-gray-600 mt-1">
            Update your farm details. Changes are synced to Zoho CRM automatically.
          </p>
        </div>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
            {/* Basic Information */}
            <Card>
              <CardHeader>
                <CardTitle>Basic Information</CardTitle>
                <CardDescription>Your farm's name and description</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <FormField
                  control={form.control}
                  name="name"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Farm Name *</FormLabel>
                      <FormControl>
                        <Input placeholder="Maple Grove Farm" {...field} />
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
                        <Textarea
                          placeholder="Tell visitors about your farm..."
                          rows={5}
                          {...field}
                        />
                      </FormControl>
                      <FormDescription>
                        A detailed description helps visitors understand what makes your farm
                        special.
                      </FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </CardContent>
            </Card>

            {/* Location */}
            <Card>
              <CardHeader>
                <CardTitle>Location</CardTitle>
                <CardDescription>
                  Your farm's physical address (coordinates auto-update when address changes)
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <FormField
                  control={form.control}
                  name="street"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Street Address *</FormLabel>
                      <FormControl>
                        <Input placeholder="123 Farm Road" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <FormField
                    control={form.control}
                    name="city"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>City *</FormLabel>
                        <FormControl>
                          <Input placeholder="Springfield" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="state"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>State *</FormLabel>
                        <FormControl>
                          <Input placeholder="Vermont" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <FormField
                    control={form.control}
                    name="postal_code"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>ZIP Code</FormLabel>
                        <FormControl>
                          <Input placeholder="05401" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="country"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Country</FormLabel>
                        <FormControl>
                          <Input placeholder="United States" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>

                {farmData?.latitude && farmData?.longitude && (
                  <div className="bg-gray-50 p-4 rounded-lg">
                    <p className="text-sm text-gray-600">
                      <strong>Coordinates (read-only):</strong> {farmData.latitude.toFixed(6)},{' '}
                      {farmData.longitude.toFixed(6)}
                    </p>
                    <p className="text-xs text-gray-500 mt-1">
                      Coordinates are automatically updated when you change the address.
                    </p>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Contact Information */}
            <Card>
              <CardHeader>
                <CardTitle>Contact Information</CardTitle>
                <CardDescription>How visitors can reach you</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <FormField
                  control={form.control}
                  name="phone"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Phone</FormLabel>
                      <FormControl>
                        <Input placeholder="(555) 123-4567" type="tel" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="email"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Email</FormLabel>
                      <FormControl>
                        <Input placeholder="info@maplegrove farm.com" type="email" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="website"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Website</FormLabel>
                      <FormControl>
                        <Input placeholder="https://www.maplegrovefarm.com" type="url" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </CardContent>
            </Card>

            {/* Operating Hours */}
            <Card>
              <CardHeader>
                <CardTitle>Operating Hours</CardTitle>
                <CardDescription>
                  Specify your hours for each day (e.g., "9:00 AM - 5:00 PM" or "Closed")
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                {['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday'].map(
                  (day) => (
                    <FormField
                      key={day}
                      control={form.control}
                      name={`${day}_hours` as keyof FarmFormData}
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel className="capitalize">{day}</FormLabel>
                          <FormControl>
                            <Input
                              placeholder="9:00 AM - 5:00 PM or Closed"
                              {...field}
                              value={(field.value as string) || ''}
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  )
                )}
              </CardContent>
            </Card>

            {/* Submit Button */}
            <div className="flex justify-end gap-4">
              <Button
                type="button"
                variant="outline"
                onClick={() => router.push('/dashboard/farmer')}
                disabled={submitting}
              >
                Cancel
              </Button>
              <Button type="submit" disabled={submitting}>
                {submitting ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Saving...
                  </>
                ) : (
                  <>
                    <Save className="mr-2 h-4 w-4" />
                    Save Changes
                  </>
                )}
              </Button>
            </div>
          </form>
        </Form>
      </div>
    </DashboardLayout>
  );
}
