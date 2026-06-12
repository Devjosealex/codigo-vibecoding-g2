import { Badge } from "@/components/ui/badge"
import {
  Clock,
  CheckCircle2,
  Truck,
  PackageCheck,
  Undo2,
  XCircle,
  ClipboardList,
} from "lucide-react"
import type { ShipmentStatus } from "@/lib/shipments.api"

const statusConfig: Record<
  ShipmentStatus,
  { label: string; icon: typeof Clock; class: string }
> = {
  pending: {
    label: "Pendiente",
    icon: Clock,
    class: "text-amber-600 dark:text-amber-400",
  },
  assigned: {
    label: "Asignado",
    icon: ClipboardList,
    class: "text-blue-600 dark:text-blue-400",
  },
  in_transit: {
    label: "En tránsito",
    icon: Truck,
    class: "text-sky-600 dark:text-sky-400",
  },
  delivered: {
    label: "Entregado",
    icon: PackageCheck,
    class: "text-emerald-600 dark:text-emerald-400",
  },
  returned: {
    label: "Devuelto",
    icon: Undo2,
    class: "text-orange-600 dark:text-orange-400",
  },
  cancelled: {
    label: "Cancelado",
    icon: XCircle,
    class: "text-destructive",
  },
}

interface ShipmentStatusBadgeProps {
  status: ShipmentStatus
}

export function ShipmentStatusBadge({ status }: ShipmentStatusBadgeProps) {
  const config = statusConfig[status] ?? {
    label: status,
    icon: CheckCircle2,
    class: "",
  }
  const Icon = config.icon
  return (
    <Badge variant="outline" className={`gap-1.5 ${config.class}`}>
      <Icon className="h-3 w-3" />
      {config.label}
    </Badge>
  )
}
