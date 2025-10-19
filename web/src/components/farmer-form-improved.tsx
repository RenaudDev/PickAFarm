'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { UseFormReturn } from 'react-hook-form';
import { Button } from '@/components/ui/button';
import { FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Checkbox } from '@/components/ui/checkbox';
import { Label } from '@/components/ui/label';
// Smart Tag Input for multi-select fields with Zoho sync
import { CollapsibleFormSection } from '@/components/ui/collapsible-form-section';
import { FormProgressIndicator } from '@/components/ui/form-progress-indicator';
import { SmartTagInput } from '@/components/forms/SmartTagInput';
import { PenSquare, Loader2, ExternalLink } from 'lucide-react';

/**
 * Improved Farmer Form Component
 *
 * Features:
 * - Organized into 7 collapsible sections with new hierarchy
 * - Form progress indicator showing % complete
 * - Expand All / Collapse All controls
 * - Section completion indicators
 * - Full keyboard navigation and accessibility
 * - localStorage persistence for section state
 * - Mobile-responsive design
 */

interface FarmerFormImprovedProps {
  form: UseFormReturn<any>;
  onSubmit: (data: any) => Promise<void>;
  isSaving?: boolean;
  farmData?: any;
  farmSlug?: string;
}

export function FarmerFormImproved({
  form,
  onSubmit,
  isSaving = false,
  farmData,
  farmSlug,
}: FarmerFormImprovedProps) {
  const [expandedSections, setExpandedSections] = useState<Record<string, boolean>>({});
  const [formProgress, setFormProgress] = useState(0);

  // Calculate form progress based on filled fields
  const calculateProgress = useCallback(() => {
    const formValues = form.getValues();
    const requiredFields = ['name', 'city', 'street'];
    const allFields = Object.keys(formValues);

    let filledCount = 0;
    let totalCount = 0;

    // Count filled required fields
    requiredFields.forEach((field) => {
      totalCount++;
      const value = formValues[field];
      if (value && value !== '' && (Array.isArray(value) ? value.length > 0 : true)) {
        filledCount++;
      }
    });

    // Count filled optional fields
    const optionalFields = allFields.filter((f) => !requiredFields.includes(f));
    optionalFields.forEach((field) => {
      const value = formValues[field];
      if (value && value !== '' && (Array.isArray(value) ? value.length > 0 : true)) {
        filledCount++;
      }
    });

    totalCount += optionalFields.length;

    const progress = totalCount > 0 ? Math.round((filledCount / totalCount) * 100) : 0;
    setFormProgress(progress);
  }, [form]);

  // Recalculate progress when form values change
  useEffect(() => {
    const subscription = form.watch(() => {
      calculateProgress();
    });

    return () => subscription.unsubscribe();
  }, [form, calculateProgress]);

  // Check if a section is complete
  const isSectionComplete = (section: string): boolean => {
    const formValues = form.getValues();

    const sections: Record<string, string[]> = {
      basic: ['name'],
      operations: [
        'monday_hours',
        'tuesday_hours',
        'wednesday_hours',
        'thursday_hours',
        'friday_hours',
        'saturday_hours',
        'sunday_hours',
      ],
      location: ['city', 'street'],
      categories: ['categories'],
      products: [], // Optional
      amenities: [], // Optional
      media: [], // Optional
    };

    const requiredFields = sections[section] || [];
    if (requiredFields.length === 0) return false; // Optional sections always show incomplete

    return requiredFields.every((field) => {
      const value = formValues[field];
      return value && value !== '' && (Array.isArray(value) ? value.length > 0 : true);
    });
  };

  // Handle Expand All
  const handleExpandAll = () => {
    const sections = [
      'basic',
      'operations',
      'location',
      'categories',
      'products',
      'amenities',
      'media',
    ];
    sections.forEach((section) => {
      localStorage.setItem(`pickafarm_form_section_${section}`, 'true');
    });

    // Announce to screen readers
    const announcement = document.createElement('div');
    announcement.setAttribute('role', 'status');
    announcement.setAttribute('aria-live', 'polite');
    announcement.textContent = 'All sections expanded';
    announcement.className = 'sr-only';
    document.body.appendChild(announcement);
    setTimeout(() => announcement.remove(), 1000);

    // Trigger re-render by forcing a state update
    // This allows CollapsibleFormSection components to pick up the new localStorage values
    setFormProgress((prev) => prev);
  };

  // Handle Collapse All (keep basic expanded)
  const handleCollapseAll = () => {
    const sections = [
      'basic',
      'operations',
      'location',
      'categories',
      'products',
      'amenities',
      'media',
    ];
    sections.forEach((section) => {
      localStorage.setItem(
        `pickafarm_form_section_${section}`,
        section === 'basic' ? 'true' : 'false'
      );
    });

    // Announce to screen readers
    const announcement = document.createElement('div');
    announcement.setAttribute('role', 'status');
    announcement.setAttribute('aria-live', 'polite');
    announcement.textContent = 'Sections collapsed, Basic Information section remains expanded';
    announcement.className = 'sr-only';
    document.body.appendChild(announcement);
    setTimeout(() => announcement.remove(), 1000);

    // Trigger re-render by forcing a state update
    // This allows CollapsibleFormSection components to pick up the new localStorage values
    setFormProgress((prev) => prev);
  };

  return (
    <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-8">
      {/* Form Controls */}
      <div className="flex flex-col sm:flex-row gap-3 items-start sm:items-center justify-between sticky top-0 bg-white z-10 py-4 -mx-6 px-6 border-b border-gray-200">
        <div className="flex-1 w-full">
          <FormProgressIndicator percentage={formProgress} />
        </div>
        <div className="flex gap-2 shrink-0">
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={handleExpandAll}
            className="text-xs"
          >
            Expand All
          </Button>
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={handleCollapseAll}
            className="text-xs"
          >
            Collapse All
          </Button>
        </div>
      </div>

      {/* Section 1: Basic Information */}
      <CollapsibleFormSection
        id="basic"
        title="Basic Information"
        icon="📍"
        description="Farm name, description, and contact details"
        isRequired={true}
        isComplete={isSectionComplete('basic')}
        defaultExpanded={true}
      >
        <div className="space-y-4">
          {/* Farm Name */}
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

          {/* Description */}
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

          {/* Email */}
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

          {/* Phone */}
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

          {/* Website */}
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
      </CollapsibleFormSection>

      {/* Section 2: Operations & Availability */}
      <CollapsibleFormSection
        id="operations"
        title="Operations & Availability"
        icon="⏰"
        description="Operating hours, opening and closing dates"
        isRequired={true}
        isComplete={isSectionComplete('operations')}
        defaultExpanded={false}
      >
        <div className="space-y-6">
          {/* Operating Hours */}
          <div>
            <p className="text-sm font-semibold text-gray-900 mb-4">Operating Hours</p>
            <p className="text-sm text-gray-600 mb-4">
              Enter hours for each day (e.g., "9:00 AM - 5:00 PM")
            </p>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {[
                { day: 'monday_hours' as const, label: 'Monday' },
                { day: 'tuesday_hours' as const, label: 'Tuesday' },
                { day: 'wednesday_hours' as const, label: 'Wednesday' },
                { day: 'thursday_hours' as const, label: 'Thursday' },
                { day: 'friday_hours' as const, label: 'Friday' },
                { day: 'saturday_hours' as const, label: 'Saturday' },
                { day: 'sunday_hours' as const, label: 'Sunday' },
              ].map(({ day, label }) => (
                <FormField
                  key={day}
                  control={form.control}
                  name={day}
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

          {/* Operating Dates */}
          <div>
            <p className="text-sm font-semibold text-gray-900 mb-4">Seasonal Dates</p>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* Opening Date */}
              <FormField
                control={form.control}
                name="opening_date"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Next Season Opening Date</FormLabel>
                    <FormControl>
                      <Input type="date" {...field} value={field.value || ''} />
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
                      <Input type="date" {...field} value={field.value || ''} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>
          </div>
        </div>
      </CollapsibleFormSection>

      {/* Section 3: Location Details */}
      <CollapsibleFormSection
        id="location"
        title="Location Details"
        icon="📍"
        description="Address and location information"
        isRequired={true}
        isComplete={isSectionComplete('location')}
        defaultExpanded={false}
      >
        <div className="space-y-4">
          {/* Street Address */}
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

          {/* City & State */}
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

          {/* ZIP Code & Country */}
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
          {(farmData?.latitude || farmData?.longitude) && (
            <div className="bg-gray-50 p-3 rounded-md border border-gray-200">
              <p className="text-sm text-gray-600">
                <span className="font-semibold">Coordinates:</span> {farmData.latitude},{' '}
                {farmData.longitude}
              </p>
              <p className="text-xs text-gray-500 mt-1">
                Contact support to change your farm's location
              </p>
            </div>
          )}
        </div>
      </CollapsibleFormSection>

      {/* Section 4: Categories & Services */}
      <CollapsibleFormSection
        id="categories"
        title="Categories & Services"
        icon="🏷️"
        description="Farm type and service offerings"
        isRequired={false}
        isComplete={isSectionComplete('categories')}
        defaultExpanded={false}
      >
        <div className="space-y-4">
          {/* Categories - Dynamic Multi-Select */}
          <FormField
            control={form.control}
            name="categories"
            render={({ field }) => (
              <FormItem>
                <SmartTagInput
                  fieldName="categories"
                  label="Categories / Type of Farms"
                  description="Select all that apply to your farm"
                  value={field.value || []}
                  onChange={field.onChange}
                  error={form.formState.errors.categories?.message as string | undefined}
                  placeholder="Search categories..."
                  maxTags={10}
                />
              </FormItem>
            )}
          />

          {/* Service Types - Multi-Select */}
          <FormField
            control={form.control}
            name="type"
            render={({ field }) => (
              <FormItem>
                <SmartTagInput
                  fieldName="service_types"
                  label="Service Types"
                  description="Select all service types your farm offers"
                  value={field.value || []}
                  onChange={field.onChange}
                  error={form.formState.errors.type?.message as string | undefined}
                  placeholder="Search service types..."
                  maxTags={8}
                />
              </FormItem>
            )}
          />
        </div>
      </CollapsibleFormSection>

      {/* Section 5: Products & Varieties */}
      <CollapsibleFormSection
        id="products"
        title="Products & Varieties"
        icon="🌾"
        description="Products offered and pricing"
        isRequired={false}
        isComplete={false}
        defaultExpanded={false}
      >
        <div className="space-y-4">
          {/* Varieties - Dynamic Multi-Select */}
          <FormField
            control={form.control}
            name="varieties"
            render={({ field }) => (
              <FormItem>
                <SmartTagInput
                  fieldName="varieties"
                  label="Varieties / Products"
                  description="Select all varieties your farm offers"
                  value={field.value || []}
                  onChange={field.onChange}
                  error={form.formState.errors.varieties?.message as string | undefined}
                  placeholder="Search varieties..."
                  maxTags={20}
                />
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
                  <Input placeholder="e.g., $25 - $75 or $10 per person" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>
      </CollapsibleFormSection>

      {/* Section 6: Amenities & Features */}
      <CollapsibleFormSection
        id="amenities"
        title="Amenities & Features"
        icon="✨"
        description="Available amenities and features"
        isRequired={false}
        isComplete={false}
        defaultExpanded={false}
      >
        <div className="space-y-4">
          {/* Amenities - Dynamic Multi-Select */}
          <FormField
            control={form.control}
            name="amenities"
            render={({ field }) => (
              <FormItem>
                <SmartTagInput
                  fieldName="amenities"
                  label="Amenities"
                  description="Select amenities available at your farm"
                  value={field.value || []}
                  onChange={field.onChange}
                  error={form.formState.errors.amenities?.message as string | undefined}
                  placeholder="Search amenities..."
                  maxTags={15}
                />
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

          {/* Payment Methods - Dynamic Multi-Select */}
          <FormField
            control={form.control}
            name="payment_methods"
            render={({ field }) => (
              <FormItem>
                <SmartTagInput
                  fieldName="payment_methods"
                  label="Payment Methods"
                  description="Select all payment methods you accept"
                  value={field.value || []}
                  onChange={field.onChange}
                  error={form.formState.errors.payment_methods?.message as string | undefined}
                  placeholder="Search payment methods..."
                  maxTags={10}
                />
              </FormItem>
            )}
          />
        </div>
      </CollapsibleFormSection>

      {/* Section 7: Media & Additional Info */}
      <CollapsibleFormSection
        id="media"
        title="Media & Additional Info"
        icon="📸"
        description="Images and additional notes"
        isRequired={false}
        isComplete={false}
        defaultExpanded={false}
      >
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 text-center">
          <p className="text-sm text-blue-800">
            Image management and additional notes coming soon in a future update.
          </p>
        </div>
      </CollapsibleFormSection>

      {/* Submit Buttons */}
      <div className="flex flex-col sm:flex-row gap-3 pt-4 border-t border-gray-200">
        <Button type="submit" disabled={isSaving} className="bg-green-800 hover:bg-green-900">
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
        {farmSlug && (
          <Button variant="outline" asChild>
            <a href={`/farms/${farmSlug}/`} target="_blank" rel="noopener noreferrer">
              <ExternalLink className="mr-2 h-4 w-4" />
              View My Listing
            </a>
          </Button>
        )}
      </div>
    </form>
  );
}
