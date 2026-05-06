'use client'

import { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { supabase } from '@/lib/supabase'
import type { User } from '@supabase/supabase-js'
import '../lib/i18n'
import { useTranslation } from 'react-i18next'
import Dashboard from './Dashboard'
import PunchCard from './PunchCard'
import TravelLog from './TravelLog'
import EnforcementData from './EnforcementData'
import SuperAdmin from './SuperAdmin'

interface AppShellProps {
  user: User
  isAdmin: boolean
}

export default function AppShell({ user, isAdmin }: AppShellProps) {
  const { t, i18n } = useTranslation()
  const [currentPage, setCurrentPage] = useState('dashboard')
  const [showProfile, setShowProfile] = useState(false)
  const [profile, setProfile] = useState<any>(null)
  const [announcement, setAnnouncement] = useState<any>(null)

  useEffect(() => {
    loadProfile()
    loadAnnouncement()
    
    // Auto-hide profile after 5 seconds
    let timeout: NodeJS.Timeout
    if (showProfile) {
      timeout = setTimeout(() => setShowProfile(false), 5000)
    }
    return () => clearTimeout(timeout)
  }, [showProfile, user.id])

  const loadProfile = async () => {
    const { data } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', user.id)
      .single()
    setProfile(data)
  }

  const loadAnnouncement = async () => {
    const { data } = await supabase
      .from('announcements')
      .select('*')
      .eq('is_active', true)
      .order('created_at', { ascending: false })
      .limit(1)
      .single()
    setAnnouncement(data)
  }

  const handleLogout = async () => {
    await supabase.auth.signOut()
  }

  const toggleLang = () => {
    i18n.changeLanguage(i18n.language === 'ms' ? 'en' : 'ms')
  }

  const navItems = [
    { id: 'dashboard', label: t('nav.home'), icon: '🏠' },
    { id: 'punchcard', label: t('nav.punchcard'), icon: '⏰' },
    { id: 'travellog', label: t('nav.travellog'), icon: '🚗' },
    { id: 'enforcement', label: t('nav.enforcement'), icon: '⚖️' },
    ...(isAdmin ? [{ id: 'admin', label: t('nav.admin'), icon: '👑' }] : []),
  ]

  return (
    <div className="min-h-screen relative overflow-hidden">
      {/* Anime Background */}
      <div 
        className="anime-bg"
        style={{
          backgroundImage: 'url(https://github.com/FDE-X/flexdata/raw/main/assets/b5.jpg)',
        }}
      />

      {/* Header */}
      <motion.header
        className="glass sticky top-0 z-40 border-b border-neon-blue/30"
        initial={{ y: -100 }}
        animate={{ y: 0 }}
        transition={{ duration: 0.5 }}
      >
        <div className="container mx-auto px-4 py-3">
          <div className="flex items-center justify-between">
            {/* Logos */}
            <div className="flex items-center gap-3">
              <img
                src="https://upload.wikimedia.org/wikipedia/commons/thumb/2/26/Coat_of_arms_of_Malaysia.svg/250px-Coat_of_arms_of_Malaysia.svg.png"
                alt="Jata Negara"
                className="w-10 h-10 object-contain"
              />
              <img
                src="https://github.com/ttv4u1/KP/raw/main/DVS.svg"
                alt="DVS"
                className="w-10 h-10 object-contain"
              />
              <img
                src="https://github.com/ttv4u1/KP/raw/main/Logo%20Penguatkuasa.png"
                alt="Penguatkuasa"
                className="w-10 h-10 object-contain"
              />
              <div className="ml-2">
                <h1 className="font-bebas text-2xl tracking-wider neon-text text-neon-blue">
                  PULSEGRID
                </h1>
                <p className="text-xs text-gray-400">v1.0</p>
              </div>
            </div>

            {/* Right Actions */}
            <div className="flex items-center gap-3">
              <button
                onClick={toggleLang}
                className="glass-light px-3 py-1 rounded-full text-sm font-bold text-neon-blue hover:scale-105 transition-all"
              >
                {i18n.language === 'ms' ? 'EN' : 'BM'}
              </button>
              
              <button
                onClick={() => setShowProfile(!showProfile)}
                className="flex items-center gap-2 glass-light px-3 py-2 rounded-full hover:scale-105 transition-all"
              >
                <img
                  src={profile?.avatar_url || 'https://api.dicebear.com/7.x/avataaars/svg?seed=' + user.email}
                  alt="Avatar"
                  className="w-8 h-8 rounded-full border-2 border-neon-blue"
                />
                <span className="text-sm font-bold text-white hidden md:block">
                  {profile?.full_name || user.email?.split('@')[0]}
                </span>
              </button>
            </div>
          </div>
        </div>
      </motion.header>

      {/* Profile Dropdown */}
      <AnimatePresence>
        {showProfile && (
          <motion.div
            className="fixed top-20 right-4 z-50 profile-dropdown w-80"
            initial={{ opacity: 0, y: -20, scale: 0.9 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -20, scale: 0.9 }}
          >
            <div className="flex items-center gap-3 mb-4 pb-4 border-b border-gray-700">
              <img
                src={profile?.avatar_url || 'https://api.dicebear.com/7.x/avataaars/svg?seed=' + user.email}
                alt="Avatar"
                className="w-16 h-16 rounded-full border-2 border-neon-blue"
              />
              <div>
                <h3 className="font-bold text-white">{profile?.full_name}</h3>
                <p className="text-sm text-gray-400">{user.email}</p>
                <span className={`text-xs px-2 py-1 rounded-full ${isAdmin ? 'bg-neon-purple' : 'bg-neon-blue'} text-white`}>
                  {isAdmin ? '👑 Super Admin' : '👤 User'}
                </span>
              </div>
            </div>
            
            <div className="space-y-2 text-sm text-gray-300">
              <p><span className="text-neon-blue">📧 Email:</span> {user.email}</p>
              <p><span className="text-neon-blue">🆔 ID:</span> {user.id.slice(0, 8)}...</p>
              <p><span className="text-neon-blue">📅 Joined:</span> {new Date(profile?.created_at).toLocaleDateString('ms-MY')}</p>
            </div>

            <button
              onClick={handleLogout}
              className="w-full mt-4 btn-secondary py-2 rounded-lg text-sm"
            >
              🚪 {t('nav.logout')}
            </button>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Announcement Banner */}
      {announcement && (
        <motion.div
          className="container mx-auto px-4 mt-4"
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
        >
          <div className="announcement-banner">
            <div className="flex items-start gap-3">
              <span className="text-2xl">📢</span>
              <div className="flex-1">
                <h4 className="font-bold text-neon-blue mb-1">{announcement.title}</h4>
                <p className="text-sm text-gray-300">{announcement.message}</p>
              </div>
              <button
                onClick={() => setAnnouncement(null)}
                className="text-gray-400 hover:text-white"
              >
                ✕
              </button>
            </div>
          </div>
        </motion.div>
      )}

      {/* Navigation */}
      <motion.nav
        className="container mx-auto px-4 mt-4"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.2 }}
      >
        <div className="glass rounded-xl p-2 flex flex-wrap gap-2">
          {navItems.map((item) => (
            <motion.button
              key={item.id}
              onClick={() => setCurrentPage(item.id)}
              className={`flex items-center gap-2 px-4 py-2 rounded-lg font-bold transition-all ${
                currentPage === item.id
                  ? 'bg-gradient-to-r from-neon-blue to-neon-purple text-white shadow-lg'
                  : 'text-gray-400 hover:text-white hover:bg-white/10'
              }`}
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
            >
              <span className="text-xl">{item.icon}</span>
              <span className="hidden sm:inline">{item.label}</span>
            </motion.button>
          ))}
        </div>
      </motion.nav>

      {/* Main Content */}
      <main className="container mx-auto px-4 py-6">
        <AnimatePresence mode="wait">
          <motion.div
            key={currentPage}
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
            transition={{ duration: 0.3 }}
          >
            {currentPage === 'dashboard' && <Dashboard user={user} isAdmin={isAdmin} />}
            {currentPage === 'punchcard' && <PunchCard user={user} />}
            {currentPage === 'travellog' && <TravelLog user={user} />}
            {currentPage === 'enforcement' && <EnforcementData user={user} isAdmin={isAdmin} />}
            {currentPage === 'admin' && isAdmin && <SuperAdmin />}
          </motion.div>
        </AnimatePresence>
      </main>

      {/* Footer */}
      <footer className="container mx-auto px-4 py-6 text-center text-gray-500 text-sm">
        <p>© 2025 PulseGrid | Jabatan Perkhidmatan Veterinar Malaysia</p>
      </footer>
    </div>
  )
}
