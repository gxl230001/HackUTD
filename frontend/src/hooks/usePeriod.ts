import { useSearchParams } from 'react-router'

import type { Period } from '@/lib/api'

const VALID: Period[] = ['7d', '30d', '90d']

/** The reporting period lives in the URL (?period=30d) so it survives navigation and reloads. */
export function usePeriod(): [Period, (next: Period) => void] {
  const [params, setParams] = useSearchParams()
  const raw = params.get('period')
  const period: Period = VALID.includes(raw as Period) ? (raw as Period) : '30d'
  const setPeriod = (next: Period) =>
    setParams(
      (prev) => {
        const updated = new URLSearchParams(prev)
        updated.set('period', next)
        return updated
      },
      { replace: true },
    )
  return [period, setPeriod]
}
