'use client'

import { useState, useEffect, useCallback } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { supabase } from '@/lib/supabase'
import type { User } from '@supabase/supabase-js'
import { useTranslation } from 'react-i18next'
import { format, getDaysInMonth, getDay } from 'date-fns'

interface PunchCardProps {
  user: User
}

interface Entry {
  date: number
  masuk1: string
  keluar1: string
  masuk2: string
  keluar2: string
  kenyataan: string
  tandatangan: string
}

export default function PunchCard({ user }: PunchCardProps) {
  const { t } = useTranslation()
  const [currentTime, setCurrentTime] = useState(new Date())
  const [selectedMonth, setSelectedMonth] = useState(new Date().getMonth() + 1)
  const [selectedYear, setSelectedYear] = useState(new Date().getFullYear())
  const [name, setName] = useState('')
  const [department, setDepartment] = useState('')
  const [section, setSection] = useState('')
  const [entries, setEntries] = useState<Entry[]>([])
  const [loading, setLoading] = useState(false)
  const [showForm, setShowForm] = useState(false)
  const [editEntry, setEditEntry] = useState<Entry | null>(null)
  const [cardId, setCardId] = useState<string | null>(null)

  useEffect(() => {
    const timer = setInterval(() => setCurrentTime(new Date()), 1000)
    return () => clearInterval(timer)
  }, [])

  useEffect(() => {
    loadPunchCard()
  }, [selectedMonth, selectedYear, user.id])

  const loadPunchCard = async () => {
    setLoading(true)
    const { data } = await supabase
      .from('punch_cards')
      .select('*')
      .eq('user_id', user.id)
      .eq('month', selectedMonth)
      .eq('year', selectedYear)
      .single()

    if (data) {
      setCardId(data.id)
      setName(data.name || '')
      setDepartment(data.department || '')
      setSection(data.section || '')
      setEntries(data.entries || [])
    } else {
      setCardId(null)
      setEntries([])
    }
    setLoading(false)
  }

  const savePunchCard = useCallback(async () => {
    const payload = {
      user_id: user.id,
      month: selectedMonth,
      year: selectedYear,
      name,
      department,
      section,
      entries,
      updated_at: new Date().toISOString(),
    }

    if (cardId) {
      await supabase.from('punch_cards').update(payload).eq('id', cardId)
    } else {
      const { data } = await supabase.from('punch_cards').insert(payload).select().single()
      if (data) setCardId(data.id)
    }
  }, [cardId, user.id, selectedMonth, selectedYear, name, department, section, entries])

  // Autosave on change
  useEffect(() => {
    if (name || department || section || entries.length > 0) {
      const timeout = setTimeout(savePunchCard, 1000)
      return () => clearTimeout(timeout)
    }
  }, [name, department, section, entries, savePunchCard])

  const getDayOfWeek = (day: number) => {
    const date = new Date(selectedYear, selectedMonth - 1, day)
    return getDay(date)
  }

  const getDayLabel = (day: number) => {
    const dow = getDayOfWeek(day)
    if (dow === 6) return t('punchcard.saturday')
    if (dow === 0) return t('punchcard.sunday')
    return ''
  }

  const isLateEntry = (time: string) => {
    if (!time) return false
    const [h, m] = time.split(':').map(Number)
    return h > 9 || (h === 9 && m > 0)
  }

  const isOT = (time: string, type: 'in' | 'out') => {
    if (!time) return false
    const [h] = time.split(':').map(Number)
    if (type === 'in') return h < 7
    if (type === 'out') return h >= 18
    return false
  }

  const updateEntry = (day: number, field: keyof Entry, value: string) => {
    setEntries(prev => {
      const existing = prev.find(e => e.date === day)
      if (existing) {
        return prev.map(e => e.date === day ? { ...e, [field]: value } : e)
      } else {
        return [...prev, { date: day, masuk1: '', keluar1: '', masuk2: '', keluar2: '', kenyataan: '', tandatangan: '', [field]: value }]
      }
    })
  }

  const getEntry = (day: number): Entry => {
    return entries.find(e => e.date === day) || {
      date: day, masuk1: '', keluar1: '', masuk2: '', keluar2: '', kenyataan: '', tandatangan: ''
    }
  }

  const daysInMonth = getDaysInMonth(new Date(selectedYear, selectedMonth - 1))
  const halfA = Array.from({ length: 15 }, (_, i) => i + 1)
  const halfB = Array.from({ length: daysInMonth - 15 }, (_, i) => i + 16)

  const getTimeDisplay = () => {
    const h = currentTime.getHours()
    const m = currentTime.getMinutes().toString().padStart(2, '0')
    const s = currentTime.getSeconds().toString().padStart(2, '0')
    const period = h < 12 ? 'PG' : h < 18 ? 'PTG' : 'MLM'
    const h12 = h % 12 || 12
    return `${h12}:${m}:${s} ${period}`
  }

  const exportCSV = () => {
    const rows = [
      ['TARIKH', 'MASUK', 'KELUAR', 'MASUK', 'KELUAR', 'KENYATAAN', 'T/T'],
      ...entries.map(e => [e.date, e.masuk1, e.keluar1, e.masuk2, e.keluar2, e.kenyataan, e.tandatangan])
    ]
    const csv = rows.map(r => r.join(',')).join('\n')
    const blob = new Blob([csv], { type: 'text/csv' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `punch_card_${selectedMonth}_${selectedYear}.csv`
    a.click()
  }

  const handlePrint = () => window.print()

  const renderHalf = (days: number[], label: string) => (
    <div className="overflow-x-auto">
      <div className="text-center font-bebas text-xl text-neon-blue mb-2 tracking-wider">
        {label}
      </div>
      <table className="data-table min-w-full text-xs md:text-sm">
        <thead>
          <tr>
            <th className="w-10">TAR</th>
            <th>{t('punchcard.in')}</th>
            <th>{t('punchcard.out')}</th>
            <th>{t('punchcard.in')}</th>
            <th>{t('punchcard.out')}</th>
            <th>{t('punchcard.remarks')}</th>
            <th>{t('punchcard.signature')}</th>
          </tr>
        </thead>
        <tbody>
          {days.map(day => {
            const entry = getEntry(day)
            const dayLabel = getDayLabel(day)
            const isWeekend = !!dayLabel
            const lateIn = isLateEntry(entry.masuk1)
            const otIn = isOT(entry.masuk1, 'in')
            const otOut = isOT(entry.keluar1, 'out')

            return (
              <tr
                key={day}
                className={`${isWeekend ? 'bg-gray-800/50' : ''} ${lateIn ? 'late-entry' : ''} ${otIn || otOut ? 'ot-entry' : ''}`}
              >
                <td className="text-center font-bold text-neon-blue">{day}</td>
                {isWeekend ? (
                  <td colSpan={5} className="text-center font-bold text-yellow-400">
                    {dayLabel}
                  </td>
                ) : (
                  <>
                    <td>
                      <input
                        type="time"
                        value={entry.masuk1}
                        onChange={e => updateEntry(day, 'masuk1', e.target.value)}
                        className="w-full bg-transparent text-white border-none outline-none text-center"
                      />
                    </td>
                    <td>
                      <input
                        type="time"
                        value={entry.keluar1}
                        onChange={e => updateEntry(day, 'keluar1', e.target.value)}
                        className="w-full bg-transparent text-white border-none outline-none text-center"
                      />
                    </td>
                    <td>
                      <input
                        type="time"
                        value={entry.masuk2}
                        onChange={e => updateEntry(day, 'masuk2', e.target.value)}
                        className="w-full bg-transparent text-white border-none outline-none text-center"
                      />
                    </td>
                    <td>
                      <input
                        type="time"
                        value={entry.keluar2}
                        onChange={e => updateEntry(day, 'keluar2', e.target.value)}
                        className="w-full bg-transparent text-white border-none outline-none text-center"
                      />
                    </td>
                  </>
                )}
                <td>
                  <input
                    type="text"
                    value={entry.kenyataan}
                    onChange={e => updateEntry(day, 'kenyataan', e.target.value)}
                    className="w-full bg-transparent text-white border-none outline-none text-center"
                    placeholder={isWeekend ? dayLabel : ''}
                  />
                </td>
                <td>
                  <input
                    type="text"
                    value={entry.tandatangan}
                    onChange={e => updateEntry(day, 'tandatangan', e.target.value)}
                    className="w-full bg-transparent text-white border-none outline-none text-center"
                  />
                </td>
              </tr>
            )
          })}
        </tbody>
      </table>
    </div>
  )

  return (
    <div className="space-y-6">
      {/* Header */}
      <motion.div
        className="glass rounded-2xl p-6"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
      >
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div>
            <h1 className="font-bebas text-4xl tracking-wider neon-text text-neon-blue">
              ⏰ {t('punchcard.title').toUpperCase()}
            </h1>
            <p className="text-sm text-gray-400">Am 493—C (Pin. 1/88)</p>
          </div>
          
          {/* Real-time Clock */}
          <motion.div
            className="glass-light rounded-xl px-6 py-3 text-center"
            animate={{ scale: [1, 1.02, 1] }}
            transition={{ duration: 1, repeat: Infinity }}
          >
            <p className="font-bebas text-3xl text-neon-green tracking-wider">
              {getTimeDisplay()}
            </p>
            <p className="text-xs text-gray-400">
              {format(currentTime, 'dd/MM/yyyy')}
            </p>
          </motion.div>
        </div>

        {/* Month/Year Selector */}
        <div className="flex flex-wrap gap-4 mt-4">
          <select
            value={selectedMonth}
            onChange={e => setSelectedMonth(Number(e.target.value))}
            className="input-field w-auto"
          >
            {Array.from({ length: 12 }, (_, i) => (
              <option key={i + 1} value={i + 1}>
                {new Date(2024, i).toLocaleString('ms-MY', { month: 'long' })}
              </option>
            ))}
          </select>
          <select
            value={selectedYear}
            onChange={e => setSelectedYear(Number(e.target.value))}
            className="input-field w-auto"
          >
            {[2023, 2024, 2025, 2026].map(y => (
              <option key={y} value={y}>{y}</option>
            ))}
          </select>
        </div>
      </motion.div>

      {/* Card Header Info */}
      <motion.div
        className="glass rounded-2xl p-6"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1 }}
      >
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="text-gray-400 text-sm">{t('punchcard.name')}</label>
            <input
              type="text"
              value={name}
              onChange={e => setName(e.target.value)}
              className="input-field mt-1"
              placeholder="Nama Penuh"
            />
          </div>
          <div>
            <label className="text-gray-400 text-sm">{t('punchcard.department')}</label>
            <input
              type="text"
              value={department}
              onChange={e => setDepartment(e.target.value)}
              className="input-field mt-1"
              placeholder="Kem./Jab."
            />
          </div>
          <div>
            <label className="text-gray-400 text-sm">{t('punchcard.section')}</label>
            <input
              type="text"
              value={section}
              onChange={e => setSection(e.target.value)}
              className="input-field mt-1"
              placeholder="Bahagian/Seksyen"
            />
          </div>
          <div>
            <label className="text-gray-400 text-sm">{t('punchcard.month')}</label>
            <input
              type="text"
              value={`${new Date(selectedYear, selectedMonth - 1).toLocaleString('ms-MY', { month: 'long' })} ${selectedYear}`}
              readOnly
              className="input-field mt-1 opacity-70"
            />
          </div>
        </div>

        {/* Legend */}
        <div className="flex flex-wrap gap-4 mt-4 text-xs">
          <span className="flex items-center gap-1">
            <span className="w-4 h-4 bg-red-500/30 border border-red-500 rounded" />
            Masuk Lewat (&gt;9:00 PG)
          </span>
          <span className="flex items-center gap-1">
            <span className="w-4 h-4 bg-green-500/30 border border-green-500 rounded" />
            Lebih Masa (OT)
          </span>
        </div>
      </motion.div>

      {/* Punch Card Tables */}
      <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
        <motion.div
          className="glass rounded-2xl p-4"
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: 0.2 }}
        >
          {renderHalf(halfA, 'MUKA A (1-15)')}
        </motion.div>
        <motion.div
          className="glass rounded-2xl p-4"
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: 0.3 }}
        >
          {renderHalf(halfB, `MUKA B (16-${daysInMonth})`)}
        </motion.div>
      </div>

      {/* Warning */}
      <motion.div
        className="glass rounded-xl p-4 text-center border border-yellow-500/30"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.4 }}
      >
        <p className="font-bold text-yellow-400">⚠️ AMARAN</p>
        <p className="text-sm text-gray-300 mt-1">
          Sesiapa yang didapati mengetik kad orang lain, tindakan tatatertib akan diambil ke atasnya.
        </p>
      </motion.div>

      {/* Action Buttons */}
      <motion.div
        className="flex flex-wrap gap-3 no-print"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.5 }}
      >
        <button onClick={savePunchCard} className="btn-primary">
          💾 {t('punchcard.save')}
        </button>
        <button onClick={exportCSV} className="btn-secondary">
          📊 CSV
        </button>
        <button onClick={handlePrint} className="btn-primary">
          🖨️ {t('punchcard.print')}
        </button>
      </motion.div>
    </div>
  )
}
