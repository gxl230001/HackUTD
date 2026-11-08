import { MemberList } from '@/components/MemberList'
import { PageHeader } from '@/components/PageHeader'
import { ApiErrorState, PageLoading } from '@/components/PageState'
import { useApi } from '@/hooks/useApi'
import type { Member } from '@/lib/api'

export function MembersPage() {
  const members = useApi<Member[]>('/api/members')

  return (
    <>
      <PageHeader title="Members" description="Choose a family member to review their activity." />
      {members.status === 'loading' && <PageLoading label="Loading members" />}
      {members.status === 'error' && <ApiErrorState title="Couldn’t load members" error={members.error} onRetry={members.retry} />}
      {members.status === 'success' && <MemberList members={members.data} />}
    </>
  )
}
