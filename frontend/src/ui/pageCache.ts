type CacheEnvelope<T> = {
  expiresAt: number
  value: T
}

const DEFAULT_TTL_MS = 5 * 60 * 1000 // 5 minutes

function readStorage<T>(storage: Storage, key: string): T | null {
  try {
    const raw = storage.getItem(`page_cache:${key}`)
    if (!raw) return null
    const parsed = JSON.parse(raw) as CacheEnvelope<T> | T
    // Backward compatibility with old cache format (plain value)
    if (parsed && typeof parsed === 'object' && 'expiresAt' in (parsed as any) && 'value' in (parsed as any)) {
      const env = parsed as CacheEnvelope<T>
      if (Date.now() > env.expiresAt) {
        storage.removeItem(`page_cache:${key}`)
        return null
      }
      return env.value
    }
    return parsed as T
  } catch {
    return null
  }
}

function writeStorage<T>(storage: Storage, key: string, value: T, ttlMs: number): void {
  try {
    const payload: CacheEnvelope<T> = {
      expiresAt: Date.now() + Math.max(1_000, ttlMs),
      value,
    }
    storage.setItem(`page_cache:${key}`, JSON.stringify(payload))
  } catch {
    // ignore storage errors
  }
}

export function readPageCache<T>(key: string): T | null {
  return readStorage<T>(sessionStorage, key) ?? readStorage<T>(localStorage, key)
}

export function writePageCache<T>(key: string, value: T, ttlMs: number = DEFAULT_TTL_MS): void {
  writeStorage(sessionStorage, key, value, ttlMs)
  writeStorage(localStorage, key, value, ttlMs)
}

