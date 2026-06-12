import { z } from "zod"

export const warehouseSchema = z.object({
  name: z.string().min(1, "El nombre es requerido").max(200),
  address: z.string().optional().or(z.literal("")),
  city: z.string().max(100).optional().or(z.literal("")),
  country: z.string().optional().or(z.literal("")),
  latitude: z.string().optional().or(z.literal("")),
  longitude: z.string().optional().or(z.literal("")),
  capacity_m3: z.string().optional().or(z.literal("")),
})

export type WarehouseFormValues = z.infer<typeof warehouseSchema>
