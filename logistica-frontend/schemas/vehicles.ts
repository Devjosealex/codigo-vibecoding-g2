import { z } from "zod"

export const vehicleSchema = z.object({
  name: z.string().min(1, "El nombre es requerido").max(200),
  plate_number: z.string().min(1, "La placa es requerida").max(20),
  vehicle_type: z.enum(["truck", "van", "motorcycle", "other"]),
  driver: z.number().nullable().optional(),
  capacity_kg: z.string().optional().or(z.literal("")),
  capacity_m3: z.string().optional().or(z.literal("")),
})

export type VehicleFormValues = z.infer<typeof vehicleSchema>
