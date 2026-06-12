import { describe, it, expect, beforeEach } from "vitest"
import { http, HttpResponse } from "msw"
import { server } from "@/test/msw/server"
import {
  getRoutes,
  getRoute,
  createRoute,
  updateRoute,
  deleteRoute,
  getRouteWarehouses,
  createRouteStop,
  deleteRouteStop,
  type Route,
  type PaginatedResponse,
} from "@/lib/routes.api"
import type { Warehouse } from "@/lib/warehouses.api"

const BASE = "http://localhost:8000"

const mockRoute: Route = {
  id: 1,
  name: "Ruta Lima-Callao",
  origin_warehouse: null,
  distance_km: "25.5",
  estimated_duration_h: "0.75",
  is_active: true,
  created_at: "2026-01-01T00:00:00Z",
  updated_at: "2026-01-01T00:00:00Z",
}

const mockPage: PaginatedResponse<Route> = { count: 1, next: null, previous: null, results: [mockRoute] }

beforeEach(() => {
  Object.defineProperty(window, "location", { value: { href: "http://localhost:3000/" }, writable: true })
  localStorage.clear()
})

describe("getRoutes", () => {
  it("returns paginated response", async () => {
    server.use(http.get(`${BASE}/api/v1/routes/`, () => HttpResponse.json(mockPage)))
    const r = await getRoutes()
    expect(r.count).toBe(1)
    expect(r.results[0].name).toBe("Ruta Lima-Callao")
  })

  it("passes search param", async () => {
    let url = ""
    server.use(http.get(`${BASE}/api/v1/routes/`, ({ request }) => { url = request.url; return HttpResponse.json(mockPage) }))
    await getRoutes({ search: "lima" })
    expect(url).toContain("search=lima")
  })

  it("propagates 4xx errors", async () => {
    server.use(http.get(`${BASE}/api/v1/routes/`, () => HttpResponse.json({ detail: "Forbidden" }, { status: 403 })))
    await expect(getRoutes()).rejects.toThrow()
  })
})

describe("getRoute", () => {
  it("fetches single route by id", async () => {
    server.use(http.get(`${BASE}/api/v1/routes/1/`, () => HttpResponse.json(mockRoute)))
    const r = await getRoute(1)
    expect(r.id).toBe(1)
    expect(r.name).toBe("Ruta Lima-Callao")
  })
})

describe("createRoute", () => {
  it("POSTs and returns created route", async () => {
    let method = ""
    server.use(http.post(`${BASE}/api/v1/routes/`, async ({ request }) => { method = request.method; return HttpResponse.json(mockRoute, { status: 201 }) }))
    const r = await createRoute({ name: "Ruta Lima-Callao" })
    expect(method).toBe("POST")
    expect(r.name).toBe("Ruta Lima-Callao")
  })
})

describe("updateRoute", () => {
  it("PUTs to correct URL", async () => {
    let url = ""
    server.use(http.put(`${BASE}/api/v1/routes/1/`, ({ request }) => { url = request.url; return HttpResponse.json(mockRoute) }))
    await updateRoute(1, { name: "Updated" })
    expect(url).toContain("/api/v1/routes/1/")
  })
})

describe("deleteRoute", () => {
  it("DELETEs correct URL", async () => {
    let method = ""
    server.use(http.delete(`${BASE}/api/v1/routes/1/`, ({ request }) => { method = request.method; return new HttpResponse(null, { status: 204 }) }))
    await deleteRoute(1)
    expect(method).toBe("DELETE")
  })
})

describe("getRouteWarehouses", () => {
  it("fetches warehouses with page_size=1000", async () => {
    let url = ""
    const whPage: PaginatedResponse<Warehouse> = { count: 0, next: null, previous: null, results: [] }
    server.use(http.get(`${BASE}/api/v1/warehouses/`, ({ request }) => { url = request.url; return HttpResponse.json(whPage) }))
    await getRouteWarehouses()
    expect(url).toContain("page_size=1000")
  })
})

describe("createRouteStop", () => {
  it("POSTs to route-stops endpoint", async () => {
    let url = ""
    server.use(http.post(`${BASE}/api/v1/route-stops/`, async ({ request }) => {
      url = request.url
      return HttpResponse.json({ id: 1, route: 1, stop_order: 1, address: "Av. Lima 1", city: "Lima", latitude: null, longitude: null }, { status: 201 })
    }))
    await createRouteStop({ route: 1, stop_order: 1, address: "Av. Lima 1", city: "Lima" })
    expect(url).toContain("/api/v1/route-stops/")
  })
})

describe("deleteRouteStop", () => {
  it("DELETEs route stop by id", async () => {
    let method = ""
    server.use(http.delete(`${BASE}/api/v1/route-stops/1/`, ({ request }) => { method = request.method; return new HttpResponse(null, { status: 204 }) }))
    await deleteRouteStop(1)
    expect(method).toBe("DELETE")
  })
})
