import { z } from "zod"

export const routeSchema = z.object({
  name: z.string().min(1, "El nombre es requerido").max(200),
  origin_warehouse: z.number().nullable().optional(),
  distance_km: z.string().optional().or(z.literal("")),
  estimated_duration_h: z.string().optional().or(z.literal("")),
})

export type RouteFormValues = z.infer<typeof routeSchema>
