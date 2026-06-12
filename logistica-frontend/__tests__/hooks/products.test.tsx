import { describe, it, expect, vi, beforeEach } from "vitest"
import { http, HttpResponse } from "msw"
import { renderHook, waitFor } from "@testing-library/react"
import React from "react"
import { QueryClient, QueryClientProvider } from "@tanstack/react-query"
import { server } from "@/test/msw/server"
import {
  useProducts,
  useProduct,
  useCreateProduct,
  useUpdateProduct,
  useDeleteProduct,
  useProductSuppliers,
  useProductWarehouses,
} from "@/hooks/use-products"
import type { Product, PaginatedResponse } from "@/lib/products.api"
import type { Supplier } from "@/lib/suppliers.api"
import type { Warehouse } from "@/lib/warehouses.api"

vi.mock("sonner", () => ({ toast: { success: vi.fn(), error: vi.fn() } }))

const BASE = "http://localhost:8000"

const mockProduct: Product = {
  id: 1, supplier: null, warehouse: null, name: "Producto A", description: null,
  sku: "SKU-001", weight_kg: null, length_cm: null, width_cm: null, height_cm: null,
  unit_price: "99.99", stock_quantity: 10, is_active: true,
  created_at: "2026-01-01T00:00:00Z", updated_at: "2026-01-01T00:00:00Z",
}
const mockPage: PaginatedResponse<Product> = { count: 1, next: null, previous: null, results: [mockProduct] }

function makeWrapper(qc: QueryClient) {
  return ({ children }: { children: React.ReactNode }) =>
    React.createElement(QueryClientProvider, { client: qc }, children)
}

function freshClient() {
  return new QueryClient({ defaultOptions: { queries: { retry: false, gcTime: 0 }, mutations: { retry: false } } })
}

beforeEach(() => {
  Object.defineProperty(window, "location", { value: { href: "http://localhost:3000/" }, writable: true })
  localStorage.clear()
  vi.clearAllMocks()
})

describe("useProducts", () => {
  it("resolves with paginated data", async () => {
    server.use(http.get(`${BASE}/api/v1/products/`, () => HttpResponse.json(mockPage)))
    const qc = freshClient()
    const { result } = renderHook(() => useProducts({}), { wrapper: makeWrapper(qc) })
    await waitFor(() => expect(result.current.isSuccess).toBe(true))
    expect(result.current.data?.results[0].sku).toBe("SKU-001")
  })

  it("queryKey includes params", async () => {
    server.use(http.get(`${BASE}/api/v1/products/`, () => HttpResponse.json(mockPage)))
    const qc = freshClient()
    const params = { search: "prod" }
    const { result } = renderHook(() => useProducts(params), { wrapper: makeWrapper(qc) })
    await waitFor(() => expect(result.current.isSuccess).toBe(true))
    expect(qc.getQueryData(["products", params])).toBeDefined()
  })
})

describe("useProduct", () => {
  it("fetches individual product", async () => {
    server.use(http.get(`${BASE}/api/v1/products/1/`, () => HttpResponse.json(mockProduct)))
    const qc = freshClient()
    const { result } = renderHook(() => useProduct(1), { wrapper: makeWrapper(qc) })
    await waitFor(() => expect(result.current.isSuccess).toBe(true))
    expect(result.current.data?.id).toBe(1)
  })

  it("does not fetch when id is 0", () => {
    const qc = freshClient()
    const { result } = renderHook(() => useProduct(0), { wrapper: makeWrapper(qc) })
    expect(result.current.isPending).toBe(true)
  })
})

describe("useCreateProduct", () => {
  it("invalidates ['products'] on success", async () => {
    server.use(http.post(`${BASE}/api/v1/products/`, () => HttpResponse.json(mockProduct, { status: 201 })))
    const qc = freshClient()
    const spy = vi.spyOn(qc, "invalidateQueries")
    const { result } = renderHook(() => useCreateProduct(), { wrapper: makeWrapper(qc) })
    result.current.mutate({ name: "Producto A", sku: "SKU-001", unit_price: "99.99", stock_quantity: 10 })
    await waitFor(() => expect(result.current.isSuccess).toBe(true))
    expect(spy).toHaveBeenCalledWith(expect.objectContaining({ queryKey: ["products"] }))
  })

  it("calls toast.success on success", async () => {
    const { toast } = await import("sonner")
    server.use(http.post(`${BASE}/api/v1/products/`, () => HttpResponse.json(mockProduct, { status: 201 })))
    const qc = freshClient()
    const { result } = renderHook(() => useCreateProduct(), { wrapper: makeWrapper(qc) })
    result.current.mutate({ name: "Producto A", sku: "SKU-001", unit_price: "99.99", stock_quantity: 10 })
    await waitFor(() => expect(result.current.isSuccess).toBe(true))
    expect(toast.success).toHaveBeenCalledWith("Producto creado correctamente")
  })

  it("calls toast.error on failure", async () => {
    const { toast } = await import("sonner")
    server.use(http.post(`${BASE}/api/v1/products/`, () => HttpResponse.json({}, { status: 400 })))
    const qc = freshClient()
    const { result } = renderHook(() => useCreateProduct(), { wrapper: makeWrapper(qc) })
    result.current.mutate({ name: "Producto A", sku: "SKU-001", unit_price: "99.99", stock_quantity: 10 })
    await waitFor(() => expect(result.current.isError).toBe(true))
    expect(toast.error).toHaveBeenCalled()
  })
})

describe("useUpdateProduct", () => {
  it("invalidates ['products'] on success", async () => {
    server.use(http.put(`${BASE}/api/v1/products/1/`, () => HttpResponse.json(mockProduct)))
    const qc = freshClient()
    const spy = vi.spyOn(qc, "invalidateQueries")
    const { result } = renderHook(() => useUpdateProduct(1), { wrapper: makeWrapper(qc) })
    result.current.mutate({ name: "Updated", sku: "SKU-001", unit_price: "99.99", stock_quantity: 10 })
    await waitFor(() => expect(result.current.isSuccess).toBe(true))
    expect(spy).toHaveBeenCalledWith(expect.objectContaining({ queryKey: ["products"] }))
  })
})

describe("useDeleteProduct", () => {
  it("invalidates ['products'] on success", async () => {
    server.use(http.delete(`${BASE}/api/v1/products/1/`, () => new HttpResponse(null, { status: 204 })))
    const qc = freshClient()
    const spy = vi.spyOn(qc, "invalidateQueries")
    const { result } = renderHook(() => useDeleteProduct(), { wrapper: makeWrapper(qc) })
    result.current.mutate(1)
    await waitFor(() => expect(result.current.isSuccess).toBe(true))
    expect(spy).toHaveBeenCalledWith(expect.objectContaining({ queryKey: ["products"] }))
  })

  it("calls toast.success on success", async () => {
    const { toast } = await import("sonner")
    server.use(http.delete(`${BASE}/api/v1/products/1/`, () => new HttpResponse(null, { status: 204 })))
    const qc = freshClient()
    const { result } = renderHook(() => useDeleteProduct(), { wrapper: makeWrapper(qc) })
    result.current.mutate(1)
    await waitFor(() => expect(result.current.isSuccess).toBe(true))
    expect(toast.success).toHaveBeenCalledWith("Producto eliminado correctamente")
  })
})

describe("useProductSuppliers", () => {
  it("resolves with suppliers list", async () => {
    const page: PaginatedResponse<Supplier> = { count: 0, next: null, previous: null, results: [] }
    server.use(http.get(`${BASE}/api/v1/suppliers/`, () => HttpResponse.json(page)))
    const qc = freshClient()
    const { result } = renderHook(() => useProductSuppliers(), { wrapper: makeWrapper(qc) })
    await waitFor(() => expect(result.current.isSuccess).toBe(true))
    expect(Array.isArray(result.current.data)).toBe(true)
  })
})

describe("useProductWarehouses", () => {
  it("resolves with warehouses list", async () => {
    const page: PaginatedResponse<Warehouse> = { count: 0, next: null, previous: null, results: [] }
    server.use(http.get(`${BASE}/api/v1/warehouses/`, () => HttpResponse.json(page)))
    const qc = freshClient()
    const { result } = renderHook(() => useProductWarehouses(), { wrapper: makeWrapper(qc) })
    await waitFor(() => expect(result.current.isSuccess).toBe(true))
    expect(Array.isArray(result.current.data)).toBe(true)
  })
})
