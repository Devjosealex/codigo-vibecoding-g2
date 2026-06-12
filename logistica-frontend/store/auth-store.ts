import { create } from "zustand"
import { login as loginApi, decodeJwtPayload } from "@/lib/auth.api"

interface User {
  id: number
  username: string
  is_superuser: boolean
}

interface AuthState {
  isAuthenticated: boolean
  user: User | null
  login: (username: string, password: string) => Promise<void>
  logout: () => void
  initialize: () => void
}

export const useAuthStore = create<AuthState>((set) => ({
  isAuthenticated: false,
  user: null,

  initialize: () => {
    if (typeof window === "undefined") return
    const token = localStorage.getItem("access_token")
    const userStr = localStorage.getItem("user")
    if (token && userStr) {
      try {
        const stored = JSON.parse(userStr)
        // Re-decode JWT para refrescar is_superuser desde el token actual
        const payload = decodeJwtPayload(token)
        const is_superuser = (payload?.is_superuser as boolean) ?? false
        set({
          isAuthenticated: true,
          user: { ...stored, is_superuser },
        })
      } catch {
        localStorage.removeItem("access_token")
        localStorage.removeItem("refresh_token")
        localStorage.removeItem("user")
      }
    }
  },

  login: async (username: string, password: string) => {
    const data = await loginApi(username, password)
    localStorage.setItem("access_token", data.access)
    localStorage.setItem("refresh_token", data.refresh)

    const payload = decodeJwtPayload(data.access)
    const userId = (payload?.user_id as number) ?? 0
    const is_superuser = (payload?.is_superuser as boolean) ?? false
    const user: User = { id: userId, username, is_superuser }
    localStorage.setItem("user", JSON.stringify(user))
    set({ isAuthenticated: true, user })
  },

  logout: () => {
    localStorage.removeItem("access_token")
    localStorage.removeItem("refresh_token")
    localStorage.removeItem("user")
    set({ isAuthenticated: false, user: null })
    if (typeof window !== "undefined") {
      window.location.href = "/login"
    }
  },
}))
