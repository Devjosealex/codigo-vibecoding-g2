import { WarehouseEditView } from "@/components/warehouses/warehouse-edit-view"

export default async function EditWarehousePage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const { id } = await params
  return (
    <div className="space-y-6">
      <h1 className="text-3xl font-semibold tracking-tight">
        Editar almacén
      </h1>
      <WarehouseEditView id={Number(id)} />
    </div>
  )
}
