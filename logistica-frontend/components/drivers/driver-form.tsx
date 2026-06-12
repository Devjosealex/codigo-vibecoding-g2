"use client"

import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { z } from "zod"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { DatePicker } from "@/components/shared/date-picker"
import {
  useCreateDriver,
  useUpdateDriver,
} from "@/hooks/use-drivers"
import type { Driver } from "@/lib/drivers.api"

const driverSchema = z.object({
  first_name: z.string().min(1, "El nombre es requerido").max(100),
  last_name: z.string().min(1, "El apellido es requerido").max(100),
  document_number: z.string().max(20).optional().or(z.literal("")),
  license_number: z.string().max(50).optional().or(z.literal("")),
  license_expiry: z.string().optional().or(z.literal("")),
  phone: z.string().max(20).optional().or(z.literal("")),
  email: z.string().min(1, "El email es requerido").email("Email inválido"),
})

type DriverFormValues = z.infer<typeof driverSchema>

interface DriverFormProps {
  driver?: Driver
}

export function DriverForm({ driver }: DriverFormProps) {
  const router = useRouter()
  const createMutation = useCreateDriver()
  const updateMutation = useUpdateDriver(driver?.id ?? 0)
  const isEditing = !!driver

  const {
    register,
    handleSubmit,
    setValue,
    watch,
    formState: { errors },
  } = useForm<DriverFormValues>({
    resolver: zodResolver(driverSchema),
    defaultValues: driver
      ? {
          first_name: driver.first_name,
          last_name: driver.last_name,
          document_number: driver.document_number ?? "",
          license_number: driver.license_number ?? "",
          license_expiry: driver.license_expiry ?? "",
          phone: driver.phone ?? "",
          email: driver.email,
        }
      : {
          license_expiry: "",
        },
  })

  async function onSubmit(data: DriverFormValues) {
    const payload = {
      ...data,
      document_number: data.document_number || undefined,
      license_number: data.license_number || undefined,
      license_expiry: data.license_expiry || undefined,
      phone: data.phone || undefined,
    }

    if (isEditing && driver) {
      await updateMutation.mutateAsync(payload)
    } else {
      await createMutation.mutateAsync(payload)
    }
    router.push("/drivers")
  }

  const isPending = createMutation.isPending || updateMutation.isPending

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
      <div className="grid gap-4 sm:grid-cols-2">
        <div className="space-y-2">
          <Label htmlFor="first_name">Nombre *</Label>
          <Input id="first_name" {...register("first_name")} />
          {errors.first_name && (
            <p className="text-sm text-destructive">
              {errors.first_name.message}
            </p>
          )}
        </div>

        <div className="space-y-2">
          <Label htmlFor="last_name">Apellido *</Label>
          <Input id="last_name" {...register("last_name")} />
          {errors.last_name && (
            <p className="text-sm text-destructive">
              {errors.last_name.message}
            </p>
          )}
        </div>

        <div className="space-y-2">
          <Label htmlFor="email">Email *</Label>
          <Input id="email" type="email" {...register("email")} />
          {errors.email && (
            <p className="text-sm text-destructive">{errors.email.message}</p>
          )}
        </div>

        <div className="space-y-2">
          <Label htmlFor="phone">Teléfono</Label>
          <Input id="phone" {...register("phone")} />
        </div>

        <div className="space-y-2">
          <Label htmlFor="document_number">Nro. documento</Label>
          <Input id="document_number" {...register("document_number")} />
        </div>

        <div className="space-y-2">
          <Label htmlFor="license_number">Nro. licencia</Label>
          <Input id="license_number" {...register("license_number")} />
        </div>

        <div className="space-y-2">
          <Label htmlFor="license_expiry">Vencimiento licencia</Label>
          <DatePicker
            value={watch("license_expiry") ?? ""}
            onChange={(v) => setValue("license_expiry", v)}
            placeholder="Seleccionar fecha"
          />
        </div>
      </div>

      <div className="flex gap-2">
        <Button type="submit" disabled={isPending}>
          {isPending
            ? "Guardando..."
            : isEditing
              ? "Actualizar conductor"
              : "Crear conductor"}
        </Button>
        <Button
          type="button"
          variant="outline"
          onClick={() => router.push("/drivers")}
        >
          Cancelar
        </Button>
      </div>
    </form>
  )
}
