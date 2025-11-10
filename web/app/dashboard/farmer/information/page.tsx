/**
 * Farmer Dashboard Information Page
 * Story 2.5: Dashboard UX Restructure - Inline Farm Information Editor
 *
 * Route: /dashboard/farmer/information
 *
 * Single unified page for all farm information editing.
 * Displays comprehensive farm information form with verification badge and all editable fields.
 */

'use client';

import { useEffect, useState } from 'react';
import { useAuth } from '@clerk/nextjs';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Skeleton } from '@/components/ui/skeleton';
import { Button } from '@/components/ui/button';
import { Form } from '@/components/ui/form';
import { ProgressBar } from '@/components/dashboard/progress-bar';
import { toast } from 'sonner';
import DashboardLayout from '@/components/farmer/dashboard-layout';
import { FarmerFormImproved } from '@/components/farmer-form-improved';
import { useRouter } from 'next/navigation';

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

export default function FarmerDashboardInformationPage() {
  const { getToken } = useAuth();
  const router = useRouter();
  const [data, setData] = useState<DashboardData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  const [profileCompletion, setProfileCompletion] = useState<number>(0);

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
        const apiUrl =
          process.env.NEXT_PUBLIC_API_URL || 'https://pickafarm-api.94623956quebecinc.workers.dev';

        // Fetch farm data
        const response = await fetch(`${apiUrl}/api/farmer/farm`, {
          method: 'GET',
          headers: {
            Authorization: `Bearer ${token}`,
            'Content-Type': 'application/json',
          },
        });

        if (response.status === 404) {
          // Farm not found. This user is a farmer without a farm.
          // Demote them and redirect.
          console.warn('Farm not found for this user. Demoting to regular user.');
          setError('The farm associated with your account could not be found. You will be redirected to your personal dashboard.');

          // Call the demotion API
          await fetch('/api/user/demote-farmer', {
            method: 'POST',
            headers: {
              Authorization: `Bearer ${token}`,
              'Content-Type': 'application/json',
            },
          });

          // Redirect to the regular user dashboard after a short delay
          setTimeout(() => {
            router.push('/dashboard');
          }, 3000); // 3-second delay to allow user to read the message

          return; // Stop further processing
        }

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
            if (
              key === 'categories' ||
              key === 'type' ||
              key === 'varieties' ||
              key === 'amenities' ||
              key === 'payment_methods'
            ) {
              // Convert CSV string to array - handle both string CSV and arrays
              let arrayValue: string[] = [];

              if (Array.isArray(value)) {
                // Already an array, use as-is
                arrayValue = value.filter(Boolean);
              } else if (typeof value === 'string' && value) {
                // CSV string, split and clean
                arrayValue = value
                  .split(',')
                  .map((v) => v.trim())
                  .filter(Boolean);
              }

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
  }, [getToken, form, router]);

  // Fetch dashboard stats for progress bar
  useEffect(() => {
    async function fetchStats() {
      try {
        const token = await getToken();
        if (!token) return;

        const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'https://pickafarm-api.94623956quebecinc.workers.dev';
        const response = await fetch(`${apiUrl}/api/farmer/dashboard/stats`, {
          method: 'GET',
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
          }
        });

        if (response.ok) {
          const stats = await response.json();
          setProfileCompletion(stats.profileCompletion?.percentage || 0);
        }
      } catch (err) {
        console.error('Error fetching stats:', err);
      }
    }

    if (data) {
      fetchStats();
    }
  }, [getToken, data]);

  // Scroll to section on hash change
  useEffect(() => {
    const hash = window.location.hash;
    if (hash) {
      // Small delay to ensure DOM is ready
      setTimeout(() => {
        const element = document.querySelector(hash);
        if (element) {
          element.scrollIntoView({ behavior: 'smooth', block: 'start' });
        }
      }, 100);
    }
  }, []);

  const onSubmit = async (formData: FarmFormData) => {
    setIsSaving(true);
    try {
      const token = await getToken();
      // Use environment variable or fallback to production API URL
      const apiUrl =
        process.env.NEXT_PUBLIC_API_URL || 'https://pickafarm-api.94623956quebecinc.workers.dev';

      const response = await fetch(`${apiUrl}/api/farmer/farm`, {
        method: 'PUT',
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(formData),
      });

      if (!response.ok) {
        // Parse error response to get specific error message
        let errorMessage = 'Failed to save farm information';
        try {
          const errorData = await response.json();
          errorMessage = errorData.error || errorData.message || errorData.details || errorMessage;
          console.error('API Error:', {
            status: response.status,
            statusText: response.statusText,
            error: errorData,
            requestData: formData
          });
        } catch (parseError) {
          console.error('Failed to parse error response:', parseError);
          errorMessage = `Server error: ${response.status} ${response.statusText}`;
        }
        throw new Error(errorMessage);
      }

      const result = await response.json();

      // Update verification status
      if (result.verification) {
        setData((prev) => (prev ? { ...prev, verification: result.verification } : null));
      }

      // Refresh stats to update progress bar
      const statsResponse = await fetch(`${apiUrl}/api/farmer/dashboard/stats`, {
        method: 'GET',
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      });
      if (statsResponse.ok) {
        const stats = await statsResponse.json();
        setProfileCompletion(stats.profileCompletion?.percentage || 0);
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
      <div className="p-4 sm:p-6 space-y-6">
        {/* Progress Bar */}
        <div className="bg-white border border-gray-200 rounded-lg p-6">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h2 className="text-lg font-semibold text-gray-900">Profile Completion</h2>
              <p className="text-sm text-gray-600 mt-1">
                Complete your profile to improve your listing visibility
              </p>
            </div>
          </div>
          <ProgressBar percentage={profileCompletion} className="w-full" />
        </div>

        {/* Farm Information Header */}
        <div className="mb-6">
          <h2 className="text-xl font-semibold text-gray-900">Farm Information</h2>
          <p className="text-sm text-gray-600 mt-1">
            Keep your farm information up to date. Your changes will be synced immediately.
          </p>
        </div>
        <Form {...form}>
          <FarmerFormImproved
            form={form}
            onSubmit={onSubmit}
            isSaving={isSaving}
            farmData={data.farm}
          />
        </Form>
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
    <div className="p-6 space-y-6">
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

