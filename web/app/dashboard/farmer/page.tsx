/**
 * Farmer Dashboard Overview Page
 * Story 2.5: Dashboard UX Restructure - Overview with Inline Farm Information Editor
 *
 * Route: /dashboard/farmer
 *
 * Displays farm information form (editable) with verification badge.
 * Replaces separate farm-info page with inline editing.
 */

'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useAuth, useUser } from '@clerk/nextjs';
import { useRouter } from 'next/navigation';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { Button } from '@/components/ui/button';
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { ExternalLink, PenSquare, Loader2 } from 'lucide-react';
import { toast } from 'sonner';
import DashboardLayout from '@/components/farmer/dashboard-layout';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Checkbox } from '@/components/ui/checkbox';
import { Label } from '@/components/ui/label';

// Farm form validation schema
const farmSchema = z.object({
  name: z.string().min(1, 'Farm name is required'),
  description: z
    .union([z.string().min(10, 'Description must be at least 10 characters'), z.literal('')])
    .optional(),
  street: z.string().optional(),
  city: z.string().optional(),
  state: z.string().optional(),
  postal_code: z.string().optional(),
  country: z.string().optional(),
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

interface DashboardData {
  farm: {
    name: string;
    slug: string;
    description?: string;
    street?: string;
    city?: string;
    state?: string;
    postal_code?: string;
    country?: string;
    phone?: string;
    email?: string;
    website?: string;
    monday_hours?: string;
    tuesday_hours?: string;
    wednesday_hours?: string;
    thursday_hours?: string;
    friday_hours?: string;
    saturday_hours?: string;
    sunday_hours?: string;
    latitude?: number;
    longitude?: number;
  };
  verification: {
    status: 'Active' | 'Pending' | 'Suspended';
    missingFields: string[];
  };
}

export default function FarmerDashboardPage() {
  const { getToken } = useAuth();
  const { user } = useUser();
  const router = useRouter();
  const [data, setData] = useState<DashboardData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isSaving, setIsSaving] = useState(false);

  const form = useForm<FarmFormData>({
    resolver: zodResolver(farmSchema),
    defaultValues: {
      name: '',
      description: '',
      street: '',
      city: '',
      state: '',
      postal_code: '',
      country: '',
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
    async function fetchData() {
      try {
        const token = await getToken();

        // Fetch farm data
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

        const result = await response.json();
        setData(result);

        // Populate form with fetched data
        if (result.farm) {
          console.log('Dashboard - API Response:', JSON.stringify(result.farm, null, 2));
          Object.keys(result.farm).forEach((key) => {
            const value = result.farm[key];

            // Handle pet_friendly boolean conversion
            if (key === 'pet_friendly' && typeof value === 'number') {
              form.setValue(key as keyof FarmFormData, Boolean(value) as any);
            } else {
              form.setValue(key as keyof FarmFormData, value || '');
            }
          });
        }
      } catch (err) {
        console.error('Data fetch error:', err);
        setError(err instanceof Error ? err.message : 'Failed to fetch farm data');
      } finally {
        setLoading(false);
      }
    }

    fetchData();
  }, [getToken, form]);

  const onSubmit = async (formData: FarmFormData) => {
    setIsSaving(true);
    try {
      const token = await getToken();
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/farmer/farm`, {
        method: 'PUT',
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(formData),
      });

      if (!response.ok) {
        throw new Error('Failed to save farm information');
      }

      const result = await response.json();

      // Update verification status
      if (result.verification) {
        setData((prev) => (prev ? { ...prev, verification: result.verification } : null));
      }

      toast.success('Farm information saved successfully!');

      if (result.verification?.status === 'Active') {
        toast.success('🎉 Your farm is now verified!');
      }
    } catch (err) {
      console.error('Save error:', err);
      toast.error('Failed to save farm information');
    } finally {
      setIsSaving(false);
    }
  };

  // Loading state
  if (loading) {
    return (
      <DashboardLayout>
        <DashboardSkeleton />
      </DashboardLayout>
    );
  }

  // Error state
  if (error) {
    return (
      <DashboardLayout>
        <div className="p-6">
          <div className="max-w-2xl mx-auto text-center py-12">
            <div className="mb-6">
              <div className="mx-auto w-16 h-16 bg-red-100 rounded-full flex items-center justify-center">
                <span className="text-3xl">⚠️</span>
              </div>
            </div>
            <h1 className="text-2xl font-bold text-gray-900 mb-2">Error Loading Dashboard</h1>
            <p className="text-gray-600 mb-6">{error}</p>
            <Button onClick={() => window.location.reload()}>Try Again</Button>
          </div>
        </div>
      </DashboardLayout>
    );
  }

  // Empty state (no data)
  if (!data) {
    return (
      <DashboardLayout>
        <EmptyState />
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout>
      <div className="p-6 space-y-6 max-w-4xl mx-auto">
        {/* Hero Section */}
        <Card className="border-2 border-green-200 bg-gradient-to-r from-green-50 to-blue-50">
          <CardContent className="pt-6">
            <div className="text-center md:text-left">
              <h1 className="text-3xl font-bold text-gray-900 mb-2">
                Welcome back, {user?.firstName || 'Farmer'}!
              </h1>
              <p className="text-lg text-gray-700">
                Managing <strong>{data.farm.name}</strong>
              </p>
            </div>
          </CardContent>
        </Card>

        {/* Verification Status Badge */}
        {data.verification?.status === 'Pending' && (
          <Card className="border-orange-200 bg-orange-50">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-orange-900">
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  className="h-5 w-5"
                  viewBox="0 0 20 20"
                  fill="currentColor"
                >
                  <path
                    fillRule="evenodd"
                    d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z"
                    clipRule="evenodd"
                  />
                </svg>
                Farm Pending Verification
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-orange-800 mb-3">
                Complete the fields below to get your farm verified and increase visibility!
              </p>
              {data.verification?.missingFields?.length > 0 && (
                <div>
                  <p className="font-semibold text-orange-900 mb-2">Missing information:</p>
                  <ul className="list-disc list-inside space-y-1 text-orange-800">
                    {data.verification.missingFields.map((field) => (
                      <li key={field} className="capitalize">
                        {field.replace('_', ' ')}
                      </li>
                    ))}
                  </ul>
                </div>
              )}
            </CardContent>
          </Card>
        )}

        {data.verification?.status === 'Active' && (
          <Card className="border-green-200 bg-green-50">
            <CardContent className="pt-6">
              <div className="flex items-center gap-3">
                <div className="bg-green-500 rounded-full p-2">
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    className="h-6 w-6 text-white"
                    viewBox="0 0 20 20"
                    fill="currentColor"
                  >
                    <path
                      fillRule="evenodd"
                      d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z"
                      clipRule="evenodd"
                    />
                  </svg>
                </div>
                <div>
                  <h3 className="font-semibold text-green-900">Farm Verified ✓</h3>
                  <p className="text-green-800">Your farm profile is complete and verified!</p>
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Farm Information Form */}
        <Card>
          <CardHeader>
            <CardTitle>Farm Information</CardTitle>
            <p className="text-sm text-gray-600 mt-1">
              Keep your farm information up to date. Your changes will be synced immediately.
            </p>
          </CardHeader>
          <CardContent>
            <Form {...form}>
              <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
                {/* Basic Information Section */}
                <div className="space-y-4">
                  <h3 className="text-lg font-semibold text-gray-900">Basic Information</h3>

                  <FormField
                    control={form.control}
                    name="name"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Farm Name *</FormLabel>
                        <FormControl>
                          <Input placeholder="Enter your farm name" {...field} />
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
                            placeholder="Tell customers about your farm (minimum 10 characters when provided)"
                            className="resize-none"
                            rows={5}
                            {...field}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>

                {/* Location Section */}
                <div className="space-y-4">
                  <h3 className="text-lg font-semibold text-gray-900">Location</h3>

                  <FormField
                    control={form.control}
                    name="street"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Street Address</FormLabel>
                        <FormControl>
                          <Input placeholder="123 Farm Lane" {...field} />
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
                          <FormLabel>City</FormLabel>
                          <FormControl>
                            <Input placeholder="Anytown" {...field} />
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
                          <FormLabel>State</FormLabel>
                          <FormControl>
                            <Input placeholder="CA" {...field} />
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
                            <Input placeholder="12345" {...field} />
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

                  {/* Coordinates (Read-only) */}
                  {(data.farm.latitude || data.farm.longitude) && (
                    <div className="bg-gray-50 p-3 rounded-md border border-gray-200">
                      <p className="text-sm text-gray-600">
                        <span className="font-semibold">Coordinates:</span> {data.farm.latitude},{' '}
                        {data.farm.longitude}
                      </p>
                      <p className="text-xs text-gray-500 mt-1">
                        Contact support to change your farm's location
                      </p>
                    </div>
                  )}
                </div>

                {/* Contact Section */}
                <div className="space-y-4">
                  <h3 className="text-lg font-semibold text-gray-900">Contact Information</h3>

                  <FormField
                    control={form.control}
                    name="phone"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Phone</FormLabel>
                        <FormControl>
                          <Input placeholder="(555) 123-4567" {...field} />
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
                          <Input placeholder="farm@example.com" type="email" {...field} />
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
                          <Input placeholder="https://yourfarm.com" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>

                {/* Operating Hours Section */}
                <div className="space-y-4">
                  <h3 className="text-lg font-semibold text-gray-900">Operating Hours</h3>
                  <p className="text-sm text-gray-600">
                    Enter hours for each day (e.g., "9:00 AM - 5:00 PM")
                  </p>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {[
                      { day: 'monday_hours', label: 'Monday' },
                      { day: 'tuesday_hours', label: 'Tuesday' },
                      { day: 'wednesday_hours', label: 'Wednesday' },
                      { day: 'thursday_hours', label: 'Thursday' },
                      { day: 'friday_hours', label: 'Friday' },
                      { day: 'saturday_hours', label: 'Saturday' },
                      { day: 'sunday_hours', label: 'Sunday' },
                    ].map(({ day, label }) => (
                      <FormField
                        key={day}
                        control={form.control}
                        name={day as keyof FarmFormData}
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>{label}</FormLabel>
                            <FormControl>
                              <Input
                                placeholder="e.g., 9:00 AM - 5:00 PM"
                                {...field}
                                value={(field.value as string) || ''}
                              />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    ))}
                  </div>
                </div>

                {/* Farm Details Section */}
                <div className="space-y-4">
                  <h3 className="text-lg font-semibold text-gray-900">Farm Details</h3>

                  {/* Categories */}
                  <FormField
                    control={form.control}
                    name="categories"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Categories / Type of Farms</FormLabel>
                        <div className="space-y-3 mt-2">
                          {[
                            'Christmas Tree',
                            'Pumpkin Patch',
                            'Apple Orchard',
                            'Berry Farm',
                            'Vegetable Farm',
                            'Sunflower Field',
                            'Corn Maze',
                            'Petting Zoo',
                          ].map((option) => (
                            <div key={option} className="flex items-center space-x-2">
                              <Checkbox
                                id={`category-${option}`}
                                checked={field.value?.includes(option) ?? false}
                                onCheckedChange={(checked) => {
                                  const newValue = checked
                                    ? [...(field.value || []), option]
                                    : (field.value || []).filter((item) => item !== option);
                                  field.onChange(newValue);
                                }}
                              />
                              <Label
                                htmlFor={`category-${option}`}
                                className="font-normal cursor-pointer"
                              >
                                {option}
                              </Label>
                            </div>
                          ))}
                        </div>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  {/* Service Type */}
                  <FormField
                    control={form.control}
                    name="type"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Service Type</FormLabel>
                        <Select value={field.value || ''} onValueChange={field.onChange}>
                          <FormControl>
                            <SelectTrigger>
                              <SelectValue placeholder="Select a service type" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            <SelectItem value="U-Pick">U-Pick</SelectItem>
                            <SelectItem value="Pre-Cut">Pre-Cut</SelectItem>
                            <SelectItem value="Cut Your Own">Cut Your Own</SelectItem>
                            <SelectItem value="Retail">Retail</SelectItem>
                            <SelectItem value="Pick Your Own">Pick Your Own</SelectItem>
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  {/* Varieties */}
                  <FormField
                    control={form.control}
                    name="varieties"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Varieties / Products</FormLabel>
                        <div className="space-y-3 mt-2">
                          {[
                            'Balsam Fir',
                            'Douglas Fir',
                            'Blue Spruce',
                            'Honeycrisp Apple',
                            'Granny Smith Apple',
                            'Blueberry',
                            'Strawberry',
                            'Pumpkin',
                            'Corn',
                            'Sunflower',
                          ].map((option) => (
                            <div key={option} className="flex items-center space-x-2">
                              <Checkbox
                                id={`variety-${option}`}
                                checked={field.value?.includes(option) ?? false}
                                onCheckedChange={(checked) => {
                                  const newValue = checked
                                    ? [...(field.value || []), option]
                                    : (field.value || []).filter((item) => item !== option);
                                  field.onChange(newValue);
                                }}
                              />
                              <Label
                                htmlFor={`variety-${option}`}
                                className="font-normal cursor-pointer"
                              >
                                {option}
                              </Label>
                            </div>
                          ))}
                        </div>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  {/* Amenities */}
                  <FormField
                    control={form.control}
                    name="amenities"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Amenities</FormLabel>
                        <div className="space-y-3 mt-2">
                          {[
                            'Restrooms',
                            'Gift Shop',
                            'Wagon Rides',
                            'Picnic Area',
                            'Playground',
                            'Food Service',
                            'Parking',
                            'Wheelchair Accessible',
                          ].map((option) => (
                            <div key={option} className="flex items-center space-x-2">
                              <Checkbox
                                id={`amenity-${option}`}
                                checked={field.value?.includes(option) ?? false}
                                onCheckedChange={(checked) => {
                                  const newValue = checked
                                    ? [...(field.value || []), option]
                                    : (field.value || []).filter((item) => item !== option);
                                  field.onChange(newValue);
                                }}
                              />
                              <Label
                                htmlFor={`amenity-${option}`}
                                className="font-normal cursor-pointer"
                              >
                                {option}
                              </Label>
                            </div>
                          ))}
                        </div>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  {/* Pet Friendly */}
                  <FormField
                    control={form.control}
                    name="pet_friendly"
                    render={({ field }) => (
                      <FormItem className="flex items-center space-x-2">
                        <FormControl>
                          <Checkbox
                            id="pet-friendly"
                            checked={field.value ?? false}
                            onCheckedChange={field.onChange}
                          />
                        </FormControl>
                        <Label htmlFor="pet-friendly" className="font-normal cursor-pointer">
                          Are pets allowed on the premises?
                        </Label>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  {/* Price Range */}
                  <FormField
                    control={form.control}
                    name="price_range"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Price Range</FormLabel>
                        <FormControl>
                          <Input
                            placeholder="e.g., $25 - $75 or $10 per person"
                            {...field}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  {/* Payment Methods */}
                  <FormField
                    control={form.control}
                    name="payment_methods"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Payment Methods</FormLabel>
                        <div className="space-y-3 mt-2">
                          {[
                            'Cash',
                            'Credit Card',
                            'Debit Card',
                            'Venmo',
                            'PayPal',
                            'Apple Pay',
                            'Google Pay',
                          ].map((option) => (
                            <div key={option} className="flex items-center space-x-2">
                              <Checkbox
                                id={`payment-${option}`}
                                checked={field.value?.includes(option) ?? false}
                                onCheckedChange={(checked) => {
                                  const newValue = checked
                                    ? [...(field.value || []), option]
                                    : (field.value || []).filter((item) => item !== option);
                                  field.onChange(newValue);
                                }}
                              />
                              <Label
                                htmlFor={`payment-${option}`}
                                className="font-normal cursor-pointer"
                              >
                                {option}
                              </Label>
                            </div>
                          ))}
                        </div>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>

                {/* Operating Dates Section */}
                <div className="space-y-4">
                  <h3 className="text-lg font-semibold text-gray-900">Operating Dates</h3>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {/* Opening Date */}
                    <FormField
                      control={form.control}
                      name="opening_date"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Next Season Opening Date</FormLabel>
                          <FormControl>
                            <Input
                              type="date"
                              {...field}
                              value={field.value || ''}
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    {/* Closing Date */}
                    <FormField
                      control={form.control}
                      name="closing_date"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Next Season Closing Date</FormLabel>
                          <FormControl>
                            <Input
                              type="date"
                              {...field}
                              value={field.value || ''}
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>
                </div>

                {/* Submit Button */}
                <div className="flex gap-3 pt-4">
                  <Button
                    type="submit"
                    disabled={isSaving}
                    className="bg-green-800 hover:bg-green-900"
                  >
                    {isSaving ? (
                      <>
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        Saving...
                      </>
                    ) : (
                      <>
                        <PenSquare className="mr-2 h-4 w-4" />
                        Save Changes
                      </>
                    )}
                  </Button>
                  <Button variant="outline" size="lg" asChild>
                    <a href={`/farms/${data.farm.slug}/`} target="_blank" rel="noopener noreferrer">
                      <ExternalLink className="mr-2 h-4 w-4" />
                      View My Listing
                    </a>
                  </Button>
                </div>
              </form>
            </Form>
          </CardContent>
        </Card>
      </div>
    </DashboardLayout>
  );
}

// Empty State Component
function EmptyState() {
  return (
    <div className="flex flex-col items-center justify-center min-h-[60vh] p-6">
      <div className="text-center space-y-4">
        <div className="mx-auto w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center">
          <span className="text-3xl">🌾</span>
        </div>
        <h2 className="text-2xl font-bold text-gray-900">Welcome to Your Farm Dashboard!</h2>
        <p className="text-gray-600 max-w-md">
          Complete your farm profile to start managing your listing and engaging with customers.
        </p>
      </div>
    </div>
  );
}

// Loading Skeleton
function DashboardSkeleton() {
  return (
    <div className="p-6 space-y-6 max-w-4xl mx-auto">
      <Skeleton className="h-24 w-full" />
      <Skeleton className="h-20 w-full" />
      <div className="space-y-4">
        <Skeleton className="h-8 w-48" />
        <Skeleton className="h-12 w-full" />
        <Skeleton className="h-32 w-full" />
        <Skeleton className="h-12 w-32" />
      </div>
    </div>
  );
}
