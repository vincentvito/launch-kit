import { lookup } from 'node:dns/promises'
import { isIP } from 'node:net'

export function normalizePublicHttpUrl(
  value: string,
  options: {
    includePath?: boolean
  } = {},
): string {
  try {
    const url = new URL(value)
    if (!['http:', 'https:'].includes(url.protocol)) {
      return ''
    }

    const hostname = url.hostname.replace(/^\[|\]$/g, '')
    if (isPrivateOrInternalHost(hostname)) {
      return ''
    }

    url.hash = ''
    url.search = ''

    if (options.includePath === false || url.pathname === '/') {
      return url.origin
    }

    return `${url.origin}${url.pathname}`
  } catch {
    return ''
  }
}

export async function assertPublicUrl(input: string): Promise<void> {
  let parsed: URL
  try {
    parsed = new URL(input)
  } catch {
    throw new Error('Invalid URL')
  }

  if (!['http:', 'https:'].includes(parsed.protocol)) {
    throw new Error('Only HTTP(S) URLs are supported')
  }

  const hostname = parsed.hostname.replace(/^\[|\]$/g, '')

  if (isPrivateOrInternalHost(hostname)) {
    throw new Error('Refusing to fetch a private or internal address')
  }

  if (isIP(hostname) === 0) {
    let resolved: Array<{ address: string }>
    try {
      resolved = await lookup(hostname, { all: true })
    } catch {
      throw new Error('Could not resolve URL host')
    }

    if (resolved.some((entry) => isBlockedIp(entry.address))) {
      throw new Error('Refusing to fetch a private or internal address')
    }
  }
}

export function isPrivateOrInternalHost(hostname: string): boolean {
  const lower = hostname.toLowerCase()
  if (
    lower === '' ||
    lower === 'localhost' ||
    lower.endsWith('.localhost') ||
    lower.endsWith('.local') ||
    lower.endsWith('.lan') ||
    lower.endsWith('.home')
  ) {
    return true
  }

  if (isIP(lower) !== 0) {
    return isBlockedIp(lower)
  }

  if (!lower.includes('.')) {
    return true
  }

  return false
}

function isBlockedIp(ip: string): boolean {
  const version = isIP(ip)
  if (version === 4) {
    return isBlockedIpv4(ip)
  }
  if (version === 6) {
    return isBlockedIpv6(ip)
  }
  return true
}

function isBlockedIpv4(ip: string): boolean {
  const parts = ip.split('.').map(Number)
  if (parts.length !== 4 || parts.some((n) => !Number.isInteger(n) || n < 0 || n > 255)) {
    return true
  }

  const [a, b] = parts
  if (a === 0 || a === 10 || a === 127 || a >= 224) {
    return true
  }
  if (a === 169 && b === 254) {
    return true
  }
  if (a === 192 && b === 0) {
    return true
  }
  if (a === 172 && b >= 16 && b <= 31) {
    return true
  }
  if (a === 192 && b === 168) {
    return true
  }
  if (a === 100 && b >= 64 && b <= 127) {
    return true
  }
  if (a === 198 && (b === 18 || b === 19)) {
    return true
  }
  return false
}

function isBlockedIpv6(ip: string): boolean {
  const lower = ip.toLowerCase()
  if (lower === '::' || lower === '::1') {
    return true
  }

  const mapped = lower.match(/^::ffff:(\d{1,3}\.\d{1,3}\.\d{1,3}\.\d{1,3})$/)
  if (mapped) {
    return isBlockedIpv4(mapped[1])
  }

  const head = lower.split(':')[0]
  if (head.startsWith('fc') || head.startsWith('fd')) {
    return true
  }
  if (head.startsWith('ff')) {
    return true
  }
  if (['fe8', 'fe9', 'fea', 'feb'].some((prefix) => head.startsWith(prefix))) {
    return true
  }
  return false
}
