-- Migration: Add location fields to users table
-- This allows us to store precise GPS coordinates when users allow browser location

-- SQLite doesn't support IF NOT EXISTS for ALTER TABLE ADD COLUMN
-- These will fail silently if columns already exist (handled by wrangler)
ALTER TABLE users ADD COLUMN latitude REAL;
ALTER TABLE users ADD COLUMN longitude REAL;
ALTER TABLE users ADD COLUMN location_city TEXT;
ALTER TABLE users ADD COLUMN location_region TEXT;
ALTER TABLE users ADD COLUMN location_updated_at TEXT;

-- Index for location-based queries
CREATE INDEX IF NOT EXISTS idx_users_location ON users(latitude, longitude);
