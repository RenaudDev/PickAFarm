import { WithContext, Organization, BreadcrumbList, CollectionPage, LocalBusiness } from 'schema-dts';

const BASE_URL = 'https://pickafarm.com';

// TypeScript interfaces for better type safety
interface FarmData {
  id: string;
  name: string;
  slug: string;
  url: string;            // Required to match SearchResultsContent
  street?: string;
  city: string;
  province: string;
  country?: string;
  postal_code?: string;
  latitude?: number;
  longitude?: number;
  phone?: string;
  image_url?: string;
  categories?: string;
  featured?: number;      // Number to match SearchResultsContent
  distance_km?: number;
}

// Type for raw farm data from API (with boolean featured)
interface ApiFarmData {
  id: string;
  name: string;
  slug: string;
  url: string;
  latitude?: number;
  longitude?: number;
  city: string;
  province: string;
  country?: string;
  categories?: string;
  featured?: boolean;     // Boolean from API
  distance_km?: number;
  street?: string;
  postal_code?: string;
  phone?: string;
  image_url?: string;
}

interface CategoryData {
  name: string;
  slug: string;
}

interface LocationData {
  name: string;
  province: string;
  location_slug: string;
  farms?: ApiFarmData[];  // Use API farm type
  full_location?: string;
}

/**
 * Generates the base Organization schema for PickAFarm.
 */
export function generateOrganizationSchema(): Organization {
  return {
    '@type': 'Organization',
    name: 'PickAFarm',
    url: BASE_URL,
    logo: `${BASE_URL}/android-chrome-192x192.png`,
    sameAs: [
      'https://www.facebook.com/pickafarm/',
      'https://www.instagram.com/pickafarm',
    ],
  };
}

/**
 * Generates a BreadcrumbList schema.
 * @param items - An array of breadcrumb items with name and optional item URL.
 */
export function generateBreadcrumbSchema(items: { name: string; item?: string }[]): WithContext<BreadcrumbList> {
  return {
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList',
    itemListElement: items.map((item, index) => ({
      '@type': 'ListItem',
      position: index + 1,
      name: item.name,
      ...(item.item && { item: item.item }),
    })),
  };
}

/**
 * Validates and sanitizes farm data for schema generation
 */
function validateFarmData(farm: FarmData): boolean {
  return !!(farm.name && farm.slug && farm.city && farm.province && farm.url);
}

/**
 * Converts ApiFarmData to FarmData
 */
function convertFarmData(farm: ApiFarmData): FarmData {
  return {
    ...farm,
    featured: farm.featured ? 1 : 0,
  };
}

/**
 * Generates a full CollectionPage schema for category + location pages.
 */
export function generateCollectionPageSchema(
  farms: FarmData[],
  categoryData: CategoryData,
  locationData: LocationData
): WithContext<CollectionPage> {
  // Validate input data
  if (!categoryData?.name || !locationData?.name) {
    throw new Error('Invalid category or location data for schema generation');
  }

  // Filter out farms with invalid data
  const validFarms = farms.filter(validateFarmData);
  
  const organization = generateOrganizationSchema();
  const url = `${BASE_URL}/${categoryData.slug}/near/${locationData.location_slug}`;

  const breadcrumbItems = [
    { name: 'Home', item: BASE_URL },
    { name: categoryData.name, item: `${BASE_URL}/${categoryData.slug}` },
    { name: `Near ${locationData.name}, ${locationData.province}` },
  ];

  return {
    '@context': 'https://schema.org',
    '@type': 'CollectionPage',
    name: `${categoryData.name} Near ${locationData.name}, ${locationData.province}`,
    description: `Find the best ${categoryData.name.toLowerCase()} near ${locationData.name}, ${locationData.province}. View hours, amenities, and contact information for ${validFarms.length} local farms.`,
    url: url,
    publisher: organization,
    mainEntity: {
      '@type': 'ItemList',
      numberOfItems: validFarms.length,
      itemListElement: validFarms.map((farm, index) => ({
        '@type': 'ListItem',
        position: index + 1,
        item: {
          '@type': 'LocalBusiness',
          name: farm.name,
          url: `${BASE_URL}/farms/${farm.slug}`,
          ...(farm.street && {
            address: {
              '@type': 'PostalAddress',
              streetAddress: farm.street,
              addressLocality: farm.city,
              addressRegion: farm.province,
              ...(farm.postal_code && { postalCode: farm.postal_code }),
              addressCountry: 'CA',
            },
          }),
          ...(farm.latitude && farm.longitude && {
            geo: {
              '@type': 'GeoCoordinates',
              latitude: farm.latitude,
              longitude: farm.longitude,
            },
          }),
          ...(farm.phone && { telephone: farm.phone }),
          image: farm.image_url || `${BASE_URL}/android-chrome-512x512.png`,
        } as LocalBusiness,
      })),
    },
    breadcrumb: generateBreadcrumbSchema(breadcrumbItems),
  };
}

/**
 * Generates a CollectionPage schema for city pages showing all farms near a location.
 */
export function generateCityPageSchema(
  farms: FarmData[],
  locationData: LocationData
): WithContext<CollectionPage> {
  // Validate input data
  if (!locationData?.name) {
    throw new Error('Invalid location data for city page schema generation');
  }

  // Filter out farms with invalid data
  const validFarms = farms.filter(validateFarmData);
  
  const organization = generateOrganizationSchema();
  const url = `${BASE_URL}/farms-near/${locationData.location_slug}`;

  const breadcrumbItems = [
    { name: 'Home', item: BASE_URL },
    { name: `All Farms Near ${locationData.name}, ${locationData.province}` },
  ];

  return {
    '@context': 'https://schema.org',
    '@type': 'CollectionPage',
    name: `All Farms Near ${locationData.name}, ${locationData.province}`,
    description: `Discover ${validFarms.length} local farms near ${locationData.name}, ${locationData.province}. Find pick-your-own farms, Christmas tree farms, and more for family fun and fresh produce.`,
    url: url,
    publisher: organization,
    mainEntity: {
      '@type': 'ItemList',
      numberOfItems: validFarms.length,
      itemListElement: validFarms.map((farm, index) => ({
        '@type': 'ListItem',
        position: index + 1,
        item: {
          '@type': 'LocalBusiness',
          name: farm.name,
          url: `${BASE_URL}/farms/${farm.slug}`,
          ...(farm.street && {
            address: {
              '@type': 'PostalAddress',
              streetAddress: farm.street,
              addressLocality: farm.city,
              addressRegion: farm.province,
              ...(farm.postal_code && { postalCode: farm.postal_code }),
              addressCountry: 'CA',
            },
          }),
          ...(farm.latitude && farm.longitude && {
            geo: {
              '@type': 'GeoCoordinates',
              latitude: farm.latitude,
              longitude: farm.longitude,
            },
          }),
          ...(farm.phone && { telephone: farm.phone }),
          image: farm.image_url || `${BASE_URL}/android-chrome-512x512.png`,
        } as LocalBusiness,
      })),
    },
    breadcrumb: generateBreadcrumbSchema(breadcrumbItems),
  };
}

// Export types for use in other files
export type { FarmData, ApiFarmData, CategoryData, LocationData };
