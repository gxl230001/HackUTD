import { useState, type FormEvent } from 'react'
import { Check } from 'lucide-react'
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
import { consumeSessionExpired } from '@/lib/api'

const HIGHLIGHTS = [
  'See scam exposure across your family plan in one place.',
  'Understand how each member’s activity differs — without blame.',
  'Get clear, practical protection recommendations.',
]

export function SignInPage() {
  const { session, loading, configured, signIn } = useAuth()
  const location = useLocation()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [expired] = useState(consumeSessionExpired)
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
    <div className="flex min-h-dvh flex-col gap-4 bg-background p-4 md:flex-row">
      <section className="flex flex-col justify-center gap-6 rounded-[36px] bg-primary p-8 text-primary-foreground md:flex-1 md:p-16">
        <Logo light />
        <h1 className="text-4xl font-bold tracking-tight text-balance md:text-5xl">Protection is stronger together.</h1>
        <p className="max-w-xl text-lg text-on-ink-soft text-pretty">
          CloseGuard turns individual scam-protection signals into family-level insight. It
          complements T-Mobile Scam Shield — it doesn’t replace it.
        </p>
        <ul className="space-y-3.5">
          {HIGHLIGHTS.map((text) => (
            <li key={text} className="flex items-start gap-3 text-base">
              <span className="mt-px grid size-7 shrink-0 place-items-center rounded-full bg-sage text-foreground">
                <Check className="size-4" strokeWidth={2.5} aria-hidden />
              </span>
              {text}
            </li>
          ))}
        </ul>
      </section>

      <div className="flex flex-col justify-center gap-5 md:w-[34rem] md:px-8">
        <DemoDataBanner />
        <Card className="w-full gap-4 p-1.5">
          <CardHeader className="px-6 pt-5">
            <CardTitle className="text-xl">Sign in</CardTitle>
            <CardDescription>For family plan account holders.</CardDescription>
          </CardHeader>
          <CardContent className="px-6 pb-5">
            {!configured ? (
              <PageError
                title="Authentication not configured"
                message="Set VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY in frontend/.env, then restart the dev server."
              />
            ) : (
              <form onSubmit={handleSubmit} className="space-y-4" noValidate>
                {expired && !error && (
                  <p role="status" className="rounded-2xl bg-surface-soft px-4 py-3 text-sm text-muted-foreground">
                    Your session ended. Please sign in again.
                  </p>
                )}
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
                  <p role="alert" className="text-sm font-medium text-destructive">
                    {error}
                  </p>
                )}
                <Button type="submit" className="w-full" disabled={submitting || !email || !password}>
                  {submitting ? 'Signing in…' : 'Sign in'}
                </Button>
              </form>
            )}
            <div className="mt-4 flex justify-center">
              <HealthStatus />
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
