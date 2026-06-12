"use client"

import { useSupplier } from "@/hooks/use-suppliers"
import { SupplierForm } from "@/components/suppliers/supplier-form"
import { Skeleton } from "@/components/ui/skeleton"

interface SupplierEditViewProps {
  id: number
}

export function SupplierEditView({ id }: SupplierEditViewProps) {
  const { data: supplier, isLoading, isError, error } = useSupplier(id)

  if (isLoading) {
    return (
      <div className="space-y-4">
        <Skeleton className="h-8 w-48" />
        <Skeleton className="h-10 w-full" />
        <Skeleton className="h-10 w-full" />
      </div>
    )
  }

  if (isError || !supplier) {
    return (
      <div className="rounded-md bg-destructive/10 p-4 text-sm text-destructive">
        {(error as { message?: string })?.message ??
          "Error al cargar el proveedor"}
      </div>
    )
  }

  return <SupplierForm supplier={supplier} />
}
