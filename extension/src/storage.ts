export const PET_KEY = 'pet'
export const NOTIFY_KEY = 'careNotifications'
export const LAST_NOTIFIED_KEY = 'lastNotifiedAt'
export const LAST_STATUS_KEY = 'lastStatus'
// Purchases brought over in a backup code from the website (the extension never buys).
export const ENTITLEMENTS_KEY = 'entitlements'

export async function readStorage<T = unknown>(key: string): Promise<T | undefined> {
  const result = await chrome.storage.local.get(key)

  return result[key] as T | undefined
}

export async function writeStorage(values: Record<string, unknown>): Promise<void> {
  await chrome.storage.local.set(values)
}
