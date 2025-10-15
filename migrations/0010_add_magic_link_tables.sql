-- Migration: 0010_add_magic_link_tables.sql
-- Story: 2.2 - Clerk Farmer Role & Magic Link Authentication
-- Purpose: Create tables for magic link token tracking, admin audit logging, and user onboarding tracking
-- Date: 2025-01-15

-- Table: pending_farmer_claims
-- Purpose: Track magic link tokens for one-time use enforcement and audit trail
CREATE TABLE IF NOT EXISTS pending_farmer_claims (
  id TEXT PRIMARY KEY,
  farm_id TEXT NOT NULL,
  email TEXT NOT NULL,
  token_hash TEXT NOT NULL,
  expires_at DATETIME NOT NULL,
  claimed BOOLEAN DEFAULT 0,
  claimed_at DATETIME,
  claimed_by_user_id TEXT,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (farm_id) REFERENCES farms(zoho_record_id),
  FOREIGN KEY (claimed_by_user_id) REFERENCES users(clerk_user_id)
);

-- Indexes for pending_farmer_claims
CREATE INDEX IF NOT EXISTS idx_pending_claims_token ON pending_farmer_claims(token_hash);
CREATE INDEX IF NOT EXISTS idx_pending_claims_email ON pending_farmer_claims(email);
CREATE INDEX IF NOT EXISTS idx_pending_claims_farm ON pending_farmer_claims(farm_id);
CREATE INDEX IF NOT EXISTS idx_pending_claims_expires ON pending_farmer_claims(expires_at);

-- Table: admin_audit_log
-- Purpose: Track all admin actions (magic link generation, auth failures, etc.)
CREATE TABLE IF NOT EXISTS admin_audit_log (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  action TEXT NOT NULL,
  farm_id TEXT,
  email TEXT,
  metadata TEXT,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- Indexes for admin_audit_log
CREATE INDEX IF NOT EXISTS idx_audit_action ON admin_audit_log(action);
CREATE INDEX IF NOT EXISTS idx_audit_farm ON admin_audit_log(farm_id);
CREATE INDEX IF NOT EXISTS idx_audit_created ON admin_audit_log(created_at);

-- Add first_update_completed column to users table
-- Purpose: Track whether farmer has completed initial profile update
ALTER TABLE users ADD COLUMN first_update_completed BOOLEAN DEFAULT 0;

-- Verification queries (run separately to verify migration)
-- SELECT COUNT(*) FROM pending_farmer_claims;
-- SELECT COUNT(*) FROM admin_audit_log;
-- SELECT clerk_user_id, email, role, farm_id, first_update_completed FROM users LIMIT 5;
