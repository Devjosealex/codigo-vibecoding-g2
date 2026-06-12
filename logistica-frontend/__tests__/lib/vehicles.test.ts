import { describe, it, expect, beforeEach } from "vitest"
import { http, HttpResponse } from "msw"
import { server } from "@/test/msw/server"
import {
  getVehicles,
  getVehicle,
  createVehicle,
  updateVehicle,
  deleteVehicle,
  getVehicleDrivers,
  type Vehicle,
  type PaginatedResponse,
} from "@/lib/vehicles.api"
import type { Driver } from "@/lib/drivers.api"

const BASE = "http://localhost:8000"

const mockVehicle: Vehicle = {
  id: 1,
  driver: null,
  name: "Camión 01",
  plate_number: "ABC-123",
  vehicle_type: "truck",
  capacity_kg: "5000.00",
  capacity_m3: "20.00",
  is_active: true,
  created_at: "2026-01-01T00:00:00Z",
  updated_at: "2026-01-01T00:00:00Z",
}

const mockPage: PaginatedResponse<Vehicle> = { count: 1, next: null, previous: null, results: [mockVehicle] }

beforeEach(() => {
  Object.defineProperty(window, "location", { value: { href: "http://localhost:3000/" }, writable: true })
  localStorage.clear()
})

describe("getVehicles", () => {
  it("returns paginated response", async () => {
    server.use(http.get(`${BASE}/api/v1/vehicles/`, () => HttpResponse.json(mockPage)))
    const r = await getVehicles()
    expect(r.count).toBe(1)
    expect(r.results[0].plate_number).toBe("ABC-123")
  })

  it("passes vehicle_type filter", async () => {
    let url = ""
    server.use(http.get(`${BASE}/api/v1/vehicles/`, ({ request }) => { url = request.url; return HttpResponse.json(mockPage) }))
    await getVehicles({ vehicle_type: "truck" })
    expect(url).toContain("vehicle_type=truck")
  })

  it("passes page param", async () => {
    let url = ""
    server.use(http.get(`${BASE}/api/v1/vehicles/`, ({ request }) => { url = request.url; return HttpResponse.json(mockPage) }))
    await getVehicles({ page: 3 })
    expect(url).toContain("page=3")
  })

  it("propagates 4xx errors", async () => {
    server.use(http.get(`${BASE}/api/v1/vehicles/`, () => HttpResponse.json({ detail: "Forbidden" }, { status: 403 })))
    await expect(getVehicles()).rejects.toThrow()
  })
})

describe("getVehicle", () => {
  it("fetches single vehicle by id", async () => {
    server.use(http.get(`${BASE}/api/v1/vehicles/1/`, () => HttpResponse.json(mockVehicle)))
    const r = await getVehicle(1)
    expect(r.id).toBe(1)
    expect(r.vehicle_type).toBe("truck")
  })
})

describe("createVehicle", () => {
  it("POSTs and returns created vehicle", async () => {
    let method = ""
    server.use(http.post(`${BASE}/api/v1/vehicles/`, async ({ request }) => { method = request.method; return HttpResponse.json(mockVehicle, { status: 201 }) }))
    const r = await createVehicle({ name: "Camión 01", plate_number: "ABC-123", vehicle_type: "truck" })
    expect(method).toBe("POST")
    expect(r.plate_number).toBe("ABC-123")
  })
})

describe("updateVehicle", () => {
  it("PUTs to correct URL", async () => {
    let url = ""
    server.use(http.put(`${BASE}/api/v1/vehicles/1/`, ({ request }) => { url = request.url; return HttpResponse.json(mockVehicle) }))
    await updateVehicle(1, { name: "Updated", plate_number: "XYZ-999", vehicle_type: "van" })
    expect(url).toContain("/api/v1/vehicles/1/")
  })
})

describe("deleteVehicle", () => {
  it("DELETEs correct URL", async () => {
    let method = ""
    server.use(http.delete(`${BASE}/api/v1/vehicles/1/`, ({ request }) => { method = request.method; return new HttpResponse(null, { status: 204 }) }))
    await deleteVehicle(1)
    expect(method).toBe("DELETE")
  })
})

describe("getVehicleDrivers", () => {
  it("fetches drivers list with page_size=1000", async () => {
    let url = ""
    const driverPage: PaginatedResponse<Driver> = { count: 0, next: null, previous: null, results: [] }
    server.use(http.get(`${BASE}/api/v1/drivers/`, ({ request }) => { url = request.url; return HttpResponse.json(driverPage) }))
    await getVehicleDrivers()
    expect(url).toContain("page_size=1000")
  })
})
