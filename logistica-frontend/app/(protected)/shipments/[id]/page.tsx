import { ShipmentEditView } from "@/components/shipments/shipment-edit-view"

export default async function EditShipmentPage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const { id } = await params
  return (
    <div className="space-y-6">
      <ShipmentEditView id={Number(id)} />
    </div>
  )
}
