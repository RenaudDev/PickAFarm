-- Migrate Amenities to Canonical Terms
-- Maps 23 related terms to canonical values, then rebuilds options table
-- User answers: Map to canonical, whitelist auto-discovery, sync Zoho

-- 1. UPDATE FARM RECORDS: Map all related terms to canonical equivalents
-- Fire Pit/Bonfire mapping
UPDATE farms
SET amenities = REPLACE(REPLACE(REPLACE(REPLACE(amenities, 'Bonfire,', 'Fire Pit/Bonfire,'), ',Bonfire', ',Fire Pit/Bonfire'), 'Bonfire', 'Fire Pit/Bonfire'), 'Firepit', 'Fire Pit/Bonfire')
WHERE amenities LIKE '%Bonfire%' OR amenities LIKE '%Firepit%';

-- Campfires variants
UPDATE farms
SET amenities = REPLACE(REPLACE(REPLACE(amenities, 'Campfires,', 'Fire Pit/Bonfire,'), ',Campfires', ',Fire Pit/Bonfire'), 'Campfires', 'Fire Pit/Bonfire')
WHERE amenities LIKE '%Campfires%';

UPDATE farms
SET amenities = REPLACE(REPLACE(REPLACE(amenities, 'Camp Fire,', 'Fire Pit/Bonfire,'), ',Camp Fire', ',Fire Pit/Bonfire'), 'Camp Fire', 'Fire Pit/Bonfire')
WHERE amenities LIKE '%Camp Fire%';

UPDATE farms
SET amenities = REPLACE(REPLACE(REPLACE(amenities, 'Fire Pit/Bonfires,', 'Fire Pit/Bonfire,'), ',Fire Pit/Bonfires', ',Fire Pit/Bonfire'), 'Fire Pit/Bonfires', 'Fire Pit/Bonfire')
WHERE amenities LIKE '%Fire Pit/Bonfires%';

-- Free Parking mapping
UPDATE farms
SET amenities = REPLACE(REPLACE(REPLACE(REPLACE(amenities, 'Free parking,', 'Free Parking,'), ',Free parking', ',Free Parking'), 'Free parking', 'Free Parking'), 'On-site parking', 'Free Parking')
WHERE amenities LIKE '%Free parking%' OR amenities LIKE '%On-site parking%';

UPDATE farms
SET amenities = REPLACE(REPLACE(REPLACE(amenities, 'Free street parking,', 'Free Parking,'), ',Free street parking', ',Free Parking'), 'Free street parking', 'Free Parking')
WHERE amenities LIKE '%Free street parking%';

UPDATE farms
SET amenities = REPLACE(REPLACE(REPLACE(amenities, 'Parking,', 'Free Parking,'), ',Parking', ',Free Parking'), ',Parking', ',Free Parking')
WHERE amenities LIKE '%Parking%' AND amenities NOT LIKE '%Free Parking%' AND amenities NOT LIKE '%Accessible Parking%';

-- Garlands For Sale mapping
UPDATE farms
SET amenities = REPLACE(REPLACE(REPLACE(amenities, 'Garland For Sale,', 'Garlands For Sale,'), ',Garland For Sale', ',Garlands For Sale'), 'Garland For Sale', 'Garlands For Sale')
WHERE amenities LIKE '%Garland For Sale%';

-- Hot Chocolate mapping (merge Hot Drinks)
UPDATE farms
SET amenities = REPLACE(REPLACE(REPLACE(amenities, 'Hot Drinks,', 'Hot Chocolate,'), ',Hot Drinks', ',Hot Chocolate'), 'Hot Drinks', 'Hot Chocolate')
WHERE amenities LIKE '%Hot Drinks%';

-- Nature Trails mapping
UPDATE farms
SET amenities = REPLACE(REPLACE(REPLACE(amenities, 'Nature Trail,', 'Nature Trails,'), ',Nature Trail', ',Nature Trails'), 'Nature Trail', 'Nature Trails')
WHERE amenities LIKE '%Nature Trail%';

UPDATE farms
SET amenities = REPLACE(REPLACE(REPLACE(amenities, 'Nature Paths,', 'Nature Trails,'), ',Nature Paths', ',Nature Trails'), 'Nature Paths', 'Nature Trails')
WHERE amenities LIKE '%Nature Paths%';

-- Photography mapping
UPDATE farms
SET amenities = REPLACE(REPLACE(REPLACE(amenities, 'Photography Allowed,', 'Photography,'), ',Photography Allowed', ',Photography'), 'Photography Allowed', 'Photography')
WHERE amenities LIKE '%Photography Allowed%';

UPDATE farms
SET amenities = REPLACE(REPLACE(REPLACE(amenities, 'Family Photos,', 'Photography,'), ',Family Photos', ',Photography'), 'Family Photos', 'Photography')
WHERE amenities LIKE '%Family Photos%';

-- Playground mapping
UPDATE farms
SET amenities = REPLACE(REPLACE(REPLACE(amenities, 'Play Area,', 'Playground,'), ',Play Area', ',Playground'), 'Play Area', 'Playground')
WHERE amenities LIKE '%Play Area%';

UPDATE farms
SET amenities = REPLACE(REPLACE(REPLACE(amenities, 'Kids Play Area,', 'Playground,'), ',Kids Play Area', ',Playground'), 'Kids Play Area', 'Playground')
WHERE amenities LIKE '%Kids Play Area%';

-- Restrooms mapping (gender-neutral)
UPDATE farms
SET amenities = REPLACE(REPLACE(REPLACE(amenities, 'Gender-neutral restroom,', 'Restrooms,'), ',Gender-neutral restroom', ',Restrooms'), 'Gender-neutral restroom', 'Restrooms')
WHERE amenities LIKE '%Gender-neutral restroom%';

-- Saw Included mapping
UPDATE farms
SET amenities = REPLACE(REPLACE(REPLACE(amenities, 'Saws Provided,', 'Saw Included,'), ',Saws Provided', ',Saw Included'), 'Saws Provided', 'Saw Included')
WHERE amenities LIKE '%Saws Provided%';

UPDATE farms
SET amenities = REPLACE(REPLACE(REPLACE(amenities, 'Bow Saws Provided,', 'Saw Included,'), ',Bow Saws Provided', ',Saw Included'), 'Bow Saws Provided', 'Saw Included')
WHERE amenities LIKE '%Bow Saws Provided%';

-- Sleigh Rides mapping (Horse-drawn wagons)
UPDATE farms
SET amenities = REPLACE(REPLACE(REPLACE(amenities, 'Horse Drawn Carriage Rides,', 'Sleigh Rides,'), ',Horse Drawn Carriage Rides', ',Sleigh Rides'), 'Horse Drawn Carriage Rides', 'Sleigh Rides')
WHERE amenities LIKE '%Horse Drawn Carriage Rides%';

UPDATE farms
SET amenities = REPLACE(REPLACE(REPLACE(amenities, 'Horse-drawn wagons,', 'Sleigh Rides,'), ',Horse-drawn wagons', ',Sleigh Rides'), 'Horse-drawn wagons', 'Sleigh Rides')
WHERE amenities LIKE '%Horse-drawn wagons%';

-- Tree Stands mapping
UPDATE farms
SET amenities = REPLACE(REPLACE(REPLACE(amenities, 'Tree Stands For Sale,', 'Tree Stands,'), ',Tree Stands For Sale', ',Tree Stands'), 'Tree Stands For Sale', 'Tree Stands')
WHERE amenities LIKE '%Tree Stands For Sale%';

UPDATE farms
SET amenities = REPLACE(REPLACE(REPLACE(amenities, 'Christmas Tree Stands,', 'Tree Stands,'), ',Christmas Tree Stands', ',Tree Stands'), 'Christmas Tree Stands', 'Tree Stands')
WHERE amenities LIKE '%Christmas Tree Stands%';

-- Wagon Rides mapping (all ride variants)
UPDATE farms
SET amenities = REPLACE(REPLACE(REPLACE(amenities, 'Free Hayride,', 'Wagon Rides,'), ',Free Hayride', ',Wagon Rides'), 'Free Hayride', 'Wagon Rides')
WHERE amenities LIKE '%Free Hayride%';

UPDATE farms
SET amenities = REPLACE(REPLACE(REPLACE(amenities, 'Hay Rides,', 'Wagon Rides,'), ',Hay Rides', ',Wagon Rides'), 'Hay Rides', 'Wagon Rides')
WHERE amenities LIKE '%Hay Rides%';

UPDATE farms
SET amenities = REPLACE(REPLACE(REPLACE(amenities, 'Hayrides,', 'Wagon Rides,'), ',Hayrides', ',Wagon Rides'), 'Hayrides', 'Wagon Rides')
WHERE amenities LIKE '%Hayrides%';

UPDATE farms
SET amenities = REPLACE(REPLACE(REPLACE(amenities, 'Hayrack Rides,', 'Wagon Rides,'), ',Hayrack Rides', ',Wagon Rides'), 'Hayrack Rides', 'Wagon Rides')
WHERE amenities LIKE '%Hayrack Rides%';

UPDATE farms
SET amenities = REPLACE(REPLACE(REPLACE(amenities, 'Tractor Rides,', 'Wagon Rides,'), ',Tractor Rides', ',Wagon Rides'), 'Tractor Rides', 'Wagon Rides')
WHERE amenities LIKE '%Tractor Rides%';

UPDATE farms
SET amenities = REPLACE(REPLACE(REPLACE(amenities, 'Trolley Rides,', 'Wagon Rides,'), ',Trolley Rides', ',Wagon Rides'), 'Trolley Rides', 'Wagon Rides')
WHERE amenities LIKE '%Trolley Rides%';

-- Wheelchair Accessible mapping (consolidate all accessibility features)
UPDATE farms
SET amenities = REPLACE(REPLACE(REPLACE(amenities, 'Wheelchair Accessible Entrance,', 'Wheelchair Accessible,'), ',Wheelchair Accessible Entrance', ',Wheelchair Accessible'), 'Wheelchair Accessible Entrance', 'Wheelchair Accessible')
WHERE amenities LIKE '%Wheelchair Accessible Entrance%';

UPDATE farms
SET amenities = REPLACE(REPLACE(REPLACE(amenities, 'Wheelchair Accessible Parking,', 'Wheelchair Accessible,'), ',Wheelchair Accessible Parking', ',Wheelchair Accessible'), 'Wheelchair Accessible Parking', 'Wheelchair Accessible')
WHERE amenities LIKE '%Wheelchair Accessible Parking%';

UPDATE farms
SET amenities = REPLACE(REPLACE(REPLACE(amenities, 'Wheelchair Accessible Restroom,', 'Wheelchair Accessible,'), ',Wheelchair Accessible Restroom', ',Wheelchair Accessible'), 'Wheelchair Accessible Restroom', 'Wheelchair Accessible')
WHERE amenities LIKE '%Wheelchair Accessible Restroom%';

UPDATE farms
SET amenities = REPLACE(REPLACE(REPLACE(amenities, 'Wheelchair Accessible Seating,', 'Wheelchair Accessible,'), ',Wheelchair Accessible Seating', ',Wheelchair Accessible'), 'Wheelchair Accessible Seating', 'Wheelchair Accessible')
WHERE amenities LIKE '%Wheelchair Accessible Seating%';

UPDATE farms
SET amenities = REPLACE(REPLACE(REPLACE(amenities, 'Wheelchair Access,', 'Wheelchair Accessible,'), ',Wheelchair Access', ',Wheelchair Accessible'), 'Wheelchair Access', 'Wheelchair Accessible')
WHERE amenities LIKE '%Wheelchair Access%';

UPDATE farms
SET amenities = REPLACE(REPLACE(REPLACE(amenities, 'Wheelchair Accessibility,', 'Wheelchair Accessible,'), ',Wheelchair Accessibility', ',Wheelchair Accessible'), 'Wheelchair Accessibility', 'Wheelchair Accessible')
WHERE amenities LIKE '%Wheelchair Accessibility%';

UPDATE farms
SET amenities = REPLACE(REPLACE(REPLACE(amenities, 'Handicap Accessible,', 'Wheelchair Accessible,'), ',Handicap Accessible', ',Wheelchair Accessible'), 'Handicap Accessible', 'Wheelchair Accessible')
WHERE amenities LIKE '%Handicap Accessible%';

-- Wreaths For Sale mapping
UPDATE farms
SET amenities = REPLACE(REPLACE(REPLACE(amenities, 'Wreath For Sale,', 'Wreaths For Sale,'), ',Wreath For Sale', ',Wreaths For Sale'), 'Wreath For Sale', 'Wreaths For Sale')
WHERE amenities LIKE '%Wreath For Sale%';

UPDATE farms
SET amenities = REPLACE(REPLACE(REPLACE(amenities, 'Wreaths,', 'Wreaths For Sale,'), ',Wreaths', ',Wreaths For Sale'), ',Wreaths', ',Wreaths For Sale')
WHERE amenities LIKE '%Wreaths,%' AND amenities NOT LIKE '%Wreaths For Sale%';

-- 2. CLEAR ALL EXISTING AMENITIES FROM OPTIONS TABLE
DELETE FROM farm_field_option_usage
WHERE field_name = 'amenities';

DELETE FROM farm_field_options
WHERE field_name = 'amenities';

-- 3. INSERT ONLY THE 18 CANONICAL AMENITIES
INSERT INTO farm_field_options (field_name, option_value, option_label, sort_order, is_active)
VALUES
  ('amenities', 'Activities', 'Activities', 1, 1),
  ('amenities', 'Fire Pit/Bonfire', 'Fire Pit/Bonfire', 2, 1),
  ('amenities', 'Free Parking', 'Free Parking', 3, 1),
  ('amenities', 'Garlands For Sale', 'Garlands For Sale', 4, 1),
  ('amenities', 'Gift Shop', 'Gift Shop', 5, 1),
  ('amenities', 'Hot Chocolate', 'Hot Chocolate', 6, 1),
  ('amenities', 'Hot Cider', 'Hot Cider', 7, 1),
  ('amenities', 'Nature Trails', 'Nature Trails', 8, 1),
  ('amenities', 'Photography', 'Photography', 9, 1),
  ('amenities', 'Playground', 'Playground', 10, 1),
  ('amenities', 'Restrooms', 'Restrooms', 11, 1),
  ('amenities', 'Santa Visits', 'Santa Visits', 12, 1),
  ('amenities', 'Saw Included', 'Saw Included', 13, 1),
  ('amenities', 'Sleigh Rides', 'Sleigh Rides', 14, 1),
  ('amenities', 'Tree Stands', 'Tree Stands', 15, 1),
  ('amenities', 'Wagon Rides', 'Wagon Rides', 16, 1),
  ('amenities', 'Wheelchair Accessible', 'Wheelchair Accessible', 17, 1),
  ('amenities', 'Wreaths For Sale', 'Wreaths For Sale', 18, 1);

-- 4. RE-POPULATE USAGE DATA FROM UPDATED FARM DATA
-- Simplified: Just count each farm + amenity combination from updated farms
INSERT OR IGNORE INTO farm_field_option_usage (farm_id, field_name, option_value, last_used)
WITH RECURSIVE split(farm_id, value, str) AS (
  SELECT zoho_record_id, '', amenities || ',' FROM farms
  WHERE amenities IS NOT NULL AND amenities != ''
  UNION ALL
  SELECT farm_id, SUBSTR(str, 0, INSTR(str, ',')), SUBSTR(str, INSTR(str, ',') + 1)
  FROM split WHERE str != ''
)
SELECT DISTINCT farm_id, 'amenities', TRIM(value), CURRENT_TIMESTAMP
FROM split
WHERE value != '' AND TRIM(value) IN (
  'Activities', 'Fire Pit/Bonfire', 'Free Parking', 'Garlands For Sale', 'Gift Shop',
  'Hot Chocolate', 'Hot Cider', 'Nature Trails', 'Photography', 'Playground',
  'Restrooms', 'Santa Visits', 'Saw Included', 'Sleigh Rides', 'Tree Stands',
  'Wagon Rides', 'Wheelchair Accessible', 'Wreaths For Sale'
);
