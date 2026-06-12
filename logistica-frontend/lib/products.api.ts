import apiClient from "./api-client"
import type { Supplier } from "./suppliers.api"
import type { Warehouse } from "./warehouses.api"

export interface Product {
  id: number
  supplier: number | null
  warehouse: number | null
  name: string
  description: string | null
  sku: string
  weight_kg: string | null
  length_cm: string | null
  width_cm: string | null
  height_cm: string | null
  unit_price: string
  stock_quantity: number
  is_active: boolean
  created_at: string
  updated_at: string
}

export interface ProductFormData {
  supplier?: number | null
  warehouse?: number | null
  name: string
  description?: string
  sku: string
  weight_kg?: string
  length_cm?: string
  width_cm?: string
  height_cm?: string
  unit_price: string
  stock_quantity: number
}

export interface PaginatedResponse<T> {
  count: number
  next: string | null
  previous: string | null
  results: T[]
}

export interface ProductParams {
  page?: number
  search?: string
  supplier?: string
  warehouse?: string
  ordering?: string
}

export async function getProducts(
  params: ProductParams = {},
): Promise<PaginatedResponse<Product>> {
  const response = await apiClient.get<PaginatedResponse<Product>>(
    "/api/v1/products/",
    { params },
  )
  return response.data
}

export async function getProduct(id: number): Promise<Product> {
  const response = await apiClient.get<Product>(`/api/v1/products/${id}/`)
  return response.data
}

export async function createProduct(
  data: ProductFormData,
): Promise<Product> {
  const response = await apiClient.post<Product>("/api/v1/products/", data)
  return response.data
}

export async function updateProduct(
  id: number,
  data: ProductFormData,
): Promise<Product> {
  const response = await apiClient.put<Product>(
    `/api/v1/products/${id}/`,
    data,
  )
  return response.data
}

export async function deleteProduct(id: number): Promise<void> {
  await apiClient.delete(`/api/v1/products/${id}/`)
}

export async function getProductSuppliers(): Promise<Supplier[]> {
  const response = await apiClient.get<PaginatedResponse<Supplier>>(
    "/api/v1/suppliers/",
    { params: { page_size: 1000 } },
  )
  return response.data.results
}

export async function getProductWarehouses(): Promise<Warehouse[]> {
  const response = await apiClient.get<PaginatedResponse<Warehouse>>(
    "/api/v1/warehouses/",
    { params: { page_size: 1000 } },
  )
  return response.data.results
}
