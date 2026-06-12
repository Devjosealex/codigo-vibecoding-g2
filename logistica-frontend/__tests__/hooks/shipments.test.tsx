import { describe, it, expect, vi, beforeEach } from "vitest"
import { http, HttpResponse } from "msw"
import { renderHook, waitFor } from "@testing-library/react"
import React from "react"
import { QueryClient, QueryClientProvider } from "@tanstack/react-query"
import { server } from "@/test/msw/server"
import {
  useShipments,
  useShipment,
  useCreateShipment,
  useUpdateShipment,
  useDeleteShipment,
  useTransitionShipment,
  useCreateShipmentItem,
  useDeleteShipmentItem,
  useShipmentCustomers,
  useShipmentVehicles,
  useShipmentRoutes,
  useShipmentProducts,
} from "@/hooks/use-shipments"
import type { Shipment, PaginatedResponse } from "@/lib/shipments.api"
import type { Customer } from "@/lib/customers.api"
import type { Vehicle } from "@/lib/vehicles.api"
import type { Route } from "@/lib/routes.api"
import type { Product } from "@/lib/products.api"

vi.mock("sonner", () => ({ toast: { success: vi.fn(), error: vi.fn() } }))

const BASE = "http://localhost:8000"

const mockShipment: Shipment = {
  id: 1, tracking_number: "TRK-001", customer: null, origin_warehouse: null,
  vehicle: null, route: null, destination_address: "Av. Lima 123",
  destination_city: "Lima", destination_country: "Peru", status: "pending",
  scheduled_date: null, delivered_at: null, base_cost: "150.00",
  calculated_cost: null, notes: null,
  created_at: "2026-01-01T00:00:00Z", updated_at: "2026-01-01T00:00:00Z",
}
const mockPage: PaginatedResponse<Shipment> = { count: 1, next: null, previous: null, results: [mockShipment] }

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

describe("useShipments", () => {
  it("resolves with paginated data", async () => {
    server.use(http.get(`${BASE}/api/v1/shipments/`, () => HttpResponse.json(mockPage)))
    const qc = freshClient()
    const { result } = renderHook(() => useShipments({}), { wrapper: makeWrapper(qc) })
    await waitFor(() => expect(result.current.isSuccess).toBe(true))
    expect(result.current.data?.results[0].tracking_number).toBe("TRK-001")
  })

  it("queryKey includes params", async () => {
    server.use(http.get(`${BASE}/api/v1/shipments/`, () => HttpResponse.json(mockPage)))
    const qc = freshClient()
    const params = { status: "pending" }
    const { result } = renderHook(() => useShipments(params), { wrapper: makeWrapper(qc) })
    await waitFor(() => expect(result.current.isSuccess).toBe(true))
    expect(qc.getQueryData(["shipments", params])).toBeDefined()
  })
})

describe("useShipment", () => {
  it("fetches individual shipment", async () => {
    server.use(http.get(`${BASE}/api/v1/shipments/1/`, () => HttpResponse.json(mockShipment)))
    const qc = freshClient()
    const { result } = renderHook(() => useShipment(1), { wrapper: makeWrapper(qc) })
    await waitFor(() => expect(result.current.isSuccess).toBe(true))
    expect(result.current.data?.status).toBe("pending")
  })

  it("does not fetch when id is 0", () => {
    const qc = freshClient()
    const { result } = renderHook(() => useShipment(0), { wrapper: makeWrapper(qc) })
    expect(result.current.isPending).toBe(true)
  })
})

describe("useCreateShipment", () => {
  it("invalidates ['shipments'] on success", async () => {
    server.use(http.post(`${BASE}/api/v1/shipments/`, () => HttpResponse.json(mockShipment, { status: 201 })))
    const qc = freshClient()
    const spy = vi.spyOn(qc, "invalidateQueries")
    const { result } = renderHook(() => useCreateShipment(), { wrapper: makeWrapper(qc) })
    result.current.mutate({ destination_address: "Av. Lima 123", destination_city: "Lima", base_cost: "150.00" })
    await waitFor(() => expect(result.current.isSuccess).toBe(true))
    expect(spy).toHaveBeenCalledWith(expect.objectContaining({ queryKey: ["shipments"] }))
  })

  it("calls toast.success on success", async () => {
    const { toast } = await import("sonner")
    server.use(http.post(`${BASE}/api/v1/shipments/`, () => HttpResponse.json(mockShipment, { status: 201 })))
    const qc = freshClient()
    const { result } = renderHook(() => useCreateShipment(), { wrapper: makeWrapper(qc) })
    result.current.mutate({ destination_address: "Av. Lima 123", destination_city: "Lima", base_cost: "150.00" })
    await waitFor(() => expect(result.current.isSuccess).toBe(true))
    expect(toast.success).toHaveBeenCalledWith("Envío creado correctamente")
  })

  it("calls toast.error on failure", async () => {
    const { toast } = await import("sonner")
    server.use(http.post(`${BASE}/api/v1/shipments/`, () => HttpResponse.json({}, { status: 400 })))
    const qc = freshClient()
    const { result } = renderHook(() => useCreateShipment(), { wrapper: makeWrapper(qc) })
    result.current.mutate({ destination_address: "Av. Lima 123", destination_city: "Lima", base_cost: "150.00" })
    await waitFor(() => expect(result.current.isError).toBe(true))
    expect(toast.error).toHaveBeenCalled()
  })
})

describe("useUpdateShipment", () => {
  it("invalidates ['shipments'] on success", async () => {
    server.use(http.put(`${BASE}/api/v1/shipments/1/`, () => HttpResponse.json(mockShipment)))
    const qc = freshClient()
    const spy = vi.spyOn(qc, "invalidateQueries")
    const { result } = renderHook(() => useUpdateShipment(1), { wrapper: makeWrapper(qc) })
    result.current.mutate({ destination_address: "Updated", destination_city: "Lima", base_cost: "200.00" })
    await waitFor(() => expect(result.current.isSuccess).toBe(true))
    expect(spy).toHaveBeenCalledWith(expect.objectContaining({ queryKey: ["shipments"] }))
  })
})

describe("useDeleteShipment", () => {
  it("invalidates ['shipments'] on success", async () => {
    server.use(http.delete(`${BASE}/api/v1/shipments/1/`, () => new HttpResponse(null, { status: 204 })))
    const qc = freshClient()
    const spy = vi.spyOn(qc, "invalidateQueries")
    const { result } = renderHook(() => useDeleteShipment(), { wrapper: makeWrapper(qc) })
    result.current.mutate(1)
    await waitFor(() => expect(result.current.isSuccess).toBe(true))
    expect(spy).toHaveBeenCalledWith(expect.objectContaining({ queryKey: ["shipments"] }))
  })

  it("calls toast.success on success", async () => {
    const { toast } = await import("sonner")
    server.use(http.delete(`${BASE}/api/v1/shipments/1/`, () => new HttpResponse(null, { status: 204 })))
    const qc = freshClient()
    const { result } = renderHook(() => useDeleteShipment(), { wrapper: makeWrapper(qc) })
    result.current.mutate(1)
    await waitFor(() => expect(result.current.isSuccess).toBe(true))
    expect(toast.success).toHaveBeenCalledWith("Envío eliminado correctamente")
  })
})

describe("useTransitionShipment", () => {
  it("invalidates ['shipments'] on success", async () => {
    server.use(http.post(`${BASE}/api/v1/shipments/1/transition/`, () =>
      HttpResponse.json({ ...mockShipment, status: "in_transit" })
    ))
    const qc = freshClient()
    const spy = vi.spyOn(qc, "invalidateQueries")
    const { result } = renderHook(() => useTransitionShipment(), { wrapper: makeWrapper(qc) })
    result.current.mutate({ id: 1, status: "in_transit" })
    await waitFor(() => expect(result.current.isSuccess).toBe(true))
    expect(spy).toHaveBeenCalledWith(expect.objectContaining({ queryKey: ["shipments"] }))
  })

  it("calls toast.success on success", async () => {
    const { toast } = await import("sonner")
    server.use(http.post(`${BASE}/api/v1/shipments/1/transition/`, () =>
      HttpResponse.json({ ...mockShipment, status: "delivered" })
    ))
    const qc = freshClient()
    const { result } = renderHook(() => useTransitionShipment(), { wrapper: makeWrapper(qc) })
    result.current.mutate({ id: 1, status: "delivered" })
    await waitFor(() => expect(result.current.isSuccess).toBe(true))
    expect(toast.success).toHaveBeenCalledWith("Estado actualizado correctamente")
  })
})

describe("useCreateShipmentItem", () => {
  it("invalidates ['shipments'] on success", async () => {
    server.use(http.post(`${BASE}/api/v1/shipment-items/`, () =>
      HttpResponse.json({ id: 1, shipment: 1, product: 2, quantity: 5, unit_price_at_shipment: "99.99" }, { status: 201 })
    ))
    const qc = freshClient()
    const spy = vi.spyOn(qc, "invalidateQueries")
    const { result } = renderHook(() => useCreateShipmentItem(), { wrapper: makeWrapper(qc) })
    result.current.mutate({ shipment: 1, product: 2, quantity: 5 })
    await waitFor(() => expect(result.current.isSuccess).toBe(true))
    expect(spy).toHaveBeenCalledWith(expect.objectContaining({ queryKey: ["shipments"] }))
  })
})

describe("useDeleteShipmentItem", () => {
  it("invalidates ['shipments'] on success", async () => {
    server.use(http.delete(`${BASE}/api/v1/shipment-items/1/`, () => new HttpResponse(null, { status: 204 })))
    const qc = freshClient()
    const spy = vi.spyOn(qc, "invalidateQueries")
    const { result } = renderHook(() => useDeleteShipmentItem(), { wrapper: makeWrapper(qc) })
    result.current.mutate(1)
    await waitFor(() => expect(result.current.isSuccess).toBe(true))
    expect(spy).toHaveBeenCalledWith(expect.objectContaining({ queryKey: ["shipments"] }))
  })
})

describe("lookup hooks", () => {
  it("useShipmentCustomers resolves with array", async () => {
    const page: PaginatedResponse<Customer> = { count: 0, next: null, previous: null, results: [] }
    server.use(http.get(`${BASE}/api/v1/customers/`, () => HttpResponse.json(page)))
    const qc = freshClient()
    const { result } = renderHook(() => useShipmentCustomers(), { wrapper: makeWrapper(qc) })
    await waitFor(() => expect(result.current.isSuccess).toBe(true))
    expect(Array.isArray(result.current.data)).toBe(true)
  })

  it("useShipmentVehicles resolves with array", async () => {
    const page: PaginatedResponse<Vehicle> = { count: 0, next: null, previous: null, results: [] }
    server.use(http.get(`${BASE}/api/v1/vehicles/`, () => HttpResponse.json(page)))
    const qc = freshClient()
    const { result } = renderHook(() => useShipmentVehicles(), { wrapper: makeWrapper(qc) })
    await waitFor(() => expect(result.current.isSuccess).toBe(true))
    expect(Array.isArray(result.current.data)).toBe(true)
  })

  it("useShipmentRoutes resolves with array", async () => {
    const page: PaginatedResponse<Route> = { count: 0, next: null, previous: null, results: [] }
    server.use(http.get(`${BASE}/api/v1/routes/`, () => HttpResponse.json(page)))
    const qc = freshClient()
    const { result } = renderHook(() => useShipmentRoutes(), { wrapper: makeWrapper(qc) })
    await waitFor(() => expect(result.current.isSuccess).toBe(true))
    expect(Array.isArray(result.current.data)).toBe(true)
  })

  it("useShipmentProducts resolves with array", async () => {
    const page: PaginatedResponse<Product> = { count: 0, next: null, previous: null, results: [] }
    server.use(http.get(`${BASE}/api/v1/products/`, () => HttpResponse.json(page)))
    const qc = freshClient()
    const { result } = renderHook(() => useShipmentProducts(), { wrapper: makeWrapper(qc) })
    await waitFor(() => expect(result.current.isSuccess).toBe(true))
    expect(Array.isArray(result.current.data)).toBe(true)
  })
})
