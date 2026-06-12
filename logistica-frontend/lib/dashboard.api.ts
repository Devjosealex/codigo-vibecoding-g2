import apiClient from "./api-client"
import type { Customer } from "./customers.api"
import type { Supplier } from "./suppliers.api"
import type { Warehouse } from "./warehouses.api"
import type { Product } from "./products.api"
import type { Driver } from "./drivers.api"
import type { Vehicle } from "./vehicles.api"
import type { Route } from "./routes.api"
import type { Shipment } from "./shipments.api"

interface PaginatedResponse<T> {
  count: number
  next: string | null
  previous: string | null
  results: T[]
}

async function fetchAll<T>(url: string, pageSize = 10000): Promise<T[]> {
  const results: T[] = []
  let page = 1
  let hasMore = true

  while (hasMore) {
    const response = await apiClient.get<PaginatedResponse<T>>(url, {
      params: { page, page_size: pageSize },
    })
    results.push(...response.data.results)
    hasMore = response.data.next != null
    page++
  }

  return results
}

export async function getAllCustomers(): Promise<Customer[]> {
  return fetchAll<Customer>("/api/v1/customers/")
}

export async function getAllSuppliers(): Promise<Supplier[]> {
  return fetchAll<Supplier>("/api/v1/suppliers/")
}

export async function getAllWarehouses(): Promise<Warehouse[]> {
  return fetchAll<Warehouse>("/api/v1/warehouses/")
}

export async function getAllProducts(): Promise<Product[]> {
  return fetchAll<Product>("/api/v1/products/")
}

export async function getAllDrivers(): Promise<Driver[]> {
  return fetchAll<Driver>("/api/v1/drivers/")
}

export async function getAllVehicles(): Promise<Vehicle[]> {
  return fetchAll<Vehicle>("/api/v1/vehicles/")
}

export async function getAllRoutes(): Promise<Route[]> {
  return fetchAll<Route>("/api/v1/routes/")
}

export async function getAllShipments(): Promise<Shipment[]> {
  return fetchAll<Shipment>("/api/v1/shipments/")
}
