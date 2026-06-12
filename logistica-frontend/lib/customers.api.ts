import apiClient from "./api-client"

export interface Customer {
  id: number
  user: number | null
  name: string
  customer_type: "company" | "individual"
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

export interface CustomerFormData {
  name: string
  customer_type: "company" | "individual"
  email: string
  tax_id?: string
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

export interface CustomerParams {
  page?: number
  search?: string
  customer_type?: string
  city?: string
  country?: string
  ordering?: string
}

export async function getCustomers(
  params: CustomerParams = {},
): Promise<PaginatedResponse<Customer>> {
  const response = await apiClient.get<PaginatedResponse<Customer>>(
    "/api/v1/customers/",
    { params },
  )
  return response.data
}

export async function getCustomer(id: number): Promise<Customer> {
  const response = await apiClient.get<Customer>(`/api/v1/customers/${id}/`)
  return response.data
}

export async function createCustomer(
  data: CustomerFormData,
): Promise<Customer> {
  const response = await apiClient.post<Customer>("/api/v1/customers/", data)
  return response.data
}

export async function updateCustomer(
  id: number,
  data: CustomerFormData,
): Promise<Customer> {
  const response = await apiClient.put<Customer>(
    `/api/v1/customers/${id}/`,
    data,
  )
  return response.data
}

export async function deleteCustomer(id: number): Promise<void> {
  await apiClient.delete(`/api/v1/customers/${id}/`)
}
