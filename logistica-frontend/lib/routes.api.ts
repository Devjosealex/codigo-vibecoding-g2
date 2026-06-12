import apiClient from "./api-client"
import type { Warehouse } from "./warehouses.api"

export interface RouteStop {
  id: number
  route: number
  stop_order: number
  address: string
  city: string
  latitude: number | null
  longitude: number | null
}

export interface Route {
  id: number
  name: string
  origin_warehouse: number | null
  distance_km: string | null
  estimated_duration_h: string | null
  is_active: boolean
  created_at: string
  updated_at: string
  stops?: RouteStop[]
}

export interface RouteFormData {
  name: string
  origin_warehouse?: number | null
  distance_km?: string
  estimated_duration_h?: string
}

export interface RouteStopFormData {
  route: number
  stop_order: number
  address: string
  city: string
  latitude?: string | null
  longitude?: string | null
}

export interface PaginatedResponse<T> {
  count: number
  next: string | null
  previous: string | null
  results: T[]
}

export interface RouteParams {
  page?: number
  search?: string
  ordering?: string
}

export async function getRoutes(
  params: RouteParams = {},
): Promise<PaginatedResponse<Route>> {
  const response = await apiClient.get<PaginatedResponse<Route>>(
    "/api/v1/routes/",
    { params },
  )
  return response.data
}

export async function getRoute(id: number): Promise<Route> {
  const response = await apiClient.get<Route>(`/api/v1/routes/${id}/`)
  return response.data
}

export async function createRoute(data: RouteFormData): Promise<Route> {
  const response = await apiClient.post<Route>("/api/v1/routes/", data)
  return response.data
}

export async function updateRoute(
  id: number,
  data: RouteFormData,
): Promise<Route> {
  const response = await apiClient.put<Route>(
    `/api/v1/routes/${id}/`,
    data,
  )
  return response.data
}

export async function deleteRoute(id: number): Promise<void> {
  await apiClient.delete(`/api/v1/routes/${id}/`)
}

export async function getRouteWarehouses(): Promise<Warehouse[]> {
  const response = await apiClient.get<PaginatedResponse<Warehouse>>(
    "/api/v1/warehouses/",
    { params: { page_size: 1000 } },
  )
  return response.data.results
}

export async function createRouteStop(
  data: RouteStopFormData,
): Promise<RouteStop> {
  const response = await apiClient.post<RouteStop>(
    "/api/v1/route-stops/",
    data,
  )
  return response.data
}

export async function deleteRouteStop(id: number): Promise<void> {
  await apiClient.delete(`/api/v1/route-stops/${id}/`)
}
