import { Link } from 'react-router'

import { Button } from '@/components/ui/button'

export function NotFoundPage() {
  return (
    <div className="flex min-h-[60dvh] flex-col items-center justify-center gap-3 text-center">
      <h1 className="text-xl font-semibold">Page not found</h1>
      <p className="text-sm text-muted-foreground">That page doesn’t exist.</p>
      <Button asChild variant="outline">
        <Link to="/dashboard">Go to dashboard</Link>
      </Button>
    </div>
  )
}
