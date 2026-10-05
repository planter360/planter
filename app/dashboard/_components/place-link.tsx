import { mapsSearchUrl } from '@/lib/maps'
import type { Installation } from '@/lib/installations'

// Si el lloc coincideix amb una instal·lació amb adreça coneguda, es
// mostra com a enllaç directe a Google Maps; si no, és text pla.
export function PlaceLink({ place, installations }: { place: string | null; installations: Installation[] }) {
  if (!place) return <>Lloc per confirmar</>

  const match = installations.find((i) => i.name === place && i.address)
  if (!match?.address) return <>{place}</>

  return (
    <a
      href={mapsSearchUrl(match.address)}
      target="_blank"
      rel="noopener noreferrer"
      className="underline underline-offset-2"
    >
      {place}
    </a>
  )
}
