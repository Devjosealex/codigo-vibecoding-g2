import { customerSchema } from "@/schemas/customers"

const validPayload = {
  name: "Acme Corp",
  customer_type: "company" as const,
  email: "contact@acme.com",
}

describe("customerSchema — valid", () => {
  it("passes with required fields only", () => {
    expect(customerSchema.safeParse(validPayload).success).toBe(true)
  })

  it("passes with all fields", () => {
    const result = customerSchema.safeParse({
      ...validPayload,
      customer_type: "individual",
      tax_id: "12345678",
      phone: "+51999888777",
      address: "Av. Lima 123",
      city: "Lima",
      country: "Peru",
    })
    expect(result.success).toBe(true)
  })

  it("passes with empty optional strings (treated as optional)", () => {
    const result = customerSchema.safeParse({
      ...validPayload,
      tax_id: "",
      phone: "",
      address: "",
      city: "",
      country: "",
    })
    expect(result.success).toBe(true)
  })
})

describe("customerSchema — required fields", () => {
  it("fails when name is empty", () => {
    const result = customerSchema.safeParse({ ...validPayload, name: "" })
    expect(result.success).toBe(false)
    if (!result.success) {
      expect(result.error.flatten().fieldErrors.name?.[0]).toBe(
        "El nombre es requerido"
      )
    }
  })

  it("fails when name is missing", () => {
    const { name: _n, ...rest } = validPayload
    expect(customerSchema.safeParse(rest).success).toBe(false)
  })

  it("fails when customer_type is not a valid enum value", () => {
    const result = customerSchema.safeParse({
      ...validPayload,
      customer_type: "unknown",
    })
    expect(result.success).toBe(false)
    if (!result.success) {
      expect(result.error.flatten().fieldErrors.customer_type).toBeDefined()
    }
  })

  it("fails when email is empty", () => {
    const result = customerSchema.safeParse({ ...validPayload, email: "" })
    expect(result.success).toBe(false)
    if (!result.success) {
      expect(result.error.flatten().fieldErrors.email?.[0]).toBe(
        "El email es requerido"
      )
    }
  })

  it("fails when email format is invalid", () => {
    const result = customerSchema.safeParse({
      ...validPayload,
      email: "not-an-email",
    })
    expect(result.success).toBe(false)
    if (!result.success) {
      expect(result.error.flatten().fieldErrors.email?.[0]).toBe("Email inválido")
    }
  })
})

describe("customerSchema — length constraints", () => {
  it("fails when name exceeds 200 chars", () => {
    const result = customerSchema.safeParse({
      ...validPayload,
      name: "a".repeat(201),
    })
    expect(result.success).toBe(false)
  })

  it("fails when tax_id exceeds 20 chars", () => {
    const result = customerSchema.safeParse({
      ...validPayload,
      tax_id: "x".repeat(21),
    })
    expect(result.success).toBe(false)
  })

  it("fails when phone exceeds 20 chars", () => {
    const result = customerSchema.safeParse({
      ...validPayload,
      phone: "1".repeat(21),
    })
    expect(result.success).toBe(false)
  })

  it("fails when city exceeds 100 chars", () => {
    const result = customerSchema.safeParse({
      ...validPayload,
      city: "x".repeat(101),
    })
    expect(result.success).toBe(false)
  })
})
