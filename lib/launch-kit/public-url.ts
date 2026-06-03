export function normalizePublicLaunchUrl(input: string): string | null {
  const trimmed = input.trim()
  if (!trimmed) {
    return null
  }

  const withProtocol = /^https?:\/\//i.test(trimmed) ? trimmed : `https://${trimmed}`

  try {
    const url = new URL(withProtocol)
    const hostname = url.hostname.replace(/^\[|\]$/g, '').toLowerCase()

    if (
      (url.protocol !== 'http:' && url.protocol !== 'https:') ||
      isPrivateOrInternalHost(hostname)
    ) {
      return null
    }

    const normalizedPath = url.pathname.replace(/\/$/, '') || '/'
    return `${url.origin}${normalizedPath}`
  } catch {
    return null
  }
}

function isPrivateOrInternalHost(hostname: string): boolean {
  if (
    !hostname ||
    hostname === 'localhost' ||
    hostname.endsWith('.localhost') ||
    hostname.endsWith('.local') ||
    hostname.endsWith('.lan') ||
    hostname.endsWith('.home')
  ) {
    return true
  }

  if (hostname.includes(':')) {
    return true
  }

  if (isIpv4Address(hostname)) {
    return isPrivateIpv4(hostname)
  }

  return !hostname.includes('.')
}

function isIpv4Address(hostname: string): boolean {
  const parts = hostname.split('.')
  return parts.length === 4 && parts.every((part) => /^\d{1,3}$/.test(part))
}

function isPrivateIpv4(ip: string): boolean {
  const parts = ip.split('.').map(Number)
  if (parts.some((part) => !Number.isInteger(part) || part < 0 || part > 255)) {
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
