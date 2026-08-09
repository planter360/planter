import { MATCH_STATUS_LABEL, MATCH_STATUS_TONE } from '@/lib/matches'

export function MatchStatusTag({ status }: { status: string }) {
  return (
    <span
      className={
        'shrink-0 rounded-full px-3 py-1 text-xs font-semibold ' + (MATCH_STATUS_TONE[status] ?? MATCH_STATUS_TONE.convocatoria)
      }
    >
      {MATCH_STATUS_LABEL[status] ?? status}
    </span>
  )
}
