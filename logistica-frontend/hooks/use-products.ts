"use client"

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query"
import {
  getProducts,
  getProduct,
  createProduct,
  updateProduct,
  deleteProduct,
  getProductSuppliers,
  getProductWarehouses,
  type ProductParams,
  type ProductFormData,
} from "@/lib/products.api"
import { toast } from "sonner"

export function useProducts(params: ProductParams) {
  return useQuery({
    queryKey: ["products", params],
    queryFn: () => getProducts(params),
  })
}

export function useProduct(id: number) {
  return useQuery({
    queryKey: ["products", id],
    queryFn: () => getProduct(id),
    enabled: !!id,
  })
}

export function useCreateProduct() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (data: ProductFormData) => createProduct(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["products"] })
      toast.success("Producto creado correctamente")
    },
    onError: (error: unknown) => {
      const msg =
        error && typeof error === "object" && "response" in error
          ? (error as { response: { data: { detail?: string } } }).response
              ?.data?.detail
          : "Error al crear producto"
      toast.error(msg || "Error al crear producto")
    },
  })
}

export function useUpdateProduct(id: number) {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (data: ProductFormData) => updateProduct(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["products"] })
      toast.success("Producto actualizado correctamente")
    },
    onError: (error: unknown) => {
      const msg =
        error && typeof error === "object" && "response" in error
          ? (error as { response: { data: { detail?: string } } }).response
              ?.data?.detail
          : "Error al actualizar producto"
      toast.error(msg || "Error al actualizar producto")
    },
  })
}

export function useDeleteProduct() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (id: number) => deleteProduct(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["products"] })
      toast.success("Producto eliminado correctamente")
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

export function useProductSuppliers() {
  return useQuery({
    queryKey: ["product-suppliers"],
    queryFn: () => getProductSuppliers(),
  })
}

export function useProductWarehouses() {
  return useQuery({
    queryKey: ["product-warehouses"],
    queryFn: () => getProductWarehouses(),
  })
}
