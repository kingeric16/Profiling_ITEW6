import api from '../api'

export type Role = 'dean' | 'faculty' | 'student'

export type MeUser = {
  id: number
  name: string
  email: string
  role: Role
  employee_number?: string | null
  student_number?: string | null
  avatar_url?: string | null
}

export type MeResponse = {
  user: MeUser
}

const USER_KEY = 'auth_user'
const FETCH_CACHE_TTL_MS = 15_000
const fetchCache = new Map<string, { expiresAt: number; res: Response; bodyText: string }>()
const fetchInFlight = new Map<string, Promise<Response>>()

export function getToken() {
  return localStorage.getItem('auth_token') || sessionStorage.getItem('auth_token') || ''
}

export function setToken(token: string, remember: boolean) {
  if (remember) {
    localStorage.setItem('auth_token', token)
    sessionStorage.removeItem('auth_token')
    return
  }
  sessionStorage.setItem('auth_token', token)
  localStorage.removeItem('auth_token')
}

export function setCachedUser(user: MeUser, remember: boolean) {
  const raw = JSON.stringify(user)
  if (remember) {
    localStorage.setItem(USER_KEY, raw)
    sessionStorage.removeItem(USER_KEY)
    return
  }
  sessionStorage.setItem(USER_KEY, raw)
  localStorage.removeItem(USER_KEY)
}

export function getCachedUser(): MeUser | null {
  const raw = localStorage.getItem(USER_KEY) || sessionStorage.getItem(USER_KEY)
  if (!raw) return null
  try {
    return JSON.parse(raw) as MeUser
  } catch {
    return null
  }
}

/** Write current user to the same storage as the active auth token. */
export function syncCachedUser(user: MeUser) {
  const remember = !!localStorage.getItem('auth_token')
  setCachedUser(user, remember)
}

export function clearToken() {
  localStorage.removeItem('auth_token')
  sessionStorage.removeItem('auth_token')
  localStorage.removeItem(USER_KEY)
  sessionStorage.removeItem(USER_KEY)
}

export async function apiFetch(path: string, init: RequestInit = {}) {
  const token = getToken()
  const headers = new Headers(init.headers || {})
  headers.set('Accept', 'application/json')
  if (!headers.has('Content-Type') && init.body) headers.set('Content-Type', 'application/json')
  if (token) headers.set('Authorization', `Bearer ${token}`)

  const method = (init.method || 'GET').toUpperCase()
  const canCache = method === 'GET' && !init.body
  const key = canCache ? `${path}::${token ? 'auth' : 'anon'}` : ''
  const now = Date.now()

  if (canCache) {
    const cached = fetchCache.get(key)
    if (cached && cached.expiresAt > now) {
      // Recreate a fresh Response so callers can still read the body.
      return new Response(cached.bodyText, {
        status: cached.res.status,
        statusText: cached.res.statusText,
        headers: cached.res.headers,
      })
    }
    const existing = fetchInFlight.get(key)
    if (existing) return existing
  }

  const p = fetch(path, { ...init, headers }).then(async (res) => {
    if (canCache) {
      try {
        const bodyText = await res.clone().text()
        fetchCache.set(key, { expiresAt: Date.now() + FETCH_CACHE_TTL_MS, res, bodyText })
      } catch {
        // ignore caching failures
      } finally {
        fetchInFlight.delete(key)
      }
    }
    return res
  })

  if (canCache) fetchInFlight.set(key, p)
  return p
}

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000'

export type UpdateMyProfilePayload = {
  name: string
  password?: string
  password_confirmation?: string
}

export async function updateMyProfile(payload: UpdateMyProfilePayload): Promise<MeUser> {
  try {
    const res = await api.patch('/api/me', payload)
    return (res.data as MeResponse).user
  } catch (e: unknown) {
    const ax = e as { response?: { data?: { message?: string; errors?: Record<string, string[]> } } }
    const d = ax.response?.data
    const msg =
      d?.errors?.password?.[0] ||
      d?.errors?.name?.[0] ||
      d?.message ||
      'Could not update profile'
    throw new Error(msg)
  }
}

export async function verifyPasswordChangeOtp(otp: string): Promise<void> {
  try {
    await api.post('/api/me/verify-password-otp', { otp })
  } catch (e: unknown) {
    const ax = e as { response?: { data?: { message?: string; errors?: Record<string, string[]> } } }
    const d = ax.response?.data
    const msg = d?.errors?.otp?.[0] || d?.message || 'Invalid verification code'
    throw new Error(msg)
  }
}

export async function requestPasswordChangeOtp(): Promise<void> {
  try {
    await api.post('/api/me/password-otp')
  } catch (e: unknown) {
    const ax = e as { response?: { status?: number; data?: { message?: string; retry_after?: number } } }
    const d = ax.response?.data
    if (ax.response?.status === 429) {
      throw Object.assign(new Error(d?.message || 'Too many requests. Please wait.'), {
        retryAfter: typeof d?.retry_after === 'number' ? d.retry_after : 60,
      })
    }
    throw new Error(d?.message || 'Could not send verification code')
  }
}

export async function requestPasswordResetOtp(email: string): Promise<void> {
  try {
    await api.post('/api/password-reset/request-otp', { email })
  } catch (e: unknown) {
    const ax = e as { response?: { status?: number; data?: { message?: string; retry_after?: number } } }
    const d = ax.response?.data
    if (ax.response?.status === 429) {
      throw Object.assign(new Error(d?.message || 'Too many requests. Please wait.'), {
        retryAfter: typeof d?.retry_after === 'number' ? d?.retry_after : 60,
      })
    }
    throw new Error(d?.message || 'Could not send verification code')
  }
}

export async function verifyPasswordResetOtp(email: string, otp: string): Promise<void> {
  try {
    await api.post('/api/password-reset/verify-otp', { email, otp })
  } catch (e: unknown) {
    const ax = e as { response?: { data?: { message?: string; errors?: Record<string, string[]> } } }
    const d = ax.response?.data
    const msg = d?.errors?.otp?.[0] || d?.message || 'Invalid verification code'
    throw new Error(msg)
  }
}

export async function resetPasswordWithOtp(
  email: string,
  newPassword: string,
  confirmPassword: string,
): Promise<void> {
  try {
    await api.post('/api/password-reset/change-password', {
      email,
      new_password: newPassword,
      new_password_confirmation: confirmPassword,
    })
  } catch (e: unknown) {
    const ax = e as { response?: { data?: { message?: string; errors?: Record<string, string[]> } } }
    const d = ax.response?.data
    const msg =
      d?.errors?.new_password?.[0] ||
      d?.errors?.password?.[0] ||
      d?.message ||
      'Could not update password'
    throw new Error(msg)
  }
}

export async function uploadMyAvatar(file: File): Promise<MeUser> {
  const token = getToken()
  const fd = new FormData()
  fd.append('avatar', file)
  const res = await fetch(`${API_BASE_URL}/api/me/avatar`, {
    method: 'POST',
    headers: {
      Accept: 'application/json',
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    },
    body: fd,
  })
  const data = (await res.json().catch(() => ({}))) as { message?: string; user?: MeUser; errors?: Record<string, string[]> }
  if (!res.ok) {
    const msg =
      (data.errors?.avatar && data.errors.avatar[0]) ||
      data.message ||
      `Upload failed (${res.status})`
    throw new Error(msg)
  }
  if (!data.user) throw new Error('Invalid response')
  return data.user
}

export async function fetchMe(): Promise<MeResponse | null> {
  const token = getToken()
  if (!token) return null
  try {
    const res = await api.get('/api/me')
    return res.data as MeResponse
  } catch {
    return null
  }
}

export async function login(payload: { role: Role; identifier: string; password: string }) {
  const res = await api.post('/api/login', payload)
  return res.data
}

export async function logout() {
  try {
    await api.post('/api/logout')
  } finally {
    clearToken()
  }
}

