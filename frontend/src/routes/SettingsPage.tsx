import { LogOut } from 'lucide-react'

import { useAuth } from '@/auth/auth-context'
import { HealthStatus } from '@/components/HealthStatus'
import { PageHeader } from '@/components/PageHeader'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { useApi } from '@/hooks/useApi'
import type { Family } from '@/lib/api'

function Row({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex flex-col gap-0.5 py-3 sm:flex-row sm:justify-between">
      <dt className="text-sm text-muted-foreground">{label}</dt>
      <dd className="text-sm font-semibold break-all">{value}</dd>
    </div>
  )
}

export function SettingsPage() {
  const { session, signOut } = useAuth()
  const family = useApi<Family>('/api/family')

  const familyName =
    family.status === 'success' ? family.data.name : family.status === 'loading' ? 'Loading…' : 'Unavailable'

  return (
    <>
      <PageHeader title="Settings" description="Account and app information" />
      <div className="grid max-w-3xl gap-4">
        <Card>
          <CardHeader>
            <CardTitle>Account</CardTitle>
          </CardHeader>
          <CardContent>
            <dl className="divide-y">
              <Row label="Signed in as" value={session?.user.email ?? 'Unknown'} />
              <Row label="Family" value={familyName} />
            </dl>
            <Button variant="outline" className="mt-4" onClick={() => void signOut()}>
              <LogOut aria-hidden /> Sign out
            </Button>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>About Owlert</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3 text-base text-muted-foreground">
            <p>
              Owlert turns individual Scam Shield protection signals into a family-level view,
              so the account holder can spot patterns and help everyone stay protected.
            </p>
            <p>
              Recommendations are guidance only. Owlert can’t change Scam Shield settings or
              subscriptions.
            </p>
            <HealthStatus className="rounded-full bg-surface-soft px-3.5 py-2 font-medium text-foreground" />
          </CardContent>
        </Card>
      </div>
    </>
  )
}
