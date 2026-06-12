import { routeSchema } from "@/schemas/routes"

const valid = { name: "Ruta Lima-Callao" }

describe("routeSchema — valid", () => {
  it("passes with name only", () => {
    expect(routeSchema.safeParse(valid).success).toBe(true)
  })

  it("passes with all optional fields", () => {
    expect(
      routeSchema.safeParse({
        ...valid,
        origin_warehouse: 1,
        distance_km: "25.5",
        estimated_duration_h: "0.75",
      }).success,
    ).toBe(true)
  })

  it("passes with null origin_warehouse", () => {
    expect(routeSchema.safeParse({ ...valid, origin_warehouse: null }).success).toBe(true)
  })

  it("passes with empty optional strings", () => {
    expect(
      routeSchema.safeParse({ ...valid, distance_km: "", estimated_duration_h: "" }).success,
    ).toBe(true)
  })
})

describe("routeSchema — required fields", () => {
  it("fails when name is empty", () => {
    const r = routeSchema.safeParse({ ...valid, name: "" })
    expect(r.success).toBe(false)
    if (!r.success)
      expect(r.error.flatten().fieldErrors.name?.[0]).toBe("El nombre es requerido")
  })

  it("fails when name is missing", () => {
    expect(routeSchema.safeParse({}).success).toBe(false)
  })
})

describe("routeSchema — length constraints", () => {
  it("fails when name exceeds 200 chars", () => {
    expect(routeSchema.safeParse({ ...valid, name: "a".repeat(201) }).success).toBe(false)
  })
})
