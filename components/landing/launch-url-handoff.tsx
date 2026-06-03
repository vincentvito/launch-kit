'use client'

import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { type FormEvent, useState } from 'react'
import { ArrowRight, Link2, PlayCircle } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { normalizePublicLaunchUrl } from '@/lib/launch-kit/public-url'

type LaunchUrlHandoffProps = {
  placeholder: string
  primaryLabel: string
  secondaryLabel: string
  helper: string
  invalidUrl: string
}

export default function LaunchUrlHandoff({
  placeholder,
  primaryLabel,
  secondaryLabel,
  helper,
  invalidUrl,
}: LaunchUrlHandoffProps) {
  const { push } = useRouter()
  const [url, setUrl] = useState('')
  const [error, setError] = useState('')

  const onSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()

    const trimmed = url.trim()
    if (!trimmed) {
      push('/dashboard')
      return
    }

    const normalized = normalizePublicLaunchUrl(trimmed)
    if (!normalized) {
      setError(invalidUrl)
      return
    }

    setError('')
    push(`/dashboard?url=${encodeURIComponent(normalized)}`)
  }

  return (
    <div>
      <form onSubmit={onSubmit} className="space-y-3">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
          <label className="relative block w-full">
            <span className="pointer-events-none absolute inset-y-0 left-3 inline-flex items-center text-violet-400">
              <Link2 className="size-4" />
            </span>
            <input
              value={url}
              aria-label={placeholder}
              onChange={(event) => {
                setUrl(event.target.value)
                if (error) {
                  setError('')
                }
              }}
              placeholder={placeholder}
              className="h-12 w-full rounded-xl border border-violet-200 bg-white px-10 text-sm text-zinc-700 outline-none transition focus:border-violet-400 focus:ring-2 focus:ring-violet-300/40"
            />
          </label>
          <Button
            type="submit"
            className="h-12 shrink-0 rounded-xl bg-gradient-to-r from-violet-600 to-fuchsia-500 px-5 text-white shadow-lg shadow-violet-500/35 hover:from-violet-700 hover:to-fuchsia-600"
          >
            {primaryLabel}
            <ArrowRight className="ml-1.5 size-4" />
          </Button>
        </div>

        <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
          <p className="text-xs text-zinc-500">{error || helper}</p>
          <Button
            asChild
            variant="ghost"
            className="h-8 justify-start px-0 text-violet-700 hover:bg-transparent hover:text-violet-800"
          >
            <Link href="/dashboard?demo=1&view=results">
              <PlayCircle className="mr-1.5 size-4" />
              {secondaryLabel}
            </Link>
          </Button>
        </div>
      </form>
    </div>
  )
}
