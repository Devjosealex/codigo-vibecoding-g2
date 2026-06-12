import apiClient from "./api-client"

export interface Driver {
  id: number
  first_name: string
  last_name: string
  document_number: string | null
  license_number: string | null
  license_expiry: string | null
  phone: string | null
  email: string
  is_active: boolean
  created_at: string
  updated_at: string
}

export interface DriverFormData {
  first_name: string
  last_name: string
  document_number?: string
  license_number?: string
  license_expiry?: string
  phone?: string
  email: string
}

export interface PaginatedResponse<T> {
  count: number
  next: string | null
  previous: string | null
  results: T[]
}

export interface DriverParams {
  page?: number
  search?: string
  ordering?: string
}

export async function getDrivers(
  params: DriverParams = {},
): Promise<PaginatedResponse<Driver>> {
  const response = await apiClient.get<PaginatedResponse<Driver>>(
    "/api/v1/drivers/",
    { params },
  )
  return response.data
}

export async function getDriver(id: number): Promise<Driver> {
  const response = await apiClient.get<Driver>(`/api/v1/drivers/${id}/`)
  return response.data
}

export async function createDriver(data: DriverFormData): Promise<Driver> {
  const response = await apiClient.post<Driver>("/api/v1/drivers/", data)
  return response.data
}

export async function updateDriver(
  id: number,
  data: DriverFormData,
): Promise<Driver> {
  const response = await apiClient.put<Driver>(
    `/api/v1/drivers/${id}/`,
    data,
  )
  return response.data
}

export async function deleteDriver(id: number): Promise<void> {
  await apiClient.delete(`/api/v1/drivers/${id}/`)
}
