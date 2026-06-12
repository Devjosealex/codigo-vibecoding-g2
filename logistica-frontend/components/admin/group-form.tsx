"use client"

import { useState, useMemo } from "react"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { z } from "zod"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Search } from "lucide-react"
import { useCreateGroup, useUpdateGroup, usePermissions } from "@/hooks/use-admin"
import type { AdminGroup } from "@/types/admin"

const groupSchema = z.object({
  name: z.string().min(1, "El nombre es requerido").max(150),
})

type GroupFormValues = z.infer<typeof groupSchema>

interface GroupFormProps {
  group?: AdminGroup
}

export function GroupForm({ group }: GroupFormProps) {
  const router = useRouter()
  const createMutation = useCreateGroup()
  const updateMutation = useUpdateGroup(group?.id ?? 0)
  const isEditing = !!group

  const { data: permissions = [] } = usePermissions()
  const [selectedIds, setSelectedIds] = useState<number[]>(
    group?.permissions.map((p) => p.id) ?? []
  )
  const [search, setSearch] = useState("")

  const filtered = useMemo(() => {
    const q = search.toLowerCase()
    return q ? permissions.filter((p) => p.name.toLowerCase().includes(q)) : permissions
  }, [permissions, search])

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<GroupFormValues>({
    resolver: zodResolver(groupSchema),
    defaultValues: group ? { name: group.name } : {},
  })

  function togglePermission(id: number) {
    setSelectedIds((prev) =>
      prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]
    )
  }

  async function onSubmit(data: GroupFormValues) {
    const payload = { name: data.name, permission_ids: selectedIds }
    if (isEditing && group) {
      await updateMutation.mutateAsync(payload)
    } else {
      await createMutation.mutateAsync(payload)
    }
    router.push("/admin/groups")
  }

  const isPending = createMutation.isPending || updateMutation.isPending

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
      <div className="space-y-2 max-w-sm">
        <Label htmlFor="name">Nombre del grupo *</Label>
        <Input id="name" {...register("name")} />
        {errors.name && (
          <p className="text-sm text-destructive">{errors.name.message}</p>
        )}
      </div>

      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <Label>Permisos</Label>
          <span className="text-xs text-muted-foreground">
            {selectedIds.length} de {permissions.length} seleccionados
          </span>
        </div>

        <div className="relative max-w-sm">
          <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Buscar permiso..."
            className="pl-8"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>

        <div className="rounded-md border max-h-72 overflow-y-auto p-3 space-y-1.5">
          {filtered.length === 0 ? (
            <p className="text-sm text-muted-foreground text-center py-4">
              Sin resultados
            </p>
          ) : (
            filtered.map((permission) => (
              <label
                key={permission.id}
                className="flex items-center gap-2.5 rounded px-1.5 py-1 cursor-pointer hover:bg-muted/50 select-none"
              >
                <input
                  type="checkbox"
                  className="h-4 w-4 rounded border accent-primary"
                  checked={selectedIds.includes(permission.id)}
                  onChange={() => togglePermission(permission.id)}
                />
                <span className="text-sm">{permission.name}</span>
              </label>
            ))
          )}
        </div>
      </div>

      <div className="flex gap-2">
        <Button type="submit" disabled={isPending}>
          {isPending ? "Guardando..." : isEditing ? "Actualizar grupo" : "Crear grupo"}
        </Button>
        <Button
          type="button"
          variant="outline"
          onClick={() => router.push("/admin/groups")}
        >
          Cancelar
        </Button>
      </div>
    </form>
  )
}
