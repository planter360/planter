'use client'
import { useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { Logomark, LogomarkNegatiu } from '@/components/Logomark'

export default function Login() {
  const [email, setEmail] = useState('')
  const [sent, setSent] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!email.trim()) return
    setLoading(true)
    setError('')
    const supabase = createClient()
    const { error } = await supabase.auth.signInWithOtp({
      email: email.trim(),
      options: { emailRedirectTo: `${location.origin}/auth/callback` },
    })
    setLoading(false)
    if (!error) {
      setSent(true)
      return
    }
    // El missatge original de Supabase ajuda a distingir un límit
    // d'enviaments d'un problema de configuració del correu.
    const tooMany = error.status === 429 || /rate limit|security purposes/i.test(error.message)
    setError(
      tooMany
        ? 'Has demanat massa enllaços seguits. Espera uns minuts i torna-ho a provar.'
        : `No hem pogut enviar l’enllaç. Revisa el correu i torna-ho a provar. (${error.message})`
    )
  }

  return (
    <main className="min-h-screen grid lg:grid-cols-[1fr_1.05fr] bg-[#F3F5F0] text-[#16211A] font-sans">
      {/* Columna de marca */}
      <section className="relative hidden lg:flex flex-col justify-between overflow-hidden bg-[#0F1E17] p-12 text-[#D9E4DC]">
        <div aria-hidden className="pointer-events-none absolute -right-24 -top-28 h-[26rem] w-[26rem] rounded-full border border-[#2E9E5B]/40" />
        <div aria-hidden className="pointer-events-none absolute -right-8 top-10 h-[18rem] w-[18rem] rounded-full border border-[#2E9E5B]/15" />
        <div aria-hidden className="pointer-events-none absolute -bottom-32 -left-16 h-[22rem] w-[22rem] rounded-full border border-[#2E9E5B]/20" />

        <div className="relative flex items-center gap-3">
          <LogomarkNegatiu size={40} />
          <span className="text-2xl font-bold tracking-wide text-white" style={{ fontFamily: 'var(--font-display)' }}>
            PLANTER
          </span>
        </div>

        <div className="relative max-w-md">
          <h1 className="text-5xl font-bold leading-[1.05] text-white" style={{ fontFamily: 'var(--font-display)' }}>
            LA VISIÓ 360<br />DEL TEU CLUB
          </h1>
          <p className="mt-5 text-base leading-relaxed text-[#AFC2B4]">
            Quotes, plantilles, entrenaments, partits i comunicació amb les famílies.
            Tot en un sol lloc, i cada persona hi veu exactament el que li pertoca.
          </p>
          <ul className="mt-8 space-y-3 text-sm">
            {['Cobra les quotes sense perseguir ningú', 'Passa llista des del mòbil en 30 segons', 'Les famílies, informades sense grups de WhatsApp'].map((t) => (
              <li key={t} className="flex items-start gap-3">
                <span aria-hidden className="mt-[2px] text-[#4FCB80]">✓</span>
                <span className="text-[#D9E4DC]">{t}</span>
              </li>
            ))}
          </ul>
        </div>

        <p className="relative text-xs text-[#6F8477]">
          Futbol · Bàsquet · Handbol · Vòlei · Futsal
        </p>
      </section>

      {/* Columna del formulari */}
      <section className="flex items-center justify-center px-6 py-12">
        <div className="w-full max-w-sm">
          {/* Marca compacta, només en mòbil */}
          <div className="mb-10 flex items-center gap-3 lg:hidden">
            <Logomark size={36} />
            <span className="text-xl font-bold tracking-wide" style={{ fontFamily: 'var(--font-display)' }}>
              PLANTER
            </span>
          </div>

          {sent ? (
            <div>
              <div className="mb-5 flex h-12 w-12 items-center justify-center rounded-2xl bg-[#E8F4EC] text-2xl">✉️</div>
              <h2 className="text-3xl font-bold" style={{ fontFamily: 'var(--font-display)' }}>
                REVISA EL CORREU
              </h2>
              <p className="mt-3 text-sm leading-relaxed text-[#5D6B61]">
                Hem enviat un enllaç d&apos;accés a <span className="font-semibold text-[#16211A]">{email}</span>.
                Clica&apos;l i entraràs directament, sense cap contrasenya.
              </p>
              <button
                onClick={() => { setSent(false); setEmail('') }}
                className="mt-6 text-sm font-semibold text-[#1E7040] underline underline-offset-4"
              >
                Provar amb un altre correu
              </button>
            </div>
          ) : (
            <>
              <h2 className="text-3xl font-bold" style={{ fontFamily: 'var(--font-display)' }}>
                ENTRA AL TEU CLUB
              </h2>
              <p className="mt-2 text-sm text-[#5D6B61]">
                Posa el teu correu i t&apos;enviem un enllaç d&apos;accés. Sense contrasenyes.
              </p>

              <form onSubmit={handleLogin} className="mt-8">
                <label htmlFor="email" className="block text-xs font-semibold uppercase tracking-wider text-[#5D6B61]">
                  Correu electrònic
                </label>
                <input
                  id="email"
                  type="email"
                  required
                  autoComplete="email"
                  placeholder="nom@elteuclub.cat"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="mt-2 w-full rounded-xl border border-[#E2E7DF] bg-white px-4 py-3 text-sm outline-none transition focus:border-[#2E9E5B] focus:ring-2 focus:ring-[#2E9E5B]/20"
                />

                {error && <p className="mt-3 text-sm text-[#A83232]">{error}</p>}

                <button
                  type="submit"
                  disabled={loading}
                  className="mt-5 w-full rounded-xl bg-[#0F1E17] px-4 py-3 text-sm font-semibold text-white transition hover:bg-[#1B2E23] disabled:opacity-60"
                >
                  {loading ? 'Enviant…' : 'Envia l’enllaç d’accés'}
                </button>
              </form>

              <p className="mt-8 text-xs leading-relaxed text-[#5D6B61]">
                En entrar acceptes la nostra política de privacitat. Planter tracta dades de menors
                seguint el RGPD: cada persona només veu la informació que li correspon.
              </p>
            </>
          )}
        </div>
      </section>
    </main>
  )
}
