"use client"

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query"
import {
  getDrivers,
  getDriver,
  createDriver,
  updateDriver,
  deleteDriver,
  type DriverParams,
  type DriverFormData,
} from "@/lib/drivers.api"
import { toast } from "sonner"

export function useDrivers(params: DriverParams) {
  return useQuery({
    queryKey: ["drivers", params],
    queryFn: () => getDrivers(params),
  })
}

export function useDriver(id: number) {
  return useQuery({
    queryKey: ["drivers", id],
    queryFn: () => getDriver(id),
    enabled: !!id,
  })
}

export function useCreateDriver() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (data: DriverFormData) => createDriver(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["drivers"] })
      toast.success("Conductor creado correctamente")
    },
    onError: (error: unknown) => {
      const msg =
        error && typeof error === "object" && "response" in error
          ? (error as { response: { data: { detail?: string } } }).response
              ?.data?.detail
          : "Error al crear conductor"
      toast.error(msg || "Error al crear conductor")
    },
  })
}

export function useUpdateDriver(id: number) {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (data: DriverFormData) => updateDriver(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["drivers"] })
      toast.success("Conductor actualizado correctamente")
    },
    onError: (error: unknown) => {
      const msg =
        error && typeof error === "object" && "response" in error
          ? (error as { response: { data: { detail?: string } } }).response
              ?.data?.detail
          : "Error al actualizar conductor"
      toast.error(msg || "Error al actualizar conductor")
    },
  })
}

export function useDeleteDriver() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (id: number) => deleteDriver(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["drivers"] })
      toast.success("Conductor eliminado correctamente")
    },
    onError: (error: unknown) => {
      const msg =
        error && typeof error === "object" && "response" in error
          ? (error as { response: { data: { detail?: string } } }).response
              ?.data?.detail
          : "Error al eliminar conductor"
      toast.error(msg || "Error al eliminar conductor")
    },
  })
}
