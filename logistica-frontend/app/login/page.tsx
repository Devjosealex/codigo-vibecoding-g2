import { LoginForm } from "@/components/auth/login-form"
import { Truck } from "lucide-react"

export default function LoginPage() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-muted/50 p-4">
      <div className="w-full max-w-sm space-y-6 rounded-xl border bg-card p-8 shadow-sm">
        <div className="space-y-4 text-center">
          <div className="flex justify-center">
            <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-primary text-primary-foreground">
              <Truck className="h-6 w-6" />
            </div>
          </div>
          <div className="space-y-1">
            <h1 className="text-2xl font-semibold tracking-tight">Logística</h1>
            <p className="text-sm text-muted-foreground">
              Ingresa tus credenciales para acceder
            </p>
          </div>
        </div>
        <LoginForm />
      </div>
    </div>
  )
}
