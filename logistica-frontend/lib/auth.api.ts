import apiClient from "./api-client"

export interface LoginResponse {
  access: string
  refresh: string
}

export interface RefreshResponse {
  access: string
}

export async function login(username: string, password: string): Promise<LoginResponse> {
  const response = await apiClient.post<LoginResponse>("/api/auth/token/", {
    username,
    password,
  })
  return response.data
}

export async function refreshToken(refresh: string): Promise<RefreshResponse> {
  const response = await apiClient.post<RefreshResponse>("/api/auth/token/refresh/", {
    refresh,
  })
  return response.data
}

export function decodeJwtPayload(token: string): Record<string, unknown> | null {
  try {
    const parts = token.split(".")
    if (parts.length !== 3) return null
    const payload = parts[1]
    const decoded = atob(payload.replace(/-/g, "+").replace(/_/g, "/"))
    return JSON.parse(decoded)
  } catch {
    return null
  }
}
