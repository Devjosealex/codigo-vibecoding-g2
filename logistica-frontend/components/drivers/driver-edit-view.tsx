"use client"

import { useDriver } from "@/hooks/use-drivers"
import { DriverForm } from "@/components/drivers/driver-form"
import { Skeleton } from "@/components/ui/skeleton"

interface DriverEditViewProps {
  id: number
}

export function DriverEditView({ id }: DriverEditViewProps) {
  const { data: driver, isLoading, isError, error } = useDriver(id)

  if (isLoading) {
    return (
      <div className="space-y-4">
        <Skeleton className="h-8 w-48" />
        <Skeleton className="h-10 w-full" />
        <Skeleton className="h-10 w-full" />
      </div>
    )
  }

  if (isError || !driver) {
    return (
      <div className="rounded-md bg-destructive/10 p-4 text-sm text-destructive">
        {(error as { message?: string })?.message ??
          "Error al cargar el conductor"}
      </div>
    )
  }

  return <DriverForm driver={driver} />
}
