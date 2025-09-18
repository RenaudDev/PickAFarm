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
