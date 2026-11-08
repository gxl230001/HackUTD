import { MemberList } from '@/components/MemberList'
import { PageHeader } from '@/components/PageHeader'
import { PageError, PageLoading } from '@/components/PageState'
import { Card, CardContent } from '@/components/ui/card'
import { useApi } from '@/hooks/useApi'
import type { Member } from '@/lib/api'

export function MembersPage() {
  const members = useApi<Member[]>('/api/members')

  return (
    <>
      <PageHeader title="Members" description="Choose a family member to review their activity." />
      <Card>
        <CardContent>
          {members.status === 'loading' && <PageLoading label="Loading members" />}
          {members.status === 'error' && <PageError title="Couldn’t load members" message={members.error.message} />}
          {members.status === 'success' && <MemberList members={members.data} />}
        </CardContent>
      </Card>
    </>
  )
}
