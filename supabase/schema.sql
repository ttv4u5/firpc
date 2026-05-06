-- ============================================================
-- PULSEGRID - COMPLETE DATABASE SCHEMA
-- Jalankan keseluruhan fail ini di Supabase SQL Editor
-- ============================================================

-- Enable extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- ============================================================
-- STEP 1: DROP EXISTING (untuk fresh install)
-- ============================================================
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
DROP TRIGGER IF EXISTS update_profiles_updated_at ON public.profiles;
DROP TRIGGER IF EXISTS update_punch_cards_updated_at ON public.punch_cards;
DROP TRIGGER IF EXISTS update_travel_logs_updated_at ON public.travel_logs;
DROP TRIGGER IF EXISTS update_enforcement_updated_at ON public.enforcement_data;
DROP TRIGGER IF EXISTS update_announcements_updated_at ON public.announcements;

DROP FUNCTION IF EXISTS public.handle_new_user() CASCADE;
DROP FUNCTION IF EXISTS public.update_updated_at_column() CASCADE;

DROP TABLE IF EXISTS public.announcements CASCADE;
DROP TABLE IF EXISTS public.enforcement_data CASCADE;
DROP TABLE IF EXISTS public.travel_logs CASCADE;
DROP TABLE IF EXISTS public.punch_cards CASCADE;
DROP TABLE IF EXISTS public.profiles CASCADE;

-- ============================================================
-- STEP 2: UPDATED_AT TRIGGER FUNCTION
-- ============================================================
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- ============================================================
-- STEP 3: PROFILES TABLE
-- ============================================================
CREATE TABLE public.profiles (
  id            UUID        PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email         TEXT        UNIQUE NOT NULL,
  full_name     TEXT        DEFAULT '',
  avatar_url    TEXT        DEFAULT '',
  role          TEXT        NOT NULL DEFAULT 'user' CHECK (role IN ('user', 'super_admin')),
  department    TEXT        DEFAULT '',
  section       TEXT        DEFAULT '',
  phone         TEXT        DEFAULT '',
  created_at    TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at    TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TRIGGER update_profiles_updated_at
  BEFORE UPDATE ON public.profiles
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- Auto-create profile on signup + auto super_admin for ttv4u5@gmail.com
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (id, email, full_name, avatar_url, role)
  VALUES (
    NEW.id,
    COALESCE(NEW.email, ''),
    COALESCE(NEW.raw_user_meta_data->>'full_name', split_part(COALESCE(NEW.email,''), '@', 1)),
    COALESCE(NEW.raw_user_meta_data->>'avatar_url', ''),
    CASE WHEN NEW.email = 'ttv4u5@gmail.com' THEN 'super_admin' ELSE 'user' END
  )
  ON CONFLICT (id) DO UPDATE SET
    email      = EXCLUDED.email,
    full_name  = CASE WHEN profiles.full_name = '' THEN EXCLUDED.full_name ELSE profiles.full_name END,
    avatar_url = CASE WHEN profiles.avatar_url = '' THEN EXCLUDED.avatar_url ELSE profiles.avatar_url END,
    updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- ============================================================
-- STEP 4: PUNCH CARDS TABLE
-- ============================================================
CREATE TABLE public.punch_cards (
  id            UUID        PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id       UUID        NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  year          INTEGER     NOT NULL CHECK (year >= 2020 AND year <= 2099),
  month         INTEGER     NOT NULL CHECK (month BETWEEN 1 AND 12),
  name          TEXT        DEFAULT '',
  department    TEXT        DEFAULT '',
  section       TEXT        DEFAULT '',
  -- entries: array of {date, masuk1, keluar1, masuk2, keluar2, kenyataan, tandatangan}
  entries       JSONB       NOT NULL DEFAULT '[]'::jsonb,
  created_at    TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at    TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE(user_id, year, month)
);

CREATE TRIGGER update_punch_cards_updated_at
  BEFORE UPDATE ON public.punch_cards
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- Index for fast lookup
CREATE INDEX idx_punch_cards_user_year_month ON public.punch_cards(user_id, year, month);

-- ============================================================
-- STEP 5: TRAVEL LOGS TABLE
-- ============================================================
CREATE TABLE public.travel_logs (
  id            UUID        PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id       UUID        NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  tarikh        DATE,
  masa          TIME,
  masa_pergi    TIME,
  masa_balik    TIME,
  pemandu       TEXT        DEFAULT '',
  tujuan        TEXT        DEFAULT '',
  pelulus       TEXT        DEFAULT '',
  pengguna      TEXT        DEFAULT '',
  odo_mula      NUMERIC     NOT NULL DEFAULT 0 CHECK (odo_mula >= 0),
  odo_akhir     NUMERIC     NOT NULL DEFAULT 0 CHECK (odo_akhir >= 0),
  -- jarak_km dikira automatik
  jarak_km      NUMERIC     GENERATED ALWAYS AS (GREATEST(0, odo_akhir - odo_mula)) STORED,
  kos_rm        NUMERIC     NOT NULL DEFAULT 0 CHECK (kos_rm >= 0),
  no_resit      TEXT        DEFAULT '',
  liter         NUMERIC     NOT NULL DEFAULT 0 CHECK (liter >= 0),
  nota          TEXT        DEFAULT '',
  resit_urls    TEXT[]      NOT NULL DEFAULT '{}',
  created_at    TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at    TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TRIGGER update_travel_logs_updated_at
  BEFORE UPDATE ON public.travel_logs
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE INDEX idx_travel_logs_user_tarikh ON public.travel_logs(user_id, tarikh DESC);

-- ============================================================
-- STEP 6: ENFORCEMENT DATA TABLE
-- ============================================================
CREATE TABLE public.enforcement_data (
  id                          UUID        PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id                     UUID        NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,

  -- Maklumat Asas
  tahun                       INTEGER     DEFAULT EXTRACT(YEAR FROM NOW())::INTEGER,
  bulan                       TEXT        DEFAULT '',
  penguatkuasa                TEXT        DEFAULT '',
  jenis_rampasan              TEXT        DEFAULT '',
  no_report_polis             TEXT        DEFAULT '',
  no_kes_ip                   TEXT        DEFAULT '',
  tarikh_kejadian             DATE,
  masa_kejadian               TIME,
  lokasi_kejadian             TEXT        DEFAULT '',
  kesalahan                   TEXT        DEFAULT '',
  undang_undang               TEXT        DEFAULT '',
  kategori_kes                TEXT        DEFAULT '',
  kes_serahan                 TEXT        DEFAULT '',
  catatan                     TEXT        DEFAULT '',

  -- Haiwan Hidup
  lembu                       INTEGER     NOT NULL DEFAULT 0 CHECK (lembu >= 0),
  kerbau                      INTEGER     NOT NULL DEFAULT 0 CHECK (kerbau >= 0),
  kambing                     INTEGER     NOT NULL DEFAULT 0 CHECK (kambing >= 0),
  bebiri                      INTEGER     NOT NULL DEFAULT 0 CHECK (bebiri >= 0),
  babi                        INTEGER     NOT NULL DEFAULT 0 CHECK (babi >= 0),
  ayam                        INTEGER     NOT NULL DEFAULT 0 CHECK (ayam >= 0),

  -- Karkas
  karkas_lembu                INTEGER     NOT NULL DEFAULT 0 CHECK (karkas_lembu >= 0),
  karkas_kerbau               INTEGER     NOT NULL DEFAULT 0 CHECK (karkas_kerbau >= 0),
  karkas_kambing              INTEGER     NOT NULL DEFAULT 0 CHECK (karkas_kambing >= 0),
  karkas_babi                 INTEGER     NOT NULL DEFAULT 0 CHECK (karkas_babi >= 0),
  karkas_babi_sejuk_beku      INTEGER     NOT NULL DEFAULT 0 CHECK (karkas_babi_sejuk_beku >= 0),
  karkas_ayam                 INTEGER     NOT NULL DEFAULT 0 CHECK (karkas_ayam >= 0),

  -- Produk Sejuk Beku
  produk_sejuk_beku_itik      INTEGER     NOT NULL DEFAULT 0 CHECK (produk_sejuk_beku_itik >= 0),
  produk_sejuk_beku_ayam      INTEGER     NOT NULL DEFAULT 0 CHECK (produk_sejuk_beku_ayam >= 0),
  produk_sejuk_beku_babi      INTEGER     NOT NULL DEFAULT 0 CHECK (produk_sejuk_beku_babi >= 0),
  produk_haiwan_tin           INTEGER     NOT NULL DEFAULT 0 CHECK (produk_haiwan_tin >= 0),

  -- Haiwan Peliharaan
  anjing                      INTEGER     NOT NULL DEFAULT 0 CHECK (anjing >= 0),
  kucing                      INTEGER     NOT NULL DEFAULT 0 CHECK (kucing >= 0),
  arnab                       INTEGER     NOT NULL DEFAULT 0 CHECK (arnab >= 0),
  burung                      INTEGER     NOT NULL DEFAULT 0 CHECK (burung >= 0),
  hamster                     INTEGER     NOT NULL DEFAULT 0 CHECK (hamster >= 0),
  rampasan_lain               TEXT        DEFAULT '',

  -- Kenderaan & Pengangkut
  jumlah_rampasan_kenderaan   NUMERIC     NOT NULL DEFAULT 0 CHECK (jumlah_rampasan_kenderaan >= 0),
  jumlah_rampasan_pengangkut  NUMERIC     NOT NULL DEFAULT 0 CHECK (jumlah_rampasan_pengangkut >= 0),

  -- Anggaran Nilai RM
  anggaran_nilai_ekor_kg      NUMERIC     NOT NULL DEFAULT 0 CHECK (anggaran_nilai_ekor_kg >= 0),
  anggaran_nilai_kenderaan    NUMERIC     NOT NULL DEFAULT 0 CHECK (anggaran_nilai_kenderaan >= 0),
  anggaran_nilai_pengangkut   NUMERIC     NOT NULL DEFAULT 0 CHECK (anggaran_nilai_pengangkut >= 0),
  anggaran_nilai_lain         NUMERIC     NOT NULL DEFAULT 0 CHECK (anggaran_nilai_lain >= 0),

  -- Jumlah Nilai Keseluruhan (auto-calculated)
  jumlah_nilai_keseluruhan    NUMERIC     GENERATED ALWAYS AS (
    COALESCE(jumlah_rampasan_kenderaan, 0) +
    COALESCE(jumlah_rampasan_pengangkut, 0) +
    COALESCE(anggaran_nilai_ekor_kg, 0) +
    COALESCE(anggaran_nilai_kenderaan, 0) +
    COALESCE(anggaran_nilai_pengangkut, 0) +
    COALESCE(anggaran_nilai_lain, 0)
  ) STORED,

  -- Lampiran
  resit_urls                  TEXT[]      NOT NULL DEFAULT '{}',

  created_at                  TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at                  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TRIGGER update_enforcement_updated_at
  BEFORE UPDATE ON public.enforcement_data
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE INDEX idx_enforcement_user ON public.enforcement_data(user_id);
CREATE INDEX idx_enforcement_tahun_bulan ON public.enforcement_data(tahun, bulan);
CREATE INDEX idx_enforcement_tarikh ON public.enforcement_data(tarikh_kejadian DESC);

-- ============================================================
-- STEP 7: ANNOUNCEMENTS TABLE
-- ============================================================
CREATE TABLE public.announcements (
  id            UUID        PRIMARY KEY DEFAULT uuid_generate_v4(),
  title         TEXT        NOT NULL DEFAULT '',
  message       TEXT        NOT NULL DEFAULT '',
  created_by    UUID        REFERENCES public.profiles(id) ON DELETE SET NULL,
  is_active     BOOLEAN     NOT NULL DEFAULT TRUE,
  priority      INTEGER     NOT NULL DEFAULT 0,  -- 0=normal, 1=penting, 2=kritikal
  created_at    TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at    TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TRIGGER update_announcements_updated_at
  BEFORE UPDATE ON public.announcements
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE INDEX idx_announcements_active ON public.announcements(is_active, created_at DESC);

-- ============================================================
-- STEP 8: ROW LEVEL SECURITY (RLS)
-- ============================================================

ALTER TABLE public.profiles        ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.punch_cards     ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.travel_logs     ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.enforcement_data ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.announcements   ENABLE ROW LEVEL SECURITY;

-- ---- PROFILES ----
CREATE POLICY "profiles_select_own"
  ON public.profiles FOR SELECT
  USING (auth.uid() = id);

CREATE POLICY "profiles_update_own"
  ON public.profiles FOR UPDATE
  USING (auth.uid() = id);

CREATE POLICY "profiles_insert_own"
  ON public.profiles FOR INSERT
  WITH CHECK (auth.uid() = id);

CREATE POLICY "profiles_admin_all"
  ON public.profiles FOR ALL
  USING (
    EXISTS (SELECT 1 FROM public.profiles p WHERE p.id = auth.uid() AND p.role = 'super_admin')
  );

-- ---- PUNCH CARDS ----
CREATE POLICY "punch_cards_own"
  ON public.punch_cards FOR ALL
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "punch_cards_admin"
  ON public.punch_cards FOR ALL
  USING (
    EXISTS (SELECT 1 FROM public.profiles p WHERE p.id = auth.uid() AND p.role = 'super_admin')
  );

-- ---- TRAVEL LOGS ----
CREATE POLICY "travel_logs_own"
  ON public.travel_logs FOR ALL
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "travel_logs_admin"
  ON public.travel_logs FOR ALL
  USING (
    EXISTS (SELECT 1 FROM public.profiles p WHERE p.id = auth.uid() AND p.role = 'super_admin')
  );

-- ---- ENFORCEMENT DATA ----
CREATE POLICY "enforcement_own"
  ON public.enforcement_data FOR ALL
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "enforcement_admin"
  ON public.enforcement_data FOR ALL
  USING (
    EXISTS (SELECT 1 FROM public.profiles p WHERE p.id = auth.uid() AND p.role = 'super_admin')
  );

-- ---- ANNOUNCEMENTS ----
CREATE POLICY "announcements_select_active"
  ON public.announcements FOR SELECT
  USING (
    is_active = TRUE
    OR EXISTS (SELECT 1 FROM public.profiles p WHERE p.id = auth.uid() AND p.role = 'super_admin')
  );

CREATE POLICY "announcements_admin_all"
  ON public.announcements FOR ALL
  USING (
    EXISTS (SELECT 1 FROM public.profiles p WHERE p.id = auth.uid() AND p.role = 'super_admin')
  );

-- ============================================================
-- STEP 9: STORAGE BUCKET
-- ============================================================
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'uploads',
  'uploads',
  true,
  52428800,  -- 50MB limit
  ARRAY['image/jpeg','image/png','image/webp','image/gif','application/pdf']
)
ON CONFLICT (id) DO UPDATE SET
  public = true,
  file_size_limit = 52428800;

-- Storage policies
DROP POLICY IF EXISTS "storage_upload_auth" ON storage.objects;
DROP POLICY IF EXISTS "storage_select_public" ON storage.objects;
DROP POLICY IF EXISTS "storage_delete_own" ON storage.objects;

CREATE POLICY "storage_upload_auth"
  ON storage.objects FOR INSERT
  WITH CHECK (bucket_id = 'uploads' AND auth.role() = 'authenticated');

CREATE POLICY "storage_select_public"
  ON storage.objects FOR SELECT
  USING (bucket_id = 'uploads');

CREATE POLICY "storage_update_own"
  ON storage.objects FOR UPDATE
  USING (bucket_id = 'uploads' AND auth.uid()::text = (storage.foldername(name))[2]);

CREATE POLICY "storage_delete_own"
  ON storage.objects FOR DELETE
  USING (bucket_id = 'uploads' AND auth.uid()::text = (storage.foldername(name))[2]);

-- ============================================================
-- STEP 10: REALTIME SUBSCRIPTIONS
-- ============================================================
DO $$
BEGIN
  -- Add tables to realtime publication (ignore if already added)
  BEGIN
    ALTER PUBLICATION supabase_realtime ADD TABLE public.punch_cards;
  EXCEPTION WHEN duplicate_object THEN NULL;
  END;

  BEGIN
    ALTER PUBLICATION supabase_realtime ADD TABLE public.travel_logs;
  EXCEPTION WHEN duplicate_object THEN NULL;
  END;

  BEGIN
    ALTER PUBLICATION supabase_realtime ADD TABLE public.enforcement_data;
  EXCEPTION WHEN duplicate_object THEN NULL;
  END;

  BEGIN
    ALTER PUBLICATION supabase_realtime ADD TABLE public.announcements;
  EXCEPTION WHEN duplicate_object THEN NULL;
  END;

  BEGIN
    ALTER PUBLICATION supabase_realtime ADD TABLE public.profiles;
  EXCEPTION WHEN duplicate_object THEN NULL;
  END;
END $$;

-- ============================================================
-- STEP 11: SAMPLE DATA (untuk testing)
-- ============================================================

-- Sample announcement
INSERT INTO public.announcements (title, message, is_active, priority)
VALUES (
  'Selamat Datang ke PulseGrid v1.0',
  'Sistem PulseGrid telah berjaya dilancarkan. Sila hubungi admin untuk sebarang pertanyaan.',
  true,
  1
);

-- ============================================================
-- STEP 12: HELPER VIEWS (untuk Super Admin)
-- ============================================================

-- View: ringkasan semua data pengguna
CREATE OR REPLACE VIEW public.admin_summary AS
SELECT
  p.id,
  p.email,
  p.full_name,
  p.role,
  p.department,
  p.created_at,
  COUNT(DISTINCT pc.id)  AS punch_card_count,
  COUNT(DISTINCT tl.id)  AS travel_log_count,
  COUNT(DISTINCT ed.id)  AS enforcement_count
FROM public.profiles p
LEFT JOIN public.punch_cards pc ON pc.user_id = p.id
LEFT JOIN public.travel_logs tl ON tl.user_id = p.id
LEFT JOIN public.enforcement_data ed ON ed.user_id = p.id
GROUP BY p.id, p.email, p.full_name, p.role, p.department, p.created_at;

-- View: statistik enforcement mengikut tahun/bulan
CREATE OR REPLACE VIEW public.enforcement_stats AS
SELECT
  tahun,
  bulan,
  COUNT(*)                              AS jumlah_kes,
  SUM(lembu + kerbau + kambing + bebiri + babi + ayam)  AS jumlah_haiwan_hidup,
  SUM(jumlah_nilai_keseluruhan)         AS jumlah_nilai_rm,
  COUNT(DISTINCT user_id)               AS bilangan_pegawai
FROM public.enforcement_data
GROUP BY tahun, bulan
ORDER BY tahun DESC, bulan DESC;

-- ============================================================
-- SELESAI ✅
-- Semua table, RLS, trigger, storage, realtime dah siap.
-- ============================================================
