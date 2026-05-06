import { createClient } from '@supabase/supabase-js'

const supabaseUrl = 'https://zdfaztrbqngfyfqtlhwx.supabase.co'
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InpkZmF6dHJicW5nZnlmcXRsaHd4Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3Nzc5NzE2NzcsImV4cCI6MjA5MzU0NzY3N30.ja4t9wdTIaAkiSNsgccYbziG2bMMVvfUtPE8mZSXXbY'

export const supabase = createClient(supabaseUrl, supabaseAnonKey)

// Database Types
export interface Profile {
  id: string
  email: string
  full_name: string
  avatar_url?: string
  role: 'user' | 'super_admin'
  created_at: string
  updated_at: string
}

export interface PunchCard {
  id: string
  user_id: string
  month: string
  year: number
  name: string
  department: string
  section: string
  entries: PunchCardEntry[]
  created_at: string
  updated_at: string
}

export interface PunchCardEntry {
  date: number
  masuk1?: string
  keluar1?: string
  masuk2?: string
  keluar2?: string
  kenyataan?: string
  tandatangan?: string
}

export interface TravelLog {
  id: string
  user_id: string
  tarikh: string
  masa: string
  masa_pergi: string
  masa_balik: string
  pemandu: string
  tujuan: string
  pelulus: string
  pengguna: string
  odo_mula: number
  odo_akhir: number
  jarak_km: number
  kos_rm: number
  no_resit: string
  liter: number
  nota?: string
  resit_urls: string[]
  created_at: string
  updated_at: string
}

export interface EnforcementData {
  id: string
  user_id: string
  bil: number
  tahun: number
  bulan: string
  penguatkuasa: string
  jenis_rampasan: string
  no_report_polis: string
  no_kes_ip: string
  tarikh_kejadian: string
  masa_kejadian: string
  lokasi_kejadian: string
  kesalahan: string
  undang_undang: string
  kategori_kes: string
  kes_serahan: string
  catatan?: string
  // Rampasan details
  lembu?: number
  kerbau?: number
  kambing?: number
  bebiri?: number
  babi?: number
  ayam?: number
  karkas_lembu?: number
  karkas_kerbau?: number
  karkas_kambing?: number
  karkas_babi?: number
  karkas_babi_sejuk_beku?: number
  karkas_ayam?: number
  produk_sejuk_beku_itik?: number
  produk_sejuk_beku_ayam?: number
  produk_sejuk_beku_babi?: number
  produk_haiwan_tin?: number
  anjing?: number
  kucing?: number
  arnab?: number
  burung?: number
  hamster?: number
  rampasan_lain?: string
  jumlah_rampasan_kenderaan?: number
  jumlah_rampasan_pengangkut?: number
  anggaran_nilai_ekor_kg?: number
  anggaran_nilai_kenderaan?: number
  anggaran_nilai_pengangkut?: number
  anggaran_nilai_lain?: number
  jumlah_nilai_keseluruhan?: number
  created_at: string
  updated_at: string
}

export interface Announcement {
  id: string
  title: string
  message: string
  created_by: string
  created_at: string
  is_active: boolean
}
