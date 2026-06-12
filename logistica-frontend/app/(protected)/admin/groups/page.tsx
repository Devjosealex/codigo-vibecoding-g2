// app/(protected)/admin/groups/page.tsx
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Plus } from "lucide-react"
import { GroupsTable } from "@/components/admin/groups-table"

export default function AdminGroupsPage() {
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-semibold tracking-tight">Grupos</h1>
        <Link href="/admin/groups/new">
          <Button>
            <Plus className="h-4 w-4" />
            Nuevo grupo
          </Button>
        </Link>
      </div>
      <GroupsTable />
    </div>
  )
}
