const ACCESS = "access_token"
const REFRESH = "refresh_token"

export function getAccessToken(): string | null {
  if (typeof window === "undefined") return null
  return localStorage.getItem(ACCESS)
}

export function getRefreshToken(): string | null {
  if (typeof window === "undefined") return null
  return localStorage.getItem(REFRESH)
}

export function setTokens({
  access,
  refresh,
}: {
  access?: string
  refresh?: string
}): void {
  if (typeof window === "undefined") return
  if (access !== undefined) localStorage.setItem(ACCESS, access)
  if (refresh !== undefined) localStorage.setItem(REFRESH, refresh)
}

export function clearTokens(): void {
  if (typeof window === "undefined") return
  localStorage.removeItem(ACCESS)
  localStorage.removeItem(REFRESH)
}

export function isAuthenticated(): boolean {
  return Boolean(getAccessToken())
}
