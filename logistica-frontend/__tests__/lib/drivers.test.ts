import { describe, it, expect, beforeEach } from "vitest"
import { http, HttpResponse } from "msw"
import { server } from "@/test/msw/server"
import {
  getDrivers,
  getDriver,
  createDriver,
  updateDriver,
  deleteDriver,
  type Driver,
  type PaginatedResponse,
} from "@/lib/drivers.api"

const BASE = "http://localhost:8000"

const mockDriver: Driver = {
  id: 1,
  first_name: "Juan",
  last_name: "Pérez",
  document_number: "12345678",
  license_number: "LIC-001",
  license_expiry: "2027-12-31",
  phone: "+51999888777",
  email: "juan@example.com",
  is_active: true,
  created_at: "2026-01-01T00:00:00Z",
  updated_at: "2026-01-01T00:00:00Z",
}

const mockPage: PaginatedResponse<Driver> = { count: 1, next: null, previous: null, results: [mockDriver] }

beforeEach(() => {
  Object.defineProperty(window, "location", { value: { href: "http://localhost:3000/" }, writable: true })
  localStorage.clear()
})

describe("getDrivers", () => {
  it("returns paginated response", async () => {
    server.use(http.get(`${BASE}/api/v1/drivers/`, () => HttpResponse.json(mockPage)))
    const r = await getDrivers()
    expect(r.count).toBe(1)
    expect(r.results[0].email).toBe("juan@example.com")
  })

  it("passes search param", async () => {
    let url = ""
    server.use(http.get(`${BASE}/api/v1/drivers/`, ({ request }) => { url = request.url; return HttpResponse.json(mockPage) }))
    await getDrivers({ search: "juan" })
    expect(url).toContain("search=juan")
  })

  it("passes ordering param", async () => {
    let url = ""
    server.use(http.get(`${BASE}/api/v1/drivers/`, ({ request }) => { url = request.url; return HttpResponse.json(mockPage) }))
    await getDrivers({ ordering: "last_name" })
    expect(url).toContain("ordering=last_name")
  })

  it("propagates 4xx errors", async () => {
    server.use(http.get(`${BASE}/api/v1/drivers/`, () => HttpResponse.json({ detail: "Forbidden" }, { status: 403 })))
    await expect(getDrivers()).rejects.toThrow()
  })
})

describe("getDriver", () => {
  it("fetches single driver by id", async () => {
    server.use(http.get(`${BASE}/api/v1/drivers/1/`, () => HttpResponse.json(mockDriver)))
    const r = await getDriver(1)
    expect(r.id).toBe(1)
    expect(r.last_name).toBe("Pérez")
  })

  it("propagates 404", async () => {
    server.use(http.get(`${BASE}/api/v1/drivers/999/`, () => HttpResponse.json({ detail: "Not found." }, { status: 404 })))
    await expect(getDriver(999)).rejects.toThrow()
  })
})

describe("createDriver", () => {
  it("POSTs and returns created driver", async () => {
    let method = ""
    server.use(http.post(`${BASE}/api/v1/drivers/`, async ({ request }) => { method = request.method; return HttpResponse.json(mockDriver, { status: 201 }) }))
    const r = await createDriver({ first_name: "Juan", last_name: "Pérez", email: "juan@example.com" })
    expect(method).toBe("POST")
    expect(r.first_name).toBe("Juan")
  })
})

describe("updateDriver", () => {
  it("PUTs to correct URL", async () => {
    let url = ""
    server.use(http.put(`${BASE}/api/v1/drivers/1/`, ({ request }) => { url = request.url; return HttpResponse.json(mockDriver) }))
    await updateDriver(1, { first_name: "Updated", last_name: "Pérez", email: "juan@example.com" })
    expect(url).toContain("/api/v1/drivers/1/")
  })
})

describe("deleteDriver", () => {
  it("DELETEs correct URL", async () => {
    let method = ""
    server.use(http.delete(`${BASE}/api/v1/drivers/1/`, ({ request }) => { method = request.method; return new HttpResponse(null, { status: 204 }) }))
    await deleteDriver(1)
    expect(method).toBe("DELETE")
  })
})
