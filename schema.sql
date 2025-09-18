-- PickAFarm Database Schema (Enhanced for Web + Mobile)
-- Location management (critical for URL structure)
CREATE TABLE cities (
    id TEXT PRIMARY KEY,
    name TEXT NOT NULL,
    slug TEXT NOT NULL, -- URL-friendly version
    state_province TEXT NOT NULL,
    country TEXT NOT NULL DEFAULT 'USA', -- USA or Canada
    latitude REAL,
    longitude REAL,
    population INTEGER,
    tier INTEGER CHECK(tier IN (1,2,3)), -- 1=major, 2=regional, 3=auto
    has_dedicated_page BOOLEAN DEFAULT 0,
    nearest_major_city_id TEXT REFERENCES cities(id),
    created_at TEXT DEFAULT CURRENT_TIMESTAMP
);

-- Core farm data (enhanced based on real data)
CREATE TABLE farms (
    zoho_record_id TEXT PRIMARY KEY, -- Zoho CRM record ID as primary key
    name TEXT NOT NULL, -- "Business Name"
    slug TEXT UNIQUE NOT NULL,
    
    -- Direct Zoho CRM field mappings
    website TEXT, -- "website"
    location_link TEXT, -- "location_link" (Google Maps link)
    facebook TEXT, -- "facebook" 
    instagram TEXT, -- "instagram"
    categories TEXT, -- "Categories" (JSON array or comma-separated)
    established_in INTEGER, -- "Established in" (year)
    opening_date TEXT, -- "Opening Date" (seasonal)
    closing_date TEXT, -- "Closing Date" (seasonal)
    type TEXT, -- "Type" (U-Pick, Pre-Cut, etc.)
    amenities TEXT, -- "amenities" (JSON array or comma-separated)
    varieties TEXT, -- "Varieties" (JSON array or comma-separated)
    pet_friendly BOOLEAN DEFAULT 0, -- "Pet Friendly"
    price_range TEXT, -- "Price Range" (full text like "$39 - $349")
    payment_methods TEXT, -- "Payment Methods" (JSON array or comma-separated)
    
    -- Operating hours (direct from CSV)
    sunday_hours TEXT, -- "Sunday (hours)"
    monday_hours TEXT, -- "Monday (hours)"
    tuesday_hours TEXT, -- "Tuesday (hours)"
    wednesday_hours TEXT, -- "Wednesday (hours)"
    thursday_hours TEXT, -- "Thursday (hours)"
    friday_hours TEXT, -- "Friday (hours)"
    saturday_hours TEXT, -- "Saturday (hours)"
    
    -- Content and location
    description TEXT, -- "description"
    street TEXT, -- "street"
    city TEXT, -- "city" (name, not ID for direct Zoho mapping)
    postal_code TEXT, -- "postal_code"
    state TEXT, -- "state"
    country TEXT, -- "country"
    latitude REAL, -- "latitude"
    longitude REAL, -- "longitude"
    place_id TEXT, -- "place_id" (Google Maps)
    phone TEXT, -- "phone"
    email TEXT, -- "email"
    
    -- Internal fields for website functionality
    city_id TEXT REFERENCES cities(id), -- Internal reference for URL structure
    price_range_min DECIMAL(6,2), -- Parsed from price_range for filtering
    price_range_max DECIMAL(6,2), -- Parsed from price_range for filtering
    
    -- Zoho CRM Integration
    zoho_last_sync TEXT, -- Last sync timestamp
    zoho_webhook_token TEXT, -- Secure token for webhook verification
    
    -- Farmer management
    farmer_update_token TEXT, -- Current secure token for farmer updates
    farmer_token_expires TEXT, -- Token expiration
    last_farmer_update TEXT, -- When farmer last updated status
    farmer_update_frequency INTEGER DEFAULT 7, -- Days between update reminders
    
    -- Metadata
    verified BOOLEAN DEFAULT 0,
    featured BOOLEAN DEFAULT 0,
    active BOOLEAN DEFAULT 1, -- Can be disabled without deletion
    created_at TEXT DEFAULT CURRENT_TIMESTAMP,
    updated_at TEXT DEFAULT CURRENT_TIMESTAMP
);

-- Farm categories (Christmas Tree, Pumpkin, Apple Orchard, etc.)
CREATE TABLE farm_categories (
    id TEXT PRIMARY KEY,
    name TEXT NOT NULL, -- "Christmas Tree", "Apple Orchard"
    slug TEXT UNIQUE NOT NULL, -- "christmas-tree", "apple-orchard"
    description TEXT,
    icon_name TEXT, -- For UI icons
    typical_season_start INTEGER, -- month number
    typical_season_end INTEGER,
    sort_order INTEGER DEFAULT 0
);

-- Farm operational types (Cut Your Own, Pre-Cut, U-Pick, etc.)
CREATE TABLE operational_types (
    id TEXT PRIMARY KEY,
    name TEXT NOT NULL, -- "Cut Your Own", "U-Pick", "Pre-Cut"
    slug TEXT UNIQUE NOT NULL,
    description TEXT
);

-- Product varieties (specific crops/tree types)
CREATE TABLE varieties (
    id TEXT PRIMARY KEY,
    name TEXT NOT NULL, -- "Balsam Fir", "Honeycrisp Apple"
    category_id TEXT REFERENCES farm_categories(id),
    description TEXT,
    typical_season_start INTEGER, -- month number
    typical_season_end INTEGER
);

-- Farm amenities (standardized list)
CREATE TABLE amenities (
    id TEXT PRIMARY KEY,
    name TEXT NOT NULL, -- "Restrooms", "Gift Shop", "Wagon Rides"
    slug TEXT UNIQUE NOT NULL,
    description TEXT,
    category TEXT, -- "facilities", "activities", "food", "services"
    icon_name TEXT
);

-- Payment methods (standardized list)
CREATE TABLE payment_methods (
    id TEXT PRIMARY KEY,
    name TEXT NOT NULL, -- "Cash", "Credit Card", "Apple Pay"
    slug TEXT UNIQUE NOT NULL,
    description TEXT
);

-- Many-to-many relationships
CREATE TABLE farm_categories_rel (
    farm_id TEXT REFERENCES farms(zoho_record_id) ON DELETE CASCADE,
    category_id TEXT REFERENCES farm_categories(id) ON DELETE CASCADE,
    PRIMARY KEY (farm_id, category_id)
);

CREATE TABLE farm_operational_types_rel (
    farm_id TEXT REFERENCES farms(zoho_record_id) ON DELETE CASCADE,
    operational_type_id TEXT REFERENCES operational_types(id) ON DELETE CASCADE,
    PRIMARY KEY (farm_id, operational_type_id)
);

CREATE TABLE farm_varieties_rel (
    farm_id TEXT REFERENCES farms(zoho_record_id) ON DELETE CASCADE,
    variety_id TEXT REFERENCES varieties(id) ON DELETE CASCADE,
    availability_notes TEXT, -- "Weather dependent", "Limited quantity"
    PRIMARY KEY (farm_id, variety_id)
);

CREATE TABLE farm_amenities_rel (
    farm_id TEXT REFERENCES farms(zoho_record_id) ON DELETE CASCADE,
    amenity_id TEXT REFERENCES amenities(id) ON DELETE CASCADE,
    notes TEXT, -- Additional details about the amenity
    PRIMARY KEY (farm_id, amenity_id)
);

CREATE TABLE farm_payment_methods_rel (
    farm_id TEXT REFERENCES farms(zoho_record_id) ON DELETE CASCADE,
    payment_method_id TEXT REFERENCES payment_methods(id) ON DELETE CASCADE,
    PRIMARY KEY (farm_id, payment_method_id)
);

-- Operating hours (detailed per-day schedule)
CREATE TABLE farm_hours (
    id TEXT PRIMARY KEY,
    farm_id TEXT REFERENCES farms(zoho_record_id) ON DELETE CASCADE,
    day_of_week INTEGER CHECK(day_of_week BETWEEN 0 AND 6), -- 0=Sunday
    is_closed BOOLEAN DEFAULT 0,
    open_time TEXT, -- "09:30" (24-hour format)
    close_time TEXT, -- "17:00" (24-hour format) 
    notes TEXT, -- "Seasonal hours may vary"
    UNIQUE(farm_id, day_of_week)
);

-- Seasonal availability and status
CREATE TABLE seasonal_availability (
    id TEXT PRIMARY KEY,
    farm_id TEXT REFERENCES farms(zoho_record_id) ON DELETE CASCADE,
    category_id TEXT REFERENCES farm_categories(id), -- What category this applies to
    variety_id TEXT REFERENCES varieties(id), -- Specific variety (optional)
    
    -- Date ranges (can be null for year-round operations)
    season_start_date TEXT, -- "2025-11-23" (ISO format)
    season_end_date TEXT, -- "2025-12-24"
    
    -- Current status
    current_status TEXT CHECK(current_status IN ('not_ready', 'ready', 'peak', 'ending', 'closed')),
    status_notes TEXT, -- "Call ahead to confirm availability"
    
    -- Metadata
    last_updated TEXT DEFAULT CURRENT_TIMESTAMP,
    updated_by TEXT -- Source of update (admin, farm owner, etc.)
);

-- Enhanced notification system for multi-platform
CREATE TABLE notifications (
    id TEXT PRIMARY KEY,
    email TEXT NOT NULL,
    
    -- Location preferences
    city_id TEXT REFERENCES cities(id), -- Preferred city
    radius_miles INTEGER DEFAULT 25,
    
    -- Category preferences (JSON array of category IDs)
    preferred_categories TEXT, -- ["christmas-tree", "apple-orchard"]
    
    -- Notification preferences
    notify_when_ready BOOLEAN DEFAULT 1,
    notify_peak_season BOOLEAN DEFAULT 1,  
    notify_new_farms BOOLEAN DEFAULT 0,
    notify_price_changes BOOLEAN DEFAULT 0,
    
    -- Platform-specific tokens
    push_token TEXT, -- Expo push token for mobile notifications
    device_type TEXT CHECK(device_type IN ('web', 'ios', 'android')),
    user_agent TEXT, -- For web push notifications
    
    -- Management
    active BOOLEAN DEFAULT 1,
    confirmed BOOLEAN DEFAULT 0, -- Email confirmation
    unsubscribe_token TEXT UNIQUE,
    
    -- Metadata
    created_at TEXT DEFAULT CURRENT_TIMESTAMP,
    last_notified TEXT, -- Track when last notification was sent
    platform_preferences TEXT -- JSON: {"email": true, "push": true}
);

-- Mobile app usage tracking
CREATE TABLE app_sessions (
    id TEXT PRIMARY KEY,
    device_id TEXT, -- Anonymous device identifier
    platform TEXT CHECK(platform IN ('web', 'ios', 'android')),
    app_version TEXT,
    session_start TEXT DEFAULT CURRENT_TIMESTAMP,
    session_end TEXT,
    location_lat REAL, -- Anonymous location data for analytics
    location_lng REAL,
    actions_taken TEXT -- JSON array of actions during session
);

-- Offline sync support for mobile
CREATE TABLE sync_log (
    id TEXT PRIMARY KEY,
    table_name TEXT NOT NULL,
    record_id TEXT NOT NULL,
    operation TEXT CHECK(operation IN ('insert', 'update', 'delete')),
    timestamp TEXT DEFAULT CURRENT_TIMESTAMP,
    synced BOOLEAN DEFAULT 0
);

-- User-generated content (mobile app reviews/photos)
CREATE TABLE farm_reviews (
    id TEXT PRIMARY KEY,
    farm_id TEXT REFERENCES farms(zoho_record_id) ON DELETE CASCADE,
    device_id TEXT, -- Anonymous reviewer
    rating INTEGER CHECK(rating BETWEEN 1 AND 5),
    review_text TEXT,
    photos TEXT, -- JSON array of R2 image URLs
    visit_date TEXT, -- When they visited the farm
    helpful_count INTEGER DEFAULT 0,
    flagged BOOLEAN DEFAULT 0,
    approved BOOLEAN DEFAULT 1,
    created_at TEXT DEFAULT CURRENT_TIMESTAMP
);

-- Farm status updates (crowdsourced from mobile users)
CREATE TABLE crowdsourced_updates (
    id TEXT PRIMARY KEY,
    farm_id TEXT REFERENCES farms(zoho_record_id) ON DELETE CASCADE,
    variety_id TEXT REFERENCES varieties(id),
    reported_status TEXT CHECK(reported_status IN ('not_ready', 'ready', 'peak', 'ending', 'closed')),
    notes TEXT, -- "Lots of apples available", "Almost picked clean"
    photo_url TEXT, -- R2 image URL of current conditions
    reporter_device_id TEXT,
    confidence_score REAL, -- Algorithm-determined reliability
    verified BOOLEAN DEFAULT 0, -- Admin verification
    created_at TEXT DEFAULT CURRENT_TIMESTAMP
);

-- Performance indexes (critical for search speed)
CREATE INDEX idx_farms_location ON farms(latitude, longitude);
CREATE INDEX idx_farms_city ON farms(city_id, featured);
CREATE INDEX idx_farms_verified ON farms(verified, featured);
CREATE INDEX idx_cities_state ON cities(state_province, tier);
CREATE INDEX idx_cities_slug ON cities(state_province, slug);
CREATE INDEX idx_availability_status ON seasonal_availability(current_status, farm_id);
CREATE INDEX idx_availability_category ON seasonal_availability(category_id, current_status);
CREATE INDEX idx_notifications_city ON notifications(city_id, active);
CREATE INDEX idx_farm_hours ON farm_hours(farm_id, day_of_week);
CREATE INDEX idx_varieties_category ON varieties(category_id);

-- Unique constraints to prevent data issues
CREATE UNIQUE INDEX idx_city_unique ON cities(state_province, slug);
CREATE UNIQUE INDEX idx_notification_unique ON notifications(email, city_id) WHERE active = 1;
CREATE UNIQUE INDEX idx_farm_slug ON farms(slug);

-- Full-text search support (SQLite FTS5)
CREATE VIRTUAL TABLE farms_fts USING fts5(
    name,
    description,
    street_address,
    content='farms',
    content_rowid='rowid'
);

-- Triggers to keep FTS in sync
CREATE TRIGGER farms_fts_insert AFTER INSERT ON farms BEGIN
  INSERT INTO farms_fts(rowid, name, description, street_address) 
  VALUES (new.zoho_record_id, new.name, new.description, new.street_address);
END;

CREATE TRIGGER farms_fts_update AFTER UPDATE ON farms BEGIN
  INSERT INTO farms_fts(farms_fts, rowid, name, description, street_address) 
  VALUES('delete', old.zoho_record_id, old.name, old.description, old.street_address);
  INSERT INTO farms_fts(rowid, name, description, street_address) 
  VALUES (new.zoho_record_id, new.name, new.description, new.street_address);
END;

CREATE TRIGGER farms_fts_delete AFTER DELETE ON farms BEGIN
  INSERT INTO farms_fts(farms_fts, rowid, name, description, street_address) 
  VALUES('delete', old.zoho_record_id, old.name, old.description, old.street_address);
END;
