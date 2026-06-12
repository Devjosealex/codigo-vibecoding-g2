"use client"

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query"
import {
  getShipments,
  getShipment,
  createShipment,
  updateShipment,
  deleteShipment,
  transitionShipment,
  createShipmentItem,
  deleteShipmentItem,
  getShipmentCustomers,
  getShipmentWarehouses,
  getShipmentVehicles,
  getShipmentRoutes,
  getShipmentProducts,
  getShipmentDrivers,
  type ShipmentParams,
  type ShipmentFormData,
  type ShipmentItemFormData,
  type ShipmentStatus,
} from "@/lib/shipments.api"
import { toast } from "sonner"

export function useShipments(params: ShipmentParams) {
  return useQuery({
    queryKey: ["shipments", params],
    queryFn: () => getShipments(params),
  })
}

export function useShipment(id: number) {
  return useQuery({
    queryKey: ["shipments", id],
    queryFn: () => getShipment(id),
    enabled: !!id,
  })
}

export function useCreateShipment() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (data: ShipmentFormData) => createShipment(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["shipments"] })
      toast.success("Envío creado correctamente")
    },
    onError: (error: unknown) => {
      const msg =
        error && typeof error === "object" && "response" in error
          ? (error as { response: { data: { detail?: string } } }).response
              ?.data?.detail
          : "Error al crear envío"
      toast.error(msg || "Error al crear envío")
    },
  })
}

export function useUpdateShipment(id: number) {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (data: ShipmentFormData) => updateShipment(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["shipments"] })
      toast.success("Envío actualizado correctamente")
    },
    onError: (error: unknown) => {
      const msg =
        error && typeof error === "object" && "response" in error
          ? (error as { response: { data: { detail?: string } } }).response
              ?.data?.detail
          : "Error al actualizar envío"
      toast.error(msg || "Error al actualizar envío")
    },
  })
}

export function useDeleteShipment() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (id: number) => deleteShipment(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["shipments"] })
      toast.success("Envío eliminado correctamente")
    },
    onError: (error: unknown) => {
      const msg =
        error && typeof error === "object" && "response" in error
          ? (error as { response: { data: { detail?: string } } }).response
              ?.data?.detail
          : "Error al eliminar envío"
      toast.error(msg || "Error al eliminar envío")
    },
  })
}

export function useTransitionShipment() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: ({
      id,
      status,
    }: {
      id: number
      status: ShipmentStatus
    }) => transitionShipment(id, status),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["shipments"] })
      toast.success("Estado actualizado correctamente")
    },
    onError: (error: unknown) => {
      const msg =
        error && typeof error === "object" && "response" in error
          ? (error as { response: { data: { detail?: string } } }).response
              ?.data?.detail
          : "Error al actualizar estado"
      toast.error(msg || "Error al actualizar estado")
    },
  })
}

export function useCreateShipmentItem() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (data: ShipmentItemFormData) => createShipmentItem(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["shipments"] })
      toast.success("Producto agregado al envío")
    },
    onError: (error: unknown) => {
      const msg =
        error && typeof error === "object" && "response" in error
          ? (error as { response: { data: { detail?: string } } }).response
              ?.data?.detail
          : "Error al agregar producto"
      toast.error(msg || "Error al agregar producto")
    },
  })
}

export function useDeleteShipmentItem() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (id: number) => deleteShipmentItem(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["shipments"] })
      toast.success("Producto eliminado del envío")
    },
    onError: (error: unknown) => {
      const msg =
        error && typeof error === "object" && "response" in error
          ? (error as { response: { data: { detail?: string } } }).response
              ?.data?.detail
          : "Error al eliminar producto"
      toast.error(msg || "Error al eliminar producto")
    },
  })
}

export function useShipmentCustomers() {
  return useQuery({
    queryKey: ["shipment-customers"],
    queryFn: () => getShipmentCustomers(),
  })
}

export function useShipmentWarehouses() {
  return useQuery({
    queryKey: ["shipment-warehouses"],
    queryFn: () => getShipmentWarehouses(),
  })
}

export function useShipmentVehicles() {
  return useQuery({
    queryKey: ["shipment-vehicles"],
    queryFn: () => getShipmentVehicles(),
  })
}

export function useShipmentRoutes() {
  return useQuery({
    queryKey: ["shipment-routes"],
    queryFn: () => getShipmentRoutes(),
  })
}

export function useShipmentProducts() {
  return useQuery({
    queryKey: ["shipment-products"],
    queryFn: () => getShipmentProducts(),
  })
}

export function useShipmentDrivers() {
  return useQuery({
    queryKey: ["shipment-drivers"],
    queryFn: () => getShipmentDrivers(),
  })
}
