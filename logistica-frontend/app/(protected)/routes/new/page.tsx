import { RouteForm } from "@/components/routes/route-form"

export default function NewRoutePage() {
  return (
    <div className="space-y-6">
      <h1 className="text-3xl font-semibold tracking-tight">Nueva ruta</h1>
      <RouteForm />
    </div>
  )
}
