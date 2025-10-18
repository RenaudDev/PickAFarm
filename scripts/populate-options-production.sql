-- Populate field options from existing farms data
INSERT OR IGNORE INTO farm_field_options (field_name, option_value, option_label, sort_order)
SELECT DISTINCT 'categories', TRIM(value), TRIM(value), 0
FROM (
  WITH RECURSIVE split(value, str) AS (
    SELECT '', categories || ',' FROM farms WHERE categories IS NOT NULL AND categories != ''
    UNION ALL
    SELECT SUBSTR(str, 0, INSTR(str, ',')), SUBSTR(str, INSTR(str, ',') + 1)
    FROM split WHERE str != ''
  )
  SELECT value FROM split WHERE value != ''
);

INSERT OR IGNORE INTO farm_field_options (field_name, option_value, option_label, sort_order)
SELECT DISTINCT 'amenities', TRIM(value), TRIM(value), 0
FROM (
  WITH RECURSIVE split(value, str) AS (
    SELECT '', amenities || ',' FROM farms WHERE amenities IS NOT NULL AND amenities != ''
    UNION ALL
    SELECT SUBSTR(str, 0, INSTR(str, ',')), SUBSTR(str, INSTR(str, ',') + 1)
    FROM split WHERE str != ''
  )
  SELECT value FROM split WHERE value != ''
);

INSERT OR IGNORE INTO farm_field_options (field_name, option_value, option_label, sort_order)
SELECT DISTINCT 'varieties', TRIM(value), TRIM(value), 0
FROM (
  WITH RECURSIVE split(value, str) AS (
    SELECT '', varieties || ',' FROM farms WHERE varieties IS NOT NULL AND varieties != ''
    UNION ALL
    SELECT SUBSTR(str, 0, INSTR(str, ',')), SUBSTR(str, INSTR(str, ',') + 1)
    FROM split WHERE str != ''
  )
  SELECT value FROM split WHERE value != ''
);

INSERT OR IGNORE INTO farm_field_options (field_name, option_value, option_label, sort_order)
SELECT DISTINCT 'payment_methods', TRIM(value), TRIM(value), 0
FROM (
  WITH RECURSIVE split(value, str) AS (
    SELECT '', payment_methods || ',' FROM farms WHERE payment_methods IS NOT NULL AND payment_methods != ''
    UNION ALL
    SELECT SUBSTR(str, 0, INSTR(str, ',')), SUBSTR(str, INSTR(str, ',') + 1)
    FROM split WHERE str != ''
  )
  SELECT value FROM split WHERE value != ''
);
