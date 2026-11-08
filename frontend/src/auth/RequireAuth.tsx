import { Navigate, Outlet, useLocation } from 'react-router'

import { useAuth } from '@/auth/auth-context'
import { PageLoading } from '@/components/PageState'

/** Route guard: renders child routes only for a signed-in user. */
export function RequireAuth() {
  const { session, loading } = useAuth()
  const location = useLocation()

  if (loading) return <PageLoading label="Checking your session" />
  if (!session) return <Navigate to="/" replace state={{ from: location.pathname }} />
  return <Outlet />
}
