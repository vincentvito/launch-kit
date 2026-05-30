'use client'

import { type FormEvent, useReducer } from 'react'
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
  stats: WaitingListSignupStatLabel[]
}

type Status = 'idle' | 'error'
type SignupState = {
  email: string
  status: Status
  errorText: string
  shake: boolean
}
type SignupAction =
  | { type: 'email'; email: string }
  | { type: 'invalid'; errorText: string }
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

  if (action.type === 'invalid') {
    return { ...state, errorText: action.errorText, status: 'error', shake: true }
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

  const submit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    const trimmed = email.trim()

    if (!/^\S+@\S+\.\S+$/.test(trimmed)) {
      dispatch({ type: 'invalid', errorText: labels.invalidEmail })
      setTimeout(() => dispatch({ type: 'stop-shake' }), 500)
      return
    }

    void fetch('/api/waitlist', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: trimmed }),
    }).catch(() => undefined)
    onSampleUnlocked(trimmed)
  }

  return (
    <>
      <form className={`${styles.form} ${shake ? styles.shake : ''}`} onSubmit={submit} noValidate>
        <div className={styles.inputWrap}>
          <span className={styles.inputIcon}>
            <MailIcon size={18} />
          </span>
          <input
            type="email"
            value={email}
            onChange={(e) => {
              dispatch({ type: 'email', email: e.target.value })
            }}
            placeholder={labels.placeholder}
            autoComplete="email"
            aria-label="email"
          />
        </div>
        <button type="submit" className={styles.cta}>
          <span>{labels.submit}</span>
          <ArrowRight size={18} />
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
