import Link from 'next/link'
import { Button } from '@/components/ui/button'

export default function NotFound() {
  return (
    <main className="flex min-h-screen flex-col items-center justify-center gap-6 bg-white px-6 text-center">
      <div className="space-y-3">
        <p className="text-sm font-semibold uppercase tracking-widest text-violet-600">404</p>
        <h1 className="text-3xl font-semibold text-zinc-900">Page not found</h1>
        <p className="max-w-md text-sm text-zinc-500">
          The page you’re looking for doesn’t exist or may have moved.
        </p>
      </div>
      <Button
        asChild
        className="h-11 rounded-xl bg-gradient-to-r from-violet-600 to-fuchsia-500 px-5 text-white shadow-lg shadow-violet-500/35 hover:from-violet-700 hover:to-fuchsia-600"
      >
        <Link href="/">Back to home</Link>
      </Button>
    </main>
  )
}
