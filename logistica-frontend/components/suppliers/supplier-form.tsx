"use client"

import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { z } from "zod"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import {
  useCreateSupplier,
  useUpdateSupplier,
} from "@/hooks/use-suppliers"
import type { Supplier } from "@/lib/suppliers.api"

const supplierSchema = z.object({
  name: z.string().min(1, "El nombre es requerido").max(200),
  contact_name: z.string().max(100).optional().or(z.literal("")),
  tax_id: z.string().max(20).optional().or(z.literal("")),
  email: z.string().min(1, "El email es requerido").email("Email inválido"),
  phone: z.string().max(20).optional().or(z.literal("")),
  address: z.string().optional().or(z.literal("")),
  city: z.string().max(100).optional().or(z.literal("")),
  country: z.string().optional().or(z.literal("")),
})

type SupplierFormValues = z.infer<typeof supplierSchema>

interface SupplierFormProps {
  supplier?: Supplier
}

export function SupplierForm({ supplier }: SupplierFormProps) {
  const router = useRouter()
  const createMutation = useCreateSupplier()
  const updateMutation = useUpdateSupplier(supplier?.id ?? 0)
  const isEditing = !!supplier

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<SupplierFormValues>({
    resolver: zodResolver(supplierSchema),
    defaultValues: supplier
      ? {
          name: supplier.name,
          contact_name: supplier.contact_name ?? "",
          tax_id: supplier.tax_id ?? "",
          email: supplier.email,
          phone: supplier.phone ?? "",
          address: supplier.address ?? "",
          city: supplier.city ?? "",
          country: supplier.country ?? "Peru",
        }
      : {
          country: "Peru",
        },
  })

  async function onSubmit(data: SupplierFormValues) {
    const payload = {
      ...data,
      contact_name: data.contact_name || undefined,
      tax_id: data.tax_id || undefined,
      phone: data.phone || undefined,
      address: data.address || undefined,
      city: data.city || undefined,
      country: data.country || "Peru",
    }

    if (isEditing && supplier) {
      await updateMutation.mutateAsync(payload)
    } else {
      await createMutation.mutateAsync(payload)
    }
    router.push("/suppliers")
  }

  const isPending = createMutation.isPending || updateMutation.isPending

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
      <div className="grid gap-4 sm:grid-cols-2">
        <div className="space-y-2 sm:col-span-2">
          <Label htmlFor="name">Nombre *</Label>
          <Input id="name" {...register("name")} />
          {errors.name && (
            <p className="text-sm text-destructive">{errors.name.message}</p>
          )}
        </div>

        <div className="space-y-2">
          <Label htmlFor="contact_name">Nombre de contacto</Label>
          <Input id="contact_name" {...register("contact_name")} />
        </div>

        <div className="space-y-2">
          <Label htmlFor="tax_id">RUC</Label>
          <Input id="tax_id" {...register("tax_id")} />
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

        <div className="space-y-2 sm:col-span-2">
          <Label htmlFor="address">Dirección</Label>
          <Input id="address" {...register("address")} />
        </div>

        <div className="space-y-2">
          <Label htmlFor="city">Ciudad</Label>
          <Input id="city" {...register("city")} />
        </div>

        <div className="space-y-2">
          <Label htmlFor="country">País</Label>
          <Input id="country" {...register("country")} />
        </div>
      </div>

      <div className="flex gap-2">
        <Button type="submit" disabled={isPending}>
          {isPending
            ? "Guardando..."
            : isEditing
              ? "Actualizar proveedor"
              : "Crear proveedor"}
        </Button>
        <Button
          type="button"
          variant="outline"
          onClick={() => router.push("/suppliers")}
        >
          Cancelar
        </Button>
      </div>
    </form>
  )
}
