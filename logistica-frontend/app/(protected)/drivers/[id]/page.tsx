import { DriverEditView } from "@/components/drivers/driver-edit-view"

export default async function EditDriverPage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const { id } = await params
  return (
    <div className="space-y-6">
      <h1 className="text-3xl font-semibold tracking-tight">
        Editar conductor
      </h1>
      <DriverEditView id={Number(id)} />
    </div>
  )
}
