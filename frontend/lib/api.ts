import axios, {
  AxiosError,
  AxiosResponse,
  InternalAxiosRequestConfig,
} from "axios"

// ═══════════════════════════════════════════════════════════════
// TYPES
// ═══════════════════════════════════════════════════════════════

interface RetryConfig extends InternalAxiosRequestConfig {
  _retryCount?: number
}

// ═══════════════════════════════════════════════════════════════
// API INSTANCE
// ═══════════════════════════════════════════════════════════════

const api = axios.create({
  baseURL:
    process.env.NEXT_PUBLIC_API_URL ||
    "http://localhost:8000/api",
  withCredentials: true,
  timeout: 10000,
})

console.log("[API] Initialized with baseURL:", api.defaults.baseURL)

// ═══════════════════════════════════════════════════════════════
// AUTH STATE
// ═══════════════════════════════════════════════════════════════

let refreshPromise: Promise<void> | null = null
let isRedirecting = false
let authChannel: BroadcastChannel | null = null

// ═══════════════════════════════════════════════════════════════
// BROADCAST CHANNEL
// ═══════════════════════════════════════════════════════════════

function getAuthChannel(): BroadcastChannel | null {
  if (typeof window === "undefined") {
    return null
  }

  if (!authChannel) {
    authChannel = new BroadcastChannel("auth")

    authChannel.onmessage = (event) => {
      console.log("[BroadcastChannel] Message reçu:", event.data?.type)
      switch (event.data?.type) {
        case "LOGOUT":
          if (!isRedirecting) {
            console.log("[BroadcastChannel] Logout depuis autre onglet")
            isRedirecting = true
            window.location.replace("/login")
          }
          break

        case "REFRESH_SUCCESS":
          console.log("[BroadcastChannel] Refresh success depuis autre onglet")
          break

        default:
          break
      }
    }
  }

  return authChannel
}

// ═══════════════════════════════════════════════════════════════
// LOGOUT CENTRALISÉ
// ═══════════════════════════════════════════════════════════════

export function forceLogout() {
  console.log("[API] Force logout déclenché")
  refreshPromise = null

  if (typeof window === "undefined") {
    console.log("[API] SSR: pas de window, abandon")
    return
  }

  getAuthChannel()?.postMessage({
    type: "LOGOUT",
  })

  if (!isRedirecting) {
    isRedirecting = true
    console.log("[API] Redirection vers /login")
    window.location.replace("/login")
  }
}

// ═══════════════════════════════════════════════════════════════
// REFRESH TOKEN
// ═══════════════════════════════════════════════════════════════

async function performTokenRefresh(): Promise<void> {
  console.log("[API] Tentative de refresh token...")
  try {
    const response = await api.post("/auth/token/refresh/")

    if (response.status !== 200) {
      throw new Error(`Token refresh retourné status ${response.status}`)
    }

    console.log("[API] ✅ Token refresh réussi")
    getAuthChannel()?.postMessage({
      type: "REFRESH_SUCCESS",
    })
  } catch (error) {
    console.error("[API] ❌ Token refresh échoué:", error)
    throw error
  }
}

function getRefreshPromise(): Promise<void> {
  if (!refreshPromise) {
    refreshPromise = performTokenRefresh().finally(() => {
      refreshPromise = null
    })
  }

  return refreshPromise
}

// ═══════════════════════════════════════════════════════════════
// REQUEST INTERCEPTOR
// ═══════════════════════════════════════════════════════════════

api.interceptors.request.use(
  (config) => {
    if (process.env.NODE_ENV === "development") {
      console.log(`[API] ${config.method?.toUpperCase()} ${config.url}`)
    }
    return config
  },
  (error) => {
    console.error("[API] Erreur request:", error)
    return Promise.reject(error)
  }
)

// ═══════════════════════════════════════════════════════════════
// RESPONSE INTERCEPTOR
// ═══════════════════════════════════════════════════════════════

api.interceptors.response.use(
  (response: AxiosResponse) => {
    if (process.env.NODE_ENV === "development") {
      console.log(`[API] ✅ ${response.status} ${response.config.url}`)
    }
    return response
  },

  async (error: AxiosError) => {
    const config = error.config as RetryConfig
    const status = error.response?.status
    const url = config?.url || "unknown"

    console.log(`[API] ❌ ${status} ${url}`, {
      message: error.message,
      retryCount: config?._retryCount || 0,
    })

    // Pas de réponse serveur
    if (!error.response) {
      console.error("[API] Pas de réponse serveur:", error.message)
      return Promise.reject(error)
    }

    // Pas un 401
    if (status !== 401) {
      console.log(`[API] Status ${status} ≠ 401, rejet direct`)
      return Promise.reject(error)
    }

    if (!config) {
      console.error("[API] Pas de config")
      return Promise.reject(error)
    }

    // ✅ IMPORTANT: Ne PAS faire de refresh pour /users/me/
    // Cet endpoint est appelé au démarrage avant qu'il y ait une session
    // Si on essaie un refresh, on boucle et on redirige vers login
    const isCheckAuthEndpoint = url?.includes("/users/me")

    if (isCheckAuthEndpoint) {
      console.log("[API] /users/me/ rejeté (pas de refresh automatique)")
      return Promise.reject(error)
    }

    // Meilleur matching des URLs
    const isTokenRefreshEndpoint = url?.includes("/auth/token/refresh")
    const isLoginEndpoint = url?.includes("/auth/login")
    const isLogoutEndpoint = url?.includes("/auth/logout")

    // Refresh token endpoint retourne 401 → forcer logout
    if (isTokenRefreshEndpoint) {
      console.log("[API] Refresh token endpoint retourné 401, force logout")
      forceLogout()
      return Promise.reject(error)
    }

    // Login / Logout : ne pas essayer de refresh
    if (isLoginEndpoint || isLogoutEndpoint) {
      console.log("[API] Auth endpoint (login/logout) retourné 401, pas de retry")
      return Promise.reject(error)
    }

    // Protection contre boucle infinie
    config._retryCount = (config._retryCount || 0) + 1

    if (config._retryCount > 1) {
      console.error("[API] Trop de tentatives de retry, force logout")
      forceLogout()
      return Promise.reject(error)
    }

    console.log(
      `[API] 401 reçu pour ${url}, tentative refresh token (retry: ${config._retryCount})`
    )

    try {
      await getRefreshPromise()
      console.log("[API] Retry de la requête après refresh")
      return api(config)
    } catch (refreshError) {
      console.error("[API] Refresh a échoué, force logout")
      forceLogout()
      return Promise.reject(refreshError)
    }
  }
)

// ═══════════════════════════════════════════════════════════════
// HELPERS
// ═══════════════════════════════════════════════════════════════

export function isRefreshing(): boolean {
  return refreshPromise !== null
}

export function waitForRefresh(): Promise<void> | null {
  return refreshPromise
}

export default api