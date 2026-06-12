import { describe, it, expect, vi, beforeEach } from "vitest"
import { http, HttpResponse } from "msw"
import { renderHook, waitFor } from "@testing-library/react"
import React from "react"
import { QueryClient, QueryClientProvider } from "@tanstack/react-query"
import { server } from "@/test/msw/server"
import {
  useWarehouses,
  useWarehouse,
  useCreateWarehouse,
  useUpdateWarehouse,
  useDeleteWarehouse,
} from "@/hooks/use-warehouses"
import type { Warehouse, PaginatedResponse } from "@/lib/warehouses.api"

vi.mock("sonner", () => ({ toast: { success: vi.fn(), error: vi.fn() } }))

const BASE = "http://localhost:8000"

const mockWarehouse: Warehouse = {
  id: 1, name: "Almacén Central", address: null, city: "Lima", country: "Peru",
  latitude: null, longitude: null, capacity_m3: null, is_active: true,
  created_at: "2026-01-01T00:00:00Z", updated_at: "2026-01-01T00:00:00Z",
}
const mockPage: PaginatedResponse<Warehouse> = { count: 1, next: null, previous: null, results: [mockWarehouse] }

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

describe("useWarehouses", () => {
  it("resolves with paginated data", async () => {
    server.use(http.get(`${BASE}/api/v1/warehouses/`, () => HttpResponse.json(mockPage)))
    const qc = freshClient()
    const { result } = renderHook(() => useWarehouses({}), { wrapper: makeWrapper(qc) })
    await waitFor(() => expect(result.current.isSuccess).toBe(true))
    expect(result.current.data?.results[0].name).toBe("Almacén Central")
  })

  it("queryKey includes params", async () => {
    server.use(http.get(`${BASE}/api/v1/warehouses/`, () => HttpResponse.json(mockPage)))
    const qc = freshClient()
    const params = { search: "central" }
    const { result } = renderHook(() => useWarehouses(params), { wrapper: makeWrapper(qc) })
    await waitFor(() => expect(result.current.isSuccess).toBe(true))
    expect(qc.getQueryData(["warehouses", params])).toBeDefined()
  })
})

describe("useWarehouse", () => {
  it("fetches individual warehouse", async () => {
    server.use(http.get(`${BASE}/api/v1/warehouses/1/`, () => HttpResponse.json(mockWarehouse)))
    const qc = freshClient()
    const { result } = renderHook(() => useWarehouse(1), { wrapper: makeWrapper(qc) })
    await waitFor(() => expect(result.current.isSuccess).toBe(true))
    expect(result.current.data?.id).toBe(1)
  })

  it("does not fetch when id is 0", () => {
    const qc = freshClient()
    const { result } = renderHook(() => useWarehouse(0), { wrapper: makeWrapper(qc) })
    expect(result.current.isPending).toBe(true)
  })
})

describe("useCreateWarehouse", () => {
  it("invalidates ['warehouses'] on success", async () => {
    server.use(http.post(`${BASE}/api/v1/warehouses/`, () => HttpResponse.json(mockWarehouse, { status: 201 })))
    const qc = freshClient()
    const spy = vi.spyOn(qc, "invalidateQueries")
    const { result } = renderHook(() => useCreateWarehouse(), { wrapper: makeWrapper(qc) })
    result.current.mutate({ name: "Almacén Central" })
    await waitFor(() => expect(result.current.isSuccess).toBe(true))
    expect(spy).toHaveBeenCalledWith(expect.objectContaining({ queryKey: ["warehouses"] }))
  })

  it("calls toast.success on success", async () => {
    const { toast } = await import("sonner")
    server.use(http.post(`${BASE}/api/v1/warehouses/`, () => HttpResponse.json(mockWarehouse, { status: 201 })))
    const qc = freshClient()
    const { result } = renderHook(() => useCreateWarehouse(), { wrapper: makeWrapper(qc) })
    result.current.mutate({ name: "Almacén Central" })
    await waitFor(() => expect(result.current.isSuccess).toBe(true))
    expect(toast.success).toHaveBeenCalledWith("Almacén creado correctamente")
  })

  it("calls toast.error on failure", async () => {
    const { toast } = await import("sonner")
    server.use(http.post(`${BASE}/api/v1/warehouses/`, () => HttpResponse.json({}, { status: 400 })))
    const qc = freshClient()
    const { result } = renderHook(() => useCreateWarehouse(), { wrapper: makeWrapper(qc) })
    result.current.mutate({ name: "Almacén Central" })
    await waitFor(() => expect(result.current.isError).toBe(true))
    expect(toast.error).toHaveBeenCalled()
  })
})

describe("useUpdateWarehouse", () => {
  it("invalidates ['warehouses'] on success", async () => {
    server.use(http.put(`${BASE}/api/v1/warehouses/1/`, () => HttpResponse.json(mockWarehouse)))
    const qc = freshClient()
    const spy = vi.spyOn(qc, "invalidateQueries")
    const { result } = renderHook(() => useUpdateWarehouse(1), { wrapper: makeWrapper(qc) })
    result.current.mutate({ name: "Updated" })
    await waitFor(() => expect(result.current.isSuccess).toBe(true))
    expect(spy).toHaveBeenCalledWith(expect.objectContaining({ queryKey: ["warehouses"] }))
  })
})

describe("useDeleteWarehouse", () => {
  it("invalidates ['warehouses'] on success", async () => {
    server.use(http.delete(`${BASE}/api/v1/warehouses/1/`, () => new HttpResponse(null, { status: 204 })))
    const qc = freshClient()
    const spy = vi.spyOn(qc, "invalidateQueries")
    const { result } = renderHook(() => useDeleteWarehouse(), { wrapper: makeWrapper(qc) })
    result.current.mutate(1)
    await waitFor(() => expect(result.current.isSuccess).toBe(true))
    expect(spy).toHaveBeenCalledWith(expect.objectContaining({ queryKey: ["warehouses"] }))
  })

  it("calls toast.success on success", async () => {
    const { toast } = await import("sonner")
    server.use(http.delete(`${BASE}/api/v1/warehouses/1/`, () => new HttpResponse(null, { status: 204 })))
    const qc = freshClient()
    const { result } = renderHook(() => useDeleteWarehouse(), { wrapper: makeWrapper(qc) })
    result.current.mutate(1)
    await waitFor(() => expect(result.current.isSuccess).toBe(true))
    expect(toast.success).toHaveBeenCalledWith("Almacén eliminado correctamente")
  })
})
