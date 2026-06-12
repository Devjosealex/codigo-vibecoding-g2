import { describe, it, expect, beforeEach } from "vitest"
import { http, HttpResponse } from "msw"
import { server } from "@/test/msw/server"
import {
  getProducts,
  getProduct,
  createProduct,
  updateProduct,
  deleteProduct,
  getProductSuppliers,
  getProductWarehouses,
  type Product,
  type PaginatedResponse,
} from "@/lib/products.api"
import type { Supplier } from "@/lib/suppliers.api"
import type { Warehouse } from "@/lib/warehouses.api"

const BASE = "http://localhost:8000"

const mockProduct: Product = {
  id: 1,
  supplier: null,
  warehouse: null,
  name: "Producto A",
  description: null,
  sku: "SKU-001",
  weight_kg: null,
  length_cm: null,
  width_cm: null,
  height_cm: null,
  unit_price: "99.99",
  stock_quantity: 10,
  is_active: true,
  created_at: "2026-01-01T00:00:00Z",
  updated_at: "2026-01-01T00:00:00Z",
}

const mockPage: PaginatedResponse<Product> = { count: 1, next: null, previous: null, results: [mockProduct] }

beforeEach(() => {
  Object.defineProperty(window, "location", { value: { href: "http://localhost:3000/" }, writable: true })
  localStorage.clear()
})

describe("getProducts", () => {
  it("returns paginated response", async () => {
    server.use(http.get(`${BASE}/api/v1/products/`, () => HttpResponse.json(mockPage)))
    const r = await getProducts()
    expect(r.count).toBe(1)
    expect(r.results[0].sku).toBe("SKU-001")
  })

  it("passes search param", async () => {
    let url = ""
    server.use(http.get(`${BASE}/api/v1/products/`, ({ request }) => { url = request.url; return HttpResponse.json(mockPage) }))
    await getProducts({ search: "prod" })
    expect(url).toContain("search=prod")
  })

  it("passes supplier filter", async () => {
    let url = ""
    server.use(http.get(`${BASE}/api/v1/products/`, ({ request }) => { url = request.url; return HttpResponse.json(mockPage) }))
    await getProducts({ supplier: "1" })
    expect(url).toContain("supplier=1")
  })

  it("propagates 4xx errors", async () => {
    server.use(http.get(`${BASE}/api/v1/products/`, () => HttpResponse.json({ detail: "Forbidden" }, { status: 403 })))
    await expect(getProducts()).rejects.toThrow()
  })
})

describe("getProduct", () => {
  it("fetches single product by id", async () => {
    server.use(http.get(`${BASE}/api/v1/products/1/`, () => HttpResponse.json(mockProduct)))
    const r = await getProduct(1)
    expect(r.sku).toBe("SKU-001")
  })
})

describe("createProduct", () => {
  it("POSTs and returns created product", async () => {
    let method = ""
    server.use(http.post(`${BASE}/api/v1/products/`, async ({ request }) => { method = request.method; return HttpResponse.json(mockProduct, { status: 201 }) }))
    const r = await createProduct({ name: "Producto A", sku: "SKU-001", unit_price: "99.99", stock_quantity: 10 })
    expect(method).toBe("POST")
    expect(r.name).toBe("Producto A")
  })
})

describe("updateProduct", () => {
  it("PUTs to correct URL", async () => {
    let url = ""
    server.use(http.put(`${BASE}/api/v1/products/1/`, ({ request }) => { url = request.url; return HttpResponse.json(mockProduct) }))
    await updateProduct(1, { name: "Updated", sku: "SKU-001", unit_price: "99.99", stock_quantity: 10 })
    expect(url).toContain("/api/v1/products/1/")
  })
})

describe("deleteProduct", () => {
  it("DELETEs correct URL", async () => {
    let method = ""
    server.use(http.delete(`${BASE}/api/v1/products/1/`, ({ request }) => { method = request.method; return new HttpResponse(null, { status: 204 }) }))
    await deleteProduct(1)
    expect(method).toBe("DELETE")
  })
})

describe("getProductSuppliers", () => {
  it("fetches suppliers list with page_size=1000", async () => {
    let url = ""
    const suppPage: PaginatedResponse<Supplier> = { count: 0, next: null, previous: null, results: [] }
    server.use(http.get(`${BASE}/api/v1/suppliers/`, ({ request }) => { url = request.url; return HttpResponse.json(suppPage) }))
    await getProductSuppliers()
    expect(url).toContain("page_size=1000")
  })
})

describe("getProductWarehouses", () => {
  it("fetches warehouses list with page_size=1000", async () => {
    let url = ""
    const whPage: PaginatedResponse<Warehouse> = { count: 0, next: null, previous: null, results: [] }
    server.use(http.get(`${BASE}/api/v1/warehouses/`, ({ request }) => { url = request.url; return HttpResponse.json(whPage) }))
    await getProductWarehouses()
    expect(url).toContain("page_size=1000")
  })
})
