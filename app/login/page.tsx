'use client'
import { useState } from 'react'
import { createClient } from '@/lib/supabase/client'

export default function Login() {
  const [email, setEmail] = useState('')
  const [sent, setSent] = useState(false)

  const handleLogin = async () => {
    const supabase = createClient()
    const { error } = await supabase.auth.signInWithOtp({
      email,
      options: { emailRedirectTo: `${location.origin}/auth/callback` },
    })
    if (!error) setSent(true)
  }

  if (sent) return <p style={{ maxWidth: 320, margin: '4rem auto' }}>Revisa el teu correu i clica l&apos;enllaç per entrar.</p>

  return (
    <div style={{ maxWidth: 320, margin: '4rem auto', display: 'flex', flexDirection: 'column', gap: 12 }}>
      <h1>Planter</h1>
      <input type="email" placeholder="El teu correu" value={email}
        onChange={(e) => setEmail(e.target.value)} />
      <button onClick={handleLogin}>Envia l&apos;enllaç d&apos;accés</button>
    </div>
  )
}