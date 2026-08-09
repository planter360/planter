const CLUB_TIMEZONE = 'Europe/Madrid'

// Always pass an explicit timeZone here rather than relying on the
// environment default: this runs on Vercel's server (UTC) as often as
// in a browser, and Spain isn't UTC.
export function formatDateTime(iso: string): string {
  return new Date(iso).toLocaleString('ca-ES', {
    timeZone: CLUB_TIMEZONE,
    weekday: 'short',
    day: '2-digit',
    month: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
  })
}
