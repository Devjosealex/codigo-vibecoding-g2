"use client"

import { useWarehouse } from "@/hooks/use-warehouses"
import { WarehouseForm } from "@/components/warehouses/warehouse-form"
import { Skeleton } from "@/components/ui/skeleton"

interface WarehouseEditViewProps {
  id: number
}

export function WarehouseEditView({ id }: WarehouseEditViewProps) {
  const { data: warehouse, isLoading, isError, error } = useWarehouse(id)

  if (isLoading) {
    return (
      <div className="space-y-4">
        <Skeleton className="h-8 w-48" />
        <Skeleton className="h-10 w-full" />
        <Skeleton className="h-10 w-full" />
      </div>
    )
  }

  if (isError || !warehouse) {
    return (
      <div className="rounded-md bg-destructive/10 p-4 text-sm text-destructive">
        {(error as { message?: string })?.message ??
          "Error al cargar el almacén"}
      </div>
    )
  }

  return <WarehouseForm warehouse={warehouse} />
}
