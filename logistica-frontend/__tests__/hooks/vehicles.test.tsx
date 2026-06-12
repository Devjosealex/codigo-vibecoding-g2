import { describe, it, expect, vi, beforeEach } from "vitest"
import { http, HttpResponse } from "msw"
import { renderHook, waitFor } from "@testing-library/react"
import React from "react"
import { QueryClient, QueryClientProvider } from "@tanstack/react-query"
import { server } from "@/test/msw/server"
import {
  useVehicles,
  useVehicle,
  useCreateVehicle,
  useUpdateVehicle,
  useDeleteVehicle,
  useVehicleDrivers,
} from "@/hooks/use-vehicles"
import type { Vehicle, PaginatedResponse } from "@/lib/vehicles.api"
import type { Driver } from "@/lib/drivers.api"

vi.mock("sonner", () => ({ toast: { success: vi.fn(), error: vi.fn() } }))

const BASE = "http://localhost:8000"

const mockVehicle: Vehicle = {
  id: 1, driver: null, name: "Camión 01", plate_number: "ABC-123",
  vehicle_type: "truck", capacity_kg: null, capacity_m3: null, is_active: true,
  created_at: "2026-01-01T00:00:00Z", updated_at: "2026-01-01T00:00:00Z",
}
const mockPage: PaginatedResponse<Vehicle> = { count: 1, next: null, previous: null, results: [mockVehicle] }

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

describe("useVehicles", () => {
  it("resolves with paginated data", async () => {
    server.use(http.get(`${BASE}/api/v1/vehicles/`, () => HttpResponse.json(mockPage)))
    const qc = freshClient()
    const { result } = renderHook(() => useVehicles({}), { wrapper: makeWrapper(qc) })
    await waitFor(() => expect(result.current.isSuccess).toBe(true))
    expect(result.current.data?.results[0].plate_number).toBe("ABC-123")
  })

  it("queryKey includes params", async () => {
    server.use(http.get(`${BASE}/api/v1/vehicles/`, () => HttpResponse.json(mockPage)))
    const qc = freshClient()
    const params = { vehicle_type: "truck" }
    const { result } = renderHook(() => useVehicles(params), { wrapper: makeWrapper(qc) })
    await waitFor(() => expect(result.current.isSuccess).toBe(true))
    expect(qc.getQueryData(["vehicles", params])).toBeDefined()
  })
})

describe("useVehicle", () => {
  it("fetches individual vehicle", async () => {
    server.use(http.get(`${BASE}/api/v1/vehicles/1/`, () => HttpResponse.json(mockVehicle)))
    const qc = freshClient()
    const { result } = renderHook(() => useVehicle(1), { wrapper: makeWrapper(qc) })
    await waitFor(() => expect(result.current.isSuccess).toBe(true))
    expect(result.current.data?.vehicle_type).toBe("truck")
  })

  it("does not fetch when id is 0", () => {
    const qc = freshClient()
    const { result } = renderHook(() => useVehicle(0), { wrapper: makeWrapper(qc) })
    expect(result.current.isPending).toBe(true)
  })
})

describe("useCreateVehicle", () => {
  it("invalidates ['vehicles'] on success", async () => {
    server.use(http.post(`${BASE}/api/v1/vehicles/`, () => HttpResponse.json(mockVehicle, { status: 201 })))
    const qc = freshClient()
    const spy = vi.spyOn(qc, "invalidateQueries")
    const { result } = renderHook(() => useCreateVehicle(), { wrapper: makeWrapper(qc) })
    result.current.mutate({ name: "Camión 01", plate_number: "ABC-123", vehicle_type: "truck" })
    await waitFor(() => expect(result.current.isSuccess).toBe(true))
    expect(spy).toHaveBeenCalledWith(expect.objectContaining({ queryKey: ["vehicles"] }))
  })

  it("calls toast.success on success", async () => {
    const { toast } = await import("sonner")
    server.use(http.post(`${BASE}/api/v1/vehicles/`, () => HttpResponse.json(mockVehicle, { status: 201 })))
    const qc = freshClient()
    const { result } = renderHook(() => useCreateVehicle(), { wrapper: makeWrapper(qc) })
    result.current.mutate({ name: "Camión 01", plate_number: "ABC-123", vehicle_type: "truck" })
    await waitFor(() => expect(result.current.isSuccess).toBe(true))
    expect(toast.success).toHaveBeenCalledWith("Vehículo creado correctamente")
  })

  it("calls toast.error on failure", async () => {
    const { toast } = await import("sonner")
    server.use(http.post(`${BASE}/api/v1/vehicles/`, () => HttpResponse.json({}, { status: 400 })))
    const qc = freshClient()
    const { result } = renderHook(() => useCreateVehicle(), { wrapper: makeWrapper(qc) })
    result.current.mutate({ name: "Camión 01", plate_number: "ABC-123", vehicle_type: "truck" })
    await waitFor(() => expect(result.current.isError).toBe(true))
    expect(toast.error).toHaveBeenCalled()
  })
})

describe("useUpdateVehicle", () => {
  it("invalidates ['vehicles'] on success", async () => {
    server.use(http.put(`${BASE}/api/v1/vehicles/1/`, () => HttpResponse.json(mockVehicle)))
    const qc = freshClient()
    const spy = vi.spyOn(qc, "invalidateQueries")
    const { result } = renderHook(() => useUpdateVehicle(1), { wrapper: makeWrapper(qc) })
    result.current.mutate({ name: "Updated", plate_number: "XYZ-999", vehicle_type: "van" })
    await waitFor(() => expect(result.current.isSuccess).toBe(true))
    expect(spy).toHaveBeenCalledWith(expect.objectContaining({ queryKey: ["vehicles"] }))
  })
})

describe("useDeleteVehicle", () => {
  it("invalidates ['vehicles'] on success", async () => {
    server.use(http.delete(`${BASE}/api/v1/vehicles/1/`, () => new HttpResponse(null, { status: 204 })))
    const qc = freshClient()
    const spy = vi.spyOn(qc, "invalidateQueries")
    const { result } = renderHook(() => useDeleteVehicle(), { wrapper: makeWrapper(qc) })
    result.current.mutate(1)
    await waitFor(() => expect(result.current.isSuccess).toBe(true))
    expect(spy).toHaveBeenCalledWith(expect.objectContaining({ queryKey: ["vehicles"] }))
  })

  it("calls toast.success on success", async () => {
    const { toast } = await import("sonner")
    server.use(http.delete(`${BASE}/api/v1/vehicles/1/`, () => new HttpResponse(null, { status: 204 })))
    const qc = freshClient()
    const { result } = renderHook(() => useDeleteVehicle(), { wrapper: makeWrapper(qc) })
    result.current.mutate(1)
    await waitFor(() => expect(result.current.isSuccess).toBe(true))
    expect(toast.success).toHaveBeenCalledWith("Vehículo eliminado correctamente")
  })
})

describe("useVehicleDrivers", () => {
  it("resolves with drivers list", async () => {
    const page: PaginatedResponse<Driver> = { count: 0, next: null, previous: null, results: [] }
    server.use(http.get(`${BASE}/api/v1/drivers/`, () => HttpResponse.json(page)))
    const qc = freshClient()
    const { result } = renderHook(() => useVehicleDrivers(), { wrapper: makeWrapper(qc) })
    await waitFor(() => expect(result.current.isSuccess).toBe(true))
    expect(Array.isArray(result.current.data)).toBe(true)
  })
})
