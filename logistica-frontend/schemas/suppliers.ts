import { z } from "zod"

export const supplierSchema = z.object({
  name: z.string().min(1, "El nombre es requerido").max(200),
  contact_name: z.string().max(100).optional().or(z.literal("")),
  tax_id: z.string().max(20).optional().or(z.literal("")),
  email: z.string().min(1, "El email es requerido").email("Email inválido"),
  phone: z.string().max(20).optional().or(z.literal("")),
  address: z.string().optional().or(z.literal("")),
  city: z.string().max(100).optional().or(z.literal("")),
  country: z.string().optional().or(z.literal("")),
})

export type SupplierFormValues = z.infer<typeof supplierSchema>
