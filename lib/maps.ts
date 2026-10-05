// Enllaç directe de cerca de Google Maps — sense clau d'API ni cost,
// obre l'app de Maps (mòbil) o el navegador amb l'adreça ja cercada.
export function mapsSearchUrl(address: string): string {
  return `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(address)}`
}
