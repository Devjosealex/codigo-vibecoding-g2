import apiClient from "./api-client"
import type { Driver } from "./drivers.api"

export interface Vehicle {
  id: number
  driver: number | null
  name: string
  plate_number: string
  vehicle_type: "truck" | "van" | "motorcycle" | "other"
  capacity_kg: string | null
  capacity_m3: string | null
  is_active: boolean
  created_at: string
  updated_at: string
}

export interface VehicleFormData {
  driver?: number | null
  name: string
  plate_number: string
  vehicle_type: "truck" | "van" | "motorcycle" | "other"
  capacity_kg?: string
  capacity_m3?: string
}

export interface PaginatedResponse<T> {
  count: number
  next: string | null
  previous: string | null
  results: T[]
}

export interface VehicleParams {
  page?: number
  search?: string
  vehicle_type?: string
  driver?: string
  ordering?: string
}

export async function getVehicles(
  params: VehicleParams = {},
): Promise<PaginatedResponse<Vehicle>> {
  const response = await apiClient.get<PaginatedResponse<Vehicle>>(
    "/api/v1/vehicles/",
    { params },
  )
  return response.data
}

export async function getVehicle(id: number): Promise<Vehicle> {
  const response = await apiClient.get<Vehicle>(`/api/v1/vehicles/${id}/`)
  return response.data
}

export async function createVehicle(
  data: VehicleFormData,
): Promise<Vehicle> {
  const response = await apiClient.post<Vehicle>("/api/v1/vehicles/", data)
  return response.data
}

export async function updateVehicle(
  id: number,
  data: VehicleFormData,
): Promise<Vehicle> {
  const response = await apiClient.put<Vehicle>(
    `/api/v1/vehicles/${id}/`,
    data,
  )
  return response.data
}

export async function deleteVehicle(id: number): Promise<void> {
  await apiClient.delete(`/api/v1/vehicles/${id}/`)
}

export async function getVehicleDrivers(): Promise<Driver[]> {
  const response = await apiClient.get<PaginatedResponse<Driver>>(
    "/api/v1/drivers/",
    { params: { page_size: 1000 } },
  )
  return response.data.results
}
