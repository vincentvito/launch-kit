import { PLATFORM_IDS, type MediaKitContact, type PlatformBlockId } from '@/lib/launch-kit/types'

export function toNonEmptyLines(input: string): string[] {
  return input.split(/\r?\n/).flatMap((line) => {
    const trimmed = line.trim()
    return trimmed ? [trimmed] : []
  })
}

export function dedupe(values: string[]): string[] {
  const trimmedValues = values.flatMap((value) => {
    const trimmed = value.trim()
    return trimmed ? [trimmed] : []
  })

  return [...new Set(trimmedValues)]
}

export function safeJsonParse<T>(value: string, fallback: T): T {
  try {
    return JSON.parse(value) as T
  } catch {
    return fallback
  }
}

export function cleanText(input: string): string {
  return input.replace(/\s+/g, ' ').trim()
}

export function escapeCsvCell(value: unknown): string {
  const raw = String(value ?? '')
  const sanitized = /^[\s]*[=+\-@]/.test(raw) ? `'${raw}` : raw

  return `"${sanitized.replaceAll('"', '""')}"`
}

export function isPlatformBlockId(value: string): value is PlatformBlockId {
  return PLATFORM_IDS.includes(value as PlatformBlockId)
}

export function withDefaultContact(contact?: Partial<MediaKitContact>): MediaKitContact {
  return {
    founderName: contact?.founderName ?? '',
    founderBio: contact?.founderBio ?? '',
    companyName: contact?.companyName ?? '',
    companyBio: contact?.companyBio ?? '',
    website: contact?.website ?? '',
    email: contact?.email ?? '',
    contactPhone: contact?.contactPhone ?? '',
    socialX: contact?.socialX ?? '',
    socialLinkedIn: contact?.socialLinkedIn ?? '',
  }
}
