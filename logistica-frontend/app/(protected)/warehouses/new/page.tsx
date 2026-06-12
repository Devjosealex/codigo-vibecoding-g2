import { WarehouseForm } from "@/components/warehouses/warehouse-form"

export default function NewWarehousePage() {
  return (
    <div className="space-y-6">
      <h1 className="text-3xl font-semibold tracking-tight">
        Nuevo almacén
      </h1>
      <WarehouseForm />
    </div>
  )
}
