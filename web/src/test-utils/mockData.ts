import type { FarmData, ApiFarmData, CategoryData, LocationData } from '@/lib/schema';

/**
 * Mock factory for FarmData
 */
export const mockFarmData = (overrides?: Partial<FarmData>): FarmData => ({
  id: '12345',
  name: 'Mock Farm',
  slug: 'mock-farm',
  url: 'https://pickafarm.com/farms/mock-farm',
  street: '123 Farm Road',
  city: 'Montreal',
  province: 'QC',
  country: 'CA',
  postal_code: 'H1A 1A1',
  latitude: 45.5017,
  longitude: -73.5673,
  phone: '514-555-1234',
  image_url: 'https://example.com/farm-image.jpg',
  categories: 'Pick Your Own Apples, Pumpkin Patch',
  featured: 0,
  distance_km: 5.2,
  logo_url: undefined,
  background_url: undefined,
  logo_updated_at: undefined,
  background_updated_at: undefined,
  ...overrides,
});

/**
 * Mock factory for ApiFarmData
 */
export const mockApiFarmData = (overrides?: Partial<ApiFarmData>): ApiFarmData => ({
  id: '12345',
  name: 'Mock Farm',
  slug: 'mock-farm',
  url: 'https://pickafarm.com/farms/mock-farm',
  latitude: 45.5017,
  longitude: -73.5673,
  city: 'Montreal',
  province: 'QC',
  country: 'CA',
  categories: 'Pick Your Own Apples, Pumpkin Patch',
  featured: false,
  distance_km: 5.2,
  street: '123 Farm Road',
  postal_code: 'H1A 1A1',
  phone: '514-555-1234',
  image_url: 'https://example.com/farm-image.jpg',
  logo_url: undefined,
  background_url: undefined,
  logo_updated_at: undefined,
  background_updated_at: undefined,
  ...overrides,
});

/**
 * Mock factory for CategoryData
 */
export const mockCategoryData = (overrides?: Partial<CategoryData>): CategoryData => ({
  name: 'Pick Your Own Apples',
  slug: 'pick-your-own-apples',
  ...overrides,
});

/**
 * Mock factory for LocationData
 */
export const mockLocationData = (overrides?: Partial<LocationData>): LocationData => ({
  name: 'Montreal',
  province: 'QC',
  location_slug: 'montreal-qc-ca',
  farms: [],
  full_location: 'Montreal, QC, CA',
  ...overrides,
});

/**
 * Creates an array of mock farms for testing lists
 */
export const mockFarmList = (count: number, overrides?: Partial<FarmData>[]): FarmData[] => {
  return Array.from({ length: count }, (_, index) => {
    const baseData = mockFarmData({
      id: `farm-${index + 1}`,
      name: `Mock Farm ${index + 1}`,
      slug: `mock-farm-${index + 1}`,
    });

    if (overrides && overrides[index]) {
      return { ...baseData, ...overrides[index] };
    }

    return baseData;
  });
};
