import { describe, it, expect, beforeEach } from "vitest"
import { http, HttpResponse } from "msw"
import { server } from "@/test/msw/server"
import {
  getSuppliers,
  getSupplier,
  createSupplier,
  updateSupplier,
  deleteSupplier,
  type Supplier,
  type PaginatedResponse,
} from "@/lib/suppliers.api"

const BASE = "http://localhost:8000"

const mockSupplier: Supplier = {
  id: 1,
  name: "Proveedor SA",
  contact_name: "Juan",
  tax_id: "12345678",
  email: "contact@proveedor.com",
  phone: "+51999",
  address: "Av. Lima 1",
  city: "Lima",
  country: "Peru",
  is_active: true,
  created_at: "2026-01-01T00:00:00Z",
  updated_at: "2026-01-01T00:00:00Z",
}

const mockPage: PaginatedResponse<Supplier> = {
  count: 1,
  next: null,
  previous: null,
  results: [mockSupplier],
}

beforeEach(() => {
  Object.defineProperty(window, "location", {
    value: { href: "http://localhost:3000/" },
    writable: true,
  })
  localStorage.clear()
})

describe("getSuppliers", () => {
  it("returns paginated response", async () => {
    server.use(http.get(`${BASE}/api/v1/suppliers/`, () => HttpResponse.json(mockPage)))
    const r = await getSuppliers()
    expect(r.count).toBe(1)
    expect(r.results[0].name).toBe("Proveedor SA")
  })

  it("passes search param", async () => {
    let url = ""
    server.use(http.get(`${BASE}/api/v1/suppliers/`, ({ request }) => { url = request.url; return HttpResponse.json(mockPage) }))
    await getSuppliers({ search: "prov" })
    expect(url).toContain("search=prov")
  })

  it("passes page param", async () => {
    let url = ""
    server.use(http.get(`${BASE}/api/v1/suppliers/`, ({ request }) => { url = request.url; return HttpResponse.json(mockPage) }))
    await getSuppliers({ page: 2 })
    expect(url).toContain("page=2")
  })

  it("propagates 4xx errors", async () => {
    server.use(http.get(`${BASE}/api/v1/suppliers/`, () => HttpResponse.json({ detail: "Forbidden" }, { status: 403 })))
    await expect(getSuppliers()).rejects.toThrow()
  })
})

describe("getSupplier", () => {
  it("fetches single supplier by id", async () => {
    server.use(http.get(`${BASE}/api/v1/suppliers/1/`, () => HttpResponse.json(mockSupplier)))
    const r = await getSupplier(1)
    expect(r.id).toBe(1)
  })

  it("propagates 404", async () => {
    server.use(http.get(`${BASE}/api/v1/suppliers/999/`, () => HttpResponse.json({ detail: "Not found." }, { status: 404 })))
    await expect(getSupplier(999)).rejects.toThrow()
  })
})

describe("createSupplier", () => {
  it("POSTs and returns created supplier", async () => {
    let method = ""
    server.use(http.post(`${BASE}/api/v1/suppliers/`, async ({ request }) => {
      method = request.method
      return HttpResponse.json(mockSupplier, { status: 201 })
    }))
    const r = await createSupplier({ name: "Proveedor SA", email: "contact@proveedor.com" })
    expect(method).toBe("POST")
    expect(r.name).toBe("Proveedor SA")
  })
})

describe("updateSupplier", () => {
  it("PUTs to correct URL", async () => {
    let url = ""
    server.use(http.put(`${BASE}/api/v1/suppliers/1/`, ({ request }) => { url = request.url; return HttpResponse.json(mockSupplier) }))
    await updateSupplier(1, { name: "Updated", email: "contact@proveedor.com" })
    expect(url).toContain("/api/v1/suppliers/1/")
  })
})

describe("deleteSupplier", () => {
  it("DELETEs correct URL", async () => {
    let method = ""
    server.use(http.delete(`${BASE}/api/v1/suppliers/1/`, ({ request }) => { method = request.method; return new HttpResponse(null, { status: 204 }) }))
    await deleteSupplier(1)
    expect(method).toBe("DELETE")
  })
})
