SELECT zoho_record_id as id, name, city as city_name, state as state_province, country, latitude, longitude, active 
FROM farms 
WHERE active = 1 
  AND latitude IS NOT NULL 
  AND longitude IS NOT NULL 
  AND latitude != 0 
  AND longitude != 0;
