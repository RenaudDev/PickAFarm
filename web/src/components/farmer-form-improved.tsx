'use client';

import React, { useState } from 'react';
import { UseFormReturn } from 'react-hook-form';
import { FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Checkbox } from '@/components/ui/checkbox';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { SmartTagInput } from '@/components/forms/SmartTagInput';
import { toast } from 'sonner';
import { Loader2, CheckCircle } from 'lucide-react';

/**
 * Farmer Form Component - Card-Based Layout
 *
 * Matches v0.tsx mockup design with clean Card sections.
 * Features:
 * - 6 card-based sections
 * - Always visible (no collapse)
 * - Clean white cards on default background
 * - Mobile-responsive grid layouts
 */

interface FarmerFormImprovedProps {
  form: UseFormReturn<any>;
  onSubmit: (data: any) => Promise<void>;
  isSaving?: boolean;
  farmData?: any;
}

export function FarmerFormImproved({
  form,
  onSubmit,
  isSaving = false,
  farmData,
}: FarmerFormImprovedProps) {
  const [savingSection, setSavingSection] = useState<string | null>(null);

  // Watch form values to trigger badge updates
  const formValues = form.watch();

  // Section-specific save handlers
  const handleSaveSection = async (sectionName: string, fields: string[]) => {
    setSavingSection(sectionName);
    try {
      const formData = form.getValues();
      const sectionData: any = {};
      
      // Extract only fields for this section
      fields.forEach(field => {
        if (formData[field] !== undefined) {
          sectionData[field] = formData[field];
        }
      });

      // Validate section fields
      const isValid = await form.trigger(fields as any);
      if (!isValid) {
        toast.error(`Please fix errors in ${sectionName} before saving`);
        return;
      }

      // Save section data
      await onSubmit(sectionData);
      toast.success(`${sectionName} saved successfully!`);
    } catch (error) {
      toast.error(`Failed to save ${sectionName}`);
    } finally {
      setSavingSection(null);
    }
  };

  // Check section completion status
  const checkSectionCompletion = (sectionName: string): boolean => {
    // Use watched form values for reactive updates
    const formData = formValues;
    
    switch (sectionName) {
      case 'Basic Information':
        return !!(formData.name && formData.description && formData.description.length >= 10);
      case 'Contact Information':
        return !!(formData.phone || formData.email || formData.website);
      case 'Operating Hours':
        return !!(formData.monday_hours || formData.tuesday_hours || formData.wednesday_hours ||
                  formData.thursday_hours || formData.friday_hours || formData.saturday_hours || formData.sunday_hours);
      case 'Location':
        return !!(formData.street && formData.city && formData.state && formData.postal_code);
      case 'Products & Activities':
        return !!((Array.isArray(formData.categories) && formData.categories.length > 0) ||
                  (Array.isArray(formData.varieties) && formData.varieties.length > 0));
      case 'Amenities & Accessibility':
        return !!(Array.isArray(formData.amenities) && formData.amenities.length > 0);
      default:
        return false;
    }
  };

  return (
    <form id="farm-form" onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
      
      {/* Section 1: Basic Information */}
      <Card id="section-basic-info" className="bg-green-50 scroll-mt-8">
        <CardHeader>
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
            <div>
              <CardTitle className="text-xl">Basic Information</CardTitle>
              <CardDescription>Tell visitors about your farm</CardDescription>
            </div>
            {checkSectionCompletion('Basic Information') && (
              <Badge variant="default" className="bg-green-600 text-white flex items-center gap-1 w-fit">
                <CheckCircle className="w-3 h-3" />
                Completed
              </Badge>
            )}
          </div>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Farm Name */}
          <FormField
            control={form.control}
            name="name"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Farm Name *</FormLabel>
                <FormControl>
                  <Input placeholder="Green Valley Farm" {...field} />
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
                <FormLabel>Farm Description</FormLabel>
                <FormControl>
                  <Textarea
                    placeholder="Tell visitors what makes your farm special..."
                    className="resize-none"
                    rows={5}
                    {...field}
                  />
                </FormControl>
                <p className="text-xs text-muted-foreground mt-1">
                  A compelling description increases visitor interest by 60%
                </p>
                <FormMessage />
              </FormItem>
            )}
          />
        </CardContent>
        <div className="px-6 pb-6 pt-0 flex justify-end border-t border-gray-200 mt-6">
          <Button
            type="button"
            variant="default"
            size="sm"
            onClick={() => handleSaveSection('Basic Information', ['name', 'description'])}
            disabled={savingSection === 'Basic Information' || isSaving}
            className="bg-primary hover:bg-primary/90 text-white"
          >
            {savingSection === 'Basic Information' ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Saving...
              </>
            ) : (
              'Save Section'
            )}
          </Button>
        </div>
      </Card>

      {/* Section 2: Contact Information */}
      <Card id="section-contact" className="bg-green-50 scroll-mt-8">
        <CardHeader>
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
            <div>
              <CardTitle className="text-xl">Contact Information</CardTitle>
              <CardDescription>How visitors can reach you</CardDescription>
            </div>
            {checkSectionCompletion('Contact Information') && (
              <Badge variant="default" className="bg-green-600 text-white flex items-center gap-1 w-fit">
                <CheckCircle className="w-3 h-3" />
                Completed
              </Badge>
            )}
          </div>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Phone */}
            <FormField
              control={form.control}
              name="phone"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Phone Number</FormLabel>
                  <FormControl>
                    <Input placeholder="(555) 123-4567" type="tel" {...field} />
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
                  <FormLabel>Email Address</FormLabel>
                  <FormControl>
                    <Input placeholder="info@greenvaleyfarm.com" type="email" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
          </div>

          {/* Website */}
          <FormField
            control={form.control}
            name="website"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Website</FormLabel>
                <FormControl>
                  <Input placeholder="https://greenvaleyfarm.com" type="url" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
        </CardContent>
        <div className="px-6 pb-6 pt-0 flex justify-end border-t border-gray-200 mt-6">
          <Button
            type="button"
            variant="default"
            size="sm"
            onClick={() => handleSaveSection('Contact Information', ['phone', 'email', 'website'])}
            disabled={savingSection === 'Contact Information' || isSaving}
            className="bg-primary hover:bg-primary/90 text-white"
          >
            {savingSection === 'Contact Information' ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Saving...
              </>
            ) : (
              'Save Section'
            )}
          </Button>
        </div>
      </Card>
      <Card id="section-hours" className="bg-green-50 scroll-mt-8">
        <CardHeader>
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
            <div>
              <CardTitle className="text-xl">Operating Hours</CardTitle>
              <CardDescription>When visitors can visit your farm</CardDescription>
            </div>
            {checkSectionCompletion('Operating Hours') && (
              <Badge variant="default" className="bg-green-600 text-white flex items-center gap-1 w-fit">
                <CheckCircle className="w-3 h-3" />
                Completed
              </Badge>
            )}
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          <p className="text-sm text-muted-foreground">
            Enter hours for each day (e.g., "9:00 AM - 5:00 PM" or "Closed")
          </p>

          <div className="space-y-3">
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
                  <FormItem className="flex flex-col sm:flex-row sm:items-center gap-3">
                    <div className="w-full sm:w-24">
                      <FormLabel className="text-sm font-medium">{label}</FormLabel>
                    </div>
                    <div className="flex-1">
                      <FormControl>
                        <Input
                          placeholder="9:00 AM - 5:00 PM"
                          {...field}
                          value={(field.value as string) || ''}
                        />
                      </FormControl>
                    </div>
                    <FormMessage />
                  </FormItem>
                )}
              />
            ))}
          </div>

          {/* Seasonal Dates */}
          <div className="pt-4 border-t">
            <p className="text-sm font-semibold text-gray-900 mb-4">Seasonal Dates (Optional)</p>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <FormField
                control={form.control}
                name="opening_date"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Season Opening Date</FormLabel>
                    <FormControl>
                      <Input type="date" {...field} value={field.value || ''} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="closing_date"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Season Closing Date</FormLabel>
                    <FormControl>
                      <Input type="date" {...field} value={field.value || ''} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>
          </div>
        </CardContent>
        <div className="px-6 pb-6 pt-0 flex justify-end border-t border-gray-200 mt-6">
          <Button
            type="button"
            variant="default"
            size="sm"
            onClick={() => handleSaveSection('Operating Hours', [
              'monday_hours', 'tuesday_hours', 'wednesday_hours', 'thursday_hours',
              'friday_hours', 'saturday_hours', 'sunday_hours', 'opening_date', 'closing_date'
            ])}
            disabled={savingSection === 'Operating Hours' || isSaving}
            className="bg-primary hover:bg-primary/90 text-white"
          >
            {savingSection === 'Operating Hours' ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Saving...
              </>
            ) : (
              'Save Section'
            )}
          </Button>
        </div>
      </Card>

      {/* Section 4: Location */}
      <Card id="section-location" className="bg-green-50 scroll-mt-8">
        <CardHeader>
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
            <div>
              <CardTitle className="text-xl">Location</CardTitle>
              <CardDescription>Help visitors find you</CardDescription>
            </div>
            {checkSectionCompletion('Location') && (
              <Badge variant="default" className="bg-green-600 text-white flex items-center gap-1 w-fit">
                <CheckCircle className="w-3 h-3" />
                Completed
              </Badge>
            )}
          </div>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Street Address */}
          <FormField
            control={form.control}
            name="street"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Street Address</FormLabel>
                <FormControl>
                  <Input placeholder="123 Farm Road" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          {/* City, State, ZIP */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <FormField
              control={form.control}
              name="city"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>City</FormLabel>
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
                  <FormLabel>State</FormLabel>
                  <FormControl>
                    <Input placeholder="CA" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

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
          </div>

          {/* Country */}
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

          {/* Coordinates (Read-only) */}
          {(farmData?.latitude || farmData?.longitude) && (
            <div className="bg-muted/50 p-4 rounded-lg border">
              <p className="text-sm text-muted-foreground">
                <span className="font-semibold text-foreground">Coordinates:</span> {farmData.latitude}, {farmData.longitude}
              </p>
              <p className="text-xs text-muted-foreground mt-1">
                Contact support to change your farm's location
              </p>
            </div>
          )}
        </CardContent>
        <div className="px-6 pb-6 pt-0 flex justify-end border-t border-gray-200 mt-6">
          <Button
            type="button"
            variant="default"
            size="sm"
            onClick={() => handleSaveSection('Location', ['street', 'city', 'state', 'postal_code', 'country'])}
            disabled={savingSection === 'Location' || isSaving}
            className="bg-primary hover:bg-primary/90 text-white"
          >
            {savingSection === 'Location' ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Saving...
              </>
            ) : (
              'Save Section'
            )}
          </Button>
        </div>
      </Card>

      {/* Section 5: Products & Activities */}
      <Card id="section-products" className="bg-green-50 scroll-mt-8">
        <CardHeader>
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
            <div>
              <CardTitle className="text-xl">Products & Activities</CardTitle>
              <CardDescription>What you offer to visitors</CardDescription>
            </div>
            {checkSectionCompletion('Products & Activities') && (
              <Badge variant="default" className="bg-green-600 text-white flex items-center gap-1 w-fit">
                <CheckCircle className="w-3 h-3" />
                Completed
              </Badge>
            )}
          </div>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Categories */}
          <FormField
            control={form.control}
            name="categories"
            render={({ field }) => (
              <FormItem>
                <SmartTagInput
                  fieldName="categories"
                  label="Farm Categories"
                  value={field.value || []}
                  onChange={field.onChange}
                  error={form.formState.errors.categories?.message as string | undefined}
                  placeholder="Search categories..."
                  maxTags={10}
                />
                <p className="text-xs text-muted-foreground mt-1">
                  Select all categories that apply to your farm
                </p>
              </FormItem>
            )}
          />

          {/* Service Types */}
          <FormField
            control={form.control}
            name="type"
            render={({ field }) => (
              <FormItem>
                <SmartTagInput
                  fieldName="service_types"
                  label="Service Types"
                  value={field.value || []}
                  onChange={field.onChange}
                  error={form.formState.errors.type?.message as string | undefined}
                  placeholder="Search service types..."
                  maxTags={8}
                />
                <p className="text-xs text-muted-foreground mt-1">
                  What services do you offer? (e.g., U-Pick, Farm Tours, Workshops)
                </p>
              </FormItem>
            )}
          />

          {/* Varieties */}
          <FormField
            control={form.control}
            name="varieties"
            render={({ field }) => (
              <FormItem>
                <SmartTagInput
                  fieldName="varieties"
                  label="Products & Varieties"
                  value={field.value || []}
                  onChange={field.onChange}
                  error={form.formState.errors.varieties?.message as string | undefined}
                  placeholder="Search varieties..."
                  maxTags={20}
                />
                <p className="text-xs text-muted-foreground mt-1">
                  What products do you grow or sell?
                </p>
              </FormItem>
            )}
          />

          {/* Price Range */}
          <FormField
            control={form.control}
            name="price_range"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Price Range (Optional)</FormLabel>
                <FormControl>
                  <Input placeholder="e.g., $25 - $75 or $10 per person" {...field} />
                </FormControl>
                <p className="text-xs text-muted-foreground mt-1">
                  Help visitors understand your pricing
                </p>
                <FormMessage />
              </FormItem>
            )}
          />
        </CardContent>
        <div className="px-6 pb-6 pt-0 flex justify-end border-t border-gray-200 mt-6">
          <Button
            type="button"
            variant="default"
            size="sm"
            onClick={() => handleSaveSection('Products & Activities', ['categories', 'type', 'varieties', 'price_range'])}
            disabled={savingSection === 'Products & Activities' || isSaving}
            className="bg-primary hover:bg-primary/90 text-white"
          >
            {savingSection === 'Products & Activities' ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Saving...
              </>
            ) : (
              'Save Section'
            )}
          </Button>
        </div>
      </Card>

      {/* Section 6: Amenities & Accessibility */}
      <Card id="section-amenities" className="bg-green-50 scroll-mt-8">
        <CardHeader>
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
            <div>
              <CardTitle className="text-xl">Amenities & Accessibility</CardTitle>
              <CardDescription>Facilities available at your farm</CardDescription>
            </div>
            {checkSectionCompletion('Amenities & Accessibility') && (
              <Badge variant="default" className="bg-green-600 text-white flex items-center gap-1 w-fit">
                <CheckCircle className="w-3 h-3" />
                Completed
              </Badge>
            )}
          </div>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Amenities */}
          <FormField
            control={form.control}
            name="amenities"
            render={({ field }) => (
              <FormItem>
                <SmartTagInput
                  fieldName="amenities"
                  label="Amenities"
                  value={field.value || []}
                  onChange={field.onChange}
                  error={form.formState.errors.amenities?.message as string | undefined}
                  placeholder="Search amenities..."
                  maxTags={15}
                />
                <p className="text-xs text-muted-foreground mt-1">
                  Select amenities available (e.g., Parking, Restrooms, Wheelchair Accessible)
                </p>
              </FormItem>
            )}
          />

          {/* Pet Friendly */}
          <FormField
            control={form.control}
            name="pet_friendly"
            render={({ field }) => (
              <FormItem className="flex flex-row items-start space-x-3 space-y-0">
                <FormControl>
                  <Checkbox
                    checked={field.value ?? false}
                    onCheckedChange={field.onChange}
                  />
                </FormControl>
                <div className="space-y-1 leading-none">
                  <FormLabel className="cursor-pointer">
                    Pet Friendly
                  </FormLabel>
                  <p className="text-xs text-muted-foreground">
                    Are pets allowed on your premises?
                  </p>
                </div>
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
                <SmartTagInput
                  fieldName="payment_methods"
                  label="Payment Methods"
                  value={field.value || []}
                  onChange={field.onChange}
                  error={form.formState.errors.payment_methods?.message as string | undefined}
                  placeholder="Search payment methods..."
                  maxTags={10}
                />
                <p className="text-xs text-muted-foreground mt-1">
                  What payment methods do you accept?
                </p>
              </FormItem>
            )}
          />
        </CardContent>
        <div className="px-6 pb-6 pt-0 flex justify-end border-t border-gray-200 mt-6">
          <Button
            type="button"
            variant="default"
            size="sm"
            onClick={() => handleSaveSection('Amenities & Accessibility', ['amenities', 'pet_friendly', 'payment_methods'])}
            disabled={savingSection === 'Amenities & Accessibility' || isSaving}
            className="bg-primary hover:bg-primary/90 text-white"
          >
            {savingSection === 'Amenities & Accessibility' ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Saving...
              </>
            ) : (
              'Save Section'
            )}
          </Button>
        </div>
      </Card>
      <div className="flex justify-end gap-3 pt-4">
        <Button 
          variant="outline" 
          size="lg" 
          type="button"
          onClick={() => window.history.back()}
        >
          Cancel
        </Button>
        <Button 
          size="lg" 
          type="submit" 
          disabled={isSaving}
        >
          {isSaving ? 'Saving...' : 'Save Changes'}
        </Button>
      </div>
    </form>
  );
}
