import apiClient from "./api-client"

export interface Supplier {
  id: number
  name: string
  contact_name: string | null
  tax_id: string | null
  email: string
  phone: string | null
  address: string | null
  city: string | null
  country: string
  is_active: boolean
  created_at: string
  updated_at: string
}

export interface SupplierFormData {
  name: string
  contact_name?: string
  tax_id?: string
  email: string
  phone?: string
  address?: string
  city?: string
  country?: string
}

export interface PaginatedResponse<T> {
  count: number
  next: string | null
  previous: string | null
  results: T[]
}

export interface SupplierParams {
  page?: number
  search?: string
  city?: string
  country?: string
  ordering?: string
}

export async function getSuppliers(
  params: SupplierParams = {},
): Promise<PaginatedResponse<Supplier>> {
  const response = await apiClient.get<PaginatedResponse<Supplier>>(
    "/api/v1/suppliers/",
    { params },
  )
  return response.data
}

export async function getSupplier(id: number): Promise<Supplier> {
  const response = await apiClient.get<Supplier>(`/api/v1/suppliers/${id}/`)
  return response.data
}

export async function createSupplier(
  data: SupplierFormData,
): Promise<Supplier> {
  const response = await apiClient.post<Supplier>(
    "/api/v1/suppliers/",
    data,
  )
  return response.data
}

export async function updateSupplier(
  id: number,
  data: SupplierFormData,
): Promise<Supplier> {
  const response = await apiClient.put<Supplier>(
    `/api/v1/suppliers/${id}/`,
    data,
  )
  return response.data
}

export async function deleteSupplier(id: number): Promise<void> {
  await apiClient.delete(`/api/v1/suppliers/${id}/`)
}
