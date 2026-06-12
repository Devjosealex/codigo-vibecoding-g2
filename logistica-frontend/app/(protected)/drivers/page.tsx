import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Plus } from "lucide-react"
import { DriversTable } from "@/components/drivers/drivers-table"

export default function DriversPage() {
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-semibold tracking-tight">Conductores</h1>
        <Link href="/drivers/new">
          <Button>
            <Plus className="h-4 w-4" />
            Nuevo conductor
          </Button>
        </Link>
      </div>
      <DriversTable />
    </div>
  )
}
