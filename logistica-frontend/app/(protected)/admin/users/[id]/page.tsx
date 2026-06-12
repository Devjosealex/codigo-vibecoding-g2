// app/(protected)/admin/users/[id]/page.tsx
"use client"

import { use } from "react"
import { useUser } from "@/hooks/use-admin"
import { UserForm } from "@/components/admin/user-form"
import { Skeleton } from "@/components/ui/skeleton"

export default function EditUserPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params)
  const { data: user, isLoading } = useUser(Number(id))

  if (isLoading) {
    return (
      <div className="space-y-4">
        <Skeleton className="h-8 w-48" />
        <Skeleton className="h-64 w-full" />
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <h1 className="text-3xl font-semibold tracking-tight">
        Editar usuario: {user?.username}
      </h1>
      {user && <UserForm user={user} />}
    </div>
  )
}
