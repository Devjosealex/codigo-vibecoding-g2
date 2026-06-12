// app/(protected)/admin/users/page.tsx
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Plus } from "lucide-react"
import { UsersTable } from "@/components/admin/users-table"

export default function AdminUsersPage() {
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-semibold tracking-tight">Usuarios</h1>
        <Link href="/admin/users/new">
          <Button>
            <Plus className="h-4 w-4" />
            Nuevo usuario
          </Button>
        </Link>
      </div>
      <UsersTable />
    </div>
  )
}
