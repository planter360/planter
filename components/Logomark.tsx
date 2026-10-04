/* Marca Planter — la P del club i el brot que creix per damunt */
export function Logomark({ size = 44 }: { size?: number }) {
  return (
    <svg viewBox="0 0 64 64" width={size} height={size} role="img" aria-label="Planter">
      <rect x="4" y="4" width="56" height="56" rx="16" fill="#0F1E17" />
      <path d="M20 47 V19 h7 C34 19 38 22.3 38 27 C38 31.7 34 35 27 35 H20" fill="none" stroke="#F3F5F0" strokeWidth="6" strokeLinecap="round" strokeLinejoin="round" />
      <circle cx="47" cy="16.5" r="5.6" fill="#2E9E5B" />
      <path d="M47 23 V47" stroke="#2E9E5B" strokeWidth="6" strokeLinecap="round" />
    </svg>
  )
}

export function LogomarkNegatiu({ size = 40 }: { size?: number }) {
  return (
    <svg viewBox="0 0 64 64" width={size} height={size} role="img" aria-label="Planter">
      <path d="M20 47 V19 h7 C34 19 38 22.3 38 27 C38 31.7 34 35 27 35 H20" fill="none" stroke="#FFFFFF" strokeWidth="6" strokeLinecap="round" strokeLinejoin="round" />
      <circle cx="47" cy="16.5" r="5.6" fill="#4FCB80" />
      <path d="M47 23 V47" stroke="#4FCB80" strokeWidth="6" strokeLinecap="round" />
    </svg>
  )
}
