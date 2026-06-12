"use client"

import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { z } from "zod"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import {
  useCreateWarehouse,
  useUpdateWarehouse,
} from "@/hooks/use-warehouses"
import type { Warehouse } from "@/lib/warehouses.api"

const warehouseSchema = z.object({
  name: z.string().min(1, "El nombre es requerido").max(200),
  address: z.string().optional().or(z.literal("")),
  city: z.string().max(100).optional().or(z.literal("")),
  country: z.string().optional().or(z.literal("")),
  latitude: z.string().optional().or(z.literal("")),
  longitude: z.string().optional().or(z.literal("")),
  capacity_m3: z.string().optional().or(z.literal("")),
})

type WarehouseFormValues = z.infer<typeof warehouseSchema>

interface WarehouseFormProps {
  warehouse?: Warehouse
}

export function WarehouseForm({ warehouse }: WarehouseFormProps) {
  const router = useRouter()
  const createMutation = useCreateWarehouse()
  const updateMutation = useUpdateWarehouse(warehouse?.id ?? 0)
  const isEditing = !!warehouse

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<WarehouseFormValues>({
    resolver: zodResolver(warehouseSchema),
    defaultValues: warehouse
      ? {
          name: warehouse.name,
          address: warehouse.address ?? "",
          city: warehouse.city ?? "",
          country: warehouse.country ?? "Peru",
          latitude: warehouse.latitude?.toString() ?? "",
          longitude: warehouse.longitude?.toString() ?? "",
          capacity_m3: warehouse.capacity_m3 ?? "",
        }
      : {
          country: "Peru",
        },
  })

  async function onSubmit(data: WarehouseFormValues) {
    const payload = {
      ...data,
      address: data.address || undefined,
      city: data.city || undefined,
      country: data.country || "Peru",
      latitude: data.latitude || undefined,
      longitude: data.longitude || undefined,
      capacity_m3: data.capacity_m3 || undefined,
    }

    if (isEditing && warehouse) {
      await updateMutation.mutateAsync(payload)
    } else {
      await createMutation.mutateAsync(payload)
    }
    router.push("/warehouses")
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

        <div className="space-y-2">
          <Label htmlFor="latitude">Latitud</Label>
          <Input
            id="latitude"
            type="number"
            step="any"
            {...register("latitude")}
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="longitude">Longitud</Label>
          <Input
            id="longitude"
            type="number"
            step="any"
            {...register("longitude")}
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="capacity_m3">Capacidad (m³)</Label>
          <Input
            id="capacity_m3"
            type="number"
            step="0.01"
            {...register("capacity_m3")}
          />
        </div>
      </div>

      <div className="flex gap-2">
        <Button type="submit" disabled={isPending}>
          {isPending
            ? "Guardando..."
            : isEditing
              ? "Actualizar almacén"
              : "Crear almacén"}
        </Button>
        <Button
          type="button"
          variant="outline"
          onClick={() => router.push("/warehouses")}
        >
          Cancelar
        </Button>
      </div>
    </form>
  )
}
