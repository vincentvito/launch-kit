const LOCAL_AUTH_ORIGIN = 'http://localhost:3000'

export function getAuthClientBaseUrl(value = process.env.NEXT_PUBLIC_APP_URL): string {
  try {
    const url = new URL(value || LOCAL_AUTH_ORIGIN)
    if (url.protocol !== 'http:' && url.protocol !== 'https:') {
      return LOCAL_AUTH_ORIGIN
    }
    return url.origin
  } catch {
    return LOCAL_AUTH_ORIGIN
  }
}
