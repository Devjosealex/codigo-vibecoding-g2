import { describe, it, expect, vi, beforeEach } from "vitest"
import { http, HttpResponse } from "msw"
import { renderHook, waitFor } from "@testing-library/react"
import React from "react"
import { QueryClient, QueryClientProvider } from "@tanstack/react-query"
import { server } from "@/test/msw/server"
import {
  useRoutes,
  useRoute,
  useCreateRoute,
  useUpdateRoute,
  useDeleteRoute,
  useRouteWarehouses,
  useCreateRouteStop,
  useDeleteRouteStop,
} from "@/hooks/use-routes"
import type { Route, PaginatedResponse } from "@/lib/routes.api"
import type { Warehouse } from "@/lib/warehouses.api"

vi.mock("sonner", () => ({ toast: { success: vi.fn(), error: vi.fn() } }))

const BASE = "http://localhost:8000"

const mockRoute: Route = {
  id: 1, name: "Ruta Lima-Callao", origin_warehouse: null,
  distance_km: "25.5", estimated_duration_h: "0.75", is_active: true,
  created_at: "2026-01-01T00:00:00Z", updated_at: "2026-01-01T00:00:00Z",
}
const mockPage: PaginatedResponse<Route> = { count: 1, next: null, previous: null, results: [mockRoute] }

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

describe("useRoutes", () => {
  it("resolves with paginated data", async () => {
    server.use(http.get(`${BASE}/api/v1/routes/`, () => HttpResponse.json(mockPage)))
    const qc = freshClient()
    const { result } = renderHook(() => useRoutes({}), { wrapper: makeWrapper(qc) })
    await waitFor(() => expect(result.current.isSuccess).toBe(true))
    expect(result.current.data?.results[0].name).toBe("Ruta Lima-Callao")
  })

  it("queryKey includes params", async () => {
    server.use(http.get(`${BASE}/api/v1/routes/`, () => HttpResponse.json(mockPage)))
    const qc = freshClient()
    const params = { search: "lima" }
    const { result } = renderHook(() => useRoutes(params), { wrapper: makeWrapper(qc) })
    await waitFor(() => expect(result.current.isSuccess).toBe(true))
    expect(qc.getQueryData(["routes", params])).toBeDefined()
  })
})

describe("useRoute", () => {
  it("fetches individual route", async () => {
    server.use(http.get(`${BASE}/api/v1/routes/1/`, () => HttpResponse.json(mockRoute)))
    const qc = freshClient()
    const { result } = renderHook(() => useRoute(1), { wrapper: makeWrapper(qc) })
    await waitFor(() => expect(result.current.isSuccess).toBe(true))
    expect(result.current.data?.id).toBe(1)
  })

  it("does not fetch when id is 0", () => {
    const qc = freshClient()
    const { result } = renderHook(() => useRoute(0), { wrapper: makeWrapper(qc) })
    expect(result.current.isPending).toBe(true)
  })
})

describe("useCreateRoute", () => {
  it("invalidates ['routes'] on success", async () => {
    server.use(http.post(`${BASE}/api/v1/routes/`, () => HttpResponse.json(mockRoute, { status: 201 })))
    const qc = freshClient()
    const spy = vi.spyOn(qc, "invalidateQueries")
    const { result } = renderHook(() => useCreateRoute(), { wrapper: makeWrapper(qc) })
    result.current.mutate({ name: "Ruta Lima-Callao" })
    await waitFor(() => expect(result.current.isSuccess).toBe(true))
    expect(spy).toHaveBeenCalledWith(expect.objectContaining({ queryKey: ["routes"] }))
  })

  it("calls toast.success on success", async () => {
    const { toast } = await import("sonner")
    server.use(http.post(`${BASE}/api/v1/routes/`, () => HttpResponse.json(mockRoute, { status: 201 })))
    const qc = freshClient()
    const { result } = renderHook(() => useCreateRoute(), { wrapper: makeWrapper(qc) })
    result.current.mutate({ name: "Ruta Lima-Callao" })
    await waitFor(() => expect(result.current.isSuccess).toBe(true))
    expect(toast.success).toHaveBeenCalledWith("Ruta creada correctamente")
  })

  it("calls toast.error on failure", async () => {
    const { toast } = await import("sonner")
    server.use(http.post(`${BASE}/api/v1/routes/`, () => HttpResponse.json({}, { status: 400 })))
    const qc = freshClient()
    const { result } = renderHook(() => useCreateRoute(), { wrapper: makeWrapper(qc) })
    result.current.mutate({ name: "Ruta Lima-Callao" })
    await waitFor(() => expect(result.current.isError).toBe(true))
    expect(toast.error).toHaveBeenCalled()
  })
})

describe("useUpdateRoute", () => {
  it("invalidates ['routes'] on success", async () => {
    server.use(http.put(`${BASE}/api/v1/routes/1/`, () => HttpResponse.json(mockRoute)))
    const qc = freshClient()
    const spy = vi.spyOn(qc, "invalidateQueries")
    const { result } = renderHook(() => useUpdateRoute(1), { wrapper: makeWrapper(qc) })
    result.current.mutate({ name: "Updated" })
    await waitFor(() => expect(result.current.isSuccess).toBe(true))
    expect(spy).toHaveBeenCalledWith(expect.objectContaining({ queryKey: ["routes"] }))
  })
})

describe("useDeleteRoute", () => {
  it("invalidates ['routes'] on success", async () => {
    server.use(http.delete(`${BASE}/api/v1/routes/1/`, () => new HttpResponse(null, { status: 204 })))
    const qc = freshClient()
    const spy = vi.spyOn(qc, "invalidateQueries")
    const { result } = renderHook(() => useDeleteRoute(), { wrapper: makeWrapper(qc) })
    result.current.mutate(1)
    await waitFor(() => expect(result.current.isSuccess).toBe(true))
    expect(spy).toHaveBeenCalledWith(expect.objectContaining({ queryKey: ["routes"] }))
  })

  it("calls toast.success on success", async () => {
    const { toast } = await import("sonner")
    server.use(http.delete(`${BASE}/api/v1/routes/1/`, () => new HttpResponse(null, { status: 204 })))
    const qc = freshClient()
    const { result } = renderHook(() => useDeleteRoute(), { wrapper: makeWrapper(qc) })
    result.current.mutate(1)
    await waitFor(() => expect(result.current.isSuccess).toBe(true))
    expect(toast.success).toHaveBeenCalledWith("Ruta eliminada correctamente")
  })
})

describe("useRouteWarehouses", () => {
  it("resolves with warehouses list", async () => {
    const page: PaginatedResponse<Warehouse> = { count: 0, next: null, previous: null, results: [] }
    server.use(http.get(`${BASE}/api/v1/warehouses/`, () => HttpResponse.json(page)))
    const qc = freshClient()
    const { result } = renderHook(() => useRouteWarehouses(), { wrapper: makeWrapper(qc) })
    await waitFor(() => expect(result.current.isSuccess).toBe(true))
    expect(Array.isArray(result.current.data)).toBe(true)
  })
})

describe("useCreateRouteStop", () => {
  it("invalidates ['routes'] on success", async () => {
    server.use(http.post(`${BASE}/api/v1/route-stops/`, () =>
      HttpResponse.json({ id: 1, route: 1, stop_order: 1, address: "Av. Lima 1", city: "Lima", latitude: null, longitude: null }, { status: 201 })
    ))
    const qc = freshClient()
    const spy = vi.spyOn(qc, "invalidateQueries")
    const { result } = renderHook(() => useCreateRouteStop(), { wrapper: makeWrapper(qc) })
    result.current.mutate({ route: 1, stop_order: 1, address: "Av. Lima 1", city: "Lima" })
    await waitFor(() => expect(result.current.isSuccess).toBe(true))
    expect(spy).toHaveBeenCalledWith(expect.objectContaining({ queryKey: ["routes"] }))
  })
})

describe("useDeleteRouteStop", () => {
  it("invalidates ['routes'] on success", async () => {
    server.use(http.delete(`${BASE}/api/v1/route-stops/1/`, () => new HttpResponse(null, { status: 204 })))
    const qc = freshClient()
    const spy = vi.spyOn(qc, "invalidateQueries")
    const { result } = renderHook(() => useDeleteRouteStop(), { wrapper: makeWrapper(qc) })
    result.current.mutate(1)
    await waitFor(() => expect(result.current.isSuccess).toBe(true))
    expect(spy).toHaveBeenCalledWith(expect.objectContaining({ queryKey: ["routes"] }))
  })
})
