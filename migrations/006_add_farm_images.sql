-- Migration: Add logo and background image support to farms table
-- Created: 2025-10-07
-- Purpose: Enable custom branding for farms with logo and background images stored in R2

-- Add logo and background URL columns
ALTER TABLE farms ADD COLUMN logo_url TEXT;
ALTER TABLE farms ADD COLUMN background_url TEXT;

-- Add timestamps for tracking when images were last updated
ALTER TABLE farms ADD COLUMN logo_updated_at DATETIME;
ALTER TABLE farms ADD COLUMN background_updated_at DATETIME;

-- Create indexes for faster queries when filtering/sorting by update time
CREATE INDEX IF NOT EXISTS idx_farms_logo_updated ON farms(logo_updated_at);
CREATE INDEX IF NOT EXISTS idx_farms_background_updated ON farms(background_updated_at);
