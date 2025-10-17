-- Migration: Add dynamic field options system
-- Purpose: Store all possible options for multi-select form fields
-- Allows auto-discovery of new values from Zoho CRM without code changes

CREATE TABLE IF NOT EXISTS farm_field_options (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    field_name TEXT NOT NULL,
    option_value TEXT NOT NULL,
    option_label TEXT,
    sort_order INTEGER DEFAULT 0,
    is_active BOOLEAN DEFAULT 1,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(field_name, option_value)
);

CREATE INDEX IF NOT EXISTS idx_field_options_field ON farm_field_options(field_name);

CREATE TABLE IF NOT EXISTS farm_field_option_usage (
    farm_id TEXT,
    field_name TEXT,
    option_value TEXT,
    last_used TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    PRIMARY KEY (farm_id, field_name, option_value)
);

CREATE INDEX IF NOT EXISTS idx_field_usage_field ON farm_field_option_usage(field_name);
