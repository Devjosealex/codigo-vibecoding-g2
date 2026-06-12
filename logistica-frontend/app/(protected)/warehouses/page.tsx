import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Plus } from "lucide-react"
import { WarehousesTable } from "@/components/warehouses/warehouses-table"

export default function WarehousesPage() {
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-semibold tracking-tight">Almacenes</h1>
        <Link href="/warehouses/new">
          <Button>
            <Plus className="h-4 w-4" />
            Nuevo almacén
          </Button>
        </Link>
      </div>
      <WarehousesTable />
    </div>
  )
}
