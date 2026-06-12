import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Plus } from "lucide-react"
import { SuppliersTable } from "@/components/suppliers/suppliers-table"

export default function SuppliersPage() {
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-semibold tracking-tight">Proveedores</h1>
        <Link href="/suppliers/new">
          <Button>
            <Plus className="h-4 w-4" />
            Nuevo proveedor
          </Button>
        </Link>
      </div>
      <SuppliersTable />
    </div>
  )
}
