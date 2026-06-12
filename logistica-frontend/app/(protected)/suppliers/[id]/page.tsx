import { SupplierEditView } from "@/components/suppliers/supplier-edit-view"

export default async function EditSupplierPage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const { id } = await params
  return (
    <div className="space-y-6">
      <h1 className="text-3xl font-semibold tracking-tight">
        Editar proveedor
      </h1>
      <SupplierEditView id={Number(id)} />
    </div>
  )
}
