import { productSchema } from "@/schemas/products"

const valid = {
  name: "Producto A",
  sku: "SKU-001",
  unit_price: "99.99",
  stock_quantity: 10,
}

describe("productSchema — valid", () => {
  it("passes with required fields only", () => {
    expect(productSchema.safeParse(valid).success).toBe(true)
  })

  it("passes with all optional fields", () => {
    expect(
      productSchema.safeParse({
        ...valid,
        supplier: 1,
        warehouse: 2,
        description: "Una descripción",
        weight_kg: "1.5",
        length_cm: "10",
        width_cm: "5",
        height_cm: "3",
      }).success,
    ).toBe(true)
  })

  it("passes with null optional numbers", () => {
    expect(
      productSchema.safeParse({ ...valid, supplier: null, warehouse: null }).success,
    ).toBe(true)
  })

  it("passes with empty optional strings", () => {
    expect(
      productSchema.safeParse({
        ...valid,
        description: "",
        weight_kg: "",
        length_cm: "",
        width_cm: "",
        height_cm: "",
      }).success,
    ).toBe(true)
  })
})

describe("productSchema — required fields", () => {
  it("fails when name is empty", () => {
    const r = productSchema.safeParse({ ...valid, name: "" })
    expect(r.success).toBe(false)
    if (!r.success)
      expect(r.error.flatten().fieldErrors.name?.[0]).toBe("El nombre es requerido")
  })

  it("fails when sku is empty", () => {
    const r = productSchema.safeParse({ ...valid, sku: "" })
    expect(r.success).toBe(false)
    if (!r.success)
      expect(r.error.flatten().fieldErrors.sku?.[0]).toBe("El SKU es requerido")
  })

  it("fails when unit_price is empty", () => {
    const r = productSchema.safeParse({ ...valid, unit_price: "" })
    expect(r.success).toBe(false)
    if (!r.success)
      expect(r.error.flatten().fieldErrors.unit_price?.[0]).toBe("El precio es requerido")
  })
})

describe("productSchema — length constraints", () => {
  it("fails when name exceeds 200 chars", () => {
    expect(productSchema.safeParse({ ...valid, name: "a".repeat(201) }).success).toBe(false)
  })

  it("fails when sku exceeds 50 chars", () => {
    expect(productSchema.safeParse({ ...valid, sku: "x".repeat(51) }).success).toBe(false)
  })
})
