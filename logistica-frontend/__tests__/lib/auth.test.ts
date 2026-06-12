import {
  getAccessToken,
  getRefreshToken,
  setTokens,
  clearTokens,
  isAuthenticated,
} from "@/lib/auth"

beforeEach(() => {
  localStorage.clear()
})

describe("getAccessToken", () => {
  it("returns stored value", () => {
    localStorage.setItem("access_token", "abc")
    expect(getAccessToken()).toBe("abc")
  })

  it("returns null when not set", () => {
    expect(getAccessToken()).toBeNull()
  })

  it("SSR guard: returns null when window is undefined", () => {
    const orig = globalThis.window
    try {
      // @ts-expect-error — simulating SSR
      globalThis.window = undefined
      expect(getAccessToken()).toBeNull()
    } finally {
      globalThis.window = orig
    }
  })
})

describe("getRefreshToken", () => {
  it("returns stored value", () => {
    localStorage.setItem("refresh_token", "xyz")
    expect(getRefreshToken()).toBe("xyz")
  })

  it("returns null when not set", () => {
    expect(getRefreshToken()).toBeNull()
  })

  it("SSR guard: returns null when window is undefined", () => {
    const orig = globalThis.window
    try {
      // @ts-expect-error — simulating SSR
      globalThis.window = undefined
      expect(getRefreshToken()).toBeNull()
    } finally {
      globalThis.window = orig
    }
  })
})

describe("setTokens", () => {
  it("stores both tokens", () => {
    setTokens({ access: "a1", refresh: "r1" })
    expect(localStorage.getItem("access_token")).toBe("a1")
    expect(localStorage.getItem("refresh_token")).toBe("r1")
  })

  it("stores only access when refresh omitted", () => {
    localStorage.setItem("refresh_token", "existing-refresh")
    setTokens({ access: "new-access" })
    expect(localStorage.getItem("access_token")).toBe("new-access")
    expect(localStorage.getItem("refresh_token")).toBe("existing-refresh")
  })

  it("stores only refresh when access omitted", () => {
    localStorage.setItem("access_token", "existing-access")
    setTokens({ refresh: "new-refresh" })
    expect(localStorage.getItem("access_token")).toBe("existing-access")
    expect(localStorage.getItem("refresh_token")).toBe("new-refresh")
  })

  it("SSR guard: does nothing when window is undefined", () => {
    const orig = globalThis.window
    try {
      // @ts-expect-error — simulating SSR
      globalThis.window = undefined
      expect(() => setTokens({ access: "x", refresh: "y" })).not.toThrow()
    } finally {
      globalThis.window = orig
    }
  })
})

describe("clearTokens", () => {
  it("removes both tokens", () => {
    localStorage.setItem("access_token", "a")
    localStorage.setItem("refresh_token", "r")
    clearTokens()
    expect(localStorage.getItem("access_token")).toBeNull()
    expect(localStorage.getItem("refresh_token")).toBeNull()
  })

  it("is a no-op when tokens not set", () => {
    expect(() => clearTokens()).not.toThrow()
  })

  it("SSR guard: does nothing when window is undefined", () => {
    const orig = globalThis.window
    try {
      // @ts-expect-error — simulating SSR
      globalThis.window = undefined
      expect(() => clearTokens()).not.toThrow()
    } finally {
      globalThis.window = orig
    }
  })
})

describe("isAuthenticated", () => {
  it("returns true when access token is truthy", () => {
    localStorage.setItem("access_token", "valid-token")
    expect(isAuthenticated()).toBe(true)
  })

  it("returns false when access token is null (not set)", () => {
    expect(isAuthenticated()).toBe(false)
  })

  it("returns false when access token is empty string", () => {
    localStorage.setItem("access_token", "")
    expect(isAuthenticated()).toBe(false)
  })

  it("SSR guard: returns false when window is undefined", () => {
    const orig = globalThis.window
    try {
      // @ts-expect-error — simulating SSR
      globalThis.window = undefined
      expect(isAuthenticated()).toBe(false)
    } finally {
      globalThis.window = orig
    }
  })
})
