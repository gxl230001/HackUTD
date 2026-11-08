import { useState, type FormEvent } from 'react'
import { BarChart3, Lightbulb, Users } from 'lucide-react'
import { Navigate, useLocation } from 'react-router'

import { useAuth } from '@/auth/auth-context'
import { DemoDataBanner } from '@/components/DemoDataBanner'
import { HealthStatus } from '@/components/HealthStatus'
import { Logo } from '@/components/Logo'
import { PageError, PageLoading } from '@/components/PageState'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'

const HIGHLIGHTS = [
  { icon: BarChart3, text: 'See scam exposure across your family plan in one place.' },
  { icon: Users, text: 'Understand how each member’s activity differs — without blame.' },
  { icon: Lightbulb, text: 'Get clear, practical protection recommendations.' },
]

export function SignInPage() {
  const { session, loading, configured, signIn } = useAuth()
  const location = useLocation()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [submitting, setSubmitting] = useState(false)

  if (loading) return <PageLoading label="Checking your session" />
  if (session) {
    const from = (location.state as { from?: string } | null)?.from
    return <Navigate to={from && from !== '/' ? from : '/dashboard'} replace />
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    setSubmitting(true)
    setError(null)
    const message = await signIn(email.trim(), password)
    setSubmitting(false)
    if (message) setError(message)
  }

  return (
    <div className="flex min-h-dvh flex-col bg-background">
      <DemoDataBanner />
      <div className="mx-auto grid w-full max-w-5xl flex-1 items-center gap-10 px-4 py-10 md:grid-cols-2 md:px-8">
        <section>
          <Logo className="text-lg" />
          <h1 className="mt-6 text-3xl font-semibold tracking-tight text-balance sm:text-4xl">
            Protection is stronger together.
          </h1>
          <p className="mt-4 text-muted-foreground text-pretty">
            CloseGuard turns individual scam-protection signals into family-level insight. It
            complements T-Mobile Scam Shield — it doesn’t replace it.
          </p>
          <ul className="mt-6 space-y-3">
            {HIGHLIGHTS.map(({ icon: Icon, text }) => (
              <li key={text} className="flex items-start gap-3 text-sm">
                <Icon className="mt-0.5 size-4 shrink-0 text-primary" aria-hidden />
                {text}
              </li>
            ))}
          </ul>
        </section>

        <Card className="w-full max-w-md justify-self-center md:justify-self-end">
          <CardHeader>
            <CardTitle className="text-lg">Sign in</CardTitle>
            <CardDescription>For family plan account holders.</CardDescription>
          </CardHeader>
          <CardContent>
            {!configured ? (
              <PageError
                title="Authentication not configured"
                message="Set VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY in frontend/.env, then restart the dev server."
              />
            ) : (
              <form onSubmit={handleSubmit} className="space-y-4" noValidate>
                <div className="space-y-2">
                  <Label htmlFor="email">Email</Label>
                  <Input
                    id="email"
                    type="email"
                    autoComplete="email"
                    required
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="password">Password</Label>
                  <Input
                    id="password"
                    type="password"
                    autoComplete="current-password"
                    required
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                  />
                </div>
                {error && (
                  <p role="alert" className="text-sm text-destructive">
                    {error}
                  </p>
                )}
                <Button type="submit" className="w-full" disabled={submitting || !email || !password}>
                  {submitting ? 'Signing in…' : 'Sign in'}
                </Button>
              </form>
            )}
            <HealthStatus className="mt-4" />
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
