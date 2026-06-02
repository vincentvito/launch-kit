'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { useTranslations } from 'next-intl'
import { Loader2 } from 'lucide-react'
import { Button } from '@/components/ui/button'

export default function BillingCheckoutPage() {
  const t = useTranslations('Billing.checkout')
  const [error, setError] = useState('')

  useEffect(() => {
    let mounted = true

    async function startCheckout() {
      try {
        const response = await fetch('/api/billing/checkout', {
          method: 'POST',
        })
        const json = (await response.json()) as { url?: string; error?: string }

        if (!response.ok || !json.url) {
          throw new Error(json.error || t('unavailable'))
        }

        window.location.href = json.url
      } catch (checkoutError) {
        if (mounted) {
          setError(checkoutError instanceof Error ? checkoutError.message : t('unavailable'))
        }
      }
    }

    void startCheckout()

    return () => {
      mounted = false
    }
  }, [t])

  return (
    <main className="flex min-h-screen items-center justify-center bg-white px-6 text-center text-zinc-900">
      <div className="w-full max-w-md space-y-5 rounded-2xl border border-zinc-200 bg-white p-8 shadow-lg">
        {error ? (
          <>
            <h1 className="text-2xl font-semibold">{t('errorTitle')}</h1>
            <p className="text-sm leading-relaxed text-zinc-600">{error}</p>
            <Button asChild className="w-full">
              <Link href="/pricing">{t('back')}</Link>
            </Button>
          </>
        ) : (
          <>
            <Loader2 className="mx-auto size-6 animate-spin text-violet-600" />
            <h1 className="text-2xl font-semibold">{t('title')}</h1>
            <p className="text-sm leading-relaxed text-zinc-600">{t('description')}</p>
          </>
        )}
      </div>
    </main>
  )
}
