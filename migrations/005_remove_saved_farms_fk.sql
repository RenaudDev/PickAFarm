-- Migration: Remove foreign key constraint from saved_farms
-- This allows saving farms that don't exist in the farms table yet

-- Drop the old table (no data loss since no existing saved farms)
DROP TABLE IF EXISTS saved_farms;

-- Recreate without farm foreign key constraint
CREATE TABLE saved_farms (
  id TEXT PRIMARY KEY,
  user_id TEXT NOT NULL,
  farm_id TEXT NOT NULL,
  
  -- Farm metadata for display (since farm might not be in farms table)
  farm_name TEXT,
  farm_slug TEXT,
  farm_city TEXT,
  farm_state TEXT,
  farm_phone TEXT,
  farm_website TEXT,
  
  -- Notification preferences
  notify_on_hours_change BOOLEAN DEFAULT 1,
  notify_on_opening_change BOOLEAN DEFAULT 1,
  notify_on_status_change BOOLEAN DEFAULT 1,
  
  -- Metadata
  saved_at TEXT NOT NULL DEFAULT (datetime('now')),
  notes TEXT,
  
  -- Foreign key only for user
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
  
  -- Prevent duplicates
  UNIQUE(user_id, farm_id)
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_saved_farms_user ON saved_farms(user_id);
CREATE INDEX IF NOT EXISTS idx_saved_farms_farm ON saved_farms(farm_id);
CREATE INDEX IF NOT EXISTS idx_saved_farms_saved_at ON saved_farms(saved_at DESC);
CREATE INDEX IF NOT EXISTS idx_saved_farms_user_farm ON saved_farms(user_id, farm_id);
