import { PET_STORAGE_VERSION } from '~/constants/pet'
import type { PetState } from '~/types/pet'
import { type Entitlement, normalizeEntitlements } from '~/utils/entitlements'
import { parseStoredPetState, toStoredPetState } from '~/utils/petValidation'

export type PetBackup = {
  state: PetState
  entitlements: Entitlement[]
}

const BACKUP_PREFIX = 'TABPET1.'

// A copy-pasteable code so a pet can move between browsers without an account.
export function encodePetBackup(state: PetState, entitlements: readonly Entitlement[] = []): string {
  const json = JSON.stringify({ ...toStoredPetState(state, PET_STORAGE_VERSION), entitlements })

  return `${BACKUP_PREFIX}${toBase64Url(new TextEncoder().encode(json))}`
}

export function decodePetBackup(code: string, now = Date.now()): PetState | null {
  return decodePetBackupWithPurchases(code, now)?.state ?? null
}

// Purchases ride along in the same code so moving browsers keeps them.
export function decodePetBackupWithPurchases(code: string, now = Date.now()): PetBackup | null {
  const trimmed = code.trim()
  if (!trimmed.startsWith(BACKUP_PREFIX)) return null

  try {
    const json = new TextDecoder().decode(fromBase64Url(trimmed.slice(BACKUP_PREFIX.length)))
    const raw = JSON.parse(json) as Record<string, unknown>
    const state = parseStoredPetState(raw, now)

    return state ? { state, entitlements: normalizeEntitlements(raw.entitlements) } : null
  } catch {
    return null
  }
}

function toBase64Url(bytes: Uint8Array): string {
  let binary = ''
  bytes.forEach((byte) => {
    binary += String.fromCharCode(byte)
  })

  return btoa(binary).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '')
}

function fromBase64Url(value: string): Uint8Array {
  const base64 = value.replace(/-/g, '+').replace(/_/g, '/')
  const binary = atob(base64.padEnd(base64.length + ((4 - (base64.length % 4)) % 4), '='))

  return Uint8Array.from(binary, (char) => char.charCodeAt(0))
}
