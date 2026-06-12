// components/admin/user-form.tsx
"use client"

import { useState } from "react"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { z } from "zod"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { useCreateUser, useUpdateUser, useSetUserGroups, useGroups } from "@/hooks/use-admin"
import type { AdminUser } from "@/types/admin"

const userSchema = z.object({
  username: z.string().min(1, "El usuario es requerido").max(150),
  email: z.string().email("Email inválido").optional().or(z.literal("")),
  first_name: z.string().max(150).optional().or(z.literal("")),
  last_name: z.string().max(150).optional().or(z.literal("")),
  password: z.string().min(8, "Mínimo 8 caracteres").optional().or(z.literal("")),
  is_active: z.boolean().optional(),
  is_staff: z.boolean().optional(),
  is_superuser: z.boolean().optional(),
})

type UserFormValues = z.infer<typeof userSchema>

interface UserFormProps {
  user?: AdminUser
}

export function UserForm({ user }: UserFormProps) {
  const router = useRouter()
  const createMutation = useCreateUser()
  const updateMutation = useUpdateUser(user?.id ?? 0)
  const setGroupsMutation = useSetUserGroups(user?.id ?? 0)
  const isEditing = !!user

  const { data: groupsData } = useGroups({})
  const availableGroups = groupsData?.results ?? []

  const [selectedGroupIds, setSelectedGroupIds] = useState<number[]>(
    user?.groups.map((g) => g.id) ?? []
  )

  const {
    register,
    handleSubmit,
    setValue,
    watch,
    formState: { errors },
  } = useForm<UserFormValues>({
    resolver: zodResolver(userSchema),
    defaultValues: user
      ? {
          username: user.username,
          email: user.email ?? "",
          first_name: user.first_name ?? "",
          last_name: user.last_name ?? "",
          is_active: user.is_active,
          is_staff: user.is_staff,
          is_superuser: user.is_superuser,
        }
      : {
          is_active: true,
          is_staff: false,
          is_superuser: false,
        },
  })

  const isActive = watch("is_active")
  const isStaff = watch("is_staff")
  const isSuperuser = watch("is_superuser")

  function toggleGroup(id: number) {
    setSelectedGroupIds((prev) =>
      prev.includes(id) ? prev.filter((g) => g !== id) : [...prev, id]
    )
  }

  async function onSubmit(data: UserFormValues) {
    const payload = {
      ...data,
      email: data.email || undefined,
      first_name: data.first_name || undefined,
      last_name: data.last_name || undefined,
      password: data.password || undefined,
    }
    if (isEditing && user) {
      await updateMutation.mutateAsync(payload)
      await setGroupsMutation.mutateAsync(selectedGroupIds)
    } else {
      const created = await createMutation.mutateAsync(payload)
      if (selectedGroupIds.length > 0) {
        // setGroupsMutation hook uses user.id — for new users use direct API call
        const { setUserGroups } = await import("@/lib/admin.api")
        await setUserGroups(created.id, selectedGroupIds)
      }
    }
    router.push("/admin/users")
  }

  const isPending =
    createMutation.isPending || updateMutation.isPending || setGroupsMutation.isPending

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
      <div className="grid gap-4 sm:grid-cols-2">
        <div className="space-y-2">
          <Label htmlFor="username">Usuario *</Label>
          <Input id="username" {...register("username")} />
          {errors.username && (
            <p className="text-sm text-destructive">{errors.username.message}</p>
          )}
        </div>

        <div className="space-y-2">
          <Label htmlFor="email">Email</Label>
          <Input id="email" type="email" {...register("email")} />
          {errors.email && (
            <p className="text-sm text-destructive">{errors.email.message}</p>
          )}
        </div>

        <div className="space-y-2">
          <Label htmlFor="first_name">Nombre</Label>
          <Input id="first_name" {...register("first_name")} />
        </div>

        <div className="space-y-2">
          <Label htmlFor="last_name">Apellido</Label>
          <Input id="last_name" {...register("last_name")} />
        </div>

        <div className="space-y-2">
          <Label htmlFor="password">
            {isEditing ? "Nueva contraseña (dejar vacío para no cambiar)" : "Contraseña *"}
          </Label>
          <Input id="password" type="password" {...register("password")} />
          {errors.password && (
            <p className="text-sm text-destructive">{errors.password.message}</p>
          )}
        </div>

        <div className="space-y-2">
          <Label>Estado activo</Label>
          <Select
            value={isActive ? "true" : "false"}
            onValueChange={(v) => setValue("is_active", v === "true")}
          >
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="true">Activo</SelectItem>
              <SelectItem value="false">Inactivo</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <div className="space-y-2">
          <Label>Staff</Label>
          <Select
            value={isStaff ? "true" : "false"}
            onValueChange={(v) => setValue("is_staff", v === "true")}
          >
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="true">Sí</SelectItem>
              <SelectItem value="false">No</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <div className="space-y-2">
          <Label>Superadmin</Label>
          <Select
            value={isSuperuser ? "true" : "false"}
            onValueChange={(v) => setValue("is_superuser", v === "true")}
          >
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="true">Sí</SelectItem>
              <SelectItem value="false">No</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      {availableGroups.length > 0 && (
        <div className="space-y-2">
          <Label>Grupos</Label>
          <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
            {availableGroups.map((group) => (
              <div key={group.id} className="flex items-center gap-2">
                <input
                  type="checkbox"
                  id={`group-${group.id}`}
                  checked={selectedGroupIds.includes(group.id)}
                  onChange={() => toggleGroup(group.id)}
                  className="h-4 w-4 rounded border border-input accent-primary cursor-pointer"
                />
                <label htmlFor={`group-${group.id}`} className="text-sm cursor-pointer">
                  {group.name}
                </label>
              </div>
            ))}
          </div>
        </div>
      )}

      <div className="flex gap-2">
        <Button type="submit" disabled={isPending}>
          {isPending ? "Guardando..." : isEditing ? "Actualizar usuario" : "Crear usuario"}
        </Button>
        <Button type="button" variant="outline" onClick={() => router.push("/admin/users")}>
          Cancelar
        </Button>
      </div>
    </form>
  )
}
