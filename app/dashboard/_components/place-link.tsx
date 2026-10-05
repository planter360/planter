import { mapsSearchUrl } from '@/lib/maps'
import type { Installation } from '@/lib/installations'

// Si el partit porta una adreça pròpia (visitant), es fa servir
// directament; si no, es busca per nom a la llista d'instal·lacions
// del club (local). Si no se'n troba cap, és text pla.
export function PlaceLink({
  place,
  address,
  installations,
}: {
  place: string | null
  address?: string | null
  installations: Installation[]
}) {
  if (!place) return <>Lloc per confirmar</>

  const resolvedAddress = address || installations.find((i) => i.name === place)?.address
  if (!resolvedAddress) return <>{place}</>

  return (
    <a
      href={mapsSearchUrl(resolvedAddress)}
      target="_blank"
      rel="noopener noreferrer"
      className="underline underline-offset-2"
    >
      {place}
    </a>
  )
}
