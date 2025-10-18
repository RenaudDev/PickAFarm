-- Cleanup Field Options - Remove duplicates, typos, and corrupt data
-- This script consolidates similar options and removes corrupted entries

-- 1. REMOVE CORRUPTED/INVALID VALUES
DELETE FROM farm_field_option_usage
WHERE field_name = 'amenities' AND option_value IN (
  'Credit/',           -- Truncated value
  'Accepts Accepts Parking',  -- Data corruption (duplicate word)
  'FreeRefreshments',  -- Missing space, suspicious
  'UNKNOWN',           -- Placeholder
  'Payment Options',   -- Too vague
  'Activities'         -- Too vague
);

DELETE FROM farm_field_options
WHERE field_name = 'amenities' AND option_value IN (
  'Credit/',
  'Accepts Accepts Parking',
  'FreeRefreshments',
  'UNKNOWN',
  'Payment Options',
  'Activities'
);

-- 2. CONSOLIDATE CASE-SENSITIVE DUPLICATES (amenities)
-- Lowercase variants → Proper case

-- Tree operations - standardize
UPDATE farm_field_option_usage
SET option_value = 'Tree Baling'
WHERE field_name = 'amenities' AND option_value = 'Tree baling';

UPDATE farm_field_option_usage
SET option_value = 'Tree Netting'
WHERE field_name = 'amenities' AND option_value = 'Tree netting';

UPDATE farm_field_option_usage
SET option_value = 'Tree Shaking'
WHERE field_name = 'amenities' AND option_value = 'Tree shaking';

-- Wheelchair accessibility - consolidate all to 'Wheelchair Accessible'
UPDATE farm_field_option_usage
SET option_value = 'Wheelchair Accessible'
WHERE field_name = 'amenities' AND option_value IN (
  'Wheelchair accessibility',
  'Wheelchair accessible',
  'Wheelchair accessible entrance',
  'Wheelchair Accessible Entrance',
  'Wheelchair accessible parking',
  'Wheelchair Accessible Parking',
  'Wheelchair accessible parking lot',
  'Wheelchair Accessible Parking Lot',
  'Wheelchair accessible restroom',
  'Wheelchair Accessible Restroom',
  'Wheelchair accessible seating',
  'Wheelchair Accessible Seating',
  'Wheelchair Access',
  'Wheelchair Accessibility'
);

-- Parking - consolidate variants
UPDATE farm_field_option_usage
SET option_value = 'Free Parking'
WHERE field_name = 'amenities' AND option_value = 'Free parking';

UPDATE farm_field_option_usage
SET option_value = 'Free Parking'
WHERE field_name = 'amenities' AND option_value = 'On-site parking';

-- Campfires - consolidate similar terms
UPDATE farm_field_option_usage
SET option_value = 'Bonfire'
WHERE field_name = 'amenities' AND option_value IN (
  'Camp Fire',
  'Campfires',
  'Fire Pit/Bonfire',
  'Fire Pit/Bonfires',
  'Firepit'
);

-- Picnic - consolidate variants
UPDATE farm_field_option_usage
SET option_value = 'Picnic Area'
WHERE field_name = 'amenities' AND option_value IN (
  'Picnic Areas',
  'Picnic Tables'
);

-- Photography
UPDATE farm_field_option_usage
SET option_value = 'Photography'
WHERE field_name = 'amenities' AND option_value = 'Photography Allowed';

-- Play areas
UPDATE farm_field_option_usage
SET option_value = 'Play Area'
WHERE field_name = 'amenities' AND option_value = 'Kids Play Area';

-- Remove duplicate amenities entries after consolidation
DELETE FROM farm_field_options
WHERE field_name = 'amenities' AND option_value IN (
  'Wheelchair accessibility',
  'Wheelchair accessible',
  'Wheelchair accessible entrance',
  'Wheelchair Accessible Entrance',
  'Wheelchair accessible parking',
  'Wheelchair Accessible Parking',
  'Wheelchair accessible parking lot',
  'Wheelchair Accessible Parking Lot',
  'Wheelchair accessible restroom',
  'Wheelchair Accessible Restroom',
  'Wheelchair accessible seating',
  'Wheelchair Accessible Seating',
  'Wheelchair Access',
  'Wheelchair Accessibility',
  'Free parking',
  'On-site parking',
  'Camp Fire',
  'Campfires',
  'Fire Pit/Bonfire',
  'Fire Pit/Bonfires',
  'Firepit',
  'Picnic Areas',
  'Picnic Tables',
  'Photography Allowed',
  'Kids Play Area'
);

-- 3. CONSOLIDATE PAYMENT METHODS DUPLICATES

-- Payment methods - case normalization
UPDATE farm_field_option_usage
SET option_value = 'Credit Card'
WHERE field_name = 'payment_methods' AND option_value = 'Credit cards';

UPDATE farm_field_option_usage
SET option_value = 'Debit Card'
WHERE field_name = 'payment_methods' AND option_value = 'Debit cards';

UPDATE farm_field_option_usage
SET option_value = 'Checks'
WHERE field_name = 'payment_methods' AND option_value = 'Cheque';

-- Remove duplicate payment method options
DELETE FROM farm_field_options
WHERE field_name = 'payment_methods' AND option_value IN (
  'Credit cards',
  'Debit cards',
  'Cheque',
  'Cash-only'  -- Too informal, use 'Cash'
);

-- Remove cross-contaminated payment options from amenities field
DELETE FROM farm_field_option_usage
WHERE field_name = 'amenities' AND option_value IN (
  'Credit Card Payment',
  'Debit Card Payment',
  'Debit Card Payments',
  'Credit Card/Debit Card Payments',
  'NFC mobile payments',
  'SNAP/EBT'
);

DELETE FROM farm_field_options
WHERE field_name = 'amenities' AND option_value IN (
  'Credit Card Payment',
  'Debit Card Payment',
  'Debit Card Payments',
  'Credit Card/Debit Card Payments',
  'NFC mobile payments',
  'SNAP/EBT'
);

-- Remove SNAP/EBT from payment_methods too (should be separate field)
DELETE FROM farm_field_option_usage
WHERE field_name = 'payment_methods' AND option_value = 'SNAP/EBT';

DELETE FROM farm_field_options
WHERE field_name = 'payment_methods' AND option_value = 'SNAP/EBT';

-- 4. UPDATE SORT ORDER FOR DISPLAY
UPDATE farm_field_options
SET sort_order = 1
WHERE field_name = 'amenities' AND option_value IN (
  'Restrooms', 'Parking', 'Wheelchair Accessible', 'Picnic Area'
);

UPDATE farm_field_options
SET sort_order = 1
WHERE field_name = 'payment_methods' AND option_value IN (
  'Cash', 'Credit Card', 'Debit Card', 'Checks'
);
