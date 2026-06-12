import { RouteEditView } from "@/components/routes/route-edit-view"

export default async function EditRoutePage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const { id } = await params
  return (
    <div className="space-y-6">
      <h1 className="text-3xl font-semibold tracking-tight">Editar ruta</h1>
      <RouteEditView id={Number(id)} />
    </div>
  )
}
