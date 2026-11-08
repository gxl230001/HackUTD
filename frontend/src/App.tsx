import { createBrowserRouter, RouterProvider } from 'react-router'

import { AuthProvider } from '@/auth/AuthProvider'
import { RequireAuth } from '@/auth/RequireAuth'
import { AppShell } from '@/components/layout/AppShell'
import { DashboardPage } from '@/routes/DashboardPage'
import { MemberPage } from '@/routes/MemberPage'
import { MembersPage } from '@/routes/MembersPage'
import { NotFoundPage } from '@/routes/NotFoundPage'
import { RecommendationPage } from '@/routes/RecommendationPage'
import { SettingsPage } from '@/routes/SettingsPage'
import { SignInPage } from '@/routes/SignInPage'

const router = createBrowserRouter([
  { path: '/', element: <SignInPage /> },
  {
    element: <RequireAuth />,
    children: [
      {
        element: <AppShell />,
        children: [
          { path: '/dashboard', element: <DashboardPage /> },
          { path: '/members', element: <MembersPage /> },
          { path: '/members/:memberId', element: <MemberPage /> },
          { path: '/members/:memberId/recommendations/:category', element: <RecommendationPage /> },
          { path: '/settings', element: <SettingsPage /> },
          { path: '*', element: <NotFoundPage /> },
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
