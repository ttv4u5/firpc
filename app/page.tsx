'use client'

import { useEffect, useState } from 'react'
import { supabase } from '@/lib/supabase'
import LoginScreen from '@/components/LoginScreen'
import AppShell from '@/components/AppShell'
import type { User } from '@supabase/supabase-js'

export default function Home() {
  const [user, setUser] = useState<User | null>(null)
  const [loading, setLoading] = useState(true)
  const [isAdmin, setIsAdmin] = useState(false)

  useEffect(() => {
    // Hard timeout — never stuck loading more than 4 seconds
    const hardTimeout = setTimeout(() => setLoading(false), 4000)

    supabase.auth.getSession().then(({ data: { session } }) => {
      clearTimeout(hardTimeout)
      setUser(session?.user ?? null)
      if (session?.user) {
        checkAdminStatus(session.user.id)
      }
      setLoading(false)
    }).catch(() => {
      clearTimeout(hardTimeout)
      setLoading(false)
    })

    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, session) => {
      setUser(session?.user ?? null)
      if (session?.user) {
        ensureProfile(session.user)
        checkAdminStatus(session.user.id)
      }
      setLoading(false)
    })

    return () => {
      clearTimeout(hardTimeout)
      subscription.unsubscribe()
    }
  }, [])

  const ensureProfile = async (user: User) => {
    try {
      const { data: existing } = await supabase
        .from('profiles')
        .select('id')
        .eq('id', user.id)
        .single()

      if (!existing) {
        const isSuperAdmin = user.email === 'ttv4u5@gmail.com'
        await supabase.from('profiles').insert({
          id: user.id,
          email: user.email,
          full_name: user.user_metadata?.full_name || user.email?.split('@')[0],
          avatar_url: user.user_metadata?.avatar_url,
          role: isSuperAdmin ? 'super_admin' : 'user',
        })
      }
    } catch (_) {}
  }

  const checkAdminStatus = async (userId: string) => {
    try {
      const { data } = await supabase
        .from('profiles')
        .select('role')
        .eq('id', userId)
        .single()
      setIsAdmin(data?.role === 'super_admin')
    } catch (_) {}
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center"
        style={{ background: 'linear-gradient(135deg, #0a0a0f 0%, #1a1a2e 50%, #16213e 100%)' }}>
        <div className="text-center">
          <div
            className="mx-auto mb-4"
            style={{
              width: 48,
              height: 48,
              border: '4px solid rgba(0,243,255,0.2)',
              borderTopColor: '#00f3ff',
              borderRadius: '50%',
              animation: 'spin 0.8s linear infinite',
            }}
          />
          <p style={{
            color: '#00f3ff',
            fontFamily: 'sans-serif',
            fontSize: '1.25rem',
            letterSpacing: '0.2em',
            textShadow: '0 0 10px #00f3ff',
          }}>
            PULSEGRID LOADING...
          </p>
          <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
        </div>
      </div>
    )
  }

  if (!user) {
    return <LoginScreen />
  }

  return <AppShell user={user} isAdmin={isAdmin} />
}
