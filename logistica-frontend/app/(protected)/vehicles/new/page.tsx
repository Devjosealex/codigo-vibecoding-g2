import { VehicleForm } from "@/components/vehicles/vehicle-form"

export default function NewVehiclePage() {
  return (
    <div className="space-y-6">
      <h1 className="text-3xl font-semibold tracking-tight">
        Nuevo vehículo
      </h1>
      <VehicleForm />
    </div>
  )
}
