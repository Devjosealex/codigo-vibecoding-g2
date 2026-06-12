import { shipmentSchema } from "@/schemas/shipments"

const valid = {
  destination_address: "Av. Lima 123",
  destination_city: "Lima",
  base_cost: "150.00",
}

describe("shipmentSchema — valid", () => {
  it("passes with required fields only", () => {
    expect(shipmentSchema.safeParse(valid).success).toBe(true)
  })

  it("passes with all optional fields", () => {
    expect(
      shipmentSchema.safeParse({
        ...valid,
        destination_country: "Peru",
        customer: 1,
        origin_warehouse: 2,
        vehicle: 3,
        route: 4,
        scheduled_date: "2026-07-01",
        notes: "Frágil",
      }).success,
    ).toBe(true)
  })

  it("passes with null optional numbers", () => {
    expect(
      shipmentSchema.safeParse({
        ...valid,
        customer: null,
        origin_warehouse: null,
        vehicle: null,
        route: null,
      }).success,
    ).toBe(true)
  })

  it("passes with empty optional strings", () => {
    expect(
      shipmentSchema.safeParse({
        ...valid,
        destination_country: "",
        scheduled_date: "",
        notes: "",
      }).success,
    ).toBe(true)
  })
})

describe("shipmentSchema — required fields", () => {
  it("fails when destination_address is empty", () => {
    const r = shipmentSchema.safeParse({ ...valid, destination_address: "" })
    expect(r.success).toBe(false)
    if (!r.success)
      expect(r.error.flatten().fieldErrors.destination_address?.[0]).toBe(
        "La dirección es requerida",
      )
  })

  it("fails when destination_city is empty", () => {
    const r = shipmentSchema.safeParse({ ...valid, destination_city: "" })
    expect(r.success).toBe(false)
    if (!r.success)
      expect(r.error.flatten().fieldErrors.destination_city?.[0]).toBe(
        "La ciudad es requerida",
      )
  })

  it("fails when base_cost is empty", () => {
    const r = shipmentSchema.safeParse({ ...valid, base_cost: "" })
    expect(r.success).toBe(false)
    if (!r.success)
      expect(r.error.flatten().fieldErrors.base_cost?.[0]).toBe(
        "El costo base es requerido",
      )
  })
})

describe("shipmentSchema — length constraints", () => {
  it("fails when destination_address exceeds 255 chars", () => {
    expect(
      shipmentSchema.safeParse({ ...valid, destination_address: "a".repeat(256) }).success,
    ).toBe(false)
  })

  it("fails when destination_city exceeds 100 chars", () => {
    expect(
      shipmentSchema.safeParse({ ...valid, destination_city: "x".repeat(101) }).success,
    ).toBe(false)
  })
})
