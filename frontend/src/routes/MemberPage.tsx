import { ArrowLeft, LineChart } from 'lucide-react'
import { Link, useParams } from 'react-router'

import { PageHeader } from '@/components/PageHeader'
import { PageError, PageLoading } from '@/components/PageState'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { useApi } from '@/hooks/useApi'
import type { Member } from '@/lib/api'

export function MemberPage() {
  const { memberId = '' } = useParams()
  const member = useApi<Member>(`/api/members/${encodeURIComponent(memberId)}`)

  const back = (
    <Link to="/members" className="mb-4 inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground">
      <ArrowLeft className="size-4" aria-hidden /> All members
    </Link>
  )

  if (member.status === 'loading') return <PageLoading label="Loading member" />
  if (member.status === 'error') {
    const notFound = member.error.status === 404
    return (
      <>
        {back}
        <PageError
          title={notFound ? 'Member not found' : 'Couldn’t load this member'}
          message={notFound ? 'This member isn’t part of your family plan.' : member.error.message}
        />
      </>
    )
  }

  const subtitle = [member.data.relationship, member.data.phone_label].filter(Boolean).join(' · ')
  return (
    <>
      {back}
      <PageHeader title={member.data.display_name} description={subtitle || 'Family member'} />
      <Card>
        <CardHeader>
          <CardTitle>Member insights</CardTitle>
          <CardDescription>Exposure, interactions and protection recommendations.</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex min-h-48 flex-col items-center justify-center gap-2 rounded-lg border border-dashed text-center text-sm text-muted-foreground">
            <LineChart className="size-6" aria-hidden />
            Member insights are not available yet.
          </div>
        </CardContent>
      </Card>
    </>
  )
}
