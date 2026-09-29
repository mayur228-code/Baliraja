-- ==============================================================================
-- BALIRAJA KRISHI SEVA KENDRA, KAIJ — SUPABASE PRODUCTION DATABASE SCHEMA
-- ==============================================================================
-- Execute this script in your Supabase SQL Editor (Dashboard -> SQL Editor -> New Query)
-- to create all tables, enable Row Level Security (RLS), and configure Storage.

-- 1. Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ==============================================================================
-- TABLE 1: categories
-- ==============================================================================
CREATE TABLE IF NOT EXISTS public.categories (
    id TEXT PRIMARY KEY,
    slug TEXT NOT NULL UNIQUE,
    name TEXT NOT NULL,
    name_mr TEXT NOT NULL,
    image TEXT DEFAULT '',
    icon TEXT DEFAULT 'Layers',
    short_desc TEXT DEFAULT '',
    short_desc_mr TEXT DEFAULT '',
    subcategories JSONB DEFAULT '[]'::jsonb,
    highlight BOOLEAN DEFAULT false,
    featured BOOLEAN DEFAULT false,
    display_order INTEGER DEFAULT 1,
    active BOOLEAN DEFAULT true,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ==============================================================================
-- TABLE 2: products
-- ==============================================================================
CREATE TABLE IF NOT EXISTS public.products (
    id TEXT PRIMARY KEY,
    slug TEXT NOT NULL UNIQUE,
    name_english TEXT NOT NULL,
    name_marathi TEXT NOT NULL,
    category_id TEXT NOT NULL REFERENCES public.categories(id) ON DELETE RESTRICT ON UPDATE CASCADE,
    subcategory_id TEXT,
    description_english TEXT DEFAULT '',
    description_marathi TEXT DEFAULT '',
    image TEXT NOT NULL,
    image_url TEXT,
    price NUMERIC(10, 2),
    availability TEXT DEFAULT 'available' CHECK (availability IN ('available', 'out_of_stock', 'pre_order')),
    featured BOOLEAN DEFAULT false,
    is_bestseller BOOLEAN DEFAULT false,
    popularity INTEGER DEFAULT 0,
    display_order INTEGER DEFAULT 1,
    is_sample BOOLEAN DEFAULT false,
    key_points_english JSONB DEFAULT '[]'::jsonb,
    key_points_marathi JSONB DEFAULT '[]'::jsonb,
    suitable_crops_english JSONB DEFAULT '[]'::jsonb,
    suitable_crops_marathi JSONB DEFAULT '[]'::jsonb,
    translation_source TEXT,
    custom_translation BOOLEAN DEFAULT false,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ==============================================================================
-- TABLE 3: brands
-- ==============================================================================
CREATE TABLE IF NOT EXISTS public.brands (
    id TEXT PRIMARY KEY,
    name TEXT NOT NULL,
    logo TEXT NOT NULL,
    display_order INTEGER DEFAULT 1,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ==============================================================================
-- TABLE 4: field_visits
-- ==============================================================================
CREATE TABLE IF NOT EXISTS public.field_visits (
    id TEXT PRIMARY KEY,
    title_en TEXT NOT NULL,
    title_mr TEXT NOT NULL,
    image_src TEXT NOT NULL,
    alt_en TEXT,
    alt_mr TEXT,
    tag_en TEXT,
    tag_mr TEXT,
    description_en TEXT,
    description_mr TEXT,
    display_order INTEGER DEFAULT 1,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ==============================================================================
-- TABLE 5: field_experiences
-- ==============================================================================
CREATE TABLE IF NOT EXISTS public.field_experiences (
    id TEXT PRIMARY KEY,
    crop_key TEXT NOT NULL,
    crop_name_english TEXT NOT NULL,
    crop_name_marathi TEXT NOT NULL,
    title_english TEXT NOT NULL,
    title_marathi TEXT NOT NULL,
    summary_english TEXT DEFAULT '',
    summary_marathi TEXT DEFAULT '',
    observation_english TEXT DEFAULT '',
    observation_marathi TEXT DEFAULT '',
    practice_english TEXT DEFAULT '',
    practice_marathi TEXT DEFAULT '',
    season_english TEXT,
    season_marathi TEXT,
    stage_english TEXT,
    stage_marathi TEXT,
    category_key TEXT,
    is_sample BOOLEAN DEFAULT false,
    image TEXT,
    related_product_ids JSONB DEFAULT '[]'::jsonb,
    key_insights_english JSONB DEFAULT '[]'::jsonb,
    key_insights_marathi JSONB DEFAULT '[]'::jsonb,
    translation_source TEXT,
    custom_translation BOOLEAN DEFAULT false,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ==============================================================================
-- TABLE 6: farmer_results
-- ==============================================================================
CREATE TABLE IF NOT EXISTS public.farmer_results (
    id TEXT PRIMARY KEY,
    image TEXT NOT NULL,
    name_en TEXT NOT NULL,
    name_mr TEXT NOT NULL,
    location_en TEXT NOT NULL,
    location_mr TEXT NOT NULL,
    display_order INTEGER DEFAULT 1,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ==============================================================================
-- TABLE 7: business_info
-- ==============================================================================
CREATE TABLE IF NOT EXISTS public.business_info (
    id TEXT PRIMARY KEY DEFAULT 'default_business_info',
    name TEXT NOT NULL,
    name_mr TEXT NOT NULL,
    proprietor TEXT NOT NULL,
    proprietor_mr TEXT,
    address TEXT NOT NULL,
    address_mr TEXT,
    landmark TEXT,
    landmark_mr TEXT,
    city TEXT NOT NULL,
    district TEXT NOT NULL,
    state TEXT NOT NULL,
    pincode TEXT NOT NULL,
    phone TEXT NOT NULL,
    alternate_phone TEXT,
    email TEXT NOT NULL,
    whatsapp TEXT NOT NULL,
    gst_number TEXT,
    fertilizer_license TEXT,
    pesticide_license TEXT,
    seed_license TEXT,
    latitude NUMERIC(10, 7) NOT NULL,
    longitude NUMERIC(10, 7) NOT NULL,
    opening_time TEXT,
    closing_time TEXT,
    working_days TEXT,
    working_days_mr TEXT,
    google_maps_url TEXT,
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ==============================================================================
-- TABLE 8: owner_profile
-- ==============================================================================
CREATE TABLE IF NOT EXISTS public.owner_profile (
    id TEXT PRIMARY KEY DEFAULT 'default_owner_profile',
    name TEXT NOT NULL,
    name_mr TEXT NOT NULL,
    title TEXT NOT NULL,
    title_mr TEXT NOT NULL,
    bio_en TEXT NOT NULL,
    bio_mr TEXT NOT NULL,
    experience_years INTEGER DEFAULT 15,
    education_en TEXT,
    education_mr TEXT,
    image TEXT NOT NULL,
    phone TEXT,
    email TEXT,
    consultation_available BOOLEAN DEFAULT true,
    specialties_en JSONB DEFAULT '[]'::jsonb,
    specialties_mr JSONB DEFAULT '[]'::jsonb,
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ==============================================================================
-- TABLE 9: admin_audit_logs
-- ==============================================================================
CREATE TABLE IF NOT EXISTS public.admin_audit_logs (
    id TEXT PRIMARY KEY DEFAULT ('audit_' || EXTRACT(EPOCH FROM NOW())::TEXT || '_' || SUBSTRING(MD5(RANDOM()::TEXT) FROM 1 FOR 6)),
    action_en TEXT NOT NULL,
    action_mr TEXT NOT NULL,
    item_type TEXT NOT NULL,
    performed_by TEXT NOT NULL DEFAULT 'Administrator',
    timestamp TIMESTAMPTZ DEFAULT NOW()
);

-- ==============================================================================
-- INDEXES FOR HIGH-PERFORMANCE QUERYING
-- ==============================================================================
CREATE INDEX IF NOT EXISTS idx_products_category ON public.products(category_id);
CREATE INDEX IF NOT EXISTS idx_products_featured ON public.products(featured);
CREATE INDEX IF NOT EXISTS idx_products_bestseller ON public.products(is_bestseller);
CREATE INDEX IF NOT EXISTS idx_products_order ON public.products(display_order);
CREATE INDEX IF NOT EXISTS idx_categories_order ON public.categories(display_order);
CREATE INDEX IF NOT EXISTS idx_categories_active ON public.categories(active);
CREATE INDEX IF NOT EXISTS idx_field_visits_order ON public.field_visits(display_order);
CREATE INDEX IF NOT EXISTS idx_farmer_results_order ON public.farmer_results(display_order);
CREATE INDEX IF NOT EXISTS idx_audit_logs_timestamp ON public.admin_audit_logs(timestamp DESC);

-- ==============================================================================
-- ROLE PERMISSIONS & GRANTS
-- ==============================================================================
GRANT USAGE ON SCHEMA public TO anon, authenticated, service_role;
GRANT ALL ON ALL TABLES IN SCHEMA public TO anon, authenticated, service_role;
GRANT ALL ON ALL SEQUENCES IN SCHEMA public TO anon, authenticated, service_role;
GRANT ALL ON ALL ROUTINES IN SCHEMA public TO anon, authenticated, service_role;

ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT ALL ON TABLES TO anon, authenticated, service_role;
ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT ALL ON SEQUENCES TO anon, authenticated, service_role;
ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT ALL ON ROUTINES TO anon, authenticated, service_role;

-- ==============================================================================
-- ROW-LEVEL SECURITY (RLS) POLICIES
-- ==============================================================================
-- Enable RLS on all tables
ALTER TABLE public.categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.products ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.brands ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.field_visits ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.field_experiences ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.farmer_results ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.business_info ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.owner_profile ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.admin_audit_logs ENABLE ROW LEVEL SECURITY;

-- Helper condition: Strictly allow server backend (service_role) or verified admin emails/claims.
-- Note: Generic auth.role() = 'authenticated' is deliberately NOT permitted to prevent
-- any newly registered or unverified Supabase Auth user from modifying catalog data.

-- 1. Categories Policies
CREATE POLICY "Public Read Categories" ON public.categories
    FOR SELECT USING (true);

CREATE POLICY "Admin Modify Categories" ON public.categories
    FOR ALL USING (
        auth.role() = 'service_role' OR
        (auth.role() = 'authenticated' AND (
            auth.jwt() ->> 'email' IN ('balirajaksk.kaij@gmail.com') OR
            auth.jwt() -> 'app_metadata' ->> 'role' = 'admin'
        ))
    )
    WITH CHECK (
        auth.role() = 'service_role' OR
        (auth.role() = 'authenticated' AND (
            auth.jwt() ->> 'email' IN ('balirajaksk.kaij@gmail.com') OR
            auth.jwt() -> 'app_metadata' ->> 'role' = 'admin'
        ))
    );

-- 2. Products Policies
CREATE POLICY "Public Read Products" ON public.products
    FOR SELECT USING (true);

CREATE POLICY "Admin Modify Products" ON public.products
    FOR ALL USING (
        auth.role() = 'service_role' OR
        (auth.role() = 'authenticated' AND (
            auth.jwt() ->> 'email' IN ('balirajaksk.kaij@gmail.com') OR
            auth.jwt() -> 'app_metadata' ->> 'role' = 'admin'
        ))
    )
    WITH CHECK (
        auth.role() = 'service_role' OR
        (auth.role() = 'authenticated' AND (
            auth.jwt() ->> 'email' IN ('balirajaksk.kaij@gmail.com') OR
            auth.jwt() -> 'app_metadata' ->> 'role' = 'admin'
        ))
    );

-- 3. Brands Policies
CREATE POLICY "Public Read Brands" ON public.brands
    FOR SELECT USING (true);

CREATE POLICY "Admin Modify Brands" ON public.brands
    FOR ALL USING (
        auth.role() = 'service_role' OR
        (auth.role() = 'authenticated' AND (
            auth.jwt() ->> 'email' IN ('balirajaksk.kaij@gmail.com') OR
            auth.jwt() -> 'app_metadata' ->> 'role' = 'admin'
        ))
    )
    WITH CHECK (
        auth.role() = 'service_role' OR
        (auth.role() = 'authenticated' AND (
            auth.jwt() ->> 'email' IN ('balirajaksk.kaij@gmail.com') OR
            auth.jwt() -> 'app_metadata' ->> 'role' = 'admin'
        ))
    );

-- 4. Field Visits Policies
CREATE POLICY "Public Read Field Visits" ON public.field_visits
    FOR SELECT USING (true);

CREATE POLICY "Admin Modify Field Visits" ON public.field_visits
    FOR ALL USING (
        auth.role() = 'service_role' OR
        (auth.role() = 'authenticated' AND (
            auth.jwt() ->> 'email' IN ('balirajaksk.kaij@gmail.com') OR
            auth.jwt() -> 'app_metadata' ->> 'role' = 'admin'
        ))
    )
    WITH CHECK (
        auth.role() = 'service_role' OR
        (auth.role() = 'authenticated' AND (
            auth.jwt() ->> 'email' IN ('balirajaksk.kaij@gmail.com') OR
            auth.jwt() -> 'app_metadata' ->> 'role' = 'admin'
        ))
    );

-- 5. Field Experiences Policies
CREATE POLICY "Public Read Field Experiences" ON public.field_experiences
    FOR SELECT USING (true);

CREATE POLICY "Admin Modify Field Experiences" ON public.field_experiences
    FOR ALL USING (
        auth.role() = 'service_role' OR
        (auth.role() = 'authenticated' AND (
            auth.jwt() ->> 'email' IN ('balirajaksk.kaij@gmail.com') OR
            auth.jwt() -> 'app_metadata' ->> 'role' = 'admin'
        ))
    )
    WITH CHECK (
        auth.role() = 'service_role' OR
        (auth.role() = 'authenticated' AND (
            auth.jwt() ->> 'email' IN ('balirajaksk.kaij@gmail.com') OR
            auth.jwt() -> 'app_metadata' ->> 'role' = 'admin'
        ))
    );

-- 6. Farmer Results Policies
CREATE POLICY "Public Read Farmer Results" ON public.farmer_results
    FOR SELECT USING (true);

CREATE POLICY "Admin Modify Farmer Results" ON public.farmer_results
    FOR ALL USING (
        auth.role() = 'service_role' OR
        (auth.role() = 'authenticated' AND (
            auth.jwt() ->> 'email' IN ('balirajaksk.kaij@gmail.com') OR
            auth.jwt() -> 'app_metadata' ->> 'role' = 'admin'
        ))
    )
    WITH CHECK (
        auth.role() = 'service_role' OR
        (auth.role() = 'authenticated' AND (
            auth.jwt() ->> 'email' IN ('balirajaksk.kaij@gmail.com') OR
            auth.jwt() -> 'app_metadata' ->> 'role' = 'admin'
        ))
    );

-- 7. Business Info Policies
CREATE POLICY "Public Read Business Info" ON public.business_info
    FOR SELECT USING (true);

CREATE POLICY "Admin Modify Business Info" ON public.business_info
    FOR ALL USING (
        auth.role() = 'service_role' OR
        (auth.role() = 'authenticated' AND (
            auth.jwt() ->> 'email' IN ('balirajaksk.kaij@gmail.com') OR
            auth.jwt() -> 'app_metadata' ->> 'role' = 'admin'
        ))
    )
    WITH CHECK (
        auth.role() = 'service_role' OR
        (auth.role() = 'authenticated' AND (
            auth.jwt() ->> 'email' IN ('balirajaksk.kaij@gmail.com') OR
            auth.jwt() -> 'app_metadata' ->> 'role' = 'admin'
        ))
    );

-- 8. Owner Profile Policies
CREATE POLICY "Public Read Owner Profile" ON public.owner_profile
    FOR SELECT USING (true);

CREATE POLICY "Admin Modify Owner Profile" ON public.owner_profile
    FOR ALL USING (
        auth.role() = 'service_role' OR
        (auth.role() = 'authenticated' AND (
            auth.jwt() ->> 'email' IN ('balirajaksk.kaij@gmail.com') OR
            auth.jwt() -> 'app_metadata' ->> 'role' = 'admin'
        ))
    )
    WITH CHECK (
        auth.role() = 'service_role' OR
        (auth.role() = 'authenticated' AND (
            auth.jwt() ->> 'email' IN ('balirajaksk.kaij@gmail.com') OR
            auth.jwt() -> 'app_metadata' ->> 'role' = 'admin'
        ))
    );

-- 9. Audit Logs Policies (Restricted to Admins & Service Role)
CREATE POLICY "Admin Read Audit Logs" ON public.admin_audit_logs
    FOR SELECT USING (
        auth.role() = 'service_role' OR
        (auth.role() = 'authenticated' AND (
            auth.jwt() ->> 'email' IN ('balirajaksk.kaij@gmail.com') OR
            auth.jwt() -> 'app_metadata' ->> 'role' = 'admin'
        ))
    );

CREATE POLICY "Admin Insert Audit Logs" ON public.admin_audit_logs
    FOR INSERT WITH CHECK (
        auth.role() = 'service_role' OR
        (auth.role() = 'authenticated' AND (
            auth.jwt() ->> 'email' IN ('balirajaksk.kaij@gmail.com') OR
            auth.jwt() -> 'app_metadata' ->> 'role' = 'admin'
        ))
    );

-- ==============================================================================
-- STORAGE BUCKET CONFIGURATION (Public Read / Admin Write)
-- ==============================================================================
INSERT INTO storage.buckets (id, name, public)
VALUES ('baliraja-assets', 'baliraja-assets', true)
ON CONFLICT (id) DO UPDATE SET public = true;

CREATE POLICY "Public Read Assets" ON storage.objects
    FOR SELECT USING (bucket_id = 'baliraja-assets');

CREATE POLICY "Admin Upload Assets" ON storage.objects
    FOR INSERT WITH CHECK (
        bucket_id = 'baliraja-assets' AND (
            auth.role() = 'service_role' OR
            (auth.role() = 'authenticated' AND (
                auth.jwt() ->> 'email' IN ('balirajaksk.kaij@gmail.com') OR
                auth.jwt() -> 'app_metadata' ->> 'role' = 'admin'
            ))
        )
    );

CREATE POLICY "Admin Delete Assets" ON storage.objects
    FOR DELETE USING (
        bucket_id = 'baliraja-assets' AND (
            auth.role() = 'service_role' OR
            (auth.role() = 'authenticated' AND (
                auth.jwt() ->> 'email' IN ('balirajaksk.kaij@gmail.com') OR
                auth.jwt() -> 'app_metadata' ->> 'role' = 'admin'
            ))
        )
    );
