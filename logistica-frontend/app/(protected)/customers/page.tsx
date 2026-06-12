import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Plus } from "lucide-react"
import { CustomersTable } from "@/components/customers/customers-table"

export default function CustomersPage() {
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-semibold tracking-tight">Clientes</h1>
        <Link href="/customers/new">
          <Button>
            <Plus className="h-4 w-4" />
            Nuevo cliente
          </Button>
        </Link>
      </div>
      <CustomersTable />
    </div>
  )
}
