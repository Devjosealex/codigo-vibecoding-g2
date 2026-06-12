import { describe, it, expect, beforeEach } from "vitest"
import { http, HttpResponse } from "msw"
import { server } from "@/test/msw/server"
import {
  getCustomers,
  getCustomer,
  createCustomer,
  updateCustomer,
  deleteCustomer,
  type Customer,
  type PaginatedResponse,
} from "@/lib/customers.api"

const BASE = "http://localhost:8000"

const mockCustomer: Customer = {
  id: 1,
  user: null,
  name: "Acme Corp",
  customer_type: "company",
  tax_id: "12345678",
  email: "contact@acme.com",
  phone: "+51999888777",
  address: "Av. Lima 123",
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

beforeEach(() => {
  Object.defineProperty(window, "location", {
    value: { href: "http://localhost:3000/" },
    writable: true,
  })
  localStorage.clear()
})

describe("getCustomers", () => {
  it("returns paginated response", async () => {
    server.use(
      http.get(`${BASE}/api/v1/customers/`, () => HttpResponse.json(mockPage)),
    )
    const result = await getCustomers()
    expect(result.count).toBe(1)
    expect(result.results[0].name).toBe("Acme Corp")
  })

  it("passes search param in query string", async () => {
    let capturedUrl = ""
    server.use(
      http.get(`${BASE}/api/v1/customers/`, ({ request }) => {
        capturedUrl = request.url
        return HttpResponse.json(mockPage)
      }),
    )
    await getCustomers({ search: "acme" })
    expect(capturedUrl).toContain("search=acme")
  })

  it("passes page param", async () => {
    let capturedUrl = ""
    server.use(
      http.get(`${BASE}/api/v1/customers/`, ({ request }) => {
        capturedUrl = request.url
        return HttpResponse.json(mockPage)
      }),
    )
    await getCustomers({ page: 2 })
    expect(capturedUrl).toContain("page=2")
  })

  it("passes customer_type filter", async () => {
    let capturedUrl = ""
    server.use(
      http.get(`${BASE}/api/v1/customers/`, ({ request }) => {
        capturedUrl = request.url
        return HttpResponse.json(mockPage)
      }),
    )
    await getCustomers({ customer_type: "individual" })
    expect(capturedUrl).toContain("customer_type=individual")
  })

  it("passes ordering param", async () => {
    let capturedUrl = ""
    server.use(
      http.get(`${BASE}/api/v1/customers/`, ({ request }) => {
        capturedUrl = request.url
        return HttpResponse.json(mockPage)
      }),
    )
    await getCustomers({ ordering: "-created_at" })
    expect(capturedUrl).toContain("ordering=-created_at")
  })

  it("propagates 4xx errors", async () => {
    server.use(
      http.get(`${BASE}/api/v1/customers/`, () =>
        HttpResponse.json({ detail: "Forbidden" }, { status: 403 }),
      ),
    )
    await expect(getCustomers()).rejects.toThrow()
  })
})

describe("getCustomer", () => {
  it("fetches single customer by id", async () => {
    server.use(
      http.get(`${BASE}/api/v1/customers/1/`, () =>
        HttpResponse.json(mockCustomer),
      ),
    )
    const result = await getCustomer(1)
    expect(result.id).toBe(1)
    expect(result.email).toBe("contact@acme.com")
  })

  it("propagates 404", async () => {
    server.use(
      http.get(`${BASE}/api/v1/customers/999/`, () =>
        HttpResponse.json({ detail: "Not found." }, { status: 404 }),
      ),
    )
    await expect(getCustomer(999)).rejects.toThrow()
  })
})

describe("createCustomer", () => {
  it("POSTs to correct URL and returns created customer", async () => {
    let method = ""
    server.use(
      http.post(`${BASE}/api/v1/customers/`, async ({ request }) => {
        method = request.method
        const body = await request.json()
        return HttpResponse.json({ ...mockCustomer, ...(body as object) }, { status: 201 })
      }),
    )
    const result = await createCustomer({
      name: "Acme Corp",
      customer_type: "company",
      email: "contact@acme.com",
    })
    expect(method).toBe("POST")
    expect(result.name).toBe("Acme Corp")
  })

  it("propagates 400 validation errors", async () => {
    server.use(
      http.post(`${BASE}/api/v1/customers/`, () =>
        HttpResponse.json({ email: ["Enter a valid email address."] }, { status: 400 }),
      ),
    )
    await expect(
      createCustomer({ name: "", customer_type: "company", email: "bad" }),
    ).rejects.toThrow()
  })
})

describe("updateCustomer", () => {
  it("PUTs to correct URL with id", async () => {
    let capturedMethod = ""
    let capturedUrl = ""
    server.use(
      http.put(`${BASE}/api/v1/customers/1/`, ({ request }) => {
        capturedMethod = request.method
        capturedUrl = request.url
        return HttpResponse.json(mockCustomer)
      }),
    )
    await updateCustomer(1, {
      name: "Updated",
      customer_type: "company",
      email: "contact@acme.com",
    })
    expect(capturedMethod).toBe("PUT")
    expect(capturedUrl).toContain("/api/v1/customers/1/")
  })
})

describe("deleteCustomer", () => {
  it("DELETEs correct URL", async () => {
    let capturedMethod = ""
    server.use(
      http.delete(`${BASE}/api/v1/customers/1/`, ({ request }) => {
        capturedMethod = request.method
        return new HttpResponse(null, { status: 204 })
      }),
    )
    await deleteCustomer(1)
    expect(capturedMethod).toBe("DELETE")
  })

  it("propagates 404 on delete", async () => {
    server.use(
      http.delete(`${BASE}/api/v1/customers/999/`, () =>
        HttpResponse.json({ detail: "Not found." }, { status: 404 }),
      ),
    )
    await expect(deleteCustomer(999)).rejects.toThrow()
  })
})
