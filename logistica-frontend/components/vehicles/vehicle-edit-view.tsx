"use client"

import { useVehicle } from "@/hooks/use-vehicles"
import { VehicleForm } from "@/components/vehicles/vehicle-form"
import { Skeleton } from "@/components/ui/skeleton"

interface VehicleEditViewProps {
  id: number
}

export function VehicleEditView({ id }: VehicleEditViewProps) {
  const { data: vehicle, isLoading, isError, error } = useVehicle(id)

  if (isLoading) {
    return (
      <div className="space-y-4">
        <Skeleton className="h-8 w-48" />
        <Skeleton className="h-10 w-full" />
        <Skeleton className="h-10 w-full" />
      </div>
    )
  }

  if (isError || !vehicle) {
    return (
      <div className="rounded-md bg-destructive/10 p-4 text-sm text-destructive">
        {(error as { message?: string })?.message ??
          "Error al cargar el vehículo"}
      </div>
    )
  }

  return <VehicleForm vehicle={vehicle} />
}
