import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Plus } from "lucide-react"
import { ShipmentsTable } from "@/components/shipments/shipments-table"

export default function ShipmentsPage() {
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-semibold tracking-tight">Envíos</h1>
        <Link href="/shipments/new">
          <Button>
            <Plus className="h-4 w-4" />
            Nuevo envío
          </Button>
        </Link>
      </div>
      <ShipmentsTable />
    </div>
  )
}
