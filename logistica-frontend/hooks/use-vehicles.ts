"use client"

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query"
import {
  getVehicles,
  getVehicle,
  createVehicle,
  updateVehicle,
  deleteVehicle,
  getVehicleDrivers,
  type VehicleParams,
  type VehicleFormData,
} from "@/lib/vehicles.api"
import { toast } from "sonner"

export function useVehicles(params: VehicleParams) {
  return useQuery({
    queryKey: ["vehicles", params],
    queryFn: () => getVehicles(params),
  })
}

export function useVehicle(id: number) {
  return useQuery({
    queryKey: ["vehicles", id],
    queryFn: () => getVehicle(id),
    enabled: !!id,
  })
}

export function useCreateVehicle() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (data: VehicleFormData) => createVehicle(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["vehicles"] })
      toast.success("Vehículo creado correctamente")
    },
    onError: (error: unknown) => {
      const msg =
        error && typeof error === "object" && "response" in error
          ? (error as { response: { data: { detail?: string } } }).response
              ?.data?.detail
          : "Error al crear vehículo"
      toast.error(msg || "Error al crear vehículo")
    },
  })
}

export function useUpdateVehicle(id: number) {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (data: VehicleFormData) => updateVehicle(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["vehicles"] })
      toast.success("Vehículo actualizado correctamente")
    },
    onError: (error: unknown) => {
      const msg =
        error && typeof error === "object" && "response" in error
          ? (error as { response: { data: { detail?: string } } }).response
              ?.data?.detail
          : "Error al actualizar vehículo"
      toast.error(msg || "Error al actualizar vehículo")
    },
  })
}

export function useDeleteVehicle() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (id: number) => deleteVehicle(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["vehicles"] })
      toast.success("Vehículo eliminado correctamente")
    },
    onError: (error: unknown) => {
      const msg =
        error && typeof error === "object" && "response" in error
          ? (error as { response: { data: { detail?: string } } }).response
              ?.data?.detail
          : "Error al eliminar vehículo"
      toast.error(msg || "Error al eliminar vehículo")
    },
  })
}

export function useVehicleDrivers() {
  return useQuery({
    queryKey: ["vehicle-drivers"],
    queryFn: () => getVehicleDrivers(),
  })
}
