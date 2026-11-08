export type SeriesKey = 'calls_received' | 'calls_blocked' | 'interactions'

/** Color follows the measure on every chart (validated categorical slots 1–3). */
export const SERIES: { key: SeriesKey; label: string; color: string; tile: string }[] = [
  { key: 'calls_received', label: 'Suspicious calls', color: 'var(--series-received)', tile: 'var(--lavender)' },
  { key: 'calls_blocked', label: 'Blocked', color: 'var(--series-blocked)', tile: 'var(--sage)' },
  { key: 'interactions', label: 'Suspicious interactions', color: 'var(--series-interactions)', tile: 'var(--orange)' },
]
