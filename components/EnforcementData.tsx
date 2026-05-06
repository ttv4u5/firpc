'use client'

import { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { supabase } from '@/lib/supabase'
import type { User } from '@supabase/supabase-js'
import { useTranslation } from 'react-i18next'

interface EnforcementDataProps {
  user: User
  isAdmin: boolean
}

interface EnforcementEntry {
  id?: string
  bil?: number
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
  catatan: string
  lembu: number
  kerbau: number
  kambing: number
  bebiri: number
  babi: number
  ayam: number
  karkas_lembu: number
  karkas_kerbau: number
  karkas_kambing: number
  karkas_babi: number
  karkas_babi_sejuk_beku: number
  karkas_ayam: number
  produk_sejuk_beku_itik: number
  produk_sejuk_beku_ayam: number
  produk_sejuk_beku_babi: number
  produk_haiwan_tin: number
  anjing: number
  kucing: number
  arnab: number
  burung: number
  hamster: number
  rampasan_lain: string
  jumlah_rampasan_kenderaan: number
  jumlah_rampasan_pengangkut: number
  anggaran_nilai_ekor_kg: number
  anggaran_nilai_kenderaan: number
  anggaran_nilai_pengangkut: number
  anggaran_nilai_lain: number
  jumlah_nilai_keseluruhan: number
  resit_urls: string[]
}

const emptyEntry = (): EnforcementEntry => ({
  tahun: new Date().getFullYear(),
  bulan: '',
  penguatkuasa: '',
  jenis_rampasan: '',
  no_report_polis: '',
  no_kes_ip: '',
  tarikh_kejadian: '',
  masa_kejadian: '',
  lokasi_kejadian: '',
  kesalahan: '',
  undang_undang: '',
  kategori_kes: '',
  kes_serahan: '',
  catatan: '',
  lembu: 0, kerbau: 0, kambing: 0, bebiri: 0, babi: 0, ayam: 0,
  karkas_lembu: 0, karkas_kerbau: 0, karkas_kambing: 0, karkas_babi: 0,
  karkas_babi_sejuk_beku: 0, karkas_ayam: 0,
  produk_sejuk_beku_itik: 0, produk_sejuk_beku_ayam: 0, produk_sejuk_beku_babi: 0,
  produk_haiwan_tin: 0, anjing: 0, kucing: 0, arnab: 0, burung: 0, hamster: 0,
  rampasan_lain: '',
  jumlah_rampasan_kenderaan: 0, jumlah_rampasan_pengangkut: 0,
  anggaran_nilai_ekor_kg: 0, anggaran_nilai_kenderaan: 0,
  anggaran_nilai_pengangkut: 0, anggaran_nilai_lain: 0,
  jumlah_nilai_keseluruhan: 0,
  resit_urls: [],
})

export default function EnforcementData({ user, isAdmin }: EnforcementDataProps) {
  const { t } = useTranslation()
  const [entries, setEntries] = useState<EnforcementEntry[]>([])
  const [showForm, setShowForm] = useState(false)
  const [editEntry, setEditEntry] = useState<EnforcementEntry>(emptyEntry())
  const [editId, setEditId] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)
  const [uploading, setUploading] = useState(false)
  const [filterYear, setFilterYear] = useState<number | ''>('')
  const [filterMonth, setFilterMonth] = useState('')

  useEffect(() => {
    loadEntries()
  }, [user.id, filterYear, filterMonth])

  const loadEntries = async () => {
    setLoading(true)
    let query = supabase
      .from('enforcement_data')
      .select('*')
      .order('tarikh_kejadian', { ascending: false })

    if (!isAdmin) {
      query = query.eq('user_id', user.id)
    }
    if (filterYear) query = query.eq('tahun', filterYear)
    if (filterMonth) query = query.eq('bulan', filterMonth)

    const { data } = await query
    setEntries(data || [])
    setLoading(false)
  }

  const calcTotal = (entry: EnforcementEntry) => {
    return (
      (entry.jumlah_rampasan_kenderaan || 0) +
      (entry.jumlah_rampasan_pengangkut || 0) +
      (entry.anggaran_nilai_ekor_kg || 0) +
      (entry.anggaran_nilai_kenderaan || 0) +
      (entry.anggaran_nilai_pengangkut || 0) +
      (entry.anggaran_nilai_lain || 0)
    )
  }

  const updateField = (field: keyof EnforcementEntry, value: any) => {
    setEditEntry(prev => {
      const updated = { ...prev, [field]: value }
      updated.jumlah_nilai_keseluruhan = calcTotal(updated)
      return updated
    })
  }

  const handleUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files
    if (!files || files.length === 0) return
    setUploading(true)
    const urls: string[] = []
    for (const file of Array.from(files)) {
      const path = `enforcement/${user.id}/${Date.now()}_${file.name}`
      const { error } = await supabase.storage.from('uploads').upload(path, file)
      if (!error) {
        const { data } = supabase.storage.from('uploads').getPublicUrl(path)
        urls.push(data.publicUrl)
      }
    }
    setEditEntry(prev => ({ ...prev, resit_urls: [...prev.resit_urls, ...urls] }))
    setUploading(false)
  }

  const handleSave = async () => {
    const payload = {
      ...editEntry,
      user_id: user.id,
      jumlah_nilai_keseluruhan: calcTotal(editEntry),
      updated_at: new Date().toISOString(),
    }
    if (editId) {
      await supabase.from('enforcement_data').update(payload).eq('id', editId)
    } else {
      await supabase.from('enforcement_data').insert(payload)
    }
    setShowForm(false)
    setEditEntry(emptyEntry())
    setEditId(null)
    loadEntries()
  }

  const handleEdit = (entry: EnforcementEntry) => {
    setEditEntry(entry)
    setEditId(entry.id || null)
    setShowForm(true)
  }

  const handleDelete = async (id: string) => {
    if (!confirm('Padam kes ini?')) return
    await supabase.from('enforcement_data').delete().eq('id', id)
    loadEntries()
  }

  const exportCSV = () => {
    const headers = ['BIL','TAHUN','BULAN','PENGUATKUASA','KATEGORI KES','NO REPORT POLIS','TARIKH','MASA','LOKASI','KESALAHAN','UNDANG-UNDANG','NO KES IP','JENIS RAMPASAN','LEMBU','KERBAU','KAMBING','BEBIRI','BABI','AYAM','JUMLAH NILAI']
    const rows = entries.map((e, i) => [
      i+1, e.tahun, e.bulan, e.penguatkuasa, e.kategori_kes, e.no_report_polis,
      e.tarikh_kejadian, e.masa_kejadian, e.lokasi_kejadian, e.kesalahan,
      e.undang_undang, e.no_kes_ip, e.jenis_rampasan,
      e.lembu, e.kerbau, e.kambing, e.bebiri, e.babi, e.ayam,
      e.jumlah_nilai_keseluruhan
    ])
    const csv = [headers, ...rows].map(r => r.join(',')).join('\n')
    const blob = new Blob([csv], { type: 'text/csv' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `enforcement_${Date.now()}.csv`
    a.click()
  }

  const animalFields = [
    { field: 'lembu', label: 'LEMBU' },
    { field: 'kerbau', label: 'KERBAU' },
    { field: 'kambing', label: 'KAMBING' },
    { field: 'bebiri', label: 'BEBIRI' },
    { field: 'babi', label: 'BABI' },
    { field: 'ayam', label: 'AYAM' },
    { field: 'karkas_lembu', label: 'KARKAS LEMBU' },
    { field: 'karkas_kerbau', label: 'KARKAS KERBAU' },
    { field: 'karkas_kambing', label: 'KARKAS KAMBING' },
    { field: 'karkas_babi', label: 'KARKAS BABI' },
    { field: 'karkas_babi_sejuk_beku', label: 'KARKAS BABI SEJUK BEKU' },
    { field: 'karkas_ayam', label: 'KARKAS AYAM' },
    { field: 'produk_sejuk_beku_itik', label: 'PRODUK ITIK' },
    { field: 'produk_sejuk_beku_ayam', label: 'PRODUK AYAM' },
    { field: 'produk_sejuk_beku_babi', label: 'PRODUK BABI' },
    { field: 'produk_haiwan_tin', label: 'PRODUK TIN' },
    { field: 'anjing', label: 'ANJING' },
    { field: 'kucing', label: 'KUCING' },
    { field: 'arnab', label: 'ARNAB' },
    { field: 'burung', label: 'BURUNG' },
    { field: 'hamster', label: 'HAMSTER' },
  ]

  return (
    <div className="space-y-6">
      {/* Header */}
      <motion.div
        className="glass rounded-2xl p-6 flex flex-wrap items-center justify-between gap-4"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
      >
        <h1 className="font-bebas text-4xl tracking-wider neon-text text-neon-blue">
          ⚖️ {t('enforcement.title').toUpperCase()}
        </h1>
        <div className="flex flex-wrap gap-3">
          <motion.button
            onClick={() => { setEditEntry(emptyEntry()); setEditId(null); setShowForm(true) }}
            className="btn-primary"
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
          >
            ➕ {t('enforcement.addNew')}
          </motion.button>
          <button onClick={exportCSV} className="btn-secondary">📊 CSV</button>
          <button onClick={() => window.print()} className="btn-primary">🖨️ Print</button>
        </div>
      </motion.div>

      {/* Filters */}
      <motion.div
        className="glass rounded-xl p-4 flex flex-wrap gap-4"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.1 }}
      >
        <select
          value={filterYear}
          onChange={e => setFilterYear(e.target.value ? Number(e.target.value) : '')}
          className="input-field w-auto"
        >
          <option value="">Semua Tahun</option>
          {[2023, 2024, 2025, 2026].map(y => <option key={y} value={y}>{y}</option>)}
        </select>
        <select
          value={filterMonth}
          onChange={e => setFilterMonth(e.target.value)}
          className="input-field w-auto"
        >
          <option value="">Semua Bulan</option>
          {Array.from({ length: 12 }, (_, i) => (
            <option key={i + 1} value={String(i + 1).padStart(2, '0')}>
              {new Date(2024, i).toLocaleString('ms-MY', { month: 'long' })}
            </option>
          ))}
        </select>
      </motion.div>

      {/* Table */}
      <motion.div
        className="glass rounded-2xl p-4 overflow-x-auto"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2 }}
      >
        {loading ? (
          <div className="flex justify-center py-8"><div className="spinner" /></div>
        ) : (
          <table className="data-table min-w-full text-xs">
            <thead>
              <tr>
                <th>BIL</th>
                <th>TAHUN</th>
                <th>BULAN</th>
                <th>PENGUATKUASA</th>
                <th>KATEGORI KES</th>
                <th>NO REPORT POLIS</th>
                <th>TARIKH KEJADIAN</th>
                <th>MASA</th>
                <th>LOKASI</th>
                <th>KESALAHAN</th>
                <th>UNDANG-UNDANG</th>
                <th>NO KES IP</th>
                <th>JENIS RAMPASAN</th>
                <th>LEMBU</th>
                <th>KERBAU</th>
                <th>KAMBING</th>
                <th>BABI</th>
                <th>AYAM</th>
                <th>JUMLAH NILAI (RM)</th>
                <th>KES SERAHAN</th>
                <th>TINDAKAN</th>
              </tr>
            </thead>
            <tbody>
              {entries.length === 0 ? (
                <tr>
                  <td colSpan={21} className="text-center py-8 text-gray-400">
                    Tiada rekod. Tambah kes baharu.
                  </td>
                </tr>
              ) : (
                entries.map((entry, index) => (
                  <motion.tr
                    key={entry.id}
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ delay: index * 0.03 }}
                  >
                    <td className="text-center">{index + 1}</td>
                    <td>{entry.tahun}</td>
                    <td>{entry.bulan}</td>
                    <td>{entry.penguatkuasa}</td>
                    <td>{entry.kategori_kes}</td>
                    <td>{entry.no_report_polis}</td>
                    <td>{entry.tarikh_kejadian}</td>
                    <td>{entry.masa_kejadian}</td>
                    <td>{entry.lokasi_kejadian}</td>
                    <td>{entry.kesalahan}</td>
                    <td>{entry.undang_undang}</td>
                    <td>{entry.no_kes_ip}</td>
                    <td>{entry.jenis_rampasan}</td>
                    <td>{entry.lembu || '-'}</td>
                    <td>{entry.kerbau || '-'}</td>
                    <td>{entry.kambing || '-'}</td>
                    <td>{entry.babi || '-'}</td>
                    <td>{entry.ayam || '-'}</td>
                    <td className="text-neon-green font-bold">
                      RM {entry.jumlah_nilai_keseluruhan?.toLocaleString()}
                    </td>
                    <td>{entry.kes_serahan}</td>
                    <td>
                      <div className="flex gap-1">
                        <button onClick={() => handleEdit(entry)}
                          className="text-neon-blue hover:scale-110 transition-transform">✏️</button>
                        {isAdmin && (
                          <button onClick={() => handleDelete(entry.id!)}
                            className="text-red-400 hover:scale-110 transition-transform">🗑️</button>
                        )}
                      </div>
                    </td>
                  </motion.tr>
                ))
              )}
            </tbody>
          </table>
        )}
      </motion.div>

      {/* Fullscreen Form */}
      <AnimatePresence>
        {showForm && (
          <motion.div
            className="fullscreen-form"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
          >
            <div className="fullscreen-form-content">
              <div className="flex items-center justify-between mb-6">
                <h2 className="font-bebas text-3xl text-neon-blue tracking-wider">
                  {editId ? '✏️ EDIT KES' : '➕ TAMBAH KES BAHARU'}
                </h2>
                <button onClick={() => setShowForm(false)} className="text-gray-400 hover:text-white text-2xl">✕</button>
              </div>

              {/* Basic Info */}
              <h3 className="text-neon-purple font-bold mb-3">📋 MAKLUMAT ASAS</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 mb-6">
                {[
                  { label: 'TAHUN', field: 'tahun', type: 'number' },
                  { label: 'BULAN', field: 'bulan', type: 'text' },
                  { label: 'PENGUATKUASA', field: 'penguatkuasa', type: 'text' },
                  { label: 'JENIS RAMPASAN', field: 'jenis_rampasan', type: 'text' },
                  { label: 'NO REPORT POLIS', field: 'no_report_polis', type: 'text' },
                  { label: 'NO KES IP', field: 'no_kes_ip', type: 'text' },
                  { label: 'TARIKH KEJADIAN', field: 'tarikh_kejadian', type: 'date' },
                  { label: 'MASA KEJADIAN', field: 'masa_kejadian', type: 'time' },
                  { label: 'LOKASI KEJADIAN', field: 'lokasi_kejadian', type: 'text' },
                  { label: 'KESALAHAN', field: 'kesalahan', type: 'text' },
                  { label: 'UNDANG-UNDANG', field: 'undang_undang', type: 'text' },
                  { label: 'KATEGORI KES', field: 'kategori_kes', type: 'text' },
                  { label: 'KES SERAHAN', field: 'kes_serahan', type: 'text' },
                ].map(({ label, field, type }) => (
                  <div key={field}>
                    <label className="text-gray-400 text-sm mb-1 block">{label}</label>
                    <input
                      type={type}
                      value={(editEntry as any)[field]}
                      onChange={e => updateField(field as keyof EnforcementEntry, type === 'number' ? Number(e.target.value) : e.target.value)}
                      className="input-field"
                    />
                  </div>
                ))}
              </div>

              {/* Animal Seizures */}
              <h3 className="text-neon-green font-bold mb-3">🐄 RAMPASAN HAIWAN</h3>
              <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-3 mb-6">
                {animalFields.map(({ field, label }) => (
                  <div key={field}>
                    <label className="text-gray-400 text-xs mb-1 block">{label}</label>
                    <input
                      type="number"
                      min="0"
                      value={(editEntry as any)[field]}
                      onChange={e => updateField(field as keyof EnforcementEntry, Number(e.target.value))}
                      className="input-field text-center"
                    />
                  </div>
                ))}
                <div className="col-span-2">
                  <label className="text-gray-400 text-xs mb-1 block">RAMPASAN LAIN-LAIN</label>
                  <input
                    type="text"
                    value={editEntry.rampasan_lain}
                    onChange={e => updateField('rampasan_lain', e.target.value)}
                    className="input-field"
                  />
                </div>
              </div>

              {/* Values */}
              <h3 className="text-neon-pink font-bold mb-3">💰 ANGGARAN NILAI</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 mb-6">
                {[
                  { label: 'JUMLAH RAMPASAN KENDERAAN', field: 'jumlah_rampasan_kenderaan' },
                  { label: 'JUMLAH RAMPASAN PENGANGKUT/KONTENA', field: 'jumlah_rampasan_pengangkut' },
                  { label: 'ANGGARAN NILAI RM (EKOR/KG)', field: 'anggaran_nilai_ekor_kg' },
                  { label: 'ANGGARAN NILAI RM (KENDERAAN)', field: 'anggaran_nilai_kenderaan' },
                  { label: 'ANGGARAN NILAI RM (PENGANGKUT/KONTENA)', field: 'anggaran_nilai_pengangkut' },
                  { label: 'ANGGARAN NILAI RM (LAIN-LAIN)', field: 'anggaran_nilai_lain' },
                ].map(({ label, field }) => (
                  <div key={field}>
                    <label className="text-gray-400 text-sm mb-1 block">{label}</label>
                    <input
                      type="number"
                      min="0"
                      step="0.01"
                      value={(editEntry as any)[field]}
                      onChange={e => updateField(field as keyof EnforcementEntry, Number(e.target.value))}
                      className="input-field"
                    />
                  </div>
                ))}
                <div>
                  <label className="text-neon-green text-sm mb-1 block font-bold">JUMLAH NILAI KESELURUHAN (Auto)</label>
                  <input
                    type="number"
                    value={calcTotal(editEntry)}
                    readOnly
                    className="input-field opacity-70 text-neon-green font-bold"
                  />
                </div>
              </div>

              {/* Notes & Upload */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
                <div>
                  <label className="text-gray-400 text-sm mb-1 block">CATATAN</label>
                  <textarea
                    value={editEntry.catatan}
                    onChange={e => updateField('catatan', e.target.value)}
                    className="input-field h-24 resize-none"
                  />
                </div>
                <div>
                  <label className="text-gray-400 text-sm mb-1 block">📎 Upload Gambar/Dokumen</label>
                  <input
                    type="file"
                    multiple
                    accept="image/*,.pdf"
                    onChange={handleUpload}
                    className="input-field"
                  />
                  {uploading && <p className="text-neon-blue text-sm mt-1 animate-pulse">Memuat naik...</p>}
                  {editEntry.resit_urls.length > 0 && (
                    <div className="flex flex-wrap gap-2 mt-2">
                      {editEntry.resit_urls.map((url, i) => (
                        <a key={i} href={url} target="_blank" rel="noopener noreferrer"
                          className="text-neon-blue text-sm hover:underline">
                          📎 Fail {i + 1}
                        </a>
                      ))}
                    </div>
                  )}
                </div>
              </div>

              <div className="flex gap-3">
                <motion.button
                  onClick={handleSave}
                  className="btn-primary flex-1"
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                >
                  💾 {t('common.save')}
                </motion.button>
                <button onClick={() => setShowForm(false)} className="btn-secondary flex-1">
                  ✕ {t('common.cancel')}
                </button>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}
