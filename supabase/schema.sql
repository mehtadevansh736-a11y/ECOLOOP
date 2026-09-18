-- ===================================================
-- ECOLOOP DATABASE SCHEMA FOR SUPABASE & POSTGRESQL
-- ===================================================

-- Enable UUID Extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- 1. PROFILES TABLE
CREATE TABLE IF NOT EXISTS public.profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  full_name TEXT NOT NULL,
  email TEXT UNIQUE NOT NULL,
  avatar_url TEXT,
  eco_points INTEGER DEFAULT 0,
  co2_saved NUMERIC(10, 2) DEFAULT 0.00,
  items_diverted INTEGER DEFAULT 0,
  items_reused INTEGER DEFAULT 0,
  items_recycled INTEGER DEFAULT 0,
  items_donated INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 2. SCANS TABLE
CREATE TABLE IF NOT EXISTS public.scans (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE,
  image_url TEXT NOT NULL,
  item_name TEXT NOT NULL,
  category TEXT NOT NULL,
  material TEXT NOT NULL,
  condition TEXT NOT NULL,
  reusable BOOLEAN DEFAULT true,
  repairable BOOLEAN DEFAULT true,
  recyclable BOOLEAN DEFAULT true,
  recommended_action TEXT NOT NULL,
  circularity_score INTEGER NOT NULL CHECK (circularity_score BETWEEN 0 AND 100),
  confidence NUMERIC(5, 2) NOT NULL,
  reason TEXT NOT NULL,
  co2_estimate NUMERIC(10, 2) DEFAULT 0.00,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 3. LISTINGS TABLE
CREATE TABLE IF NOT EXISTS public.listings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  description TEXT NOT NULL,
  category TEXT NOT NULL,
  condition TEXT NOT NULL,
  material TEXT,
  price NUMERIC(10, 2) DEFAULT 0.00,
  image_url TEXT NOT NULL,
  location TEXT NOT NULL,
  listing_type TEXT DEFAULT 'Sell', -- 'Sell', 'Donate'
  status TEXT DEFAULT 'active', -- 'active', 'reserved', 'sold', 'donated', 'completed', 'archived'
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 4. CENTERS TABLE
CREATE TABLE IF NOT EXISTS public.centers (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  type TEXT NOT NULL, -- 'Recycling', 'Repair', 'Donation', 'E-waste'
  address TEXT NOT NULL,
  latitude NUMERIC(10, 6),
  longitude NUMERIC(10, 6),
  accepted_materials TEXT[] DEFAULT '{}',
  phone TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 5. ACTIVITIES TABLE
CREATE TABLE IF NOT EXISTS public.activities (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE,
  scan_id UUID REFERENCES public.scans(id) ON DELETE SET NULL,
  activity_type TEXT NOT NULL, -- 'Reuse', 'Repair', 'Donate', 'Resell', 'Recycle', 'Dispose'
  points INTEGER NOT NULL DEFAULT 0,
  co2_saved NUMERIC(10, 2) NOT NULL DEFAULT 0.00,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 6. LISTING REQUESTS TABLE
CREATE TABLE IF NOT EXISTS public.listing_requests (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  listing_id UUID REFERENCES public.listings(id) ON DELETE CASCADE,
  requester_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE,
  seller_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE,
  message TEXT,
  status TEXT DEFAULT 'pending', -- 'pending', 'accepted', 'rejected', 'completed', 'cancelled'
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- INDEXES FOR SPEED
CREATE INDEX IF NOT EXISTS idx_scans_user_id ON public.scans(user_id);
CREATE INDEX IF NOT EXISTS idx_listings_user_id ON public.listings(user_id);
CREATE INDEX IF NOT EXISTS idx_activities_user_id ON public.activities(user_id);
CREATE INDEX IF NOT EXISTS idx_listing_requests_listing_id ON public.listing_requests(listing_id);
CREATE INDEX IF NOT EXISTS idx_listing_requests_requester_id ON public.listing_requests(requester_id);

-- ROW LEVEL SECURITY (RLS)
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.scans ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.listings ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.centers ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.activities ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.listing_requests ENABLE ROW LEVEL SECURITY;

-- POLICIES FOR PROFILES
CREATE POLICY "Public profiles are viewable by everyone" ON public.profiles FOR SELECT USING (true);
CREATE POLICY "Users can update own profile" ON public.profiles FOR UPDATE USING (auth.uid() = id);

-- POLICIES FOR SCANS
CREATE POLICY "Users can view own scans" ON public.scans FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own scans" ON public.scans FOR INSERT WITH CHECK (auth.uid() = user_id);

-- POLICIES FOR LISTINGS
CREATE POLICY "Listings are viewable by everyone" ON public.listings FOR SELECT USING (true);
CREATE POLICY "Users can insert own listings" ON public.listings FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own listings" ON public.listings FOR UPDATE USING (auth.uid() = user_id);

-- POLICIES FOR CENTERS
CREATE POLICY "Centers are viewable by everyone" ON public.centers FOR SELECT USING (true);

-- POLICIES FOR ACTIVITIES
CREATE POLICY "Activities are viewable by everyone" ON public.activities FOR SELECT USING (true);
CREATE POLICY "Users can insert own activities" ON public.activities FOR INSERT WITH CHECK (auth.uid() = user_id);

-- POLICIES FOR LISTING REQUESTS
CREATE POLICY "Users can view own requests or requests for own listings" ON public.listing_requests FOR SELECT USING (auth.uid() = requester_id OR auth.uid() = seller_id);
CREATE POLICY "Users can create requests" ON public.listing_requests FOR INSERT WITH CHECK (auth.uid() = requester_id);
CREATE POLICY "Users can update own requests" ON public.listing_requests FOR UPDATE USING (auth.uid() = requester_id OR auth.uid() = seller_id);

-- TRIGGER FOR NEW USER CREATION IN AUTH.USERS
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (id, full_name, email, avatar_url, eco_points, co2_saved, items_diverted)
  VALUES (
    new.id,
    COALESCE(new.raw_user_meta_data->>'full_name', 'Eco Pioneer'),
    new.email,
    COALESCE(new.raw_user_meta_data->>'avatar_url', 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?auto=format&fit=crop&w=150&q=80'),
    100, -- Welcome 100 bonus eco points
    0.0,
    0
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- DROP IF EXISTS BEFORE CREATING TRIGGER
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- SEED DATA FOR CENTERS
INSERT INTO public.centers (name, type, address, latitude, longitude, accepted_materials, phone) VALUES
('EcoTech E-Waste & Electronics Recycling', 'E-waste', '742 Evergreen Terrace, Eco District', 37.774929, -122.419416, ARRAY['Electronics', 'Metal', 'Batteries'], '+1 (555) 234-5678'),
('GreenThread Clothing Donation Hub', 'Donation', '108 Compassion Way, Metro City', 37.783333, -122.416667, ARRAY['Textile', 'Leather', 'Shoes'], '+1 (555) 876-5432'),
('FixIt All Community Repair Cafe', 'Repair', '45 Renewal Blvd, Tech Park', 37.765000, -122.425000, ARRAY['Furniture', 'Electronics', 'Appliances'], '+1 (555) 345-6789'),
('ClearStream Glass & Metal Recovery', 'Recycling', '89 Industrial Parkway, Dockside', 37.755000, -122.405000, ARRAY['Glass', 'Metal', 'Aluminum', 'Plastic'], '+1 (555) 901-2345'),
('Second Life Furniture & Home Thrift', 'Donation', '312 Goodwill St, Midtown', 37.790000, -122.410000, ARRAY['Furniture', 'Organic', 'Mixed'], '+1 (555) 432-1098');
