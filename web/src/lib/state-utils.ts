/**
 * State/Province Utilities
 * 
 * Helper functions for converting between state names, slugs, and codes.
 * Used for breadcrumbs, navigation, and URL generation.
 */

export interface StateInfo {
  name: string
  slug: string
  code: string
  country: 'Canada' | 'United States'
  countryCode: 'CA' | 'US'
  geographicType: 'Province' | 'State'
}

// Complete mapping of state/province names to URL slugs
const STATE_SLUG_MAP: Record<string, string> = {
  // Canada
  'Ontario': 'ontario-farms',
  'Quebec': 'quebec-farms',
  'British Columbia': 'british-columbia-farms',
  'Alberta': 'alberta-farms',
  'Manitoba': 'manitoba-farms',
  'Saskatchewan': 'saskatchewan-farms',
  'Nova Scotia': 'nova-scotia-farms',
  'New Brunswick': 'new-brunswick-farms',
  'Newfoundland and Labrador': 'newfoundland-and-labrador-farms',
  'Prince Edward Island': 'prince-edward-island-farms',
  'Yukon': 'yukon-farms',
  'Northwest Territories': 'northwest-territories-farms',
  'Nunavut': 'nunavut-farms',
  // United States
  'Alabama': 'alabama-farms',
  'Alaska': 'alaska-farms',
  'Arizona': 'arizona-farms',
  'Arkansas': 'arkansas-farms',
  'California': 'california-farms',
  'Colorado': 'colorado-farms',
  'Connecticut': 'connecticut-farms',
  'Delaware': 'delaware-farms',
  'Florida': 'florida-farms',
  'Georgia': 'georgia-farms',
  'Hawaii': 'hawaii-farms',
  'Idaho': 'idaho-farms',
  'Illinois': 'illinois-farms',
  'Indiana': 'indiana-farms',
  'Iowa': 'iowa-farms',
  'Kansas': 'kansas-farms',
  'Kentucky': 'kentucky-farms',
  'Louisiana': 'louisiana-farms',
  'Maine': 'maine-farms',
  'Maryland': 'maryland-farms',
  'Massachusetts': 'massachusetts-farms',
  'Michigan': 'michigan-farms',
  'Minnesota': 'minnesota-farms',
  'Mississippi': 'mississippi-farms',
  'Missouri': 'missouri-farms',
  'Montana': 'montana-farms',
  'Nebraska': 'nebraska-farms',
  'Nevada': 'nevada-farms',
  'New Hampshire': 'new-hampshire-farms',
  'New Jersey': 'new-jersey-farms',
  'New Mexico': 'new-mexico-farms',
  'New York': 'new-york-farms',
  'North Carolina': 'north-carolina-farms',
  'North Dakota': 'north-dakota-farms',
  'Ohio': 'ohio-farms',
  'Oklahoma': 'oklahoma-farms',
  'Oregon': 'oregon-farms',
  'Pennsylvania': 'pennsylvania-farms',
  'Rhode Island': 'rhode-island-farms',
  'South Carolina': 'south-carolina-farms',
  'South Dakota': 'south-dakota-farms',
  'Tennessee': 'tennessee-farms',
  'Texas': 'texas-farms',
  'Utah': 'utah-farms',
  'Vermont': 'vermont-farms',
  'Virginia': 'virginia-farms',
  'Washington': 'washington-farms',
  'West Virginia': 'west-virginia-farms',
  'Wisconsin': 'wisconsin-farms',
  'Wyoming': 'wyoming-farms'
};

// Reverse mapping: slug to name
const SLUG_TO_NAME: Record<string, string> = Object.fromEntries(
  Object.entries(STATE_SLUG_MAP).map(([name, slug]) => [slug, name])
);

// State/Province codes
const STATE_CODES: Record<string, string> = {
  // Canada
  'Ontario': 'ON',
  'Quebec': 'QC',
  'British Columbia': 'BC',
  'Alberta': 'AB',
  'Manitoba': 'MB',
  'Saskatchewan': 'SK',
  'Nova Scotia': 'NS',
  'New Brunswick': 'NB',
  'Newfoundland and Labrador': 'NL',
  'Prince Edward Island': 'PE',
  'Yukon': 'YT',
  'Northwest Territories': 'NT',
  'Nunavut': 'NU',
  // United States
  'Alabama': 'AL',
  'Alaska': 'AK',
  'Arizona': 'AZ',
  'Arkansas': 'AR',
  'California': 'CA',
  'Colorado': 'CO',
  'Connecticut': 'CT',
  'Delaware': 'DE',
  'Florida': 'FL',
  'Georgia': 'GA',
  'Hawaii': 'HI',
  'Idaho': 'ID',
  'Illinois': 'IL',
  'Indiana': 'IN',
  'Iowa': 'IA',
  'Kansas': 'KS',
  'Kentucky': 'KY',
  'Louisiana': 'LA',
  'Maine': 'ME',
  'Maryland': 'MD',
  'Massachusetts': 'MA',
  'Michigan': 'MI',
  'Minnesota': 'MN',
  'Mississippi': 'MS',
  'Missouri': 'MO',
  'Montana': 'MT',
  'Nebraska': 'NE',
  'Nevada': 'NV',
  'New Hampshire': 'NH',
  'New Jersey': 'NJ',
  'New Mexico': 'NM',
  'New York': 'NY',
  'North Carolina': 'NC',
  'North Dakota': 'ND',
  'Ohio': 'OH',
  'Oklahoma': 'OK',
  'Oregon': 'OR',
  'Pennsylvania': 'PA',
  'Rhode Island': 'RI',
  'South Carolina': 'SC',
  'South Dakota': 'SD',
  'Tennessee': 'TN',
  'Texas': 'TX',
  'Utah': 'UT',
  'Vermont': 'VT',
  'Virginia': 'VA',
  'Washington': 'WA',
  'West Virginia': 'WV',
  'Wisconsin': 'WI',
  'Wyoming': 'WY'
};

// Canadian provinces
const CANADIAN_PROVINCES = new Set([
  'Ontario', 'Quebec', 'British Columbia', 'Alberta', 'Manitoba', 'Saskatchewan',
  'Nova Scotia', 'New Brunswick', 'Newfoundland and Labrador', 'Prince Edward Island',
  'Yukon', 'Northwest Territories', 'Nunavut'
]);

/**
 * Normalize state name variations (On, ON, ontario → Ontario)
 */
export function normalizeStateName(state: string): string | null {
  if (!state) return null;
  
  const normalized = state.trim();
  
  // Common variations
  const variations: Record<string, string> = {
    'ON': 'Ontario',
    'On': 'Ontario',
    'ontario': 'Ontario',
    'QC': 'Quebec',
    'Qc': 'Quebec',
    'quebec': 'Quebec',
    'BC': 'British Columbia',
    'Bc': 'British Columbia',
    'british columbia': 'British Columbia',
    'NY': 'New York',
    'new york': 'New York'
  };
  
  return variations[normalized] || normalized;
}

/**
 * Get URL slug for a state/province name
 * @param stateName - Full state/province name (e.g., "Ontario", "California")
 * @returns URL slug (e.g., "ontario-farms") or null if not found
 */
export function getStateSlug(stateName: string): string | null {
  const normalized = normalizeStateName(stateName);
  if (!normalized) return null;
  
  return STATE_SLUG_MAP[normalized] || null;
}

/**
 * Get state/province name from URL slug
 * @param slug - URL slug (e.g., "ontario-farms")
 * @returns State name (e.g., "Ontario") or null if not found
 */
export function getStateName(slug: string): string | null {
  return SLUG_TO_NAME[slug] || null;
}

/**
 * Get state/province code
 * @param stateName - Full state/province name
 * @returns Two-letter code (e.g., "ON", "CA") or null
 */
export function getStateCode(stateName: string): string | null {
  const normalized = normalizeStateName(stateName);
  if (!normalized) return null;
  
  return STATE_CODES[normalized] || null;
}

/**
 * Check if a state/province is in Canada
 */
export function isCanadianProvince(stateName: string): boolean {
  const normalized = normalizeStateName(stateName);
  if (!normalized) return false;
  
  return CANADIAN_PROVINCES.has(normalized);
}

/**
 * Get geographic type (Province or State)
 */
export function getGeographicType(stateName: string): 'Province' | 'State' | null {
  if (isCanadianProvince(stateName)) return 'Province';
  
  const normalized = normalizeStateName(stateName);
  if (normalized && STATE_SLUG_MAP[normalized]) return 'State';
  
  return null;
}

/**
 * Get complete state information
 */
export function getStateInfo(stateName: string): StateInfo | null {
  const normalized = normalizeStateName(stateName);
  if (!normalized) return null;
  
  const slug = STATE_SLUG_MAP[normalized];
  const code = STATE_CODES[normalized];
  
  if (!slug || !code) return null;
  
  const isCanadian = CANADIAN_PROVINCES.has(normalized);
  
  return {
    name: normalized,
    slug: slug,
    code: code,
    country: isCanadian ? 'Canada' : 'United States',
    countryCode: isCanadian ? 'CA' : 'US',
    geographicType: isCanadian ? 'Province' : 'State'
  };
}

/**
 * Get all available states (for navigation/browse pages)
 */
export function getAllStates(): string[] {
  return Object.keys(STATE_SLUG_MAP);
}

/**
 * Get Canadian provinces only
 */
export function getCanadianProvinces(): string[] {
  return Array.from(CANADIAN_PROVINCES);
}

/**
 * Get US states only
 */
export function getUSStates(): string[] {
  return getAllStates().filter(state => !CANADIAN_PROVINCES.has(state));
}
