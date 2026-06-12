import { ShipmentForm } from "@/components/shipments/shipment-form"

export default function NewShipmentPage() {
  return (
    <div className="space-y-6">
      <h1 className="text-3xl font-semibold tracking-tight">
        Nuevo envío
      </h1>
      <ShipmentForm />
    </div>
  )
}
