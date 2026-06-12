import { driverSchema } from "@/schemas/drivers"

const valid = {
  first_name: "Juan",
  last_name: "Pérez",
  email: "juan@example.com",
}

describe("driverSchema — valid", () => {
  it("passes with required fields only", () => {
    expect(driverSchema.safeParse(valid).success).toBe(true)
  })

  it("passes with all optional fields", () => {
    expect(
      driverSchema.safeParse({
        ...valid,
        document_number: "12345678",
        license_number: "LIC-001",
        license_expiry: "2027-12-31",
        phone: "+51999888777",
      }).success,
    ).toBe(true)
  })

  it("passes with empty optional strings", () => {
    expect(
      driverSchema.safeParse({
        ...valid,
        document_number: "",
        license_number: "",
        license_expiry: "",
        phone: "",
      }).success,
    ).toBe(true)
  })
})

describe("driverSchema — required fields", () => {
  it("fails when first_name is empty", () => {
    const r = driverSchema.safeParse({ ...valid, first_name: "" })
    expect(r.success).toBe(false)
    if (!r.success)
      expect(r.error.flatten().fieldErrors.first_name?.[0]).toBe("El nombre es requerido")
  })

  it("fails when last_name is empty", () => {
    const r = driverSchema.safeParse({ ...valid, last_name: "" })
    expect(r.success).toBe(false)
    if (!r.success)
      expect(r.error.flatten().fieldErrors.last_name?.[0]).toBe("El apellido es requerido")
  })

  it("fails when email is empty", () => {
    const r = driverSchema.safeParse({ ...valid, email: "" })
    expect(r.success).toBe(false)
    if (!r.success)
      expect(r.error.flatten().fieldErrors.email?.[0]).toBe("El email es requerido")
  })

  it("fails when email format is invalid", () => {
    const r = driverSchema.safeParse({ ...valid, email: "not-an-email" })
    expect(r.success).toBe(false)
    if (!r.success)
      expect(r.error.flatten().fieldErrors.email?.[0]).toBe("Email inválido")
  })
})

describe("driverSchema — length constraints", () => {
  it("fails when first_name exceeds 100 chars", () => {
    expect(driverSchema.safeParse({ ...valid, first_name: "a".repeat(101) }).success).toBe(false)
  })

  it("fails when last_name exceeds 100 chars", () => {
    expect(driverSchema.safeParse({ ...valid, last_name: "a".repeat(101) }).success).toBe(false)
  })

  it("fails when document_number exceeds 20 chars", () => {
    expect(driverSchema.safeParse({ ...valid, document_number: "x".repeat(21) }).success).toBe(false)
  })

  it("fails when license_number exceeds 50 chars", () => {
    expect(driverSchema.safeParse({ ...valid, license_number: "x".repeat(51) }).success).toBe(false)
  })

  it("fails when phone exceeds 20 chars", () => {
    expect(driverSchema.safeParse({ ...valid, phone: "1".repeat(21) }).success).toBe(false)
  })
})
