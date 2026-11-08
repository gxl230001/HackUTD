import { BarChart3 } from 'lucide-react'

import { MemberList } from '@/components/MemberList'
import { PageHeader } from '@/components/PageHeader'
import { PageError, PageLoading } from '@/components/PageState'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { useApi } from '@/hooks/useApi'
import type { Family, Member } from '@/lib/api'

export function DashboardPage() {
  const family = useApi<Family>('/api/family')
  const members = useApi<Member[]>('/api/members')

  if (family.status === 'loading') return <PageLoading label="Loading your family" />
  if (family.status === 'error') {
    return <PageError title="Couldn’t load your family" message={family.error.message} />
  }

  return (
    <>
      <PageHeader title={family.data.name} description="Family Threat Dashboard" />

      <div className="grid gap-4 lg:grid-cols-3">
        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle>Family scam activity</CardTitle>
            <CardDescription>Exposure, blocked activity and suspicious interactions.</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex min-h-48 flex-col items-center justify-center gap-2 rounded-lg border border-dashed text-center text-sm text-muted-foreground">
              <BarChart3 className="size-6" aria-hidden />
              Activity summary is not available yet.
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Family members</CardTitle>
            <CardDescription>{family.data.member_count} on this plan</CardDescription>
          </CardHeader>
          <CardContent>
            {members.status === 'loading' && <PageLoading label="Loading members" />}
            {members.status === 'error' && (
              <PageError title="Couldn’t load members" message={members.error.message} />
            )}
            {members.status === 'success' && <MemberList members={members.data} />}
          </CardContent>
        </Card>
      </div>
    </>
  )
}
