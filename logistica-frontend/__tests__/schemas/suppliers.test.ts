import { supplierSchema } from "@/schemas/suppliers"

const valid = {
  name: "Proveedor SA",
  email: "contact@proveedor.com",
}

describe("supplierSchema — valid", () => {
  it("passes with required fields only", () => {
    expect(supplierSchema.safeParse(valid).success).toBe(true)
  })

  it("passes with all optional fields", () => {
    expect(
      supplierSchema.safeParse({
        ...valid,
        contact_name: "Juan",
        tax_id: "12345678",
        phone: "+51999",
        address: "Av. Lima 1",
        city: "Lima",
        country: "Peru",
      }).success,
    ).toBe(true)
  })

  it("passes with empty optional strings", () => {
    expect(
      supplierSchema.safeParse({
        ...valid,
        contact_name: "",
        tax_id: "",
        phone: "",
        address: "",
        city: "",
        country: "",
      }).success,
    ).toBe(true)
  })
})

describe("supplierSchema — required fields", () => {
  it("fails when name is empty", () => {
    const r = supplierSchema.safeParse({ ...valid, name: "" })
    expect(r.success).toBe(false)
    if (!r.success)
      expect(r.error.flatten().fieldErrors.name?.[0]).toBe("El nombre es requerido")
  })

  it("fails when email is empty", () => {
    const r = supplierSchema.safeParse({ ...valid, email: "" })
    expect(r.success).toBe(false)
    if (!r.success)
      expect(r.error.flatten().fieldErrors.email?.[0]).toBe("El email es requerido")
  })

  it("fails when email format is invalid", () => {
    const r = supplierSchema.safeParse({ ...valid, email: "bad" })
    expect(r.success).toBe(false)
    if (!r.success)
      expect(r.error.flatten().fieldErrors.email?.[0]).toBe("Email inválido")
  })
})

describe("supplierSchema — length constraints", () => {
  it("fails when name exceeds 200 chars", () => {
    expect(supplierSchema.safeParse({ ...valid, name: "a".repeat(201) }).success).toBe(false)
  })

  it("fails when contact_name exceeds 100 chars", () => {
    expect(supplierSchema.safeParse({ ...valid, contact_name: "x".repeat(101) }).success).toBe(false)
  })

  it("fails when tax_id exceeds 20 chars", () => {
    expect(supplierSchema.safeParse({ ...valid, tax_id: "x".repeat(21) }).success).toBe(false)
  })

  it("fails when phone exceeds 20 chars", () => {
    expect(supplierSchema.safeParse({ ...valid, phone: "1".repeat(21) }).success).toBe(false)
  })

  it("fails when city exceeds 100 chars", () => {
    expect(supplierSchema.safeParse({ ...valid, city: "x".repeat(101) }).success).toBe(false)
  })
})
