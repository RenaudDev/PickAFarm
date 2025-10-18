-- Rebuild Amenities with Authoritative Zoho List ONLY
-- Clears all corrupted/garbage data and replaces with correct 18 items

-- 1. CLEAR ALL EXISTING AMENITIES
DELETE FROM farm_field_option_usage
WHERE field_name = 'amenities';

DELETE FROM farm_field_options
WHERE field_name = 'amenities';

-- 2. INSERT ONLY THE 18 AUTHORITATIVE ZOHO AMENITIES
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
