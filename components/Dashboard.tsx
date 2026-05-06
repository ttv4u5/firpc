'use client'

import { motion } from 'framer-motion'
import type { User } from '@supabase/supabase-js'
import { useTranslation } from 'react-i18next'

interface DashboardProps {
  user: User
  isAdmin: boolean
}

export default function Dashboard({ user, isAdmin }: DashboardProps) {
  const { t } = useTranslation()

  const stats = [
    { label: 'Punch Card Entries', value: '24', icon: '⏰', color: 'from-blue-500 to-cyan-500' },
    { label: 'Travel Logs', value: '12', icon: '🚗', color: 'from-green-500 to-emerald-500' },
    { label: 'Enforcement Cases', value: '8', icon: '⚖️', color: 'from-purple-500 to-pink-500' },
    { label: 'Total Users', value: '45', icon: '👥', color: 'from-orange-500 to-red-500', adminOnly: true },
  ]

  const quickActions = [
    { label: 'Add Punch Entry', icon: '➕⏰', action: 'punchcard' },
    { label: 'Log Travel', icon: '➕🚗', action: 'travellog' },
    { label: 'Report Case', icon: '➕⚖️', action: 'enforcement' },
  ]

  return (
    <div className="space-y-6">
      {/* Welcome Section */}
      <motion.div
        className="glass rounded-2xl p-8 text-center"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
      >
        <motion.h1
          className="font-bebas text-5xl tracking-widest neon-text text-neon-blue mb-2"
          animate={{ scale: [1, 1.02, 1] }}
          transition={{ duration: 2, repeat: Infinity }}
        >
          {t('dashboard.welcome').toUpperCase()}
        </motion.h1>
        <p className="text-xl text-gray-300">
          {user.email}
        </p>
        <p className="text-sm text-gray-500 mt-2">
          {new Date().toLocaleDateString('ms-MY', { 
            weekday: 'long', 
            year: 'numeric', 
            month: 'long', 
            day: 'numeric' 
          })}
        </p>
      </motion.div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {stats
          .filter(stat => !stat.adminOnly || isAdmin)
          .map((stat, index) => (
            <motion.div
              key={stat.label}
              className="anime-card"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.1 }}
            >
              <div className={`bg-gradient-to-br ${stat.color} rounded-lg p-4 mb-3`}>
                <span className="text-4xl">{stat.icon}</span>
              </div>
              <h3 className="text-3xl font-bold text-white mb-1">{stat.value}</h3>
              <p className="text-sm text-gray-400">{stat.label}</p>
            </motion.div>
          ))}
      </div>

      {/* Quick Actions */}
      <motion.div
        className="glass rounded-2xl p-6"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.3 }}
      >
        <h2 className="font-bebas text-2xl tracking-wider text-neon-blue mb-4">
          ⚡ QUICK ACTIONS
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {quickActions.map((action, index) => (
            <motion.button
              key={action.label}
              className="btn-primary py-4 rounded-xl text-lg"
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.4 + index * 0.1 }}
            >
              <span className="text-2xl mr-2">{action.icon}</span>
              {action.label}
            </motion.button>
          ))}
        </div>
      </motion.div>

      {/* Character Grid */}
      <motion.div
        className="glass rounded-2xl p-6"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.5 }}
      >
        <h2 className="font-bebas text-2xl tracking-wider text-neon-purple mb-4">
          🎨 TEAM CHARACTERS
        </h2>
        <div className="character-grid">
          {[
            'https://api.dicebear.com/7.x/avataaars/svg?seed=Felix',
            'https://api.dicebear.com/7.x/avataaars/svg?seed=Aneka',
            'https://api.dicebear.com/7.x/avataaars/svg?seed=Luna',
            'https://api.dicebear.com/7.x/avataaars/svg?seed=Max',
            'https://api.dicebear.com/7.x/avataaars/svg?seed=Zoe',
            'https://api.dicebear.com/7.x/avataaars/svg?seed=Leo',
          ].map((avatar, index) => (
            <motion.div
              key={index}
              className="character-card"
              initial={{ opacity: 0, scale: 0.8 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: 0.6 + index * 0.05 }}
              whileHover={{ y: -10 }}
            >
              <img src={avatar} alt={`Character ${index + 1}`} />
            </motion.div>
          ))}
        </div>
      </motion.div>

      {/* System Info */}
      <motion.div
        className="glass rounded-2xl p-6"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.7 }}
      >
        <h2 className="font-bebas text-2xl tracking-wider text-neon-green mb-4">
          ℹ️ SYSTEM INFO
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
          <div>
            <p className="text-gray-400">Status</p>
            <p className="text-neon-green font-bold">🟢 Online</p>
          </div>
          <div>
            <p className="text-gray-400">Version</p>
            <p className="text-white font-bold">v1.0.0</p>
          </div>
          <div>
            <p className="text-gray-400">Last Updated</p>
            <p className="text-white font-bold">{new Date().toLocaleDateString('ms-MY')}</p>
          </div>
        </div>
      </motion.div>
    </div>
  )
}
