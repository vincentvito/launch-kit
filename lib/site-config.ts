export function isWaitingListEnabled(): boolean {
  const value = process.env.WAITING_LIST_ENABLED?.trim().toLowerCase()
  return value === 'true' || value === '1' || value === 'yes'
}
