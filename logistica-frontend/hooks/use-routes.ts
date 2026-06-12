"use client"

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query"
import {
  getRoutes,
  getRoute,
  createRoute,
  updateRoute,
  deleteRoute,
  createRouteStop,
  deleteRouteStop,
  getRouteWarehouses,
  type RouteParams,
  type RouteFormData,
  type RouteStopFormData,
} from "@/lib/routes.api"
import { toast } from "sonner"

export function useRoutes(params: RouteParams) {
  return useQuery({
    queryKey: ["routes", params],
    queryFn: () => getRoutes(params),
  })
}

export function useRoute(id: number) {
  return useQuery({
    queryKey: ["routes", id],
    queryFn: () => getRoute(id),
    enabled: !!id,
  })
}

export function useCreateRoute() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (data: RouteFormData) => createRoute(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["routes"] })
      toast.success("Ruta creada correctamente")
    },
    onError: (error: unknown) => {
      const msg =
        error && typeof error === "object" && "response" in error
          ? (error as { response: { data: { detail?: string } } }).response
              ?.data?.detail
          : "Error al crear ruta"
      toast.error(msg || "Error al crear ruta")
    },
  })
}

export function useUpdateRoute(id: number) {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (data: RouteFormData) => updateRoute(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["routes"] })
      toast.success("Ruta actualizada correctamente")
    },
    onError: (error: unknown) => {
      const msg =
        error && typeof error === "object" && "response" in error
          ? (error as { response: { data: { detail?: string } } }).response
              ?.data?.detail
          : "Error al actualizar ruta"
      toast.error(msg || "Error al actualizar ruta")
    },
  })
}

export function useDeleteRoute() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (id: number) => deleteRoute(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["routes"] })
      toast.success("Ruta eliminada correctamente")
    },
    onError: (error: unknown) => {
      const msg =
        error && typeof error === "object" && "response" in error
          ? (error as { response: { data: { detail?: string } } }).response
              ?.data?.detail
          : "Error al eliminar ruta"
      toast.error(msg || "Error al eliminar ruta")
    },
  })
}

export function useRouteWarehouses() {
  return useQuery({
    queryKey: ["route-warehouses"],
    queryFn: () => getRouteWarehouses(),
  })
}

export function useCreateRouteStop() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (data: RouteStopFormData) => createRouteStop(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["routes"] })
      toast.success("Parada agregada correctamente")
    },
    onError: (error: unknown) => {
      const msg =
        error && typeof error === "object" && "response" in error
          ? (error as { response: { data: { detail?: string } } }).response
              ?.data?.detail
          : "Error al agregar parada"
      toast.error(msg || "Error al agregar parada")
    },
  })
}

export function useDeleteRouteStop() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (id: number) => deleteRouteStop(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["routes"] })
      toast.success("Parada eliminada correctamente")
    },
    onError: (error: unknown) => {
      const msg =
        error && typeof error === "object" && "response" in error
          ? (error as { response: { data: { detail?: string } } }).response
              ?.data?.detail
          : "Error al eliminar parada"
      toast.error(msg || "Error al eliminar parada")
    },
  })
}
