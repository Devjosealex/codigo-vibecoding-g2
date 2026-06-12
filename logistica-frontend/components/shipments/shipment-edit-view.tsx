"use client"

import { useShipment } from "@/hooks/use-shipments"
import { ShipmentForm } from "@/components/shipments/shipment-form"
import { ShipmentTransitions } from "@/components/shipments/shipment-transitions"
import { ShipmentStatusBadge } from "@/components/shipments/shipment-status-badge"
import { ShipmentItems } from "@/components/shipments/shipment-items"
import { Skeleton } from "@/components/ui/skeleton"
import { Separator } from "@/components/ui/separator"

interface ShipmentEditViewProps {
  id: number
}

export function ShipmentEditView({ id }: ShipmentEditViewProps) {
  const { data: shipment, isLoading, isError, error } = useShipment(id)

  if (isLoading) {
    return (
      <div className="space-y-4">
        <Skeleton className="h-8 w-48" />
        <Skeleton className="h-10 w-full" />
        <Skeleton className="h-10 w-full" />
      </div>
    )
  }

  if (isError || !shipment) {
    return (
      <div className="rounded-md bg-destructive/10 p-4 text-sm text-destructive">
        {(error as { message?: string })?.message ??
          "Error al cargar el envío"}
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3">
        <h1 className="text-3xl font-semibold tracking-tight">
          Envío {shipment.tracking_number}
        </h1>
        <ShipmentStatusBadge status={shipment.status} />
      </div>

      {shipment.calculated_cost && (
        <p className="text-sm text-muted-foreground">
          Costo calculado: S/{" "}
          {Number(shipment.calculated_cost).toFixed(2)}
        </p>
      )}

      <Separator />

      <ShipmentTransitions
        shipmentId={id}
        currentStatus={shipment.status}
      />

      <ShipmentForm shipment={shipment} />
      <ShipmentItems shipmentId={id} />
    </div>
  )
}
