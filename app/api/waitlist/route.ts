import { NextResponse } from 'next/server'
import prisma from '@/lib/prisma'

export const runtime = 'nodejs'

// Throwaway/disposable email providers we don't want clogging the waitlist.
const DISPOSABLE_DOMAINS = new Set([
  '10minutemail.com', '10minutemail.net', 'guerrillamail.com', 'guerrillamail.net',
  'sharklasers.com', 'guerrillamailblock.com', 'mailinator.com', 'mailinator.net',
  'yopmail.com', 'yopmail.net', 'tempmail.com', 'temp-mail.org', 'tempmail.net',
  'getnada.com', 'nada.email', 'trashmail.com', 'trashmail.net', 'throwawaymail.com',
  'maildrop.cc', 'mailnesia.com', 'mintemail.com', 'mohmal.com', 'dispostable.com',
  'fakeinbox.com', 'spam4.me', 'tmpmail.org', 'mailcatch.com', 'emailondeck.com',
  'discard.email', 'getairmail.com', 'maileater.com', 'spamgourmet.com',
])

// A real human can't fill and submit the form faster than this; bots can.
const MIN_SUBMIT_MS = 2000

export async function POST(request: Request) {
  let body: unknown

  try {
    body = await request.json()
  } catch {
    return NextResponse.json({ error: 'Invalid request body.' }, { status: 400 })
  }

  const fields = (typeof body === 'object' && body !== null ? body : {}) as Record<string, unknown>

  // Honeypot: a field hidden from humans. If it's filled, it's a bot — return a
  // fake success so the bot has no signal that it was rejected.
  const honeypot = typeof fields.company === 'string' ? fields.company.trim() : ''
  if (honeypot) {
    return NextResponse.json({ ok: true })
  }

  // Timing trap: submissions faster than a human could type are bots. Same
  // silent-success treatment. Skipped when no timestamp was sent (elapsed 0).
  const elapsedMs = typeof fields.elapsedMs === 'number' ? fields.elapsedMs : 0
  if (elapsedMs > 0 && elapsedMs < MIN_SUBMIT_MS) {
    return NextResponse.json({ ok: true })
  }

  const email = typeof fields.email === 'string' ? fields.email.trim().toLowerCase() : ''

  if (!email || email.length > 254 || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    return NextResponse.json({ error: 'A valid email is required.' }, { status: 400 })
  }

  const domain = email.slice(email.lastIndexOf('@') + 1)
  if (DISPOSABLE_DOMAINS.has(domain)) {
    return NextResponse.json(
      { error: 'Please use a permanent email address.' },
      { status: 400 },
    )
  }

  try {
    await prisma.waitlistEntry.upsert({
      where: { email },
      create: { email },
      update: {},
    })
  } catch {
    return NextResponse.json({ error: 'Could not save your email. Try again.' }, { status: 500 })
  }

  return NextResponse.json({ ok: true })
}
