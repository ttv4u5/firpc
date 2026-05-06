'use client'

import { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { supabase } from '@/lib/supabase'
import '../lib/i18n'
import { useTranslation } from 'react-i18next'

export default function LoginScreen() {
  const { t, i18n } = useTranslation()
  const [showAdminLogin, setShowAdminLogin] = useState(false)
  const [username, setUsername] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const [currentBg, setCurrentBg] = useState(0)
  const [particles, setParticles] = useState<Array<{id: number, x: number, y: number, size: number, speed: number}>>([])

  const animeBackgrounds = [
    'https://raw.githubusercontent.com/ttv4u1/KP/main/anime1.jpg',
    'https://images.unsplash.com/photo-1578632767115-351597cf2477?w=1920&q=80',
    'https://images.unsplash.com/photo-1541701494587-cb58502866ab?w=1920&q=80',
  ]

  useEffect(() => {
    // Generate particles
    const newParticles = Array.from({ length: 30 }, (_, i) => ({
      id: i,
      x: Math.random() * 100,
      y: Math.random() * 100,
      size: Math.random() * 4 + 1,
      speed: Math.random() * 3 + 1,
    }))
    setParticles(newParticles)

    // Rotate backgrounds
    const interval = setInterval(() => {
      setCurrentBg(prev => (prev + 1) % animeBackgrounds.length)
    }, 5000)
    return () => clearInterval(interval)
  }, [])

  const handleGoogleLogin = async () => {
    setLoading(true)
    const { error } = await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: {
        redirectTo: typeof window !== 'undefined' ? window.location.origin + '/firpc/' : undefined,
      }
    })
    if (error) {
      setError(error.message)
      setLoading(false)
    }
  }

  const handleAdminLogin = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError('')

    // Super admin credentials check
    if (username === 'admin' && password === 'admin') {
      // Sign in with admin email
      const { error } = await supabase.auth.signInWithPassword({
        email: 'ttv4u5@gmail.com',
        password: 'admin123456',
      })
      if (error) {
        // Try to create admin account if not exists
        const { error: signUpError } = await supabase.auth.signUp({
          email: 'ttv4u5@gmail.com',
          password: 'admin123456',
          options: {
            data: {
              full_name: 'Super Admin',
              role: 'super_admin',
            }
          }
        })
        if (signUpError) {
          setError('Admin login failed. Please use Google login.')
        }
      }
    } else {
      setError('Invalid credentials. Use admin/admin')
    }
    setLoading(false)
  }

  const toggleLang = () => {
    i18n.changeLanguage(i18n.language === 'ms' ? 'en' : 'ms')
  }

  return (
    <div className="min-h-screen relative overflow-hidden flex items-center justify-center">
      {/* Animated Background */}
      <AnimatePresence mode="wait">
        <motion.div
          key={currentBg}
          className="absolute inset-0 z-0"
          initial={{ opacity: 0, scale: 1.1 }}
          animate={{ opacity: 0.4, scale: 1 }}
          exit={{ opacity: 0, scale: 0.95 }}
          transition={{ duration: 1.5 }}
          style={{
            backgroundImage: `url(${animeBackgrounds[currentBg]})`,
            backgroundSize: 'cover',
            backgroundPosition: 'center',
          }}
        />
      </AnimatePresence>

      {/* Dark Overlay */}
      <div className="absolute inset-0 z-0 bg-gradient-to-b from-dark-bg/80 via-dark-bg/60 to-dark-bg/90" />

      {/* Floating Particles */}
      {particles.map(p => (
        <motion.div
          key={p.id}
          className="absolute rounded-full bg-neon-blue opacity-60 z-0"
          style={{
            left: `${p.x}%`,
            top: `${p.y}%`,
            width: p.size,
            height: p.size,
          }}
          animate={{
            y: [0, -100, 0],
            opacity: [0.6, 0.2, 0.6],
          }}
          transition={{
            duration: p.speed * 3,
            repeat: Infinity,
            ease: 'easeInOut',
          }}
        />
      ))}

      {/* Language Toggle */}
      <button
        onClick={toggleLang}
        className="absolute top-4 right-4 z-20 glass px-4 py-2 rounded-full text-neon-blue font-bold hover:scale-105 transition-all"
      >
        {i18n.language === 'ms' ? '🇬🇧 EN' : '🇲🇾 BM'}
      </button>

      {/* Main Content */}
      <motion.div
        className="relative z-10 w-full max-w-md px-4"
        initial={{ opacity: 0, y: 50 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.8, ease: 'easeOut' }}
      >
        {/* Header Logos */}
        <div className="flex items-center justify-center gap-4 mb-8">
          <motion.img
            src="https://upload.wikimedia.org/wikipedia/commons/thumb/2/26/Coat_of_arms_of_Malaysia.svg/250px-Coat_of_arms_of_Malaysia.svg.png"
            alt="Jata Negara"
            className="w-16 h-16 object-contain drop-shadow-lg"
            animate={{ rotate: [0, 5, -5, 0] }}
            transition={{ duration: 4, repeat: Infinity }}
          />
          <motion.img
            src="https://github.com/ttv4u1/KP/raw/main/DVS.svg"
            alt="DVS Logo"
            className="w-16 h-16 object-contain drop-shadow-lg"
            animate={{ scale: [1, 1.05, 1] }}
            transition={{ duration: 3, repeat: Infinity }}
          />
          <motion.img
            src="https://github.com/ttv4u1/KP/raw/main/Logo%20Penguatkuasa.png"
            alt="Logo Penguatkuasa"
            className="w-16 h-16 object-contain drop-shadow-lg"
            animate={{ rotate: [0, -5, 5, 0] }}
            transition={{ duration: 4, repeat: Infinity, delay: 0.5 }}
          />
        </div>

        {/* Title */}
        <motion.div
          className="text-center mb-8"
          initial={{ opacity: 0, scale: 0.8 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: 0.3, duration: 0.6 }}
        >
          <h1 className="font-bebas text-6xl tracking-widest neon-text text-neon-blue drop-shadow-2xl">
            PULSEGRID
          </h1>
          <p className="text-neon-purple text-lg font-bold tracking-wider mt-1">
            {t('auth.subtitle')}
          </p>
          <div className="mt-3 glass rounded-lg p-3 text-sm text-gray-300">
            <p className="mb-1">🎯 <span className="text-neon-blue font-bold">Visi:</span> {t('auth.vision')}</p>
            <p>⚡ <span className="text-neon-pink font-bold">Misi:</span> {t('auth.mission')}</p>
          </div>
        </motion.div>

        {/* Login Card */}
        <motion.div
          className="glass rounded-2xl p-8 shadow-2xl"
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.5, duration: 0.6 }}
        >
          <AnimatePresence mode="wait">
            {!showAdminLogin ? (
              <motion.div
                key="google-login"
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: 20 }}
              >
                {/* Google Login */}
                <motion.button
                  onClick={handleGoogleLogin}
                  disabled={loading}
                  className="w-full flex items-center justify-center gap-3 py-4 px-6 rounded-xl font-bold text-white text-lg transition-all duration-300 mb-4"
                  style={{
                    background: 'linear-gradient(135deg, #4285F4, #34A853)',
                    boxShadow: '0 4px 20px rgba(66, 133, 244, 0.5)',
                  }}
                  whileHover={{ scale: 1.03, boxShadow: '0 6px 30px rgba(66, 133, 244, 0.7)' }}
                  whileTap={{ scale: 0.97 }}
                >
                  {loading ? (
                    <div className="spinner w-6 h-6" />
                  ) : (
                    <>
                      <svg className="w-6 h-6" viewBox="0 0 24 24">
                        <path fill="white" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
                        <path fill="white" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
                        <path fill="white" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
                        <path fill="white" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
                      </svg>
                      {t('auth.login')}
                    </>
                  )}
                </motion.button>

                <div className="relative my-4">
                  <div className="absolute inset-0 flex items-center">
                    <div className="w-full border-t border-gray-600" />
                  </div>
                  <div className="relative flex justify-center text-sm">
                    <span className="px-2 bg-transparent text-gray-400">atau</span>
                  </div>
                </div>

                <motion.button
                  onClick={() => setShowAdminLogin(true)}
                  className="w-full py-3 px-6 rounded-xl font-bold text-neon-purple border border-neon-purple hover:bg-neon-purple hover:text-white transition-all duration-300"
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                >
                  🔐 {t('auth.adminLogin')}
                </motion.button>
              </motion.div>
            ) : (
              <motion.div
                key="admin-login"
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
              >
                <h3 className="text-neon-purple font-bebas text-2xl tracking-wider mb-4 text-center">
                  🔐 SUPER ADMIN LOGIN
                </h3>
                <form onSubmit={handleAdminLogin} className="space-y-4">
                  <div>
                    <label className="text-gray-300 text-sm mb-1 block">{t('auth.username')}</label>
                    <input
                      type="text"
                      value={username}
                      onChange={e => setUsername(e.target.value)}
                      placeholder="admin"
                      className="input-field"
                      required
                    />
                  </div>
                  <div>
                    <label className="text-gray-300 text-sm mb-1 block">{t('auth.password')}</label>
                    <input
                      type="password"
                      value={password}
                      onChange={e => setPassword(e.target.value)}
                      placeholder="••••••"
                      className="input-field"
                      required
                    />
                  </div>
                  {error && (
                    <motion.p
                      className="text-red-400 text-sm text-center"
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                    >
                      ⚠️ {error}
                    </motion.p>
                  )}
                  <motion.button
                    type="submit"
                    disabled={loading}
                    className="w-full btn-secondary py-3 rounded-xl"
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                  >
                    {loading ? <div className="spinner w-5 h-5 mx-auto" /> : '🚀 Log Masuk'}
                  </motion.button>
                  <button
                    type="button"
                    onClick={() => setShowAdminLogin(false)}
                    className="w-full text-gray-400 hover:text-white text-sm transition-colors"
                  >
                    ← Kembali
                  </button>
                </form>
              </motion.div>
            )}
          </AnimatePresence>
        </motion.div>

        {/* Version */}
        <motion.p
          className="text-center text-gray-500 text-sm mt-4"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 1 }}
        >
          PulseGrid v1.0 © 2025 | Jabatan Perkhidmatan Veterinar Malaysia
        </motion.p>
      </motion.div>
    </div>
  )
}
