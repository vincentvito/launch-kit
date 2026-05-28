'use client'

import { type FormEvent, useReducer, useState } from 'react'
import { ArrowRight, CheckIcon, MailIcon } from '@/components/waiting-list/icons'
import styles from '@/components/waiting-list/waiting-list.module.css'

type ConfettiPiece = { id: string; x: number; r: number; d: number; s: number; c: string }

// Built in the submit handler (an event, not render) so the randomness never
// runs during render or in an effect — keeps React's purity rules happy.
function makeConfetti(): ConfettiPiece[] {
  return Array.from({ length: 36 }, (_, index) => ({
    id: `confetti-${Date.now()}-${index}`,
    x: Math.random() * 100,
    r: Math.random() * 360,
    d: Math.random() * 0.6,
    s: Math.random() * 8 + 6,
    c: Math.random() > 0.5 ? '#7B5CFF' : '#CFC2FF',
  }))
}

// Real product scope, shown instead of fabricated user counts. Grounded in
// the Launch Kit landing copy: "8 launch channels ... from one structured
// brief" and the 4 GROWTH_BLOCK_LABELS in lib/launch-kit/types.ts.
const STATS = [
  { n: '8', label: 'launch channels' },
  { n: '1', label: 'URL → full kit' },
  { n: '4', label: 'growth workflows' },
]

type Status = 'idle' | 'loading' | 'success' | 'error'
type SignupState = {
  email: string
  status: Status
  errorText: string
  shake: boolean
  burst: number
  confetti: ConfettiPiece[]
}
type SignupAction =
  | { type: 'email'; email: string }
  | { type: 'invalid' | 'server-error' }
  | { type: 'error-text'; text: string }
  | { type: 'loading' }
  | { type: 'success'; confetti: ConfettiPiece[] }
  | { type: 'stop-shake' }
  | { type: 'reset' }

const INVALID_EMAIL = "that doesn't look like an email. try again, captain."
const SERVER_ERROR = 'something broke on our end. give it another shot.'

const initialSignupState: SignupState = {
  email: '',
  status: 'idle',
  errorText: INVALID_EMAIL,
  shake: false,
  burst: 0,
  confetti: [],
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
    return { ...state, errorText: INVALID_EMAIL, status: 'error', shake: true }
  }

  if (action.type === 'server-error') {
    return { ...state, errorText: SERVER_ERROR, status: 'error', shake: true }
  }

  if (action.type === 'error-text') {
    return { ...state, errorText: action.text, status: 'error', shake: true }
  }

  if (action.type === 'loading') {
    return { ...state, status: 'loading' }
  }

  if (action.type === 'success') {
    return {
      ...state,
      burst: state.burst + 1,
      confetti: action.confetti,
      status: 'success',
    }
  }

  if (action.type === 'stop-shake') {
    return { ...state, shake: false }
  }

  return initialSignupState
}

export default function WaitingListSignupForm() {
  const [{ email, status, errorText, shake, burst, confetti }, dispatch] = useReducer(
    signupReducer,
    initialSignupState,
  )
  // When the form first mounted — sent to the server so it can reject
  // submissions that arrive faster than a human could type (bot timing trap).
  const [mountedAt] = useState(() => Date.now())

  const submit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    const trimmed = email.trim()
    // Hidden honeypot field; humans leave it empty, bots tend to fill it.
    const honeypot = (new FormData(e.currentTarget).get('company') as string) ?? ''

    if (!/^\S+@\S+\.\S+$/.test(trimmed)) {
      dispatch({ type: 'invalid' })
      setTimeout(() => dispatch({ type: 'stop-shake' }), 500)
      return
    }

    dispatch({ type: 'loading' })
    try {
      const res = await fetch('/api/waitlist', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: trimmed,
          company: honeypot,
          elapsedMs: Date.now() - mountedAt,
        }),
      })
      if (!res.ok) {
        // Surface the server's message for validation errors (400); fall back
        // to the generic copy for anything else.
        let text = SERVER_ERROR
        try {
          const data = (await res.json()) as { error?: string }
          if (res.status === 400 && data?.error) text = data.error
        } catch {
          // keep the generic fallback
        }
        dispatch({ type: 'error-text', text })
        setTimeout(() => dispatch({ type: 'stop-shake' }), 500)
        return
      }
      dispatch({ type: 'success', confetti: makeConfetti() })
    } catch {
      dispatch({ type: 'server-error' })
      setTimeout(() => dispatch({ type: 'stop-shake' }), 500)
    }
  }

  const reset = () => {
    dispatch({ type: 'reset' })
  }

  return (
    <>
      {status !== 'success' ? (
        <form className={`${styles.form} ${shake ? styles.shake : ''}`} onSubmit={submit}>
          {/* Honeypot: hidden from humans, a magnet for bots. Not display:none
              (some bots skip those) — pushed offscreen and out of tab order. */}
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
              onChange={(e) => {
                dispatch({ type: 'email', email: e.target.value })
              }}
              placeholder="founder@yourstartup.com"
              autoComplete="email"
              aria-label="email"
            />
          </div>
          <button type="submit" className={styles.cta} disabled={status === 'loading'}>
            {status === 'loading' ? (
              <span className={styles.ctaLoading}>
                <span className={styles.spinner} /> launching
              </span>
            ) : (
              <>
                <span>request liftoff</span>
                <ArrowRight size={18} />
              </>
            )}
          </button>
        </form>
      ) : (
        <div className={styles.success} key={burst}>
          <div className={styles.successRow}>
            <div className={styles.check}>
              <CheckIcon size={20} />
            </div>
            <div>
              <div className={styles.successTitle}>you&apos;re on the rocket.</div>
              <div className={styles.successSub}>
                welcome aboard, {email.split('@')[0]}. check your inbox.
              </div>
            </div>
          </div>
          <button type="button" className={styles.linkBtn} onClick={reset}>
            add another email →
          </button>
        </div>
      )}

      <div className={styles.micro}>
        {status === 'error' ? (
          <span className={styles.err}>{errorText}</span>
        ) : (
          <span>no spam. no funnels. just shipping updates.</span>
        )}
      </div>

      <div className={styles.stats}>
        {STATS.map((s) => (
          <div className={styles.stat} key={s.label}>
            <strong>{s.n}</strong>
            <span>{s.label}</span>
          </div>
        ))}
      </div>

      {status === 'success' && <Confetti key={`c${burst}`} pieces={confetti} />}
    </>
  )
}

function Confetti({ pieces }: { pieces: ConfettiPiece[] }) {
  return (
    <div className={styles.confetti}>
      {pieces.map((p) => (
        <span
          key={p.id}
          style={{
            left: `${p.x}%`,
            width: `${p.s}px`,
            height: `${p.s * 0.45}px`,
            background: p.c,
            transform: `rotate(${p.r}deg)`,
            animationDelay: `${p.d}s`,
          }}
        />
      ))}
    </div>
  )
}
