"use client"

import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { z } from "zod"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { useUpdateProfile } from "@/hooks/use-profile"
import type { Profile } from "@/lib/profile.api"

const profileSchema = z.object({
  username: z.string().min(1, "El nombre de usuario es requerido").max(150),
  email: z.string().min(1, "El email es requerido").email("Email inválido"),
  first_name: z.string().max(150).optional().or(z.literal("")),
  last_name: z.string().max(150).optional().or(z.literal("")),
})

type ProfileFormValues = z.infer<typeof profileSchema>

interface ProfileFormProps {
  profile: Profile
}

export function ProfileForm({ profile }: ProfileFormProps) {
  const updateMutation = useUpdateProfile()

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<ProfileFormValues>({
    resolver: zodResolver(profileSchema),
    defaultValues: {
      username: profile.username,
      email: profile.email,
      first_name: profile.first_name ?? "",
      last_name: profile.last_name ?? "",
    },
  })

  async function onSubmit(data: ProfileFormValues) {
    await updateMutation.mutateAsync({
      ...data,
      first_name: data.first_name || undefined,
      last_name: data.last_name || undefined,
    })
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
      <div className="grid gap-4 sm:grid-cols-2">
        <div className="space-y-2">
          <Label htmlFor="first_name">Nombre</Label>
          <Input id="first_name" {...register("first_name")} />
        </div>

        <div className="space-y-2">
          <Label htmlFor="last_name">Apellido</Label>
          <Input id="last_name" {...register("last_name")} />
        </div>

        <div className="space-y-2">
          <Label htmlFor="username">Usuario *</Label>
          <Input id="username" {...register("username")} />
          {errors.username && (
            <p className="text-sm text-destructive">{errors.username.message}</p>
          )}
        </div>

        <div className="space-y-2">
          <Label htmlFor="email">Email *</Label>
          <Input id="email" type="email" {...register("email")} />
          {errors.email && (
            <p className="text-sm text-destructive">{errors.email.message}</p>
          )}
        </div>
      </div>

      <Button type="submit" disabled={updateMutation.isPending}>
        {updateMutation.isPending ? "Guardando..." : "Guardar cambios"}
      </Button>
    </form>
  )
}
