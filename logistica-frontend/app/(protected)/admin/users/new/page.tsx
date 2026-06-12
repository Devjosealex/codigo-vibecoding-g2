// app/(protected)/admin/users/new/page.tsx
import { UserForm } from "@/components/admin/user-form"

export default function NewUserPage() {
  return (
    <div className="space-y-6">
      <h1 className="text-3xl font-semibold tracking-tight">Nuevo usuario</h1>
      <UserForm />
    </div>
  )
}
