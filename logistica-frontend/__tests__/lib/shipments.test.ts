import { describe, it, expect, beforeEach } from "vitest"
import { http, HttpResponse } from "msw"
import { server } from "@/test/msw/server"
import {
  getShipments,
  getShipment,
  createShipment,
  updateShipment,
  deleteShipment,
  transitionShipment,
  createShipmentItem,
  deleteShipmentItem,
  getShipmentCustomers,
  getShipmentVehicles,
  getShipmentRoutes,
  getShipmentProducts,
  type Shipment,
  type PaginatedResponse,
} from "@/lib/shipments.api"
import type { Customer } from "@/lib/customers.api"
import type { Vehicle } from "@/lib/vehicles.api"
import type { Route } from "@/lib/routes.api"
import type { Product } from "@/lib/products.api"

const BASE = "http://localhost:8000"

const mockShipment: Shipment = {
  id: 1,
  tracking_number: "TRK-001",
  customer: null,
  origin_warehouse: null,
  vehicle: null,
  route: null,
  destination_address: "Av. Lima 123",
  destination_city: "Lima",
  destination_country: "Peru",
  status: "pending",
  scheduled_date: null,
  delivered_at: null,
  base_cost: "150.00",
  calculated_cost: null,
  notes: null,
  created_at: "2026-01-01T00:00:00Z",
  updated_at: "2026-01-01T00:00:00Z",
}

const mockPage: PaginatedResponse<Shipment> = { count: 1, next: null, previous: null, results: [mockShipment] }

beforeEach(() => {
  Object.defineProperty(window, "location", { value: { href: "http://localhost:3000/" }, writable: true })
  localStorage.clear()
})

describe("getShipments", () => {
  it("returns paginated response", async () => {
    server.use(http.get(`${BASE}/api/v1/shipments/`, () => HttpResponse.json(mockPage)))
    const r = await getShipments()
    expect(r.count).toBe(1)
    expect(r.results[0].tracking_number).toBe("TRK-001")
  })

  it("passes status filter", async () => {
    let url = ""
    server.use(http.get(`${BASE}/api/v1/shipments/`, ({ request }) => { url = request.url; return HttpResponse.json(mockPage) }))
    await getShipments({ status: "pending" })
    expect(url).toContain("status=pending")
  })

  it("passes search param", async () => {
    let url = ""
    server.use(http.get(`${BASE}/api/v1/shipments/`, ({ request }) => { url = request.url; return HttpResponse.json(mockPage) }))
    await getShipments({ search: "TRK" })
    expect(url).toContain("search=TRK")
  })

  it("propagates 4xx errors", async () => {
    server.use(http.get(`${BASE}/api/v1/shipments/`, () => HttpResponse.json({ detail: "Forbidden" }, { status: 403 })))
    await expect(getShipments()).rejects.toThrow()
  })
})

describe("getShipment", () => {
  it("fetches single shipment by id", async () => {
    server.use(http.get(`${BASE}/api/v1/shipments/1/`, () => HttpResponse.json(mockShipment)))
    const r = await getShipment(1)
    expect(r.id).toBe(1)
    expect(r.status).toBe("pending")
  })
})

describe("createShipment", () => {
  it("POSTs and returns created shipment", async () => {
    let method = ""
    server.use(http.post(`${BASE}/api/v1/shipments/`, async ({ request }) => { method = request.method; return HttpResponse.json(mockShipment, { status: 201 }) }))
    const r = await createShipment({ destination_address: "Av. Lima 123", destination_city: "Lima", base_cost: "150.00" })
    expect(method).toBe("POST")
    expect(r.tracking_number).toBe("TRK-001")
  })
})

describe("updateShipment", () => {
  it("PUTs to correct URL", async () => {
    let url = ""
    server.use(http.put(`${BASE}/api/v1/shipments/1/`, ({ request }) => { url = request.url; return HttpResponse.json(mockShipment) }))
    await updateShipment(1, { destination_address: "Updated", destination_city: "Lima", base_cost: "200.00" })
    expect(url).toContain("/api/v1/shipments/1/")
  })
})

describe("deleteShipment", () => {
  it("DELETEs correct URL", async () => {
    let method = ""
    server.use(http.delete(`${BASE}/api/v1/shipments/1/`, ({ request }) => { method = request.method; return new HttpResponse(null, { status: 204 }) }))
    await deleteShipment(1)
    expect(method).toBe("DELETE")
  })
})

describe("transitionShipment", () => {
  it("POSTs to transition endpoint with status", async () => {
    let body: unknown
    server.use(http.post(`${BASE}/api/v1/shipments/1/transition/`, async ({ request }) => {
      body = await request.json()
      return HttpResponse.json({ ...mockShipment, status: "in_transit" })
    }))
    const r = await transitionShipment(1, "in_transit")
    expect((body as { status: string }).status).toBe("in_transit")
    expect(r.status).toBe("in_transit")
  })
})

describe("createShipmentItem", () => {
  it("POSTs to shipment-items endpoint", async () => {
    let url = ""
    server.use(http.post(`${BASE}/api/v1/shipment-items/`, async ({ request }) => {
      url = request.url
      return HttpResponse.json({ id: 1, shipment: 1, product: 2, quantity: 5, unit_price_at_shipment: "99.99" }, { status: 201 })
    }))
    await createShipmentItem({ shipment: 1, product: 2, quantity: 5 })
    expect(url).toContain("/api/v1/shipment-items/")
  })
})

describe("deleteShipmentItem", () => {
  it("DELETEs shipment item by id", async () => {
    let method = ""
    server.use(http.delete(`${BASE}/api/v1/shipment-items/1/`, ({ request }) => { method = request.method; return new HttpResponse(null, { status: 204 }) }))
    await deleteShipmentItem(1)
    expect(method).toBe("DELETE")
  })
})

describe("lookup functions", () => {
  it("getShipmentCustomers fetches with page_size=1000", async () => {
    let url = ""
    const page: PaginatedResponse<Customer> = { count: 0, next: null, previous: null, results: [] }
    server.use(http.get(`${BASE}/api/v1/customers/`, ({ request }) => { url = request.url; return HttpResponse.json(page) }))
    await getShipmentCustomers()
    expect(url).toContain("page_size=1000")
  })

  it("getShipmentVehicles fetches with page_size=1000", async () => {
    let url = ""
    const page: PaginatedResponse<Vehicle> = { count: 0, next: null, previous: null, results: [] }
    server.use(http.get(`${BASE}/api/v1/vehicles/`, ({ request }) => { url = request.url; return HttpResponse.json(page) }))
    await getShipmentVehicles()
    expect(url).toContain("page_size=1000")
  })

  it("getShipmentRoutes fetches with page_size=1000", async () => {
    let url = ""
    const page: PaginatedResponse<Route> = { count: 0, next: null, previous: null, results: [] }
    server.use(http.get(`${BASE}/api/v1/routes/`, ({ request }) => { url = request.url; return HttpResponse.json(page) }))
    await getShipmentRoutes()
    expect(url).toContain("page_size=1000")
  })

  it("getShipmentProducts fetches with page_size=1000", async () => {
    let url = ""
    const page: PaginatedResponse<Product> = { count: 0, next: null, previous: null, results: [] }
    server.use(http.get(`${BASE}/api/v1/products/`, ({ request }) => { url = request.url; return HttpResponse.json(page) }))
    await getShipmentProducts()
    expect(url).toContain("page_size=1000")
  })
})
