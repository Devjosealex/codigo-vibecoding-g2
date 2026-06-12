import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Plus } from "lucide-react"
import { ProductsTable } from "@/components/products/products-table"

export default function ProductsPage() {
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-semibold tracking-tight">Productos</h1>
        <Link href="/products/new">
          <Button>
            <Plus className="h-4 w-4" />
            Nuevo producto
          </Button>
        </Link>
      </div>
      <ProductsTable />
    </div>
  )
}
