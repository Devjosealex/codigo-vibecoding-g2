import apiClient from "./api-client"
import type { Customer } from "./customers.api"
import type { Warehouse } from "./warehouses.api"
import type { Vehicle } from "./vehicles.api"
import type { Route } from "./routes.api"
import type { Product } from "./products.api"
import type { Driver } from "./drivers.api"

export type ShipmentStatus =
  | "pending"
  | "assigned"
  | "in_transit"
  | "delivered"
  | "returned"
  | "cancelled"

export interface ShipmentItem {
  id: number
  shipment: number
  product: number
  quantity: number
  unit_price_at_shipment: string
}

export interface Shipment {
  id: number
  tracking_number: string
  customer: number | null
  origin_warehouse: number | null
  vehicle: number | null
  route: number | null
  destination_address: string
  destination_city: string
  destination_country: string
  status: ShipmentStatus
  scheduled_date: string | null
  delivered_at: string | null
  base_cost: string
  calculated_cost: string | null
  notes: string | null
  created_at: string
  updated_at: string
  items?: ShipmentItem[]
}

export interface ShipmentFormData {
  customer?: number | null
  origin_warehouse?: number | null
  vehicle?: number | null
  route?: number | null
  destination_address: string
  destination_city: string
  destination_country?: string
  scheduled_date?: string
  base_cost: string
  notes?: string
}

export interface ShipmentItemFormData {
  shipment: number
  product: number
  quantity: number
}

export interface PaginatedResponse<T> {
  count: number
  next: string | null
  previous: string | null
  results: T[]
}

export interface ShipmentParams {
  page?: number
  search?: string
  status?: string
  customer?: string
  origin_warehouse?: string
  vehicle?: string
  route?: string
  ordering?: string
}

export async function getShipments(
  params: ShipmentParams = {},
): Promise<PaginatedResponse<Shipment>> {
  const response = await apiClient.get<PaginatedResponse<Shipment>>(
    "/api/v1/shipments/",
    { params },
  )
  return response.data
}

export async function getShipment(id: number): Promise<Shipment> {
  const response = await apiClient.get<Shipment>(
    `/api/v1/shipments/${id}/`,
  )
  return response.data
}

export async function createShipment(
  data: ShipmentFormData,
): Promise<Shipment> {
  const response = await apiClient.post<Shipment>(
    "/api/v1/shipments/",
    data,
  )
  return response.data
}

export async function updateShipment(
  id: number,
  data: ShipmentFormData,
): Promise<Shipment> {
  const response = await apiClient.put<Shipment>(
    `/api/v1/shipments/${id}/`,
    data,
  )
  return response.data
}

export async function deleteShipment(id: number): Promise<void> {
  await apiClient.delete(`/api/v1/shipments/${id}/`)
}

export async function transitionShipment(
  id: number,
  status: ShipmentStatus,
): Promise<Shipment> {
  const response = await apiClient.post<Shipment>(
    `/api/v1/shipments/${id}/transition/`,
    { status },
  )
  return response.data
}

export async function createShipmentItem(
  data: ShipmentItemFormData,
): Promise<ShipmentItem> {
  const response = await apiClient.post<ShipmentItem>(
    "/api/v1/shipment-items/",
    data,
  )
  return response.data
}

export async function deleteShipmentItem(id: number): Promise<void> {
  await apiClient.delete(`/api/v1/shipment-items/${id}/`)
}

export async function getShipmentCustomers(): Promise<Customer[]> {
  const response = await apiClient.get<PaginatedResponse<Customer>>(
    "/api/v1/customers/",
    { params: { page_size: 1000 } },
  )
  return response.data.results
}

export async function getShipmentWarehouses(): Promise<Warehouse[]> {
  const response = await apiClient.get<PaginatedResponse<Warehouse>>(
    "/api/v1/warehouses/",
    { params: { page_size: 1000 } },
  )
  return response.data.results
}

export async function getShipmentVehicles(): Promise<Vehicle[]> {
  const response = await apiClient.get<PaginatedResponse<Vehicle>>(
    "/api/v1/vehicles/",
    { params: { page_size: 1000 } },
  )
  return response.data.results
}

export async function getShipmentRoutes(): Promise<Route[]> {
  const response = await apiClient.get<PaginatedResponse<Route>>(
    "/api/v1/routes/",
    { params: { page_size: 1000 } },
  )
  return response.data.results
}

export async function getShipmentProducts(): Promise<Product[]> {
  const response = await apiClient.get<PaginatedResponse<Product>>(
    "/api/v1/products/",
    { params: { page_size: 1000 } },
  )
  return response.data.results
}

export async function getShipmentDrivers(): Promise<Driver[]> {
  const response = await apiClient.get<PaginatedResponse<Driver>>(
    "/api/v1/drivers/",
    { params: { page_size: 1000 } },
  )
  return response.data.results
}
