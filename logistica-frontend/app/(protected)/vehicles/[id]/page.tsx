import { VehicleEditView } from "@/components/vehicles/vehicle-edit-view"

export default async function EditVehiclePage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const { id } = await params
  return (
    <div className="space-y-6">
      <h1 className="text-3xl font-semibold tracking-tight">
        Editar vehículo
      </h1>
      <VehicleEditView id={Number(id)} />
    </div>
  )
}
