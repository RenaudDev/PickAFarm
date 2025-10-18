-- Verify Amenities Cleanup - Phase 1, 2, 3 Status Report

-- 1. Total canonical amenities in database
SELECT
  'Total Canonical Amenities' as metric,
  COUNT(*) as value
FROM farm_field_options
WHERE field_name = 'amenities';

-- 2. Amenities with usage counts (ordered by popularity)
SELECT
  'AMENITIES WITH USAGE' as section,
  ffo.option_value,
  COUNT(DISTINCT ffou.farm_id) as farms_using
FROM farm_field_options ffo
LEFT JOIN farm_field_option_usage ffou
  ON ffo.field_name = ffou.field_name
  AND ffo.option_value = ffou.option_value
WHERE ffo.field_name = 'amenities'
GROUP BY ffo.option_value
ORDER BY farms_using DESC, ffo.option_value ASC;

-- 3. Farms with valid canonical amenities
SELECT
  'Farms with Valid Amenities' as metric,
  COUNT(DISTINCT zoho_record_id) as value
FROM farms
WHERE amenities IS NOT NULL
  AND TRIM(amenities) != ''
  AND active = 1;

-- 4. Total amenity assignments
SELECT
  'Total Amenity Assignments' as metric,
  COUNT(*) as value
FROM farm_field_option_usage
WHERE field_name = 'amenities';

-- 5. Check for any non-canonical amenities in farm records (should be 0)
SELECT
  'NON-CANONICAL AMENITIES IN FARMS' as check_result,
  GROUP_CONCAT(DISTINCT value) as suspicious_values
FROM (
  WITH RECURSIVE split(farm_id, value, str) AS (
    SELECT zoho_record_id, '', amenities || ',' FROM farms
    WHERE amenities IS NOT NULL AND amenities != ''
    UNION ALL
    SELECT farm_id, SUBSTR(str, 0, INSTR(str, ',')), SUBSTR(str, INSTR(str, ',') + 1)
    FROM split WHERE str != ''
  )
  SELECT farm_id, TRIM(value) as value FROM split WHERE value != ''
)
WHERE value NOT IN (
  'Activities', 'Fire Pit/Bonfire', 'Free Parking', 'Garlands For Sale',
  'Gift Shop', 'Hot Chocolate', 'Hot Cider', 'Nature Trails', 'Photography',
  'Playground', 'Restrooms', 'Santa Visits', 'Saw Included', 'Sleigh Rides',
  'Tree Stands', 'Wagon Rides', 'Wheelchair Accessible', 'Wreaths For Sale'
);
