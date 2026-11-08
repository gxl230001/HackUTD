import { lazy, Suspense, type ComponentType } from 'react'
import { createBrowserRouter, RouterProvider } from 'react-router'

import { AuthProvider } from '@/auth/AuthProvider'
import { RequireAuth } from '@/auth/RequireAuth'
import { AppShell } from '@/components/layout/AppShell'
import { PageLoading } from '@/components/PageState'
import { RouteError } from '@/routes/RouteError'
import { SignInPage } from '@/routes/SignInPage'

// Signed-in screens load on demand so the sign-in page stays light (charts are only fetched when needed).
function page(load: () => Promise<{ [key: string]: ComponentType }>, name: string) {
  const Component = lazy(() => load().then((module) => ({ default: module[name] })))
  return (
    <Suspense fallback={<PageLoading />}>
      <Component />
    </Suspense>
  )
}

const router = createBrowserRouter([
  { path: '/', element: <SignInPage />, errorElement: <RouteError /> },
  {
    element: <RequireAuth />,
    errorElement: <RouteError />,
    children: [
      {
        element: <AppShell />,
        children: [
          { path: '/dashboard', element: page(() => import('@/routes/DashboardPage'), 'DashboardPage') },
          { path: '/members', element: page(() => import('@/routes/MembersPage'), 'MembersPage') },
          { path: '/members/:memberId', element: page(() => import('@/routes/MemberPage'), 'MemberPage') },
          {
            path: '/members/:memberId/recommendations/:category',
            element: page(() => import('@/routes/RecommendationPage'), 'RecommendationPage'),
          },
          { path: '/settings', element: page(() => import('@/routes/SettingsPage'), 'SettingsPage') },
          { path: '*', element: page(() => import('@/routes/NotFoundPage'), 'NotFoundPage') },
        ],
      },
    ],
  },
])

export default function App() {
  return (
    <AuthProvider>
      <RouterProvider router={router} />
    </AuthProvider>
  )
}
