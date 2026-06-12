import { z } from "zod"

export const productSchema = z.object({
  name: z.string().min(1, "El nombre es requerido").max(200),
  sku: z.string().min(1, "El SKU es requerido").max(50),
  supplier: z.number().nullable().optional(),
  warehouse: z.number().nullable().optional(),
  description: z.string().optional().or(z.literal("")),
  weight_kg: z.string().optional().or(z.literal("")),
  length_cm: z.string().optional().or(z.literal("")),
  width_cm: z.string().optional().or(z.literal("")),
  height_cm: z.string().optional().or(z.literal("")),
  unit_price: z.string().min(1, "El precio es requerido"),
  stock_quantity: z.number(),
})

export type ProductFormValues = z.infer<typeof productSchema>
