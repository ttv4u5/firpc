'use client'

import { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { supabase } from '@/lib/supabase'

interface Profile {
  id: string
  email: string
  full_name: string
  avatar_url?: string
  role: string
  created_at: string
}

interface Announcement {
  id: string
  title: string
  message: string
  is_active: boolean
  created_at: string
}

export default function SuperAdmin() {
  const [users, setUsers] = useState<Profile[]>([])
  const [announcements, setAnnouncements] = useState<Announcement[]>([])
  const [activeTab, setActiveTab] = useState<'users' | 'announcements' | 'data'>('users')
  const [showAnnForm, setShowAnnForm] = useState(false)
  const [annTitle, setAnnTitle] = useState('')
  const [annMessage, setAnnMessage] = useState('')
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    loadUsers()
    loadAnnouncements()
  }, [])

  const loadUsers = async () => {
    setLoading(true)
    const { data } = await supabase
      .from('profiles')
      .select('*')
      .order('created_at', { ascending: false })
    setUsers(data || [])
    setLoading(false)
  }

  const loadAnnouncements = async () => {
    const { data } = await supabase
      .from('announcements')
      .select('*')
      .order('created_at', { ascending: false })
    setAnnouncements(data || [])
  }

  const promoteToAdmin = async (userId: string) => {
    await supabase
      .from('profiles')
      .update({ role: 'super_admin' })
      .eq('id', userId)
    loadUsers()
  }

  const demoteUser = async (userId: string) => {
    await supabase
      .from('profiles')
      .update({ role: 'user' })
      .eq('id', userId)
    loadUsers()
  }

  const deleteUser = async (userId: string) => {
    if (!confirm('Padam pengguna ini? Semua data mereka akan dikekalkan.')) return
    await supabase.from('profiles').delete().eq('id', userId)
    loadUsers()
  }

  const createAnnouncement = async () => {
    if (!annTitle || !annMessage) return
    const { data: { user } } = await supabase.auth.getUser()
    await supabase.from('announcements').insert({
      title: annTitle,
      message: annMessage,
      created_by: user?.id,
      is_active: true,
    })
    setAnnTitle('')
    setAnnMessage('')
    setShowAnnForm(false)
    loadAnnouncements()
  }

  const toggleAnnouncement = async (id: string, current: boolean) => {
    await supabase.from('announcements').update({ is_active: !current }).eq('id', id)
    loadAnnouncements()
  }

  const deleteAnnouncement = async (id: string) => {
    await supabase.from('announcements').delete().eq('id', id)
    loadAnnouncements()
  }

  const tabs = [
    { id: 'users', label: '👥 Pengguna', icon: '👥' },
    { id: 'announcements', label: '📢 Pengumuman', icon: '📢' },
    { id: 'data', label: '📊 Data Overview', icon: '📊' },
  ]

  return (
    <div className="space-y-6">
      {/* Header */}
      <motion.div
        className="glass rounded-2xl p-6"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
      >
        <div className="flex items-center gap-4">
          <span className="text-5xl">👑</span>
          <div>
            <h1 className="font-bebas text-4xl tracking-wider neon-text text-neon-purple">
              SUPER ADMIN DASHBOARD
            </h1>
            <p className="text-gray-400">Kawalan penuh sistem PulseGrid</p>
          </div>
        </div>
      </motion.div>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {[
          { label: 'Jumlah Pengguna', value: users.length, icon: '👥', color: 'from-blue-500 to-cyan-500' },
          { label: 'Super Admin', value: users.filter(u => u.role === 'super_admin').length, icon: '👑', color: 'from-purple-500 to-pink-500' },
          { label: 'Pengumuman Aktif', value: announcements.filter(a => a.is_active).length, icon: '📢', color: 'from-green-500 to-emerald-500' },
        ].map((stat, i) => (
          <motion.div
            key={stat.label}
            className="anime-card"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.1 }}
          >
            <div className={`bg-gradient-to-br ${stat.color} rounded-lg p-3 mb-3 inline-block`}>
              <span className="text-3xl">{stat.icon}</span>
            </div>
            <h3 className="text-3xl font-bold text-white">{stat.value}</h3>
            <p className="text-sm text-gray-400">{stat.label}</p>
          </motion.div>
        ))}
      </div>

      {/* Tabs */}
      <div className="glass rounded-xl p-2 flex gap-2">
        {tabs.map(tab => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id as any)}
            className={`flex items-center gap-2 px-4 py-2 rounded-lg font-bold transition-all ${
              activeTab === tab.id
                ? 'bg-gradient-to-r from-neon-purple to-neon-pink text-white'
                : 'text-gray-400 hover:text-white hover:bg-white/10'
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* Tab Content */}
      <AnimatePresence mode="wait">
        {activeTab === 'users' && (
          <motion.div
            key="users"
            className="glass rounded-2xl p-6"
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
          >
            <h2 className="font-bebas text-2xl text-neon-blue mb-4">👥 SENARAI PENGGUNA</h2>
            {loading ? (
              <div className="flex justify-center py-8"><div className="spinner" /></div>
            ) : (
              <div className="overflow-x-auto">
                <table className="data-table min-w-full">
                  <thead>
                    <tr>
                      <th>BIL</th>
                      <th>AVATAR</th>
                      <th>NAMA</th>
                      <th>EMAIL</th>
                      <th>PERANAN</th>
                      <th>TARIKH DAFTAR</th>
                      <th>TINDAKAN</th>
                    </tr>
                  </thead>
                  <tbody>
                    {users.map((u, i) => (
                      <motion.tr
                        key={u.id}
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        transition={{ delay: i * 0.05 }}
                      >
                        <td className="text-center">{i + 1}</td>
                        <td>
                          <img
                            src={u.avatar_url || `https://api.dicebear.com/7.x/avataaars/svg?seed=${u.email}`}
                            alt={u.full_name}
                            className="w-10 h-10 rounded-full border-2 border-neon-blue mx-auto"
                          />
                        </td>
                        <td className="font-bold">{u.full_name}</td>
                        <td className="text-gray-300">{u.email}</td>
                        <td>
                          <span className={`px-2 py-1 rounded-full text-xs font-bold ${
                            u.role === 'super_admin' ? 'bg-neon-purple text-white' : 'bg-gray-700 text-gray-300'
                          }`}>
                            {u.role === 'super_admin' ? '👑 Super Admin' : '👤 User'}
                          </span>
                        </td>
                        <td className="text-gray-400 text-sm">
                          {new Date(u.created_at).toLocaleDateString('ms-MY')}
                        </td>
                        <td>
                          <div className="flex gap-2">
                            {u.role !== 'super_admin' ? (
                              <button
                                onClick={() => promoteToAdmin(u.id)}
                                className="text-xs bg-neon-purple/20 text-neon-purple px-2 py-1 rounded hover:bg-neon-purple hover:text-white transition-all"
                              >
                                👑 Promote
                              </button>
                            ) : (
                              <button
                                onClick={() => demoteUser(u.id)}
                                className="text-xs bg-gray-700 text-gray-300 px-2 py-1 rounded hover:bg-gray-600 transition-all"
                              >
                                ↓ Demote
                              </button>
                            )}
                            <button
                              onClick={() => deleteUser(u.id)}
                              className="text-xs bg-red-500/20 text-red-400 px-2 py-1 rounded hover:bg-red-500 hover:text-white transition-all"
                            >
                              🗑️ Padam
                            </button>
                          </div>
                        </td>
                      </motion.tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </motion.div>
        )}

        {activeTab === 'announcements' && (
          <motion.div
            key="announcements"
            className="glass rounded-2xl p-6 space-y-4"
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
          >
            <div className="flex items-center justify-between">
              <h2 className="font-bebas text-2xl text-neon-blue">📢 PENGUMUMAN</h2>
              <button
                onClick={() => setShowAnnForm(!showAnnForm)}
                className="btn-primary"
              >
                ➕ Pengumuman Baharu
              </button>
            </div>

            {/* Create Form */}
            <AnimatePresence>
              {showAnnForm && (
                <motion.div
                  className="glass-light rounded-xl p-4 space-y-3"
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: 'auto' }}
                  exit={{ opacity: 0, height: 0 }}
                >
                  <input
                    type="text"
                    value={annTitle}
                    onChange={e => setAnnTitle(e.target.value)}
                    placeholder="Tajuk Pengumuman"
                    className="input-field"
                  />
                  <textarea
                    value={annMessage}
                    onChange={e => setAnnMessage(e.target.value)}
                    placeholder="Isi Pengumuman..."
                    className="input-field h-24 resize-none"
                  />
                  <div className="flex gap-3">
                    <button onClick={createAnnouncement} className="btn-primary flex-1">
                      📢 Hantar
                    </button>
                    <button onClick={() => setShowAnnForm(false)} className="btn-secondary flex-1">
                      ✕ Batal
                    </button>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>

            {/* Announcements List */}
            <div className="space-y-3">
              {announcements.map((ann, i) => (
                <motion.div
                  key={ann.id}
                  className={`glass-light rounded-xl p-4 border ${ann.is_active ? 'border-neon-green/50' : 'border-gray-700'}`}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: i * 0.05 }}
                >
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-1">
                        <h4 className="font-bold text-white">{ann.title}</h4>
                        <span className={`text-xs px-2 py-0.5 rounded-full ${ann.is_active ? 'bg-neon-green/20 text-neon-green' : 'bg-gray-700 text-gray-400'}`}>
                          {ann.is_active ? '🟢 Aktif' : '⚫ Tidak Aktif'}
                        </span>
                      </div>
                      <p className="text-sm text-gray-300">{ann.message}</p>
                      <p className="text-xs text-gray-500 mt-1">
                        {new Date(ann.created_at).toLocaleString('ms-MY')}
                      </p>
                    </div>
                    <div className="flex gap-2">
                      <button
                        onClick={() => toggleAnnouncement(ann.id, ann.is_active)}
                        className="text-xs px-2 py-1 rounded bg-neon-blue/20 text-neon-blue hover:bg-neon-blue hover:text-white transition-all"
                      >
                        {ann.is_active ? '⏸️' : '▶️'}
                      </button>
                      <button
                        onClick={() => deleteAnnouncement(ann.id)}
                        className="text-xs px-2 py-1 rounded bg-red-500/20 text-red-400 hover:bg-red-500 hover:text-white transition-all"
                      >
                        🗑️
                      </button>
                    </div>
                  </div>
                </motion.div>
              ))}
            </div>
          </motion.div>
        )}

        {activeTab === 'data' && (
          <motion.div
            key="data"
            className="glass rounded-2xl p-6"
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
          >
            <h2 className="font-bebas text-2xl text-neon-blue mb-4">📊 DATA OVERVIEW</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="glass-light rounded-xl p-4">
                <h3 className="text-neon-green font-bold mb-3">⏰ Punch Card Stats</h3>
                <p className="text-gray-400 text-sm">Jumlah rekod punch card dalam sistem</p>
                <DataCounter table="punch_cards" />
              </div>
              <div className="glass-light rounded-xl p-4">
                <h3 className="text-neon-blue font-bold mb-3">🚗 Travel Log Stats</h3>
                <p className="text-gray-400 text-sm">Jumlah rekod log perjalanan</p>
                <DataCounter table="travel_logs" />
              </div>
              <div className="glass-light rounded-xl p-4">
                <h3 className="text-neon-purple font-bold mb-3">⚖️ Enforcement Stats</h3>
                <p className="text-gray-400 text-sm">Jumlah kes penguatkuasaan</p>
                <DataCounter table="enforcement_data" />
              </div>
              <div className="glass-light rounded-xl p-4">
                <h3 className="text-neon-pink font-bold mb-3">👥 User Stats</h3>
                <p className="text-gray-400 text-sm">Jumlah pengguna berdaftar</p>
                <p className="text-4xl font-bold text-white mt-2">{users.length}</p>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}

function DataCounter({ table }: { table: string }) {
  const [count, setCount] = useState<number | null>(null)

  useEffect(() => {
    supabase.from(table).select('*', { count: 'exact', head: true }).then(({ count }) => {
      setCount(count)
    })
  }, [table])

  return (
    <p className="text-4xl font-bold text-white mt-2">
      {count === null ? <span className="spinner w-6 h-6 inline-block" /> : count}
    </p>
  )
}
