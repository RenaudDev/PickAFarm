interface Farm {
  id: string;
  name: string;
  slug: string;
  city_name: string;
  state_province: string;
  country: string;
  latitude: number;
  longitude: number;
  phone?: string;
  email?: string;
  website?: string;
  description?: string;
  categories?: string;
  reviews?: number;
  rating?: number;
  subscriber_count?: number;
  street?: string;
  postal_code?: string;
  // Additional fields for enhanced schema
  type?: string;
  monday_hours?: string;
  tuesday_hours?: string;
  wednesday_hours?: string;
  thursday_hours?: string;
  friday_hours?: string;
  saturday_hours?: string;
  sunday_hours?: string;
  facebook?: string;
  instagram?: string;
  logo_url?: string;
  background_url?: string;
  payment_methods?: string;
  amenities?: string;
  varieties?: string;
  price_range?: string;
  opening_date?: string;
  closing_date?: string;
  pet_friendly?: number;
  verified?: number;
}

export function generateFarmsSchema(farms: Farm[], organizationName = 'PickAFarm') {
  const organization = {
    '@context': 'https://schema.org',
    '@type': 'Organization',
    name: organizationName,
    url: 'https://pickafarm.com',
    logo: 'https://pickafarm.com/android-chrome-512x512.png',
    description:
      'Find the best pick-your-own farms, Christmas tree farms, pumpkin patches, and agritourism experiences across Canada.',
    sameAs: ['https://www.facebook.com/PickAFarmCanada', 'https://twitter.com/PickAFarmCA'],
    member: farms.slice(0, 50).map((farm) => {
      const localBusiness: any = {
        '@type': 'LocalBusiness',
        '@id': `https://pickafarm.com/farms/${farm.slug}`,
        name: farm.name,
        url: `https://pickafarm.com/farms/${farm.slug}`,
        address: {
          '@type': 'PostalAddress',
          streetAddress: farm.street || '',
          addressLocality: farm.city_name,
          addressRegion: farm.state_province,
          addressCountry: farm.country || 'CA',
          postalCode: farm.postal_code || '',
        },
        geo: {
          '@type': 'GeoCoordinates',
          latitude: farm.latitude,
          longitude: farm.longitude,
        },
      };

      // Add optional fields
      if (farm.phone) {
        localBusiness.telephone = farm.phone;
      }

      if (farm.email) {
        localBusiness.email = farm.email;
      }

      if (farm.website) {
        localBusiness.url = farm.website;
      }

      if (farm.description) {
        localBusiness.description = farm.description;
      }

      // Add aggregateRating if reviews exist
      if (farm.reviews && farm.reviews > 0 && farm.rating) {
        localBusiness.aggregateRating = {
          '@type': 'AggregateRating',
          ratingValue: farm.rating,
          reviewCount: farm.reviews,
          bestRating: '5',
          worstRating: '1',
        };
      }

      // Add image/logo
      if (farm.logo_url) {
        localBusiness.image = farm.logo_url;
        localBusiness.logo = farm.logo_url;
      }

      // Add price range
      if (farm.price_range) {
        localBusiness.priceRange = farm.price_range;
      }

      // Add opening hours
      const openingHours = buildOpeningHoursSpecification(farm);
      if (openingHours.length > 0) {
        localBusiness.openingHoursSpecification = openingHours;
      }

      // Add social media links
      const sameAs = [];
      if (farm.facebook) sameAs.push(farm.facebook);
      if (farm.instagram) sameAs.push(farm.instagram);
      if (farm.website && farm.website !== localBusiness.url) sameAs.push(farm.website);
      if (sameAs.length > 0) {
        localBusiness.sameAs = sameAs;
      }

      // Add payment methods if available
      if (farm.payment_methods) {
        localBusiness.paymentAccepted = farm.payment_methods;
      }

      // Add amenities as additional property
      if (farm.amenities) {
        localBusiness.amenityFeature = farm.amenities.split(',').map((amenity: string) => ({
          '@type': 'LocationFeatureSpecification',
          name: amenity.trim(),
        }));
      }

      return localBusiness;
    }),
  };

  return organization;
}

/**
 * Helper function to build OpeningHoursSpecification from daily hours
 */
function buildOpeningHoursSpecification(farm: Farm) {
  const daysMap = [
    { day: 'Monday', hours: farm.monday_hours },
    { day: 'Tuesday', hours: farm.tuesday_hours },
    { day: 'Wednesday', hours: farm.wednesday_hours },
    { day: 'Thursday', hours: farm.thursday_hours },
    { day: 'Friday', hours: farm.friday_hours },
    { day: 'Saturday', hours: farm.saturday_hours },
    { day: 'Sunday', hours: farm.sunday_hours },
  ];

  const openingHours = [];

  for (const { day, hours } of daysMap) {
    if (hours && hours.toLowerCase() !== 'closed') {
      // Parse hours like "9:00 AM - 5:00 PM"
      const match = hours.match(/(\d{1,2}:\d{2}\s*(?:AM|PM))\s*-\s*(\d{1,2}:\d{2}\s*(?:AM|PM))/i);
      if (match) {
        openingHours.push({
          '@type': 'OpeningHoursSpecification',
          dayOfWeek: day,
          opens: convertTo24Hour(match[1]),
          closes: convertTo24Hour(match[2]),
        });
      }
    }
  }

  return openingHours;
}

/**
 * Convert 12-hour time to 24-hour format (HH:MM)
 */
function convertTo24Hour(time: string): string {
  const match = time.match(/(\d{1,2}):(\d{2})\s*(AM|PM)/i);
  if (!match) return time;

  let [, hours, minutes, meridiem] = match;
  let hour = parseInt(hours, 10);

  if (meridiem.toUpperCase() === 'PM' && hour !== 12) {
    hour += 12;
  } else if (meridiem.toUpperCase() === 'AM' && hour === 12) {
    hour = 0;
  }

  return `${hour.toString().padStart(2, '0')}:${minutes}`;
}

/**
 * Generate enhanced LocalBusiness schema for individual farm detail page
 */
export function generateFarmDetailSchema(farm: Farm) {
  const schema: any = {
    '@context': 'https://schema.org',
    '@type': 'LocalBusiness',
    '@id': `https://pickafarm.com/farms/${farm.slug}/`,
    name: farm.name,
    url: `https://pickafarm.com/farms/${farm.slug}/`,
    address: {
      '@type': 'PostalAddress',
      streetAddress: farm.street || '',
      addressLocality: farm.city_name,
      addressRegion: farm.state_province,
      addressCountry: farm.country || 'US',
      postalCode: farm.postal_code || '',
    },
    geo: {
      '@type': 'GeoCoordinates',
      latitude: farm.latitude,
      longitude: farm.longitude,
    },
  };

  // Add all optional fields
  if (farm.phone) schema.telephone = farm.phone;
  if (farm.email) schema.email = farm.email;
  if (farm.website) schema.url = farm.website;
  if (farm.description) schema.description = farm.description;

  // Add logo/image - use logo as primary image for business listings
  if (farm.logo_url) {
    schema.image = farm.logo_url;
    schema.logo = farm.logo_url;
  }

  // Add rating
  if (farm.reviews && farm.reviews > 0 && farm.rating) {
    schema.aggregateRating = {
      '@type': 'AggregateRating',
      ratingValue: farm.rating,
      reviewCount: farm.reviews,
      bestRating: '5',
      worstRating: '1',
    };
  }

  // Add subscriber count as interaction statistic
  if (farm.subscriber_count !== undefined && farm.subscriber_count > 0) {
    schema.interactionStatistic = {
      '@type': 'InteractionCounter',
      interactionType: 'https://schema.org/FollowAction',
      userInteractionCount: farm.subscriber_count,
    };
  }

  // Add price range
  if (farm.price_range) {
    schema.priceRange = farm.price_range;
  } else {
    // Default price range for U-Pick farms
    schema.priceRange = '$';
  }

  // Add opening hours
  const openingHours = buildOpeningHoursSpecification(farm);
  if (openingHours.length > 0) {
    schema.openingHoursSpecification = openingHours;
  }

  // Add social media
  const sameAs = [];
  if (farm.facebook) sameAs.push(farm.facebook);
  if (farm.instagram) sameAs.push(farm.instagram);
  if (farm.website && farm.website !== schema.url) sameAs.push(farm.website);
  if (sameAs.length > 0) {
    schema.sameAs = sameAs;
  }

  // Add payment methods
  if (farm.payment_methods) {
    schema.paymentAccepted = farm.payment_methods;
  }

  // Add amenities
  if (farm.amenities) {
    schema.amenityFeature = farm.amenities.split(',').map((amenity: string) => ({
      '@type': 'LocationFeatureSpecification',
      name: amenity.trim(),
    }));
  }

  // Add varieties as makesOffer
  if (farm.varieties) {
    schema.makesOffer = farm.varieties.split(',').map((variety: string) => ({
      '@type': 'Offer',
      itemOffered: {
        '@type': 'Product',
        name: variety.trim(),
      },
    }));
  }

  // Add additional properties
  const additionalProperties = [];

  if (farm.pet_friendly === 1) {
    additionalProperties.push({
      '@type': 'PropertyValue',
      name: 'Pet Friendly',
      value: 'Yes',
    });
  }

  if (farm.verified === 1) {
    additionalProperties.push({
      '@type': 'PropertyValue',
      name: 'Verified',
      value: 'Owner Verified',
    });
  }

  if (farm.opening_date) {
    additionalProperties.push({
      '@type': 'PropertyValue',
      name: 'Opening Date',
      value: farm.opening_date,
    });
  }

  if (farm.closing_date) {
    additionalProperties.push({
      '@type': 'PropertyValue',
      name: 'Closing Date',
      value: farm.closing_date,
    });
  }

  if (additionalProperties.length > 0) {
    schema.additionalProperty = additionalProperties;
  }

  return schema;
}
