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
    // Check current session
    supabase.auth.getSession().then(({ data: { session } }) => {
      setUser(session?.user ?? null)
      if (session?.user) {
        checkAdminStatus(session.user.id)
      }
      setLoading(false)
    })

    // Listen for auth changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, session) => {
      setUser(session?.user ?? null)
      if (session?.user) {
        await ensureProfile(session.user)
        await checkAdminStatus(session.user.id)
      }
      setLoading(false)
    })

    return () => subscription.unsubscribe()
  }, [])

  const ensureProfile = async (user: User) => {
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
  }

  const checkAdminStatus = async (userId: string) => {
    const { data } = await supabase
      .from('profiles')
      .select('role')
      .eq('id', userId)
      .single()
    setIsAdmin(data?.role === 'super_admin')
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-dark-bg">
        <div className="text-center">
          <div className="spinner mx-auto mb-4" />
          <p className="text-neon-blue font-bebas text-2xl tracking-widest animate-pulse">
            PULSEGRID LOADING...
          </p>
        </div>
      </div>
    )
  }

  if (!user) {
    return <LoginScreen />
  }

  return <AppShell user={user} isAdmin={isAdmin} />
}
