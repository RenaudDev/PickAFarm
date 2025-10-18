-- Populate farm_field_option_usage from existing farms data
INSERT OR IGNORE INTO farm_field_option_usage (farm_id, field_name, option_value, last_used)
SELECT DISTINCT zoho_record_id, 'categories', TRIM(value), CURRENT_TIMESTAMP
FROM (
  WITH RECURSIVE split(farm_id, value, str) AS (
    SELECT zoho_record_id, '', categories || ',' FROM farms WHERE categories IS NOT NULL AND categories != ''
    UNION ALL
    SELECT farm_id, SUBSTR(str, 0, INSTR(str, ',')), SUBSTR(str, INSTR(str, ',') + 1)
    FROM split WHERE str != ''
  )
  SELECT farm_id, value FROM split WHERE value != ''
);

INSERT OR IGNORE INTO farm_field_option_usage (farm_id, field_name, option_value, last_used)
SELECT DISTINCT zoho_record_id, 'amenities', TRIM(value), CURRENT_TIMESTAMP
FROM (
  WITH RECURSIVE split(farm_id, value, str) AS (
    SELECT zoho_record_id, '', amenities || ',' FROM farms WHERE amenities IS NOT NULL AND amenities != ''
    UNION ALL
    SELECT farm_id, SUBSTR(str, 0, INSTR(str, ',')), SUBSTR(str, INSTR(str, ',') + 1)
    FROM split WHERE str != ''
  )
  SELECT farm_id, value FROM split WHERE value != ''
);

INSERT OR IGNORE INTO farm_field_option_usage (farm_id, field_name, option_value, last_used)
SELECT DISTINCT zoho_record_id, 'varieties', TRIM(value), CURRENT_TIMESTAMP
FROM (
  WITH RECURSIVE split(farm_id, value, str) AS (
    SELECT zoho_record_id, '', varieties || ',' FROM farms WHERE varieties IS NOT NULL AND varieties != ''
    UNION ALL
    SELECT farm_id, SUBSTR(str, 0, INSTR(str, ',')), SUBSTR(str, INSTR(str, ',') + 1)
    FROM split WHERE str != ''
  )
  SELECT farm_id, value FROM split WHERE value != ''
);

INSERT OR IGNORE INTO farm_field_option_usage (farm_id, field_name, option_value, last_used)
SELECT DISTINCT zoho_record_id, 'payment_methods', TRIM(value), CURRENT_TIMESTAMP
FROM (
  WITH RECURSIVE split(farm_id, value, str) AS (
    SELECT zoho_record_id, '', payment_methods || ',' FROM farms WHERE payment_methods IS NOT NULL AND payment_methods != ''
    UNION ALL
    SELECT farm_id, SUBSTR(str, 0, INSTR(str, ',')), SUBSTR(str, INSTR(str, ',') + 1)
    FROM split WHERE str != ''
  )
  SELECT farm_id, value FROM split WHERE value != ''
);
