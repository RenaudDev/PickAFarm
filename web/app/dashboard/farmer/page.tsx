/**
 * Farmer Dashboard Overview Page
 * Story 2.5: Dashboard UX Restructure - Inline Farm Information Editor
 *
 * Route: /dashboard/farmer
 *
 * Single unified page for all farm information editing.
 * Displays comprehensive farm information form with verification badge and all editable fields.
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
import { DynamicMultiSelect } from '@/components/forms/DynamicMultiSelect';
import { FarmerFormImproved } from '@/components/farmer-form-improved';

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
  type: z.array(z.string()).optional(), // Service types (multi-select)
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
      type: [], // Service types (multi-select)
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

        // Use environment variable or fallback to production API URL
        const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'https://pickafarm-api.94623956quebecinc.workers.dev';

        // Fetch farm data
        const response = await fetch(`${apiUrl}/api/farmer/farm`, {
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

        // DEBUG: Log the entire API response
        console.log('=== FULL API RESPONSE ===');
        console.log(JSON.stringify(result, null, 2));

        // Populate form with fetched data
        if (result.farm) {
          console.log('=== POPULATING FORM FIELDS ===');

          // Log each field as we process it
          Object.keys(result.farm).forEach((key) => {
            const value = result.farm[key];
            console.log(`Processing field "${key}":`, value);

            // Special handling for multi-select fields that come as CSV strings
            if (key === 'categories' || key === 'varieties' || key === 'amenities' || key === 'payment_methods') {
              // Convert CSV string to array
              const arrayValue = typeof value === 'string' && value
                ? value.split(',').map(v => v.trim()).filter(Boolean)
                : [];
              console.log(`  Converted "${key}" to array:`, arrayValue);
              form.setValue(key as keyof FarmFormData, arrayValue);
            }
            // Handle pet_friendly boolean conversion
            else if (key === 'pet_friendly') {
              const boolValue = value === 1 || value === true || value === 'true';
              console.log(`  Converted "${key}" to boolean:`, boolValue);
              form.setValue(key as keyof FarmFormData, boolValue as any);
            }
            // Handle description specifically
            else if (key === 'description') {
              console.log(`  Setting description: "${value}"`);
              form.setValue('description', value || '');
            }
            // Handle dates
            else if (key === 'opening_date' || key === 'closing_date') {
              form.setValue(key as keyof FarmFormData, value || null);
            }
            // All other string fields
            else if (typeof value === 'string' || typeof value === 'number') {
              form.setValue(key as keyof FarmFormData, (value || '') as any);
            }
          });

          // Log final form values
          console.log('=== FINAL FORM VALUES ===');
          console.log('Description:', form.getValues('description'));
          console.log('Categories:', form.getValues('categories'));
          console.log('Varieties:', form.getValues('varieties'));
          console.log('Amenities:', form.getValues('amenities'));
          console.log('Payment Methods:', form.getValues('payment_methods'));
        } else {
          console.log('ERROR: No farm data in response!');
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
      // Use environment variable or fallback to production API URL
      const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'https://pickafarm-api.94623956quebecinc.workers.dev';

      const response = await fetch(`${apiUrl}/api/farmer/farm`, {
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
              <FarmerFormImproved
                form={form}
                onSubmit={onSubmit}
                isSaving={isSaving}
                farmData={data.farm}
                farmSlug={data.farm.slug}
              />
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
