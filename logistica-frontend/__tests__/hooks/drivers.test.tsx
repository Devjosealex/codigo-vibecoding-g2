import { describe, it, expect, vi, beforeEach } from "vitest"
import { http, HttpResponse } from "msw"
import { renderHook, waitFor } from "@testing-library/react"
import React from "react"
import { QueryClient, QueryClientProvider } from "@tanstack/react-query"
import { server } from "@/test/msw/server"
import {
  useDrivers,
  useDriver,
  useCreateDriver,
  useUpdateDriver,
  useDeleteDriver,
} from "@/hooks/use-drivers"
import type { Driver, PaginatedResponse } from "@/lib/drivers.api"

vi.mock("sonner", () => ({ toast: { success: vi.fn(), error: vi.fn() } }))

const BASE = "http://localhost:8000"

const mockDriver: Driver = {
  id: 1, first_name: "Juan", last_name: "Pérez", document_number: null,
  license_number: null, license_expiry: null, phone: null, email: "juan@example.com",
  is_active: true, created_at: "2026-01-01T00:00:00Z", updated_at: "2026-01-01T00:00:00Z",
}
const mockPage: PaginatedResponse<Driver> = { count: 1, next: null, previous: null, results: [mockDriver] }

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

describe("useDrivers", () => {
  it("resolves with paginated data", async () => {
    server.use(http.get(`${BASE}/api/v1/drivers/`, () => HttpResponse.json(mockPage)))
    const qc = freshClient()
    const { result } = renderHook(() => useDrivers({}), { wrapper: makeWrapper(qc) })
    await waitFor(() => expect(result.current.isSuccess).toBe(true))
    expect(result.current.data?.results[0].last_name).toBe("Pérez")
  })

  it("queryKey includes params", async () => {
    server.use(http.get(`${BASE}/api/v1/drivers/`, () => HttpResponse.json(mockPage)))
    const qc = freshClient()
    const params = { search: "juan" }
    const { result } = renderHook(() => useDrivers(params), { wrapper: makeWrapper(qc) })
    await waitFor(() => expect(result.current.isSuccess).toBe(true))
    expect(qc.getQueryData(["drivers", params])).toBeDefined()
  })
})

describe("useDriver", () => {
  it("fetches individual driver", async () => {
    server.use(http.get(`${BASE}/api/v1/drivers/1/`, () => HttpResponse.json(mockDriver)))
    const qc = freshClient()
    const { result } = renderHook(() => useDriver(1), { wrapper: makeWrapper(qc) })
    await waitFor(() => expect(result.current.isSuccess).toBe(true))
    expect(result.current.data?.id).toBe(1)
  })

  it("does not fetch when id is 0", () => {
    const qc = freshClient()
    const { result } = renderHook(() => useDriver(0), { wrapper: makeWrapper(qc) })
    expect(result.current.isPending).toBe(true)
  })
})

describe("useCreateDriver", () => {
  it("invalidates ['drivers'] on success", async () => {
    server.use(http.post(`${BASE}/api/v1/drivers/`, () => HttpResponse.json(mockDriver, { status: 201 })))
    const qc = freshClient()
    const spy = vi.spyOn(qc, "invalidateQueries")
    const { result } = renderHook(() => useCreateDriver(), { wrapper: makeWrapper(qc) })
    result.current.mutate({ first_name: "Juan", last_name: "Pérez", email: "juan@example.com" })
    await waitFor(() => expect(result.current.isSuccess).toBe(true))
    expect(spy).toHaveBeenCalledWith(expect.objectContaining({ queryKey: ["drivers"] }))
  })

  it("calls toast.success on success", async () => {
    const { toast } = await import("sonner")
    server.use(http.post(`${BASE}/api/v1/drivers/`, () => HttpResponse.json(mockDriver, { status: 201 })))
    const qc = freshClient()
    const { result } = renderHook(() => useCreateDriver(), { wrapper: makeWrapper(qc) })
    result.current.mutate({ first_name: "Juan", last_name: "Pérez", email: "juan@example.com" })
    await waitFor(() => expect(result.current.isSuccess).toBe(true))
    expect(toast.success).toHaveBeenCalledWith("Conductor creado correctamente")
  })

  it("calls toast.error on failure", async () => {
    const { toast } = await import("sonner")
    server.use(http.post(`${BASE}/api/v1/drivers/`, () => HttpResponse.json({}, { status: 400 })))
    const qc = freshClient()
    const { result } = renderHook(() => useCreateDriver(), { wrapper: makeWrapper(qc) })
    result.current.mutate({ first_name: "Juan", last_name: "Pérez", email: "juan@example.com" })
    await waitFor(() => expect(result.current.isError).toBe(true))
    expect(toast.error).toHaveBeenCalled()
  })
})

describe("useUpdateDriver", () => {
  it("invalidates ['drivers'] on success", async () => {
    server.use(http.put(`${BASE}/api/v1/drivers/1/`, () => HttpResponse.json(mockDriver)))
    const qc = freshClient()
    const spy = vi.spyOn(qc, "invalidateQueries")
    const { result } = renderHook(() => useUpdateDriver(1), { wrapper: makeWrapper(qc) })
    result.current.mutate({ first_name: "Updated", last_name: "Pérez", email: "juan@example.com" })
    await waitFor(() => expect(result.current.isSuccess).toBe(true))
    expect(spy).toHaveBeenCalledWith(expect.objectContaining({ queryKey: ["drivers"] }))
  })
})

describe("useDeleteDriver", () => {
  it("invalidates ['drivers'] on success", async () => {
    server.use(http.delete(`${BASE}/api/v1/drivers/1/`, () => new HttpResponse(null, { status: 204 })))
    const qc = freshClient()
    const spy = vi.spyOn(qc, "invalidateQueries")
    const { result } = renderHook(() => useDeleteDriver(), { wrapper: makeWrapper(qc) })
    result.current.mutate(1)
    await waitFor(() => expect(result.current.isSuccess).toBe(true))
    expect(spy).toHaveBeenCalledWith(expect.objectContaining({ queryKey: ["drivers"] }))
  })

  it("calls toast.success on success", async () => {
    const { toast } = await import("sonner")
    server.use(http.delete(`${BASE}/api/v1/drivers/1/`, () => new HttpResponse(null, { status: 204 })))
    const qc = freshClient()
    const { result } = renderHook(() => useDeleteDriver(), { wrapper: makeWrapper(qc) })
    result.current.mutate(1)
    await waitFor(() => expect(result.current.isSuccess).toBe(true))
    expect(toast.success).toHaveBeenCalledWith("Conductor eliminado correctamente")
  })
})
