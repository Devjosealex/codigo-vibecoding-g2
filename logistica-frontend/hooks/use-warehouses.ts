"use client"

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query"
import {
  getWarehouses,
  getWarehouse,
  createWarehouse,
  updateWarehouse,
  deleteWarehouse,
  type WarehouseParams,
  type WarehouseFormData,
} from "@/lib/warehouses.api"
import { toast } from "sonner"

export function useWarehouses(params: WarehouseParams) {
  return useQuery({
    queryKey: ["warehouses", params],
    queryFn: () => getWarehouses(params),
  })
}

export function useWarehouse(id: number) {
  return useQuery({
    queryKey: ["warehouses", id],
    queryFn: () => getWarehouse(id),
    enabled: !!id,
  })
}

export function useCreateWarehouse() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (data: WarehouseFormData) => createWarehouse(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["warehouses"] })
      toast.success("Almacén creado correctamente")
    },
    onError: (error: unknown) => {
      const msg =
        error && typeof error === "object" && "response" in error
          ? (error as { response: { data: { detail?: string } } }).response
              ?.data?.detail
          : "Error al crear almacén"
      toast.error(msg || "Error al crear almacén")
    },
  })
}

export function useUpdateWarehouse(id: number) {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (data: WarehouseFormData) => updateWarehouse(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["warehouses"] })
      toast.success("Almacén actualizado correctamente")
    },
    onError: (error: unknown) => {
      const msg =
        error && typeof error === "object" && "response" in error
          ? (error as { response: { data: { detail?: string } } }).response
              ?.data?.detail
          : "Error al actualizar almacén"
      toast.error(msg || "Error al actualizar almacén")
    },
  })
}

export function useDeleteWarehouse() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (id: number) => deleteWarehouse(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["warehouses"] })
      toast.success("Almacén eliminado correctamente")
    },
    onError: (error: unknown) => {
      const msg =
        error && typeof error === "object" && "response" in error
          ? (error as { response: { data: { detail?: string } } }).response
              ?.data?.detail
          : "Error al eliminar almacén"
      toast.error(msg || "Error al eliminar almacén")
    },
  })
}
