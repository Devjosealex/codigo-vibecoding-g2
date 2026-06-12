import { vehicleSchema } from "@/schemas/vehicles"

const valid = {
  name: "Camión 01",
  plate_number: "ABC-123",
  vehicle_type: "truck" as const,
}

describe("vehicleSchema — valid", () => {
  it("passes with required fields only", () => {
    expect(vehicleSchema.safeParse(valid).success).toBe(true)
  })

  it("passes with all vehicle_type values", () => {
    for (const vt of ["truck", "van", "motorcycle", "other"] as const) {
      expect(vehicleSchema.safeParse({ ...valid, vehicle_type: vt }).success).toBe(true)
    }
  })

  it("passes with optional fields", () => {
    expect(
      vehicleSchema.safeParse({
        ...valid,
        driver: 1,
        capacity_kg: "5000",
        capacity_m3: "20",
      }).success,
    ).toBe(true)
  })

  it("passes with null driver", () => {
    expect(vehicleSchema.safeParse({ ...valid, driver: null }).success).toBe(true)
  })

  it("passes with empty optional strings", () => {
    expect(
      vehicleSchema.safeParse({ ...valid, capacity_kg: "", capacity_m3: "" }).success,
    ).toBe(true)
  })
})

describe("vehicleSchema — required fields", () => {
  it("fails when name is empty", () => {
    const r = vehicleSchema.safeParse({ ...valid, name: "" })
    expect(r.success).toBe(false)
    if (!r.success)
      expect(r.error.flatten().fieldErrors.name?.[0]).toBe("El nombre es requerido")
  })

  it("fails when plate_number is empty", () => {
    const r = vehicleSchema.safeParse({ ...valid, plate_number: "" })
    expect(r.success).toBe(false)
    if (!r.success)
      expect(r.error.flatten().fieldErrors.plate_number?.[0]).toBe("La placa es requerida")
  })

  it("fails when vehicle_type is invalid enum", () => {
    const r = vehicleSchema.safeParse({ ...valid, vehicle_type: "bike" })
    expect(r.success).toBe(false)
    if (!r.success)
      expect(r.error.flatten().fieldErrors.vehicle_type).toBeDefined()
  })
})

describe("vehicleSchema — length constraints", () => {
  it("fails when name exceeds 200 chars", () => {
    expect(vehicleSchema.safeParse({ ...valid, name: "a".repeat(201) }).success).toBe(false)
  })

  it("fails when plate_number exceeds 20 chars", () => {
    expect(vehicleSchema.safeParse({ ...valid, plate_number: "x".repeat(21) }).success).toBe(false)
  })
})
