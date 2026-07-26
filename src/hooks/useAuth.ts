import { useEffect, useState } from 'react'
import type { Session } from '@supabase/supabase-js'
import { supabase } from '../lib/supabaseClient'

type AuthState = {
  session: Session | null
  isAdmin: boolean
  loading: boolean
}

export function useAuth() {
  const [state, setState] = useState<AuthState>({
    session: null,
    isAdmin: false,
    loading: true,
  })

  useEffect(() => {
    let active = true

    async function loadSession(session: Session | null) {
      if (!session) {
        if (active) setState({ session: null, isAdmin: false, loading: false })
        return
      }

      const { data: isAdmin } = await supabase.rpc('is_admin')
      if (active) setState({ session, isAdmin: Boolean(isAdmin), loading: false })
    }

    supabase.auth.getSession().then(({ data }) => loadSession(data.session))

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      loadSession(session)
    })

    return () => {
      active = false
      subscription.unsubscribe()
    }
  }, [])

  async function signIn(email: string, password: string) {
    const { error } = await supabase.auth.signInWithPassword({ email, password })
    if (error) throw error
  }

  async function signOut() {
    await supabase.auth.signOut()
  }

  return { ...state, signIn, signOut }
}
