'use client'

import { type FormEvent, useReducer, useState } from 'react'
import { ArrowRight, MailIcon } from '@/components/waiting-list/icons'
import styles from '@/components/waiting-list/waiting-list.module.css'

export type WaitingListSignupStatLabel = {
  n: string
  label: string
}
export type WaitingListSignupLabels = {
  placeholder: string
  submit: string
  helper: string
  invalidEmail: string
  error: string
  stats: WaitingListSignupStatLabel[]
}

type Status = 'idle' | 'loading' | 'error'
type SignupState = {
  email: string
  status: Status
  errorText: string
  shake: boolean
}
type SignupAction =
  | { type: 'email'; email: string }
  | { type: 'invalid'; errorText: string }
  | { type: 'loading' }
  | { type: 'server-error'; errorText: string }
  | { type: 'stop-shake' }
  | { type: 'reset' }

const initialSignupState: SignupState = {
  email: '',
  status: 'idle',
  errorText: '',
  shake: false,
}

function signupReducer(state: SignupState, action: SignupAction): SignupState {
  if (action.type === 'email') {
    return {
      ...state,
      email: action.email,
      status: state.status === 'error' ? 'idle' : state.status,
    }
  }

  if (action.type === 'invalid' || action.type === 'server-error') {
    return { ...state, errorText: action.errorText, status: 'error', shake: true }
  }

  if (action.type === 'loading') {
    return { ...state, status: 'loading' }
  }

  if (action.type === 'stop-shake') {
    return { ...state, shake: false }
  }

  return initialSignupState
}

export default function WaitingListSignupForm({
  labels,
  onSampleUnlocked,
}: {
  labels: WaitingListSignupLabels
  onSampleUnlocked: (email: string) => void
}) {
  const [{ email, status, errorText, shake }, dispatch] = useReducer(
    signupReducer,
    initialSignupState,
  )
  const [mountedAt] = useState(() => Date.now())

  const submit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    const trimmed = email.trim()
    const honeypot = (new FormData(e.currentTarget).get('company') as string) ?? ''

    if (!/^\S+@\S+\.\S+$/.test(trimmed)) {
      dispatch({ type: 'invalid', errorText: labels.invalidEmail })
      setTimeout(() => dispatch({ type: 'stop-shake' }), 500)
      return
    }

    dispatch({ type: 'loading' })

    try {
      const response = await fetch('/api/waitlist', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: trimmed,
          company: honeypot,
          elapsedMs: Date.now() - mountedAt,
        }),
      })

      if (!response.ok) {
        let text = labels.error
        try {
          const data = (await response.json()) as { error?: string }
          if (data.error) {
            text = data.error
          }
        } catch {
          text = labels.error
        }
        dispatch({ type: 'server-error', errorText: text })
        setTimeout(() => dispatch({ type: 'stop-shake' }), 500)
        return
      }

      onSampleUnlocked(trimmed)
    } catch {
      dispatch({ type: 'server-error', errorText: labels.error })
      setTimeout(() => dispatch({ type: 'stop-shake' }), 500)
    }
  }

  return (
    <>
      <form className={`${styles.form} ${shake ? styles.shake : ''}`} onSubmit={submit} noValidate>
        <input
          type="text"
          name="company"
          tabIndex={-1}
          autoComplete="off"
          aria-hidden="true"
          style={{ position: 'absolute', left: '-9999px', width: 1, height: 1, opacity: 0 }}
        />
        <div className={styles.inputWrap}>
          <span className={styles.inputIcon}>
            <MailIcon size={18} />
          </span>
          <input
            type="email"
            value={email}
            onChange={(event) => {
              dispatch({ type: 'email', email: event.target.value })
            }}
            placeholder={labels.placeholder}
            autoComplete="email"
            aria-label="email"
          />
        </div>
        <button type="submit" className={styles.cta} disabled={status === 'loading'}>
          {status === 'loading' ? (
            <span className={styles.ctaLoading}>
              <span className={styles.spinner} />
              {labels.submit}
            </span>
          ) : (
            <>
              <span>{labels.submit}</span>
              <ArrowRight size={18} />
            </>
          )}
        </button>
      </form>

      <div className={styles.micro}>
        {status === 'error' ? (
          <span className={styles.err}>{errorText}</span>
        ) : (
          <span>{labels.helper}</span>
        )}
      </div>

      <div className={styles.stats}>
        {labels.stats.map((s) => (
          <div className={styles.stat} key={s.label}>
            <strong>{s.n}</strong>
            <span>{s.label}</span>
          </div>
        ))}
      </div>
    </>
  )
}
