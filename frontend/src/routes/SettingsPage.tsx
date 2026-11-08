import { FlaskConical, LogOut } from 'lucide-react'

import { useAuth } from '@/auth/auth-context'
import { HealthStatus } from '@/components/HealthStatus'
import { PageHeader } from '@/components/PageHeader'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { useApi } from '@/hooks/useApi'
import type { Family } from '@/lib/api'

function Row({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex flex-col gap-0.5 py-2 sm:flex-row sm:justify-between">
      <dt className="text-sm text-muted-foreground">{label}</dt>
      <dd className="text-sm font-medium break-all">{value}</dd>
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
      <PageHeader title="Settings" />
      <div className="grid gap-4 md:grid-cols-2">
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
            <CardTitle className="flex items-center gap-2">
              <FlaskConical className="size-4 text-amber-600" aria-hidden /> About this demo
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3 text-sm text-muted-foreground">
            <p>
              CloseGuard is a hackathon prototype. Every family, member and activity record shown is
              fictional and generated for demonstration.
            </p>
            <p>
              CloseGuard is <strong className="text-foreground">not connected</strong> to T-Mobile
              Scam Shield or any T-Mobile account. A future version would need an authorized
              integration to show real activity.
            </p>
            <HealthStatus />
          </CardContent>
        </Card>
      </div>
    </>
  )
}
