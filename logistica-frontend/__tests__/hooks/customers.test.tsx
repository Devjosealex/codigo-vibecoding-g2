import { describe, it, expect, vi, beforeEach } from "vitest"
import { http, HttpResponse } from "msw"
import { renderHook, waitFor } from "@testing-library/react"
import React from "react"
import { QueryClient, QueryClientProvider } from "@tanstack/react-query"
import { server } from "@/test/msw/server"
import {
  useCustomers,
  useCustomer,
  useCreateCustomer,
  useUpdateCustomer,
  useDeleteCustomer,
} from "@/hooks/use-customers"
import type { Customer, PaginatedResponse } from "@/lib/customers.api"

vi.mock("sonner", () => ({
  toast: { success: vi.fn(), error: vi.fn() },
}))

const BASE = "http://localhost:8000"

const mockCustomer: Customer = {
  id: 1,
  user: null,
  name: "Acme Corp",
  customer_type: "company",
  tax_id: null,
  email: "contact@acme.com",
  phone: null,
  address: null,
  city: "Lima",
  country: "Peru",
  is_active: true,
  created_at: "2026-01-01T00:00:00Z",
  updated_at: "2026-01-01T00:00:00Z",
}

const mockPage: PaginatedResponse<Customer> = {
  count: 1,
  next: null,
  previous: null,
  results: [mockCustomer],
}

function makeWrapper(queryClient: QueryClient) {
  return function Wrapper({ children }: { children: React.ReactNode }) {
    return React.createElement(QueryClientProvider, { client: queryClient }, children)
  }
}

function freshClient() {
  return new QueryClient({
    defaultOptions: {
      queries: { retry: false, gcTime: 0 },
      mutations: { retry: false },
    },
  })
}

beforeEach(() => {
  Object.defineProperty(window, "location", {
    value: { href: "http://localhost:3000/" },
    writable: true,
  })
  localStorage.clear()
  vi.clearAllMocks()
})

describe("useCustomers", () => {
  it("starts pending then resolves with data", async () => {
    server.use(
      http.get(`${BASE}/api/v1/customers/`, () => HttpResponse.json(mockPage)),
    )
    const qc = freshClient()
    const { result } = renderHook(() => useCustomers({}), {
      wrapper: makeWrapper(qc),
    })

    expect(result.current.isPending).toBe(true)

    await waitFor(() => expect(result.current.isSuccess).toBe(true))
    expect(result.current.data?.results[0].name).toBe("Acme Corp")
    expect(result.current.data?.count).toBe(1)
  })

  it("queryKey includes params", async () => {
    server.use(
      http.get(`${BASE}/api/v1/customers/`, () => HttpResponse.json(mockPage)),
    )
    const qc = freshClient()
    const params = { search: "acme", page: 1 }
    const { result } = renderHook(() => useCustomers(params), {
      wrapper: makeWrapper(qc),
    })
    await waitFor(() => expect(result.current.isSuccess).toBe(true))

    const cached = qc.getQueryData(["customers", params])
    expect(cached).toBeDefined()
  })

  it("sets error state on 4xx", async () => {
    server.use(
      http.get(`${BASE}/api/v1/customers/`, () =>
        HttpResponse.json({ detail: "Forbidden" }, { status: 403 }),
      ),
    )
    const qc = freshClient()
    const { result } = renderHook(() => useCustomers({}), {
      wrapper: makeWrapper(qc),
    })
    await waitFor(() => expect(result.current.isError).toBe(true))
  })
})

describe("useCustomer", () => {
  it("fetches individual customer", async () => {
    server.use(
      http.get(`${BASE}/api/v1/customers/1/`, () =>
        HttpResponse.json(mockCustomer),
      ),
    )
    const qc = freshClient()
    const { result } = renderHook(() => useCustomer(1), {
      wrapper: makeWrapper(qc),
    })
    await waitFor(() => expect(result.current.isSuccess).toBe(true))
    expect(result.current.data?.id).toBe(1)
  })

  it("does not fetch when id is 0", async () => {
    let called = false
    server.use(
      http.get(`${BASE}/api/v1/customers/0/`, () => {
        called = true
        return HttpResponse.json(mockCustomer)
      }),
    )
    const qc = freshClient()
    const { result } = renderHook(() => useCustomer(0), {
      wrapper: makeWrapper(qc),
    })
    // enabled: !!id → false when id=0, stays pending
    expect(result.current.isPending).toBe(true)
    expect(called).toBe(false)
  })
})

describe("useCreateCustomer", () => {
  it("calls createCustomer and invalidates ['customers']", async () => {
    server.use(
      http.post(`${BASE}/api/v1/customers/`, () =>
        HttpResponse.json(mockCustomer, { status: 201 }),
      ),
    )
    const qc = freshClient()
    const invalidateSpy = vi.spyOn(qc, "invalidateQueries")

    const { result } = renderHook(() => useCreateCustomer(), {
      wrapper: makeWrapper(qc),
    })

    result.current.mutate({
      name: "Acme Corp",
      customer_type: "company",
      email: "contact@acme.com",
    })

    await waitFor(() => expect(result.current.isSuccess).toBe(true))
    expect(invalidateSpy).toHaveBeenCalledWith(
      expect.objectContaining({ queryKey: ["customers"] }),
    )
  })

  it("calls toast.success on success", async () => {
    const { toast } = await import("sonner")
    server.use(
      http.post(`${BASE}/api/v1/customers/`, () =>
        HttpResponse.json(mockCustomer, { status: 201 }),
      ),
    )
    const qc = freshClient()
    const { result } = renderHook(() => useCreateCustomer(), {
      wrapper: makeWrapper(qc),
    })

    result.current.mutate({
      name: "Acme Corp",
      customer_type: "company",
      email: "contact@acme.com",
    })
    await waitFor(() => expect(result.current.isSuccess).toBe(true))
    expect(toast.success).toHaveBeenCalledWith("Cliente creado correctamente")
  })

  it("calls toast.error on failure", async () => {
    const { toast } = await import("sonner")
    server.use(
      http.post(`${BASE}/api/v1/customers/`, () =>
        HttpResponse.json({ detail: "Ya existe." }, { status: 400 }),
      ),
    )
    const qc = freshClient()
    const { result } = renderHook(() => useCreateCustomer(), {
      wrapper: makeWrapper(qc),
    })

    result.current.mutate({
      name: "Acme Corp",
      customer_type: "company",
      email: "contact@acme.com",
    })
    await waitFor(() => expect(result.current.isError).toBe(true))
    expect(toast.error).toHaveBeenCalled()
  })
})

describe("useUpdateCustomer", () => {
  it("invalidates ['customers'] on success", async () => {
    server.use(
      http.put(`${BASE}/api/v1/customers/1/`, () =>
        HttpResponse.json(mockCustomer),
      ),
    )
    const qc = freshClient()
    const invalidateSpy = vi.spyOn(qc, "invalidateQueries")

    const { result } = renderHook(() => useUpdateCustomer(1), {
      wrapper: makeWrapper(qc),
    })

    result.current.mutate({
      name: "Updated",
      customer_type: "company",
      email: "contact@acme.com",
    })

    await waitFor(() => expect(result.current.isSuccess).toBe(true))
    expect(invalidateSpy).toHaveBeenCalledWith(
      expect.objectContaining({ queryKey: ["customers"] }),
    )
  })

  it("calls toast.success on success", async () => {
    const { toast } = await import("sonner")
    server.use(
      http.put(`${BASE}/api/v1/customers/1/`, () =>
        HttpResponse.json(mockCustomer),
      ),
    )
    const qc = freshClient()
    const { result } = renderHook(() => useUpdateCustomer(1), {
      wrapper: makeWrapper(qc),
    })

    result.current.mutate({
      name: "Updated",
      customer_type: "company",
      email: "contact@acme.com",
    })
    await waitFor(() => expect(result.current.isSuccess).toBe(true))
    expect(toast.success).toHaveBeenCalledWith("Cliente actualizado correctamente")
  })
})

describe("useDeleteCustomer", () => {
  it("invalidates ['customers'] on success", async () => {
    server.use(
      http.delete(`${BASE}/api/v1/customers/1/`, () =>
        new HttpResponse(null, { status: 204 }),
      ),
    )
    const qc = freshClient()
    const invalidateSpy = vi.spyOn(qc, "invalidateQueries")

    const { result } = renderHook(() => useDeleteCustomer(), {
      wrapper: makeWrapper(qc),
    })

    result.current.mutate(1)

    await waitFor(() => expect(result.current.isSuccess).toBe(true))
    expect(invalidateSpy).toHaveBeenCalledWith(
      expect.objectContaining({ queryKey: ["customers"] }),
    )
  })

  it("calls toast.success on success", async () => {
    const { toast } = await import("sonner")
    server.use(
      http.delete(`${BASE}/api/v1/customers/1/`, () =>
        new HttpResponse(null, { status: 204 }),
      ),
    )
    const qc = freshClient()
    const { result } = renderHook(() => useDeleteCustomer(), {
      wrapper: makeWrapper(qc),
    })

    result.current.mutate(1)
    await waitFor(() => expect(result.current.isSuccess).toBe(true))
    expect(toast.success).toHaveBeenCalledWith("Cliente eliminado correctamente")
  })

  it("calls toast.error on failure", async () => {
    const { toast } = await import("sonner")
    server.use(
      http.delete(`${BASE}/api/v1/customers/999/`, () =>
        HttpResponse.json({ detail: "Not found." }, { status: 404 }),
      ),
    )
    const qc = freshClient()
    const { result } = renderHook(() => useDeleteCustomer(), {
      wrapper: makeWrapper(qc),
    })

    result.current.mutate(999)
    await waitFor(() => expect(result.current.isError).toBe(true))
    expect(toast.error).toHaveBeenCalled()
  })
})
