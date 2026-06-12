"use client"

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query"
import {
  getSuppliers,
  getSupplier,
  createSupplier,
  updateSupplier,
  deleteSupplier,
  type SupplierParams,
  type SupplierFormData,
} from "@/lib/suppliers.api"
import { toast } from "sonner"

export function useSuppliers(params: SupplierParams) {
  return useQuery({
    queryKey: ["suppliers", params],
    queryFn: () => getSuppliers(params),
  })
}

export function useSupplier(id: number) {
  return useQuery({
    queryKey: ["suppliers", id],
    queryFn: () => getSupplier(id),
    enabled: !!id,
  })
}

export function useCreateSupplier() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (data: SupplierFormData) => createSupplier(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["suppliers"] })
      toast.success("Proveedor creado correctamente")
    },
    onError: (error: unknown) => {
      const msg =
        error && typeof error === "object" && "response" in error
          ? (error as { response: { data: { detail?: string } } }).response
              ?.data?.detail
          : "Error al crear proveedor"
      toast.error(msg || "Error al crear proveedor")
    },
  })
}

export function useUpdateSupplier(id: number) {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (data: SupplierFormData) => updateSupplier(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["suppliers"] })
      toast.success("Proveedor actualizado correctamente")
    },
    onError: (error: unknown) => {
      const msg =
        error && typeof error === "object" && "response" in error
          ? (error as { response: { data: { detail?: string } } }).response
              ?.data?.detail
          : "Error al actualizar proveedor"
      toast.error(msg || "Error al actualizar proveedor")
    },
  })
}

export function useDeleteSupplier() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (id: number) => deleteSupplier(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["suppliers"] })
      toast.success("Proveedor eliminado correctamente")
    },
    onError: (error: unknown) => {
      const msg =
        error && typeof error === "object" && "response" in error
          ? (error as { response: { data: { detail?: string } } }).response
              ?.data?.detail
          : "Error al eliminar proveedor"
      toast.error(msg || "Error al eliminar proveedor")
    },
  })
}
