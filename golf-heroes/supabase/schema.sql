-- ============================================================
-- Golf Heroes — Complete Database Schema
-- Run this against your Supabase SQL Editor
-- ============================================================

-- Enable required extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ─── ENUMS ──────────────────────────────────────────────────

DO $$ BEGIN
  CREATE TYPE user_role AS ENUM ('subscriber', 'admin');
EXCEPTION WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
  CREATE TYPE subscription_status AS ENUM ('active', 'inactive', 'cancelled', 'lapsed');
EXCEPTION WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
  CREATE TYPE subscription_plan AS ENUM ('monthly', 'yearly');
EXCEPTION WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
  CREATE TYPE draw_status AS ENUM ('pending', 'simulated', 'published');
EXCEPTION WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
  CREATE TYPE draw_type AS ENUM ('random', 'algorithmic');
EXCEPTION WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
  CREATE TYPE match_type AS ENUM ('three_match', 'four_match', 'five_match');
EXCEPTION WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
  CREATE TYPE payment_status AS ENUM ('pending', 'paid', 'rejected');
EXCEPTION WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
  CREATE TYPE verification_status AS ENUM ('pending', 'approved', 'rejected');
EXCEPTION WHEN duplicate_object THEN null;
END $$;

-- ─── TABLES ─────────────────────────────────────────────────

-- 1. Profiles — extends Supabase auth.users
CREATE TABLE IF NOT EXISTS profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email TEXT NOT NULL,
  full_name TEXT NOT NULL DEFAULT '',
  avatar_url TEXT,
  role user_role NOT NULL DEFAULT 'subscriber',
  selected_charity_id UUID,
  charity_contribution_percent INTEGER NOT NULL DEFAULT 10
    CHECK (charity_contribution_percent >= 10 AND charity_contribution_percent <= 100),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- 2. Subscriptions
CREATE TABLE IF NOT EXISTS subscriptions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  plan subscription_plan NOT NULL DEFAULT 'monthly',
  status subscription_status NOT NULL DEFAULT 'inactive',
  price_cents INTEGER NOT NULL DEFAULT 999, -- £9.99 monthly
  current_period_start TIMESTAMPTZ,
  current_period_end TIMESTAMPTZ,
  cancelled_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(user_id) -- one subscription per user
);

-- 3. Charities
CREATE TABLE IF NOT EXISTS charities (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name TEXT NOT NULL,
  slug TEXT NOT NULL UNIQUE,
  description TEXT NOT NULL DEFAULT '',
  short_description TEXT NOT NULL DEFAULT '',
  image_url TEXT,
  website_url TEXT,
  upcoming_events TEXT,
  is_featured BOOLEAN NOT NULL DEFAULT false,
  total_received_cents INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- 4. Scores — golf scores in Stableford format
CREATE TABLE IF NOT EXISTS scores (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  score INTEGER NOT NULL CHECK (score >= 1 AND score <= 45),
  played_date DATE NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(user_id, played_date) -- one score per date per user
);

-- Index for efficient queries
CREATE INDEX IF NOT EXISTS idx_scores_user_date ON scores(user_id, played_date DESC);

-- 5. Draws — monthly draws
CREATE TABLE IF NOT EXISTS draws (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  draw_date DATE NOT NULL UNIQUE,
  month INTEGER NOT NULL,
  year INTEGER NOT NULL,
  status draw_status NOT NULL DEFAULT 'pending',
  draw_type draw_type NOT NULL DEFAULT 'random',
  winning_numbers INTEGER[] NOT NULL DEFAULT '{}', -- 5 numbers
  total_pool_cents INTEGER NOT NULL DEFAULT 0,
  five_match_pool_cents INTEGER NOT NULL DEFAULT 0,
  four_match_pool_cents INTEGER NOT NULL DEFAULT 0,
  three_match_pool_cents INTEGER NOT NULL DEFAULT 0,
  jackpot_rollover_cents INTEGER NOT NULL DEFAULT 0,
  published_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- 6. Draw entries — user participation in draws
CREATE TABLE IF NOT EXISTS draw_entries (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  draw_id UUID NOT NULL REFERENCES draws(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  entered_numbers INTEGER[] NOT NULL DEFAULT '{}', -- user's 5 scores
  matches INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(draw_id, user_id) -- one entry per draw per user
);

-- 7. Winners
CREATE TABLE IF NOT EXISTS winners (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  draw_id UUID NOT NULL REFERENCES draws(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  match_type match_type NOT NULL,
  matched_numbers INTEGER[] NOT NULL DEFAULT '{}',
  prize_amount_cents INTEGER NOT NULL DEFAULT 0,
  payment_status payment_status NOT NULL DEFAULT 'pending',
  verification_status verification_status NOT NULL DEFAULT 'pending',
  proof_image_url TEXT,
  admin_notes TEXT,
  paid_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- 8. Donations — independent donations not tied to subscription
CREATE TABLE IF NOT EXISTS donations (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  charity_id UUID NOT NULL REFERENCES charities(id) ON DELETE CASCADE,
  amount_cents INTEGER NOT NULL CHECK (amount_cents > 0),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- ─── ADMIN HELPER FUNCTION ──────────────────────────────────
-- IMPORTANT: Using SECURITY DEFINER to bypass RLS when checking admin role
-- avoids infinite recursion in policies that query the profiles table.
CREATE OR REPLACE FUNCTION public.is_admin()
RETURNS BOOLEAN AS $$
  SELECT COALESCE(
    (SELECT role = 'admin' FROM public.profiles WHERE id = auth.uid()),
    false
  );
$$ LANGUAGE sql SECURITY DEFINER STABLE;

-- ─── ROW LEVEL SECURITY ─────────────────────────────────────

ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE subscriptions ENABLE ROW LEVEL SECURITY;
ALTER TABLE charities ENABLE ROW LEVEL SECURITY;
ALTER TABLE scores ENABLE ROW LEVEL SECURITY;
ALTER TABLE draws ENABLE ROW LEVEL SECURITY;
ALTER TABLE draw_entries ENABLE ROW LEVEL SECURITY;
ALTER TABLE winners ENABLE ROW LEVEL SECURITY;
ALTER TABLE donations ENABLE ROW LEVEL SECURITY;

-- Profiles policies (NOTE: is_admin() prevents recursion)
CREATE POLICY "Users can view own profile" ON profiles
  FOR SELECT USING (auth.uid() = id);
CREATE POLICY "Users can update own profile" ON profiles
  FOR UPDATE USING (auth.uid() = id);
CREATE POLICY "Admins can view all profiles" ON profiles
  FOR SELECT USING (public.is_admin());
CREATE POLICY "Admins can update all profiles" ON profiles
  FOR UPDATE USING (public.is_admin());

-- Subscriptions policies
CREATE POLICY "Users can view own subscription" ON subscriptions
  FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own subscription" ON subscriptions
  FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own subscription" ON subscriptions
  FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Admins can manage all subscriptions" ON subscriptions
  FOR ALL USING (public.is_admin());

-- Charities — publicly readable
CREATE POLICY "Anyone can view charities" ON charities
  FOR SELECT USING (true);
CREATE POLICY "Admins can manage charities" ON charities
  FOR ALL USING (public.is_admin());

-- Scores policies
CREATE POLICY "Users can view own scores" ON scores
  FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own scores" ON scores
  FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own scores" ON scores
  FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can delete own scores" ON scores
  FOR DELETE USING (auth.uid() = user_id);
CREATE POLICY "Admins can manage all scores" ON scores
  FOR ALL USING (public.is_admin());

-- Draws — publicly readable when published
CREATE POLICY "Anyone can view published draws" ON draws
  FOR SELECT USING (status = 'published');
CREATE POLICY "Subscribers can view pending draws" ON draws
  FOR SELECT USING (auth.uid() IS NOT NULL);
CREATE POLICY "Admins can manage draws" ON draws
  FOR ALL USING (public.is_admin());

-- Draw entries
CREATE POLICY "Users can view own entries" ON draw_entries
  FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Admins can manage entries" ON draw_entries
  FOR ALL USING (public.is_admin());

-- Winners
CREATE POLICY "Users can view own winnings" ON winners
  FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can update own proof" ON winners
  FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Admins can manage winners" ON winners
  FOR ALL USING (public.is_admin());

-- Donations
CREATE POLICY "Users can view own donations" ON donations
  FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own donations" ON donations
  FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Admins can view all donations" ON donations
  FOR SELECT USING (public.is_admin());


-- ─── TRIGGERS ────────────────────────────────────────────────

-- Auto-create profile on user signup
CREATE OR REPLACE FUNCTION handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (id, email, full_name)
  VALUES (
    NEW.id,
    NEW.email,
    COALESCE(NEW.raw_user_meta_data->>'full_name', '')
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION handle_new_user();

-- Auto-update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_profiles_updated_at
  BEFORE UPDATE ON profiles FOR EACH ROW EXECUTE FUNCTION update_updated_at();
CREATE TRIGGER update_subscriptions_updated_at
  BEFORE UPDATE ON subscriptions FOR EACH ROW EXECUTE FUNCTION update_updated_at();
CREATE TRIGGER update_charities_updated_at
  BEFORE UPDATE ON charities FOR EACH ROW EXECUTE FUNCTION update_updated_at();
CREATE TRIGGER update_scores_updated_at
  BEFORE UPDATE ON scores FOR EACH ROW EXECUTE FUNCTION update_updated_at();
CREATE TRIGGER update_draws_updated_at
  BEFORE UPDATE ON draws FOR EACH ROW EXECUTE FUNCTION update_updated_at();
CREATE TRIGGER update_winners_updated_at
  BEFORE UPDATE ON winners FOR EACH ROW EXECUTE FUNCTION update_updated_at();

-- ─── SEED DATA — SAMPLE CHARITIES ──────────────────────────

INSERT INTO charities (name, slug, description, short_description, image_url, is_featured) VALUES
(
  'The Golf Trust',
  'the-golf-trust',
  'The Golf Trust brings the joy of golf to young people from disadvantaged backgrounds. Through coaching, mentoring, and access to courses, we help build confidence, life skills, and lasting friendships.',
  'Bringing golf to disadvantaged youth',
  'https://images.unsplash.com/photo-1535131749006-b7f58c99034b?w=800',
  true
),
(
  'Cancer Research UK',
  'cancer-research-uk',
  'Cancer Research UK is the world''s leading cancer charity dedicated to saving lives through research, influence and information. We fund scientists, doctors and nurses to help beat cancer sooner.',
  'Beating cancer through research',
  'https://images.unsplash.com/photo-1579154204601-01588f351e67?w=800',
  true
),
(
  'Mind Mental Health',
  'mind-mental-health',
  'Mind provides advice and support to empower anyone experiencing a mental health problem. We campaign to improve services, raise awareness and promote understanding.',
  'Mental health support for everyone',
  'https://images.unsplash.com/photo-1544027993-37dbfe43562a?w=800',
  true
),
(
  'Children in Need',
  'children-in-need',
  'BBC Children in Need exists to make sure every child in the UK has the childhood they deserve. We fund local charities and projects that help remove the barriers that children face.',
  'Every child deserves a great childhood',
  'https://images.unsplash.com/photo-1488521787991-ed7bbaae773c?w=800',
  false
),
(
  'Macmillan Cancer Support',
  'macmillan-cancer-support',
  'Macmillan Cancer Support provides physical, financial, and emotional support for people living with cancer. From diagnosis through treatment and beyond, we''re there for you.',
  'Supporting people living with cancer',
  'https://images.unsplash.com/photo-1532938911079-1b06ac7ceec7?w=800',
  false
),
(
  'British Heart Foundation',
  'british-heart-foundation',
  'The British Heart Foundation funds groundbreaking research into the causes of heart and circulatory diseases and the prevention, treatment and cure of them.',
  'Fighting heart disease together',
  'https://images.unsplash.com/photo-1559757175-5700dde675bc?w=800',
  false
)
ON CONFLICT (slug) DO NOTHING;

-- ─── STORAGE BUCKET ──────────────────────────────────────────

-- Create storage bucket for winner proof images (run in Supabase Dashboard > Storage)
-- INSERT INTO storage.buckets (id, name, public) VALUES ('winner-proofs', 'winner-proofs', false);
