"use client"

import { Button } from "@/components/ui/button"
import type { ShipmentStatus } from "@/lib/shipments.api"
import { useTransitionShipment } from "@/hooks/use-shipments"

const transitionMap: Record<
  ShipmentStatus,
  { label: string; next: ShipmentStatus }[]
> = {
  pending: [
    { label: "Asignar", next: "assigned" },
    { label: "Cancelar", next: "cancelled" },
  ],
  assigned: [
    { label: "Iniciar tránsito", next: "in_transit" },
    { label: "Cancelar", next: "cancelled" },
  ],
  in_transit: [
    { label: "Marcar entregado", next: "delivered" },
    { label: "Marcar devuelto", next: "returned" },
  ],
  delivered: [],
  returned: [],
  cancelled: [],
}

interface ShipmentTransitionsProps {
  shipmentId: number
  currentStatus: ShipmentStatus
}

export function ShipmentTransitions({
  shipmentId,
  currentStatus,
}: ShipmentTransitionsProps) {
  const transitionMutation = useTransitionShipment()
  const transitions = transitionMap[currentStatus] ?? []

  if (transitions.length === 0) return null

  return (
    <div className="flex flex-wrap gap-2">
      {transitions.map((t) => (
        <Button
          key={t.next}
          variant="outline"
          size="sm"
          disabled={transitionMutation.isPending}
          onClick={() =>
            transitionMutation.mutate({
              id: shipmentId,
              status: t.next,
            })
          }
        >
          {transitionMutation.isPending ? "..." : t.label}
        </Button>
      ))}
    </div>
  )
}
