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
  useCreateVehicle,
  useUpdateVehicle,
  useVehicleDrivers,
} from "@/hooks/use-vehicles"
import type { Vehicle } from "@/lib/vehicles.api"

const vehicleSchema = z.object({
  name: z.string().min(1, "El nombre es requerido").max(200),
  plate_number: z.string().min(1, "La placa es requerida").max(20),
  vehicle_type: z.enum(["truck", "van", "motorcycle", "other"]),
  driver: z.number().nullable().optional(),
  capacity_kg: z.string().optional().or(z.literal("")),
  capacity_m3: z.string().optional().or(z.literal("")),
})

type VehicleFormValues = z.infer<typeof vehicleSchema>

interface VehicleFormProps {
  vehicle?: Vehicle
}

export function VehicleForm({ vehicle }: VehicleFormProps) {
  const router = useRouter()
  const createMutation = useCreateVehicle()
  const updateMutation = useUpdateVehicle(vehicle?.id ?? 0)
  const { data: drivers } = useVehicleDrivers()
  const isEditing = !!vehicle

  const {
    register,
    handleSubmit,
    setValue,
    watch,
    formState: { errors },
  } = useForm<VehicleFormValues>({
    resolver: zodResolver(vehicleSchema),
    defaultValues: vehicle
      ? {
          name: vehicle.name,
          plate_number: vehicle.plate_number,
          vehicle_type: vehicle.vehicle_type,
          driver: vehicle.driver,
          capacity_kg: vehicle.capacity_kg ?? "",
          capacity_m3: vehicle.capacity_m3 ?? "",
        }
      : {
          vehicle_type: "truck",
          driver: null,
        },
  })

  const selectedType = watch("vehicle_type")
  const selectedDriver = watch("driver")

  async function onSubmit(data: VehicleFormValues) {
    const payload = {
      ...data,
      capacity_kg: data.capacity_kg || undefined,
      capacity_m3: data.capacity_m3 || undefined,
    }

    if (isEditing && vehicle) {
      await updateMutation.mutateAsync(payload)
    } else {
      await createMutation.mutateAsync(payload)
    }
    router.push("/vehicles")
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
          <Label htmlFor="plate_number">Placa *</Label>
          <Input id="plate_number" {...register("plate_number")} />
          {errors.plate_number && (
            <p className="text-sm text-destructive">
              {errors.plate_number.message}
            </p>
          )}
        </div>

        <div className="space-y-2">
          <Label>Tipo *</Label>
          <Select
            value={selectedType}
            onValueChange={(v) =>
              setValue(
                "vehicle_type",
                v as "truck" | "van" | "motorcycle" | "other",
              )
            }
          >
            <SelectTrigger>
              <SelectValue placeholder="Selecciona tipo" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="truck">Camión</SelectItem>
              <SelectItem value="van">Camioneta</SelectItem>
              <SelectItem value="motorcycle">Moto</SelectItem>
              <SelectItem value="other">Otro</SelectItem>
            </SelectContent>
          </Select>
          {errors.vehicle_type && (
            <p className="text-sm text-destructive">
              {errors.vehicle_type.message}
            </p>
          )}
        </div>

        <div className="space-y-2">
          <Label>Conductor</Label>
          <Select
            value={selectedDriver?.toString() ?? ""}
            onValueChange={(v) =>
              setValue("driver", v ? Number(v) : null)
            }
          >
            <SelectTrigger>
              <SelectValue placeholder="Sin conductor" />
            </SelectTrigger>
            <SelectContent>
              {(drivers ?? []).map((d) => (
                <SelectItem key={d.id} value={String(d.id)}>
                  {d.first_name} {d.last_name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div className="space-y-2">
          <Label htmlFor="capacity_kg">Capacidad (kg)</Label>
          <Input
            id="capacity_kg"
            type="number"
            step="0.01"
            {...register("capacity_kg")}
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
              ? "Actualizar vehículo"
              : "Crear vehículo"}
        </Button>
        <Button
          type="button"
          variant="outline"
          onClick={() => router.push("/vehicles")}
        >
          Cancelar
        </Button>
      </div>
    </form>
  )
}
