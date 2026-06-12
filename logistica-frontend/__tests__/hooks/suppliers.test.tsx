import { describe, it, expect, vi, beforeEach } from "vitest"
import { http, HttpResponse } from "msw"
import { renderHook, waitFor } from "@testing-library/react"
import React from "react"
import { QueryClient, QueryClientProvider } from "@tanstack/react-query"
import { server } from "@/test/msw/server"
import {
  useSuppliers,
  useSupplier,
  useCreateSupplier,
  useUpdateSupplier,
  useDeleteSupplier,
} from "@/hooks/use-suppliers"
import type { Supplier, PaginatedResponse } from "@/lib/suppliers.api"

vi.mock("sonner", () => ({ toast: { success: vi.fn(), error: vi.fn() } }))

const BASE = "http://localhost:8000"

const mockSupplier: Supplier = {
  id: 1, name: "Proveedor SA", contact_name: null, tax_id: null,
  email: "contact@proveedor.com", phone: null, address: null, city: "Lima",
  country: "Peru", is_active: true,
  created_at: "2026-01-01T00:00:00Z", updated_at: "2026-01-01T00:00:00Z",
}
const mockPage: PaginatedResponse<Supplier> = { count: 1, next: null, previous: null, results: [mockSupplier] }

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

describe("useSuppliers", () => {
  it("resolves with paginated data", async () => {
    server.use(http.get(`${BASE}/api/v1/suppliers/`, () => HttpResponse.json(mockPage)))
    const qc = freshClient()
    const { result } = renderHook(() => useSuppliers({}), { wrapper: makeWrapper(qc) })
    expect(result.current.isPending).toBe(true)
    await waitFor(() => expect(result.current.isSuccess).toBe(true))
    expect(result.current.data?.results[0].name).toBe("Proveedor SA")
  })

  it("queryKey includes params", async () => {
    server.use(http.get(`${BASE}/api/v1/suppliers/`, () => HttpResponse.json(mockPage)))
    const qc = freshClient()
    const params = { search: "prov" }
    const { result } = renderHook(() => useSuppliers(params), { wrapper: makeWrapper(qc) })
    await waitFor(() => expect(result.current.isSuccess).toBe(true))
    expect(qc.getQueryData(["suppliers", params])).toBeDefined()
  })
})

describe("useSupplier", () => {
  it("fetches individual supplier", async () => {
    server.use(http.get(`${BASE}/api/v1/suppliers/1/`, () => HttpResponse.json(mockSupplier)))
    const qc = freshClient()
    const { result } = renderHook(() => useSupplier(1), { wrapper: makeWrapper(qc) })
    await waitFor(() => expect(result.current.isSuccess).toBe(true))
    expect(result.current.data?.id).toBe(1)
  })

  it("does not fetch when id is 0", () => {
    const qc = freshClient()
    const { result } = renderHook(() => useSupplier(0), { wrapper: makeWrapper(qc) })
    expect(result.current.isPending).toBe(true)
  })
})

describe("useCreateSupplier", () => {
  it("invalidates ['suppliers'] on success", async () => {
    server.use(http.post(`${BASE}/api/v1/suppliers/`, () => HttpResponse.json(mockSupplier, { status: 201 })))
    const qc = freshClient()
    const spy = vi.spyOn(qc, "invalidateQueries")
    const { result } = renderHook(() => useCreateSupplier(), { wrapper: makeWrapper(qc) })
    result.current.mutate({ name: "Proveedor SA", email: "contact@proveedor.com" })
    await waitFor(() => expect(result.current.isSuccess).toBe(true))
    expect(spy).toHaveBeenCalledWith(expect.objectContaining({ queryKey: ["suppliers"] }))
  })

  it("calls toast.success on success", async () => {
    const { toast } = await import("sonner")
    server.use(http.post(`${BASE}/api/v1/suppliers/`, () => HttpResponse.json(mockSupplier, { status: 201 })))
    const qc = freshClient()
    const { result } = renderHook(() => useCreateSupplier(), { wrapper: makeWrapper(qc) })
    result.current.mutate({ name: "Proveedor SA", email: "contact@proveedor.com" })
    await waitFor(() => expect(result.current.isSuccess).toBe(true))
    expect(toast.success).toHaveBeenCalledWith("Proveedor creado correctamente")
  })

  it("calls toast.error on failure", async () => {
    const { toast } = await import("sonner")
    server.use(http.post(`${BASE}/api/v1/suppliers/`, () => HttpResponse.json({}, { status: 400 })))
    const qc = freshClient()
    const { result } = renderHook(() => useCreateSupplier(), { wrapper: makeWrapper(qc) })
    result.current.mutate({ name: "Proveedor SA", email: "contact@proveedor.com" })
    await waitFor(() => expect(result.current.isError).toBe(true))
    expect(toast.error).toHaveBeenCalled()
  })
})

describe("useUpdateSupplier", () => {
  it("invalidates ['suppliers'] on success", async () => {
    server.use(http.put(`${BASE}/api/v1/suppliers/1/`, () => HttpResponse.json(mockSupplier)))
    const qc = freshClient()
    const spy = vi.spyOn(qc, "invalidateQueries")
    const { result } = renderHook(() => useUpdateSupplier(1), { wrapper: makeWrapper(qc) })
    result.current.mutate({ name: "Updated", email: "contact@proveedor.com" })
    await waitFor(() => expect(result.current.isSuccess).toBe(true))
    expect(spy).toHaveBeenCalledWith(expect.objectContaining({ queryKey: ["suppliers"] }))
  })
})

describe("useDeleteSupplier", () => {
  it("invalidates ['suppliers'] on success", async () => {
    server.use(http.delete(`${BASE}/api/v1/suppliers/1/`, () => new HttpResponse(null, { status: 204 })))
    const qc = freshClient()
    const spy = vi.spyOn(qc, "invalidateQueries")
    const { result } = renderHook(() => useDeleteSupplier(), { wrapper: makeWrapper(qc) })
    result.current.mutate(1)
    await waitFor(() => expect(result.current.isSuccess).toBe(true))
    expect(spy).toHaveBeenCalledWith(expect.objectContaining({ queryKey: ["suppliers"] }))
  })

  it("calls toast.success on success", async () => {
    const { toast } = await import("sonner")
    server.use(http.delete(`${BASE}/api/v1/suppliers/1/`, () => new HttpResponse(null, { status: 204 })))
    const qc = freshClient()
    const { result } = renderHook(() => useDeleteSupplier(), { wrapper: makeWrapper(qc) })
    result.current.mutate(1)
    await waitFor(() => expect(result.current.isSuccess).toBe(true))
    expect(toast.success).toHaveBeenCalledWith("Proveedor eliminado correctamente")
  })
})
