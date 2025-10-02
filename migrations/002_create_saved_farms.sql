-- Migration: Create saved_farms junction table
-- Links users to farms they want to follow and receive notifications about

CREATE TABLE IF NOT EXISTS saved_farms (
  id TEXT PRIMARY KEY,
  user_id TEXT NOT NULL,
  farm_id TEXT NOT NULL,
  
  -- Notification preferences (per-farm granular control)
  notify_on_hours_change BOOLEAN DEFAULT 1,
  notify_on_opening_change BOOLEAN DEFAULT 1,
  notify_on_status_change BOOLEAN DEFAULT 1,
  
  -- Metadata
  saved_at TEXT NOT NULL DEFAULT (datetime('now')),
  notes TEXT,
  
  -- Foreign keys
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
  FOREIGN KEY (farm_id) REFERENCES farms(zoho_record_id) ON DELETE CASCADE,
  
  -- Prevent duplicates: user can only save a farm once
  UNIQUE(user_id, farm_id)
);

-- Indexes for fast lookups
CREATE INDEX IF NOT EXISTS idx_saved_farms_user ON saved_farms(user_id);
CREATE INDEX IF NOT EXISTS idx_saved_farms_farm ON saved_farms(farm_id);
CREATE INDEX IF NOT EXISTS idx_saved_farms_saved_at ON saved_farms(saved_at DESC);

-- Combined index for checking if user has saved a specific farm
CREATE INDEX IF NOT EXISTS idx_saved_farms_user_farm ON saved_farms(user_id, farm_id);
