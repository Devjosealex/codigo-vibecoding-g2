import { DriverForm } from "@/components/drivers/driver-form"

export default function NewDriverPage() {
  return (
    <div className="space-y-6">
      <h1 className="text-3xl font-semibold tracking-tight">
        Nuevo conductor
      </h1>
      <DriverForm />
    </div>
  )
}
