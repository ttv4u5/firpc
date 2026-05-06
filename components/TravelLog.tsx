'use client'

import { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { supabase } from '@/lib/supabase'
import type { User } from '@supabase/supabase-js'
import { useTranslation } from 'react-i18next'

interface TravelLogProps {
  user: User
}

interface TravelEntry {
  id?: string
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
  nota: string
  resit_urls: string[]
}

const emptyEntry = (): TravelEntry => ({
  tarikh: '',
  masa: '',
  masa_pergi: '',
  masa_balik: '',
  pemandu: '',
  tujuan: '',
  pelulus: '',
  pengguna: '',
  odo_mula: 0,
  odo_akhir: 0,
  jarak_km: 0,
  kos_rm: 0,
  no_resit: '',
  liter: 0,
  nota: '',
  resit_urls: [],
})

export default function TravelLog({ user }: TravelLogProps) {
  const { t } = useTranslation()
  const [entries, setEntries] = useState<TravelEntry[]>([])
  const [showForm, setShowForm] = useState(false)
  const [editEntry, setEditEntry] = useState<TravelEntry>(emptyEntry())
  const [editId, setEditId] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)
  const [uploading, setUploading] = useState(false)

  useEffect(() => {
    loadEntries()
  }, [user.id])

  const loadEntries = async () => {
    setLoading(true)
    const { data } = await supabase
      .from('travel_logs')
      .select('*')
      .eq('user_id', user.id)
      .order('tarikh', { ascending: false })
    setEntries(data || [])
    setLoading(false)
  }

  const handleOdoChange = (field: 'odo_mula' | 'odo_akhir', value: number) => {
    setEditEntry(prev => {
      const updated = { ...prev, [field]: value }
      updated.jarak_km = Math.max(0, updated.odo_akhir - updated.odo_mula)
      return updated
    })
  }

  const handleUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files
    if (!files || files.length === 0) return
    setUploading(true)
    const urls: string[] = []
    for (const file of Array.from(files)) {
      const path = `travel/${user.id}/${Date.now()}_${file.name}`
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
      updated_at: new Date().toISOString(),
    }
    if (editId) {
      await supabase.from('travel_logs').update(payload).eq('id', editId)
    } else {
      await supabase.from('travel_logs').insert(payload)
    }
    setShowForm(false)
    setEditEntry(emptyEntry())
    setEditId(null)
    loadEntries()
  }

  const handleEdit = (entry: TravelEntry) => {
    setEditEntry(entry)
    setEditId(entry.id || null)
    setShowForm(true)
  }

  const handleDelete = async (id: string) => {
    if (!confirm('Padam entri ini?')) return
    await supabase.from('travel_logs').delete().eq('id', id)
    loadEntries()
  }

  const exportCSV = () => {
    const headers = ['TARIKH','MASA','MASA PERGI','MASA BALIK','PEMANDU','TUJUAN','PELULUS','PENGGUNA','ODO MULA','ODO AKHIR','JARAK KM','KOS RM','NO RESIT','LITER','NOTA']
    const rows = entries.map(e => [
      e.tarikh, e.masa, e.masa_pergi, e.masa_balik, e.pemandu, e.tujuan,
      e.pelulus, e.pengguna, e.odo_mula, e.odo_akhir, e.jarak_km,
      e.kos_rm, e.no_resit, e.liter, e.nota
    ])
    const csv = [headers, ...rows].map(r => r.join(',')).join('\n')
    const blob = new Blob([csv], { type: 'text/csv' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `travel_log_${Date.now()}.csv`
    a.click()
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <motion.div
        className="glass rounded-2xl p-6 flex flex-wrap items-center justify-between gap-4"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
      >
        <h1 className="font-bebas text-4xl tracking-wider neon-text text-neon-blue">
          🚗 {t('travel.title').toUpperCase()}
        </h1>
        <div className="flex gap-3">
          <motion.button
            onClick={() => { setEditEntry(emptyEntry()); setEditId(null); setShowForm(true) }}
            className="btn-primary"
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
          >
            ➕ {t('travel.addNew')}
          </motion.button>
          <button onClick={exportCSV} className="btn-secondary">
            📊 CSV
          </button>
          <button onClick={() => window.print()} className="btn-primary">
            🖨️ Print
          </button>
        </div>
      </motion.div>

      {/* Table */}
      <motion.div
        className="glass rounded-2xl p-4 overflow-x-auto"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1 }}
      >
        {loading ? (
          <div className="flex justify-center py-8">
            <div className="spinner" />
          </div>
        ) : (
          <table className="data-table min-w-full text-xs">
            <thead>
              <tr>
                <th>BIL</th>
                <th>{t('travel.date')}</th>
                <th>{t('travel.departure')}</th>
                <th>{t('travel.return')}</th>
                <th>{t('travel.driver')}</th>
                <th>{t('travel.purpose')}</th>
                <th>{t('travel.approver')}</th>
                <th>ODO MULA</th>
                <th>{t('travel.odoEnd')}</th>
                <th>{t('travel.distance')} (KM)</th>
                <th>{t('travel.cost')} (RM)</th>
                <th>NO RESIT</th>
                <th>{t('travel.liter')}</th>
                <th>RESIT</th>
                <th>TINDAKAN</th>
              </tr>
            </thead>
            <tbody>
              {entries.length === 0 ? (
                <tr>
                  <td colSpan={15} className="text-center py-8 text-gray-400">
                    Tiada rekod. Tambah entri baharu.
                  </td>
                </tr>
              ) : (
                entries.map((entry, index) => (
                  <motion.tr
                    key={entry.id}
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: index * 0.05 }}
                  >
                    <td className="text-center">{index + 1}</td>
                    <td>{entry.tarikh}</td>
                    <td>{entry.masa_pergi}</td>
                    <td>{entry.masa_balik}</td>
                    <td>{entry.pemandu}</td>
                    <td>{entry.tujuan}</td>
                    <td>{entry.pelulus}</td>
                    <td>{entry.odo_mula}</td>
                    <td>{entry.odo_akhir}</td>
                    <td className="text-neon-green font-bold">{entry.jarak_km}</td>
                    <td className="text-neon-blue font-bold">RM {entry.kos_rm}</td>
                    <td>{entry.no_resit}</td>
                    <td>{entry.liter}L</td>
                    <td>
                      {entry.resit_urls?.length > 0 && (
                        <div className="flex gap-1">
                          {entry.resit_urls.map((url, i) => (
                            <a key={i} href={url} target="_blank" rel="noopener noreferrer"
                              className="text-neon-blue hover:underline text-xs">
                              📎{i + 1}
                            </a>
                          ))}
                        </div>
                      )}
                    </td>
                    <td>
                      <div className="flex gap-1">
                        <button onClick={() => handleEdit(entry)}
                          className="text-neon-blue hover:scale-110 transition-transform">✏️</button>
                        <button onClick={() => handleDelete(entry.id!)}
                          className="text-red-400 hover:scale-110 transition-transform">🗑️</button>
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
                  {editId ? '✏️ EDIT ENTRI' : '➕ TAMBAH ENTRI BAHARU'}
                </h2>
                <button onClick={() => setShowForm(false)} className="text-gray-400 hover:text-white text-2xl">✕</button>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {[
                  { label: t('travel.date'), field: 'tarikh', type: 'date' },
                  { label: t('travel.time'), field: 'masa', type: 'time' },
                  { label: t('travel.departure'), field: 'masa_pergi', type: 'time' },
                  { label: t('travel.return'), field: 'masa_balik', type: 'time' },
                  { label: t('travel.driver'), field: 'pemandu', type: 'text' },
                  { label: t('travel.purpose'), field: 'tujuan', type: 'text' },
                  { label: t('travel.approver'), field: 'pelulus', type: 'text' },
                  { label: t('travel.user'), field: 'pengguna', type: 'text' },
                  { label: 'ODO MULA', field: 'odo_mula', type: 'number' },
                  { label: t('travel.odoEnd'), field: 'odo_akhir', type: 'number' },
                  { label: `${t('travel.cost')} (RM)`, field: 'kos_rm', type: 'number' },
                  { label: 'NO RESIT', field: 'no_resit', type: 'text' },
                  { label: t('travel.liter'), field: 'liter', type: 'number' },
                ].map(({ label, field, type }) => (
                  <div key={field}>
                    <label className="text-gray-400 text-sm mb-1 block">{label}</label>
                    <input
                      type={type}
                      value={(editEntry as any)[field]}
                      onChange={e => {
                        const val = type === 'number' ? Number(e.target.value) : e.target.value
                        if (field === 'odo_mula' || field === 'odo_akhir') {
                          handleOdoChange(field as 'odo_mula' | 'odo_akhir', Number(val))
                        } else {
                          setEditEntry(prev => ({ ...prev, [field]: val }))
                        }
                      }}
                      className="input-field"
                    />
                  </div>
                ))}

                {/* Auto-calculated fields */}
                <div>
                  <label className="text-gray-400 text-sm mb-1 block">JARAK KM (Auto)</label>
                  <input type="number" value={editEntry.jarak_km} readOnly className="input-field opacity-70" />
                </div>

                <div className="md:col-span-2">
                  <label className="text-gray-400 text-sm mb-1 block">{t('travel.notes')}</label>
                  <textarea
                    value={editEntry.nota}
                    onChange={e => setEditEntry(prev => ({ ...prev, nota: e.target.value }))}
                    className="input-field h-20 resize-none"
                  />
                </div>

                {/* File Upload */}
                <div className="md:col-span-3">
                  <label className="text-gray-400 text-sm mb-1 block">
                    📎 Upload Resit/Gambar (Minyak, TNG, Odometer)
                  </label>
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

              <div className="flex gap-3 mt-6">
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
