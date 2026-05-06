-- ============================================
-- PulseGrid Database Schema
-- ============================================

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ============================================
-- PROFILES TABLE
-- ============================================
CREATE TABLE IF NOT EXISTS public.profiles (
  id UUID REFERENCES auth.users(id) ON DELETE CASCADE PRIMARY KEY,
  email TEXT UNIQUE NOT NULL,
  full_name TEXT,
  avatar_url TEXT,
  role TEXT DEFAULT 'user' CHECK (role IN ('user', 'super_admin')),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Auto-set super_admin for specific email
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (id, email, full_name, avatar_url, role)
  VALUES (
    NEW.id,
    NEW.email,
    COALESCE(NEW.raw_user_meta_data->>'full_name', split_part(NEW.email, '@', 1)),
    NEW.raw_user_meta_data->>'avatar_url',
    CASE WHEN NEW.email = 'ttv4u5@gmail.com' THEN 'super_admin' ELSE 'user' END
  )
  ON CONFLICT (id) DO UPDATE SET
    email = EXCLUDED.email,
    full_name = COALESCE(EXCLUDED.full_name, profiles.full_name),
    avatar_url = COALESCE(EXCLUDED.avatar_url, profiles.avatar_url),
    updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- ============================================
-- PUNCH CARDS TABLE
-- ============================================
CREATE TABLE IF NOT EXISTS public.punch_cards (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  user_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
  month INTEGER NOT NULL CHECK (month BETWEEN 1 AND 12),
  year INTEGER NOT NULL,
  name TEXT,
  department TEXT,
  section TEXT,
  entries JSONB DEFAULT '[]'::jsonb,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(user_id, month, year)
);

-- ============================================
-- TRAVEL LOGS TABLE
-- ============================================
CREATE TABLE IF NOT EXISTS public.travel_logs (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  user_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
  tarikh DATE,
  masa TIME,
  masa_pergi TIME,
  masa_balik TIME,
  pemandu TEXT,
  tujuan TEXT,
  pelulus TEXT,
  pengguna TEXT,
  odo_mula NUMERIC DEFAULT 0,
  odo_akhir NUMERIC DEFAULT 0,
  jarak_km NUMERIC GENERATED ALWAYS AS (GREATEST(0, odo_akhir - odo_mula)) STORED,
  kos_rm NUMERIC DEFAULT 0,
  no_resit TEXT,
  liter NUMERIC DEFAULT 0,
  nota TEXT,
  resit_urls TEXT[] DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================
-- ENFORCEMENT DATA TABLE
-- ============================================
CREATE TABLE IF NOT EXISTS public.enforcement_data (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  user_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
  bil SERIAL,
  tahun INTEGER,
  bulan TEXT,
  penguatkuasa TEXT,
  jenis_rampasan TEXT,
  no_report_polis TEXT,
  no_kes_ip TEXT,
  tarikh_kejadian DATE,
  masa_kejadian TIME,
  lokasi_kejadian TEXT,
  kesalahan TEXT,
  undang_undang TEXT,
  kategori_kes TEXT,
  kes_serahan TEXT,
  catatan TEXT,
  -- Haiwan hidup
  lembu INTEGER DEFAULT 0,
  kerbau INTEGER DEFAULT 0,
  kambing INTEGER DEFAULT 0,
  bebiri INTEGER DEFAULT 0,
  babi INTEGER DEFAULT 0,
  ayam INTEGER DEFAULT 0,
  -- Karkas
  karkas_lembu INTEGER DEFAULT 0,
  karkas_kerbau INTEGER DEFAULT 0,
  karkas_kambing INTEGER DEFAULT 0,
  karkas_babi INTEGER DEFAULT 0,
  karkas_babi_sejuk_beku INTEGER DEFAULT 0,
  karkas_ayam INTEGER DEFAULT 0,
  -- Produk
  produk_sejuk_beku_itik INTEGER DEFAULT 0,
  produk_sejuk_beku_ayam INTEGER DEFAULT 0,
  produk_sejuk_beku_babi INTEGER DEFAULT 0,
  produk_haiwan_tin INTEGER DEFAULT 0,
  -- Haiwan lain
  anjing INTEGER DEFAULT 0,
  kucing INTEGER DEFAULT 0,
  arnab INTEGER DEFAULT 0,
  burung INTEGER DEFAULT 0,
  hamster INTEGER DEFAULT 0,
  rampasan_lain TEXT,
  -- Nilai
  jumlah_rampasan_kenderaan NUMERIC DEFAULT 0,
  jumlah_rampasan_pengangkut NUMERIC DEFAULT 0,
  anggaran_nilai_ekor_kg NUMERIC DEFAULT 0,
  anggaran_nilai_kenderaan NUMERIC DEFAULT 0,
  anggaran_nilai_pengangkut NUMERIC DEFAULT 0,
  anggaran_nilai_lain NUMERIC DEFAULT 0,
  jumlah_nilai_keseluruhan NUMERIC GENERATED ALWAYS AS (
    COALESCE(jumlah_rampasan_kenderaan, 0) +
    COALESCE(jumlah_rampasan_pengangkut, 0) +
    COALESCE(anggaran_nilai_ekor_kg, 0) +
    COALESCE(anggaran_nilai_kenderaan, 0) +
    COALESCE(anggaran_nilai_pengangkut, 0) +
    COALESCE(anggaran_nilai_lain, 0)
  ) STORED,
  resit_urls TEXT[] DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================
-- ANNOUNCEMENTS TABLE
-- ============================================
CREATE TABLE IF NOT EXISTS public.announcements (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  title TEXT NOT NULL,
  message TEXT NOT NULL,
  created_by UUID REFERENCES public.profiles(id),
  is_active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================
-- ROW LEVEL SECURITY (RLS)
-- ============================================

-- Enable RLS
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.punch_cards ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.travel_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.enforcement_data ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.announcements ENABLE ROW LEVEL SECURITY;

-- Profiles policies
CREATE POLICY "Users can view own profile" ON public.profiles
  FOR SELECT USING (auth.uid() = id);

CREATE POLICY "Users can update own profile" ON public.profiles
  FOR UPDATE USING (auth.uid() = id);

CREATE POLICY "Super admins can view all profiles" ON public.profiles
  FOR SELECT USING (
    EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'super_admin')
  );

CREATE POLICY "Super admins can update all profiles" ON public.profiles
  FOR UPDATE USING (
    EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'super_admin')
  );

CREATE POLICY "Super admins can delete profiles" ON public.profiles
  FOR DELETE USING (
    EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'super_admin')
  );

-- Punch cards policies
CREATE POLICY "Users can manage own punch cards" ON public.punch_cards
  FOR ALL USING (auth.uid() = user_id);

CREATE POLICY "Super admins can manage all punch cards" ON public.punch_cards
  FOR ALL USING (
    EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'super_admin')
  );

-- Travel logs policies
CREATE POLICY "Users can manage own travel logs" ON public.travel_logs
  FOR ALL USING (auth.uid() = user_id);

CREATE POLICY "Super admins can manage all travel logs" ON public.travel_logs
  FOR ALL USING (
    EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'super_admin')
  );

-- Enforcement data policies
CREATE POLICY "Users can manage own enforcement data" ON public.enforcement_data
  FOR ALL USING (auth.uid() = user_id);

CREATE POLICY "Super admins can manage all enforcement data" ON public.enforcement_data
  FOR ALL USING (
    EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'super_admin')
  );

-- Announcements policies
CREATE POLICY "Anyone can view active announcements" ON public.announcements
  FOR SELECT USING (is_active = TRUE OR 
    EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'super_admin')
  );

CREATE POLICY "Super admins can manage announcements" ON public.announcements
  FOR ALL USING (
    EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'super_admin')
  );

-- ============================================
-- STORAGE BUCKET
-- ============================================
INSERT INTO storage.buckets (id, name, public) 
VALUES ('uploads', 'uploads', true)
ON CONFLICT (id) DO NOTHING;

CREATE POLICY "Authenticated users can upload" ON storage.objects
  FOR INSERT WITH CHECK (auth.role() = 'authenticated');

CREATE POLICY "Public can view uploads" ON storage.objects
  FOR SELECT USING (bucket_id = 'uploads');

CREATE POLICY "Users can delete own uploads" ON storage.objects
  FOR DELETE USING (auth.uid()::text = (storage.foldername(name))[2]);

-- ============================================
-- REALTIME
-- ============================================
ALTER PUBLICATION supabase_realtime ADD TABLE public.punch_cards;
ALTER PUBLICATION supabase_realtime ADD TABLE public.travel_logs;
ALTER PUBLICATION supabase_realtime ADD TABLE public.enforcement_data;
ALTER PUBLICATION supabase_realtime ADD TABLE public.announcements;
