"use client"

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query"
import {
  getCustomers,
  getCustomer,
  createCustomer,
  updateCustomer,
  deleteCustomer,
  type CustomerParams,
  type CustomerFormData,
} from "@/lib/customers.api"
import { toast } from "sonner"

export function useCustomers(params: CustomerParams) {
  return useQuery({
    queryKey: ["customers", params],
    queryFn: () => getCustomers(params),
  })
}

export function useCustomer(id: number) {
  return useQuery({
    queryKey: ["customers", id],
    queryFn: () => getCustomer(id),
    enabled: !!id,
  })
}

export function useCreateCustomer() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (data: CustomerFormData) => createCustomer(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["customers"] })
      toast.success("Cliente creado correctamente")
    },
    onError: (error: unknown) => {
      const msg =
        error && typeof error === "object" && "response" in error
          ? (error as { response: { data: { detail?: string } } }).response?.data
              ?.detail
          : "Error al crear cliente"
      toast.error(msg || "Error al crear cliente")
    },
  })
}

export function useUpdateCustomer(id: number) {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (data: CustomerFormData) => updateCustomer(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["customers"] })
      toast.success("Cliente actualizado correctamente")
    },
    onError: (error: unknown) => {
      const msg =
        error && typeof error === "object" && "response" in error
          ? (error as { response: { data: { detail?: string } } }).response?.data
              ?.detail
          : "Error al actualizar cliente"
      toast.error(msg || "Error al actualizar cliente")
    },
  })
}

export function useDeleteCustomer() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (id: number) => deleteCustomer(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["customers"] })
      toast.success("Cliente eliminado correctamente")
    },
    onError: (error: unknown) => {
      const msg =
        error && typeof error === "object" && "response" in error
          ? (error as { response: { data: { detail?: string } } }).response?.data
              ?.detail
          : "Error al eliminar cliente"
      toast.error(msg || "Error al eliminar cliente")
    },
  })
}
