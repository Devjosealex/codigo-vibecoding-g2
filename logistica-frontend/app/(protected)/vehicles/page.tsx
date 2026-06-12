import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Plus } from "lucide-react"
import { VehiclesTable } from "@/components/vehicles/vehicles-table"

export default function VehiclesPage() {
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-semibold tracking-tight">Vehículos</h1>
        <Link href="/vehicles/new">
          <Button>
            <Plus className="h-4 w-4" />
            Nuevo vehículo
          </Button>
        </Link>
      </div>
      <VehiclesTable />
    </div>
  )
}
