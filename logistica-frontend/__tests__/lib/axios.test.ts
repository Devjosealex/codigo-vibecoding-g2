/**
 * Tests the interceptors in lib/api-client.ts.
 *
 * Axios in jsdom uses the XHR adapter. MSW's XMLHttpRequestInterceptor intercepts
 * those requests, but it constructs absolute URLs via `new URL(url, location.href)`.
 * The base URL MUST be a valid absolute URL — setting location.href to '' or '/login'
 * causes `new URL(url, base)` to throw even if `url` is already absolute.
 *
 * Fix: each beforeEach resets window.location to a plain writable object with a valid
 * href. This lets MSW intercept normally AND lets us observe href assignments made by
 * the interceptor (e.g. window.location.href = "/login").
 *
 * Single shared apiClient — isRefreshing/failedQueue are always reset by the
 * interceptor's finally block and early-return paths.
 */
import { http, HttpResponse } from "msw"
import apiClient from "@/lib/api-client"
import { server } from "@/test/msw/server"

beforeEach(() => {
  localStorage.clear()
  // Valid base URL required so MSW's XHR interceptor can call new URL(req, location.href)
  Object.defineProperty(window, "location", {
    configurable: true,
    writable: true,
    value: { href: "http://localhost:3000/" },
  })
})

afterEach(() => {
  server.resetHandlers()
})

// ─── Request interceptor ──────────────────────────────────────────────────────

describe("request interceptor", () => {
  it("adds Authorization: Bearer header when access token exists", async () => {
    localStorage.setItem("access_token", "my-token")
    let capturedAuth: string | null = null

    server.use(
      http.get("http://localhost:8000/api/ping/", ({ request }) => {
        capturedAuth = request.headers.get("Authorization")
        return HttpResponse.json({ ok: true })
      })
    )

    await apiClient.get("/api/ping/")
    expect(capturedAuth).toBe("Bearer my-token")
  })

  it("omits Authorization header when no access token", async () => {
    let capturedAuth: string | null = "sentinel"

    server.use(
      http.get("http://localhost:8000/api/ping/", ({ request }) => {
        capturedAuth = request.headers.get("Authorization")
        return HttpResponse.json({ ok: true })
      })
    )

    await apiClient.get("/api/ping/")
    expect(capturedAuth).toBeNull()
  })
})

// ─── Response interceptor ─────────────────────────────────────────────────────

describe("response interceptor — 401 with valid refresh token", () => {
  it("calls refresh, saves new token, retries with new token", async () => {
    localStorage.setItem("access_token", "old-token")
    localStorage.setItem("refresh_token", "valid-refresh")

    const authHeaders: string[] = []

    server.use(
      http.get("http://localhost:8000/api/protected/", ({ request }) => {
        const auth = request.headers.get("Authorization") ?? ""
        authHeaders.push(auth)
        if (auth.includes("old-token")) {
          return new HttpResponse(null, { status: 401 })
        }
        return HttpResponse.json({ ok: true })
      }),
      http.post("http://localhost:8000/api/auth/token/refresh/", () =>
        HttpResponse.json({ access: "new-token" })
      )
    )

    const res = await apiClient.get("/api/protected/")

    expect(res.status).toBe(200)
    // original attempt (old-token) + retry (new-token)
    expect(authHeaders).toHaveLength(2)
    expect(authHeaders[0]).toBe("Bearer old-token")
    expect(authHeaders[1]).toBe("Bearer new-token")
    expect(localStorage.getItem("access_token")).toBe("new-token")
  })
})

describe("response interceptor — 401 with no refresh token", () => {
  it("clears tokens and redirects to /login", async () => {
    localStorage.setItem("access_token", "some-token")
    // no refresh_token

    server.use(
      http.get("http://localhost:8000/api/protected/", () =>
        new HttpResponse(null, { status: 401 })
      )
    )

    await expect(apiClient.get("/api/protected/")).rejects.toThrow()
    expect(localStorage.getItem("access_token")).toBeNull()
    expect(localStorage.getItem("refresh_token")).toBeNull()
    expect(window.location.href).toBe("/login")
  })
})

describe("response interceptor — 401 and refresh also fails", () => {
  it("clears tokens, redirects to /login, and rejects the promise", async () => {
    localStorage.setItem("access_token", "old-token")
    localStorage.setItem("refresh_token", "bad-refresh")

    server.use(
      http.get("http://localhost:8000/api/protected/", () =>
        new HttpResponse(null, { status: 401 })
      ),
      http.post("http://localhost:8000/api/auth/token/refresh/", () =>
        new HttpResponse(null, { status: 401 })
      )
    )

    await expect(apiClient.get("/api/protected/")).rejects.toThrow()
    expect(localStorage.getItem("access_token")).toBeNull()
    expect(localStorage.getItem("refresh_token")).toBeNull()
    expect(window.location.href).toBe("/login")
  })
})

describe("_retry flag — no infinite loop", () => {
  it("calls refresh exactly once even when retry also gets 401", async () => {
    localStorage.setItem("access_token", "token")
    localStorage.setItem("refresh_token", "refresh")

    let refreshCount = 0

    server.use(
      // Endpoint always returns 401 — triggers refresh on first attempt,
      // but _retry=true blocks a second refresh attempt on the retry.
      http.get("http://localhost:8000/api/loop/", () =>
        new HttpResponse(null, { status: 401 })
      ),
      http.post("http://localhost:8000/api/auth/token/refresh/", () => {
        refreshCount++
        return HttpResponse.json({ access: "new-token" })
      })
    )

    await expect(apiClient.get("/api/loop/")).rejects.toThrow()

    // Refresh called exactly once; retry's 401 is NOT re-handled
    expect(refreshCount).toBe(1)
    // Refresh succeeded → access_token was updated before the retry
    expect(localStorage.getItem("access_token")).toBe("new-token")
    // No redirect because clearTokens is only called when refresh itself fails
    expect(window.location.href).not.toBe("/login")
  })
})
