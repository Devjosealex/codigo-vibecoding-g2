import { loginSchema } from "@/schemas/login"

describe("loginSchema", () => {
  it("passes with valid username and password", () => {
    const result = loginSchema.safeParse({
      username: "testuser",
      password: "secret123",
    })
    expect(result.success).toBe(true)
  })

  it("fails when username is empty", () => {
    const result = loginSchema.safeParse({ username: "", password: "secret123" })
    expect(result.success).toBe(false)
    if (!result.success) {
      const msg = result.error.flatten().fieldErrors.username?.[0]
      expect(msg).toBe("El usuario es requerido")
    }
  })

  it("fails when password is too short (< 6 chars)", () => {
    const result = loginSchema.safeParse({ username: "user", password: "abc" })
    expect(result.success).toBe(false)
    if (!result.success) {
      const msg = result.error.flatten().fieldErrors.password?.[0]
      expect(msg).toBe("La contraseña debe tener al menos 6 caracteres")
    }
  })

  it("fails when both fields are empty", () => {
    const result = loginSchema.safeParse({ username: "", password: "" })
    expect(result.success).toBe(false)
    if (!result.success) {
      const errors = result.error.flatten().fieldErrors
      expect(errors.username?.[0]).toBe("El usuario es requerido")
      expect(errors.password?.[0]).toBe("La contraseña debe tener al menos 6 caracteres")
    }
  })

  it("fails when fields are missing", () => {
    const result = loginSchema.safeParse({})
    expect(result.success).toBe(false)
  })

  it("passes with password exactly 6 chars", () => {
    const result = loginSchema.safeParse({ username: "user", password: "abcdef" })
    expect(result.success).toBe(true)
  })
})
