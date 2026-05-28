'use client'

import { type FormEvent, useState } from 'react'
import { ArrowRight, CheckIcon, MailIcon } from '@/components/waiting-list/icons'
import styles from '@/components/waiting-list/waiting-list.module.css'

type ConfettiPiece = { x: number; r: number; d: number; s: number; c: string }

// Built in the submit handler (an event, not render) so the randomness never
// runs during render or in an effect — keeps React's purity rules happy.
function makeConfetti(): ConfettiPiece[] {
  return Array.from({ length: 36 }, () => ({
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

const INVALID_EMAIL = "that doesn't look like an email. try again, captain."
const SERVER_ERROR = 'something broke on our end. give it another shot.'

export default function WaitingListSignupForm() {
  const [email, setEmail] = useState('')
  const [status, setStatus] = useState<Status>('idle')
  const [errorText, setErrorText] = useState(INVALID_EMAIL)
  const [shake, setShake] = useState(false)
  const [burst, setBurst] = useState(0)
  const [confetti, setConfetti] = useState<ConfettiPiece[]>([])

  const submit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    const trimmed = email.trim()

    if (!/^\S+@\S+\.\S+$/.test(trimmed)) {
      setErrorText(INVALID_EMAIL)
      setStatus('error')
      setShake(true)
      setTimeout(() => setShake(false), 500)
      return
    }

    setStatus('loading')
    try {
      const res = await fetch('/api/waitlist', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: trimmed }),
      })
      if (!res.ok) {
        setErrorText(SERVER_ERROR)
        setStatus('error')
        setShake(true)
        setTimeout(() => setShake(false), 500)
        return
      }
      setBurst((b) => b + 1)
      setConfetti(makeConfetti())
      setStatus('success')
    } catch {
      setErrorText(SERVER_ERROR)
      setStatus('error')
      setShake(true)
      setTimeout(() => setShake(false), 500)
    }
  }

  const reset = () => {
    setStatus('idle')
    setEmail('')
  }

  return (
    <>
      {status !== 'success' ? (
        <form className={`${styles.form} ${shake ? styles.shake : ''}`} onSubmit={submit}>
          <div className={styles.inputWrap}>
            <span className={styles.inputIcon}>
              <MailIcon size={18} />
            </span>
            <input
              type="email"
              value={email}
              onChange={(e) => {
                setEmail(e.target.value)
                if (status === 'error') setStatus('idle')
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
          <button className={styles.linkBtn} onClick={reset}>
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
      {pieces.map((p, i) => (
        <span
          key={i}
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
