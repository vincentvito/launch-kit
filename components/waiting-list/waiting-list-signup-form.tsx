'use client'

import { type FormEvent, useState } from 'react'
import { ArrowRight, Mail } from 'lucide-react'
import { Button } from '@/components/ui/button'

type WaitingListSignupFormProps = {
  placeholder: string
  submitLabel: string
  helper: string
  invalidEmail: string
  successMessage: string
  errorMessage: string
}

export default function WaitingListSignupForm({
  placeholder,
  submitLabel,
  helper,
  invalidEmail,
  successMessage,
  errorMessage,
}: WaitingListSignupFormProps) {
  const [email, setEmail] = useState('')
  const [status, setStatus] = useState<'idle' | 'loading' | 'success' | 'error'>('idle')
  const [message, setMessage] = useState('')

  const onSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()

    const trimmed = email.trim().toLowerCase()
    if (!isValidEmail(trimmed)) {
      setStatus('error')
      setMessage(invalidEmail)
      return
    }

    setStatus('loading')
    setMessage('')

    try {
      const response = await fetch('/api/waitlist', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: trimmed }),
      })

      if (!response.ok) {
        setStatus('error')
        setMessage(errorMessage)
        return
      }

      setStatus('success')
      setMessage(successMessage)
      setEmail('')
    } catch {
      setStatus('error')
      setMessage(errorMessage)
    }
  }

  const helperText =
    status === 'success' ? message : status === 'error' ? message || errorMessage : helper

  return (
    <form onSubmit={onSubmit} className="space-y-3">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
        <label className="relative block w-full">
          <span className="pointer-events-none absolute inset-y-0 left-3 inline-flex items-center text-violet-400">
            <Mail className="h-4 w-4" />
          </span>
          <input
            type="email"
            name="email"
            autoComplete="email"
            value={email}
            disabled={status === 'loading' || status === 'success'}
            onChange={(event) => {
              setEmail(event.target.value)
              if (status === 'error') {
                setStatus('idle')
                setMessage('')
              }
            }}
            placeholder={placeholder}
            className="h-12 w-full rounded-xl border border-violet-200 bg-white px-10 text-sm text-zinc-700 outline-none transition focus:border-violet-400 focus:ring-2 focus:ring-violet-300/40 disabled:cursor-not-allowed disabled:opacity-70"
          />
        </label>
        <Button
          type="submit"
          disabled={status === 'loading' || status === 'success'}
          className="h-12 shrink-0 rounded-xl bg-gradient-to-r from-violet-600 to-fuchsia-500 px-5 text-white shadow-lg shadow-violet-500/35 hover:from-violet-700 hover:to-fuchsia-600 disabled:opacity-70"
        >
          {submitLabel}
          <ArrowRight className="ml-1.5 h-4 w-4" />
        </Button>
      </div>
      <p
        className={`text-xs ${status === 'success' ? 'text-violet-700' : status === 'error' ? 'text-red-600' : 'text-zinc-500'}`}
      >
        {helperText}
      </p>
    </form>
  )
}

function isValidEmail(email: string): boolean {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)
}
