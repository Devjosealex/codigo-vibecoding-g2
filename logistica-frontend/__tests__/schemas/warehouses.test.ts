import { warehouseSchema } from "@/schemas/warehouses"

const valid = { name: "Almacén Central" }

describe("warehouseSchema — valid", () => {
  it("passes with name only", () => {
    expect(warehouseSchema.safeParse(valid).success).toBe(true)
  })

  it("passes with all optional fields", () => {
    expect(
      warehouseSchema.safeParse({
        ...valid,
        address: "Av. Industrial 5",
        city: "Lima",
        country: "Peru",
        latitude: "-12.0464",
        longitude: "-77.0428",
        capacity_m3: "500.00",
      }).success,
    ).toBe(true)
  })

  it("passes with empty optional strings", () => {
    expect(
      warehouseSchema.safeParse({
        ...valid,
        address: "",
        city: "",
        country: "",
        latitude: "",
        longitude: "",
        capacity_m3: "",
      }).success,
    ).toBe(true)
  })
})

describe("warehouseSchema — required fields", () => {
  it("fails when name is empty", () => {
    const r = warehouseSchema.safeParse({ ...valid, name: "" })
    expect(r.success).toBe(false)
    if (!r.success)
      expect(r.error.flatten().fieldErrors.name?.[0]).toBe("El nombre es requerido")
  })

  it("fails when name is missing", () => {
    expect(warehouseSchema.safeParse({}).success).toBe(false)
  })
})

describe("warehouseSchema — length constraints", () => {
  it("fails when name exceeds 200 chars", () => {
    expect(warehouseSchema.safeParse({ ...valid, name: "a".repeat(201) }).success).toBe(false)
  })

  it("fails when city exceeds 100 chars", () => {
    expect(warehouseSchema.safeParse({ ...valid, city: "x".repeat(101) }).success).toBe(false)
  })
})
