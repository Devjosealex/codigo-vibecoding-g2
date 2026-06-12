import { z } from "zod"

export const shipmentSchema = z.object({
  destination_address: z.string().min(1, "La dirección es requerida").max(255),
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

export type ShipmentFormValues = z.infer<typeof shipmentSchema>
