import axios from 'axios'

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000'

const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Accept': 'application/json',
    'Content-Type': 'application/json',
  },
  withCredentials: false,
})

type CacheEntry = {
  expiresAt: number
  data: any
  status: number
  statusText: string
  headers: any
  config: any
  request?: any
}

const GET_CACHE_TTL_MS = 15_000
const getCache = new Map<string, CacheEntry>()
const inFlight = new Map<string, Promise<any>>()

function cacheKey(config: any): string {
  const base = (config.baseURL || '') + (config.url || '')
  const params = config.params ? JSON.stringify(config.params) : ''
  return `${base}?${params}`
}

api.interceptors.request.use((config) => {
  // Lightweight GET cache (speeds up navigation + reduces repeated "Loading…")
  if ((config.method || 'get').toLowerCase() === 'get') {
    const key = cacheKey(config)
    const now = Date.now()
    const cached = getCache.get(key)
    const noCache = (config.headers as any)?.['x-no-cache'] === '1'
    const ttlOverride = Number((config.headers as any)?.['x-cache-ttl'] ?? NaN)
    const ttl = Number.isFinite(ttlOverride) ? ttlOverride : GET_CACHE_TTL_MS

    if (!noCache && cached && cached.expiresAt > now) {
      // Short-circuit axios with cached response.
      ;(config as any).adapter = async () => cached
      return config
    }

    // Deduplicate identical in-flight GETs
    if (!noCache && inFlight.has(key)) {
      ;(config as any).adapter = async () => inFlight.get(key)
      return config
    }

    ;(config as any).__cacheKey = key
    ;(config as any).__cacheTtl = ttl
  }

  const token = localStorage.getItem('auth_token') || sessionStorage.getItem('auth_token')
  if (token) {
    config.headers.Authorization = `Bearer ${token}`
  }
  return config
})

api.interceptors.response.use(
  (response) => {
    const config: any = response.config || {}
    if ((config.method || 'get').toLowerCase() === 'get') {
      const key = config.__cacheKey || cacheKey(config)
      const ttl = Number(config.__cacheTtl ?? GET_CACHE_TTL_MS)
      const noCache = (config.headers as any)?.['x-no-cache'] === '1'
      if (!noCache) {
        getCache.set(key, {
          expiresAt: Date.now() + ttl,
          data: response.data,
          status: response.status,
          statusText: response.statusText,
          headers: response.headers,
          config: response.config,
          request: response.request,
        })
      }
      inFlight.delete(key)
    }
    return response
  },
  (error) => {
    console.error('API Error:', error)
    
    if (error.code === 'ECONNREFUSED' || error.code === 'ERR_NETWORK') {
      throw new Error('Network error - Unable to connect to server. Please check if the backend is running.')
    }
    
    if (error.response?.status === 401) {
      localStorage.removeItem('auth_token')
      sessionStorage.removeItem('auth_token')
      localStorage.removeItem('auth_user')
      sessionStorage.removeItem('auth_user')
      window.location.href = '/login'
    }
    
    if (error.response?.status === 419) {
      throw new Error('CSRF token mismatch. Please refresh the page.')
    }
    
    const config: any = error?.config || {}
    if ((config.method || 'get').toLowerCase() === 'get') {
      const key = config.__cacheKey || cacheKey(config)
      inFlight.delete(key)
    }

    return Promise.reject(error)
  }
)

export default api
