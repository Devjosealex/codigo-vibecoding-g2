import { describe, it, expect, beforeEach } from "vitest"
import { http, HttpResponse } from "msw"
import { server } from "@/test/msw/server"
import {
  getWarehouses,
  getWarehouse,
  createWarehouse,
  updateWarehouse,
  deleteWarehouse,
  type Warehouse,
  type PaginatedResponse,
} from "@/lib/warehouses.api"

const BASE = "http://localhost:8000"

const mockWarehouse: Warehouse = {
  id: 1,
  name: "Almacén Central",
  address: "Av. Industrial 5",
  city: "Lima",
  country: "Peru",
  latitude: -12.0464,
  longitude: -77.0428,
  capacity_m3: "500.00",
  is_active: true,
  created_at: "2026-01-01T00:00:00Z",
  updated_at: "2026-01-01T00:00:00Z",
}

const mockPage: PaginatedResponse<Warehouse> = { count: 1, next: null, previous: null, results: [mockWarehouse] }

beforeEach(() => {
  Object.defineProperty(window, "location", { value: { href: "http://localhost:3000/" }, writable: true })
  localStorage.clear()
})

describe("getWarehouses", () => {
  it("returns paginated response", async () => {
    server.use(http.get(`${BASE}/api/v1/warehouses/`, () => HttpResponse.json(mockPage)))
    const r = await getWarehouses()
    expect(r.count).toBe(1)
    expect(r.results[0].name).toBe("Almacén Central")
  })

  it("passes search param", async () => {
    let url = ""
    server.use(http.get(`${BASE}/api/v1/warehouses/`, ({ request }) => { url = request.url; return HttpResponse.json(mockPage) }))
    await getWarehouses({ search: "central" })
    expect(url).toContain("search=central")
  })

  it("passes city param", async () => {
    let url = ""
    server.use(http.get(`${BASE}/api/v1/warehouses/`, ({ request }) => { url = request.url; return HttpResponse.json(mockPage) }))
    await getWarehouses({ city: "Lima" })
    expect(url).toContain("city=Lima")
  })

  it("propagates 4xx errors", async () => {
    server.use(http.get(`${BASE}/api/v1/warehouses/`, () => HttpResponse.json({ detail: "Forbidden" }, { status: 403 })))
    await expect(getWarehouses()).rejects.toThrow()
  })
})

describe("getWarehouse", () => {
  it("fetches single warehouse by id", async () => {
    server.use(http.get(`${BASE}/api/v1/warehouses/1/`, () => HttpResponse.json(mockWarehouse)))
    const r = await getWarehouse(1)
    expect(r.id).toBe(1)
  })

  it("propagates 404", async () => {
    server.use(http.get(`${BASE}/api/v1/warehouses/999/`, () => HttpResponse.json({ detail: "Not found." }, { status: 404 })))
    await expect(getWarehouse(999)).rejects.toThrow()
  })
})

describe("createWarehouse", () => {
  it("POSTs and returns created warehouse", async () => {
    let method = ""
    server.use(http.post(`${BASE}/api/v1/warehouses/`, async ({ request }) => { method = request.method; return HttpResponse.json(mockWarehouse, { status: 201 }) }))
    const r = await createWarehouse({ name: "Almacén Central" })
    expect(method).toBe("POST")
    expect(r.name).toBe("Almacén Central")
  })
})

describe("updateWarehouse", () => {
  it("PUTs to correct URL", async () => {
    let url = ""
    server.use(http.put(`${BASE}/api/v1/warehouses/1/`, ({ request }) => { url = request.url; return HttpResponse.json(mockWarehouse) }))
    await updateWarehouse(1, { name: "Updated" })
    expect(url).toContain("/api/v1/warehouses/1/")
  })
})

describe("deleteWarehouse", () => {
  it("DELETEs correct URL", async () => {
    let method = ""
    server.use(http.delete(`${BASE}/api/v1/warehouses/1/`, ({ request }) => { method = request.method; return new HttpResponse(null, { status: 204 }) }))
    await deleteWarehouse(1)
    expect(method).toBe("DELETE")
  })
})
