// app/(protected)/admin/groups/[id]/page.tsx
"use client"

import { use } from "react"
import { useGroup } from "@/hooks/use-admin"
import { GroupForm } from "@/components/admin/group-form"
import { Skeleton } from "@/components/ui/skeleton"

export default function EditGroupPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params)
  const { data: group, isLoading } = useGroup(Number(id))

  if (isLoading) {
    return (
      <div className="space-y-4">
        <Skeleton className="h-8 w-48" />
        <Skeleton className="h-32 w-full" />
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <h1 className="text-3xl font-semibold tracking-tight">
        Editar grupo: {group?.name}
      </h1>
      {group && <GroupForm group={group} />}
    </div>
  )
}
