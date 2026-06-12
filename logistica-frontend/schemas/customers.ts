import { z } from "zod"

export const customerSchema = z.object({
  name: z.string().min(1, "El nombre es requerido").max(200),
  customer_type: z.enum(["company", "individual"]),
  email: z.string().min(1, "El email es requerido").email("Email inválido"),
  tax_id: z.string().max(20).optional().or(z.literal("")),
  phone: z.string().max(20).optional().or(z.literal("")),
  address: z.string().optional().or(z.literal("")),
  city: z.string().max(100).optional().or(z.literal("")),
  country: z.string().optional().or(z.literal("")),
})

export type CustomerFormValues = z.infer<typeof customerSchema>
