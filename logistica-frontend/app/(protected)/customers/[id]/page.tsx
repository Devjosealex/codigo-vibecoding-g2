import { CustomerEditView } from "@/components/customers/customer-edit-view"

export default async function EditCustomerPage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const { id } = await params
  return (
    <div className="space-y-6">
      <h1 className="text-3xl font-semibold tracking-tight">
        Editar cliente
      </h1>
      <CustomerEditView id={Number(id)} />
    </div>
  )
}
