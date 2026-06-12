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
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import {
  useCreateShipment,
  useUpdateShipment,
  useShipmentCustomers,
  useShipmentWarehouses,
  useShipmentVehicles,
  useShipmentRoutes,
  useShipmentDrivers,
} from "@/hooks/use-shipments"
import type { Shipment } from "@/lib/shipments.api"
import Link from "next/link"
import { Info } from "lucide-react"

const shipmentSchema = z.object({
  destination_address: z
    .string()
    .min(1, "La dirección es requerida")
    .max(255),
  destination_city: z.string().min(1, "La ciudad es requerida").max(100),
  destination_country: z.string().optional().or(z.literal("")),
  base_cost: z.string().min(1, "El costo base es requerido"),
  customer: z.number().nullable().optional(),
  origin_warehouse: z.number().nullable().optional(),
  vehicle: z.number().nullable().optional(),
  route: z.number().nullable().optional(),
  scheduled_date: z.string().optional().or(z.literal("")),
  notes: z.string().optional().or(z.literal("")),
})

type ShipmentFormValues = z.infer<typeof shipmentSchema>

interface ShipmentFormProps {
  shipment?: Shipment
  onSaved?: () => void
}

export function ShipmentForm({ shipment, onSaved }: ShipmentFormProps) {
  const router = useRouter()
  const createMutation = useCreateShipment()
  const updateMutation = useUpdateShipment(shipment?.id ?? 0)
  const { data: customers } = useShipmentCustomers()
  const { data: warehouses } = useShipmentWarehouses()
  const { data: vehicles } = useShipmentVehicles()
  const { data: routes } = useShipmentRoutes()
  const { data: drivers } = useShipmentDrivers()
  const isEditing = !!shipment

  const {
    register,
    handleSubmit,
    setValue,
    watch,
    formState: { errors },
  } = useForm<ShipmentFormValues>({
    resolver: zodResolver(shipmentSchema),
    defaultValues: shipment
      ? {
          destination_address: shipment.destination_address,
          destination_city: shipment.destination_city,
          destination_country: shipment.destination_country,
          base_cost: shipment.base_cost,
          customer: shipment.customer,
          origin_warehouse: shipment.origin_warehouse,
          vehicle: shipment.vehicle,
          route: shipment.route,
          scheduled_date: shipment.scheduled_date ?? "",
          notes: shipment.notes ?? "",
        }
      : {
          customer: null,
          origin_warehouse: null,
          vehicle: null,
          route: null,
          destination_country: "Peru",
        },
  })

  const watchedCustomer = watch("customer")
  const watchedWarehouse = watch("origin_warehouse")
  const watchedVehicle = watch("vehicle")
  const watchedRoute = watch("route")

  const driverMap = new Map(
    (drivers ?? []).map((d) => [d.id, `${d.first_name} ${d.last_name}`]),
  )
  const selectedVehicle = (vehicles ?? []).find(
    (v) => v.id === watchedVehicle,
  )
  const assignedDriver =
    selectedVehicle?.driver != null
      ? driverMap.get(selectedVehicle.driver) ?? `#${selectedVehicle.driver}`
      : null

  async function onSubmit(data: ShipmentFormValues) {
    const payload = {
      ...data,
      destination_country: data.destination_country || "Peru",
      scheduled_date: data.scheduled_date || undefined,
      notes: data.notes || undefined,
    }

    if (isEditing && shipment) {
      await updateMutation.mutateAsync(payload)
    } else {
      await createMutation.mutateAsync(payload)
    }

    if (onSaved) {
      onSaved()
    } else {
      router.push("/shipments")
    }
  }

  const isPending = createMutation.isPending || updateMutation.isPending

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
      <div className="rounded-md border border-blue-200 bg-blue-50 p-4 text-sm text-blue-800 dark:border-blue-800 dark:bg-blue-950 dark:text-blue-200">
        <p className="flex items-start gap-2">
          <Info className="mt-0.5 h-4 w-4 shrink-0" />
          <span>
            <strong>Cálculo del costo total:</strong> El costo calculado se
            determina automáticamente como{" "}
            <code className="rounded bg-blue-100 px-1 dark:bg-blue-900">
              peso total (kg) × S/5 + distancia (km) × S/0.50
            </code>
            . Ingresa un <strong>costo base</strong> como punto de partida; el
            costo calculado final lo define el backend.
          </span>
        </p>
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <div className="space-y-2 sm:col-span-2">
          <Label htmlFor="destination_address">
            Dirección destino *
          </Label>
          <Input
            id="destination_address"
            {...register("destination_address")}
          />
          {errors.destination_address && (
            <p className="text-sm text-destructive">
              {errors.destination_address.message}
            </p>
          )}
        </div>

        <div className="space-y-2">
          <Label htmlFor="destination_city">Ciudad destino *</Label>
          <Input id="destination_city" {...register("destination_city")} />
          {errors.destination_city && (
            <p className="text-sm text-destructive">
              {errors.destination_city.message}
            </p>
          )}
        </div>

        <div className="space-y-2">
          <Label htmlFor="destination_country">País destino</Label>
          <Input
            id="destination_country"
            {...register("destination_country")}
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="base_cost">Costo base *</Label>
          <Input
            id="base_cost"
            type="number"
            step="0.01"
            {...register("base_cost")}
          />
          {errors.base_cost && (
            <p className="text-sm text-destructive">
              {errors.base_cost.message}
            </p>
          )}
        </div>

        <div className="space-y-2">
          <Label>Fecha programada</Label>
          <DatePicker
            value={watch("scheduled_date") ?? ""}
            onChange={(v) => setValue("scheduled_date", v)}
            placeholder="Seleccionar fecha"
          />
        </div>

        <div className="space-y-2">
          <Label>Cliente</Label>
          <Select
            value={String(watchedCustomer ?? "")}
            onValueChange={(v) =>
              setValue("customer", v ? Number(v) : null)
            }
          >
            <SelectTrigger>
              <SelectValue placeholder="Seleccionar cliente" />
            </SelectTrigger>
            <SelectContent>
              {(customers ?? []).map((c) => (
                <SelectItem key={c.id} value={String(c.id)}>
                  {c.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div className="space-y-2">
          <Label>Almacén origen</Label>
          <Select
            value={String(watchedWarehouse ?? "")}
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
          <Label>Vehículo</Label>
          <Select
            value={String(watchedVehicle ?? "")}
            onValueChange={(v) =>
              setValue("vehicle", v ? Number(v) : null)
            }
          >
            <SelectTrigger>
              <SelectValue placeholder="Seleccionar vehículo" />
            </SelectTrigger>
            <SelectContent>
              {(vehicles ?? []).map((v) => (
                <SelectItem key={v.id} value={String(v.id)}>
                  {v.name} ({v.plate_number})
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          {assignedDriver && (
            <p className="text-xs text-muted-foreground">
              Conductor asignado: {assignedDriver}
            </p>
          )}
          {watchedVehicle && !assignedDriver && (
            <p className="text-xs text-amber-600">
              Este vehículo no tiene conductor asignado.{" "}
              <Link
                href={`/vehicles/${watchedVehicle}`}
                className="underline"
              >
                Asignar conductor
              </Link>
            </p>
          )}
        </div>

        <div className="space-y-2">
          <Label>Ruta</Label>
          <Select
            value={String(watchedRoute ?? "")}
            onValueChange={(v) =>
              setValue("route", v ? Number(v) : null)
            }
          >
            <SelectTrigger>
              <SelectValue placeholder="Seleccionar ruta" />
            </SelectTrigger>
            <SelectContent>
              {(routes ?? []).map((r) => (
                <SelectItem key={r.id} value={String(r.id)}>
                  {r.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div className="space-y-2 sm:col-span-2">
          <Label htmlFor="notes">Notas</Label>
          <Input id="notes" {...register("notes")} />
        </div>
      </div>

      <div className="flex gap-2">
        <Button type="submit" disabled={isPending}>
          {isPending
            ? "Guardando..."
            : isEditing
              ? "Actualizar envío"
              : "Crear envío"}
        </Button>
        <Button
          type="button"
          variant="outline"
          onClick={() => router.push("/shipments")}
        >
          Cancelar
        </Button>
      </div>
    </form>
  )
}
