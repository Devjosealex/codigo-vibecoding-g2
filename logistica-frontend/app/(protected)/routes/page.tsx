import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Plus } from "lucide-react"
import { RoutesTable } from "@/components/routes/routes-table"

export default function RoutesPage() {
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-semibold tracking-tight">Rutas</h1>
        <Link href="/routes/new">
          <Button>
            <Plus className="h-4 w-4" />
            Nueva ruta
          </Button>
        </Link>
      </div>
      <RoutesTable />
    </div>
  )
}
