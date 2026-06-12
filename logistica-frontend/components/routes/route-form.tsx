"use client"

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
import {
  useCreateRoute,
  useUpdateRoute,
  useRouteWarehouses,
} from "@/hooks/use-routes"
import type { Route } from "@/lib/routes.api"

const routeSchema = z.object({
  name: z.string().min(1, "El nombre es requerido").max(200),
  origin_warehouse: z.number().nullable().optional(),
  distance_km: z.string().optional().or(z.literal("")),
  estimated_duration_h: z.string().optional().or(z.literal("")),
})

type RouteFormValues = z.infer<typeof routeSchema>

interface RouteFormProps {
  route?: Route
  onSaved?: () => void
}

export function RouteForm({ route, onSaved }: RouteFormProps) {
  const router = useRouter()
  const createMutation = useCreateRoute()
  const updateMutation = useUpdateRoute(route?.id ?? 0)
  const { data: warehouses } = useRouteWarehouses()
  const isEditing = !!route

  const {
    register,
    handleSubmit,
    setValue,
    watch,
    formState: { errors },
  } = useForm<RouteFormValues>({
    resolver: zodResolver(routeSchema),
    defaultValues: route
      ? {
          name: route.name,
          origin_warehouse: route.origin_warehouse,
          distance_km: route.distance_km ?? "",
          estimated_duration_h: route.estimated_duration_h ?? "",
        }
      : {
          origin_warehouse: null,
        },
  })

  const selectedWarehouse = watch("origin_warehouse")

  async function onSubmit(data: RouteFormValues) {
    const payload = {
      ...data,
      distance_km: data.distance_km || undefined,
      estimated_duration_h: data.estimated_duration_h || undefined,
    }

    if (isEditing && route) {
      await updateMutation.mutateAsync(payload)
    } else {
      await createMutation.mutateAsync(payload)
    }

    if (onSaved) {
      onSaved()
    } else {
      router.push("/routes")
    }
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
          <Label>Almacén origen</Label>
          <Select
            value={selectedWarehouse?.toString() ?? ""}
            onValueChange={(v) =>
              setValue("origin_warehouse", v ? Number(v) : null)
            }
          >
            <SelectTrigger>
              <SelectValue placeholder="Seleccionar almacén" />
            </SelectTrigger>
            <SelectContent>
              {(warehouses ?? []).map((w) => (
                <SelectItem key={w.id} value={String(w.id)}>
                  {w.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div className="space-y-2">
          <Label htmlFor="distance_km">Distancia (km)</Label>
          <Input
            id="distance_km"
            type="number"
            step="0.01"
            {...register("distance_km")}
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="estimated_duration_h">Duración estimada (h)</Label>
          <Input
            id="estimated_duration_h"
            type="number"
            step="0.5"
            {...register("estimated_duration_h")}
          />
        </div>
      </div>

      <div className="flex gap-2">
        <Button type="submit" disabled={isPending}>
          {isPending
            ? "Guardando..."
            : isEditing
              ? "Actualizar ruta"
              : "Crear ruta"}
        </Button>
        <Button
          type="button"
          variant="outline"
          onClick={() => router.push("/routes")}
        >
          Cancelar
        </Button>
      </div>
    </form>
  )
}
