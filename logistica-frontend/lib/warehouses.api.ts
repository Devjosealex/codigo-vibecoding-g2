import apiClient from "./api-client"

export interface Warehouse {
  id: number
  name: string
  address: string | null
  city: string | null
  country: string
  latitude: number | null
  longitude: number | null
  capacity_m3: string | null
  is_active: boolean
  created_at: string
  updated_at: string
}

export interface WarehouseFormData {
  name: string
  address?: string
  city?: string
  country?: string
  latitude?: string | null
  longitude?: string | null
  capacity_m3?: string
}

export interface PaginatedResponse<T> {
  count: number
  next: string | null
  previous: string | null
  results: T[]
}

export interface WarehouseParams {
  page?: number
  search?: string
  city?: string
  country?: string
  ordering?: string
}

export async function getWarehouses(
  params: WarehouseParams = {},
): Promise<PaginatedResponse<Warehouse>> {
  const response = await apiClient.get<PaginatedResponse<Warehouse>>(
    "/api/v1/warehouses/",
    { params },
  )
  return response.data
}

export async function getWarehouse(id: number): Promise<Warehouse> {
  const response = await apiClient.get<Warehouse>(
    `/api/v1/warehouses/${id}/`,
  )
  return response.data
}

export async function createWarehouse(
  data: WarehouseFormData,
): Promise<Warehouse> {
  const response = await apiClient.post<Warehouse>(
    "/api/v1/warehouses/",
    data,
  )
  return response.data
}

export async function updateWarehouse(
  id: number,
  data: WarehouseFormData,
): Promise<Warehouse> {
  const response = await apiClient.put<Warehouse>(
    `/api/v1/warehouses/${id}/`,
    data,
  )
  return response.data
}

export async function deleteWarehouse(id: number): Promise<void> {
  await apiClient.delete(`/api/v1/warehouses/${id}/`)
}
