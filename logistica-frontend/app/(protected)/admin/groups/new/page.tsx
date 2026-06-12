// app/(protected)/admin/groups/new/page.tsx
import { GroupForm } from "@/components/admin/group-form"

export default function NewGroupPage() {
  return (
    <div className="space-y-6">
      <h1 className="text-3xl font-semibold tracking-tight">Nuevo grupo</h1>
      <GroupForm />
    </div>
  )
}
