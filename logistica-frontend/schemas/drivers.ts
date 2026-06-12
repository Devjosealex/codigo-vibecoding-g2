import { z } from "zod"

export const driverSchema = z.object({
  first_name: z.string().min(1, "El nombre es requerido").max(100),
  last_name: z.string().min(1, "El apellido es requerido").max(100),
  document_number: z.string().max(20).optional().or(z.literal("")),
  license_number: z.string().max(50).optional().or(z.literal("")),
  license_expiry: z.string().optional().or(z.literal("")),
  phone: z.string().max(20).optional().or(z.literal("")),
  email: z.string().min(1, "El email es requerido").email("Email inválido"),
})

export type DriverFormValues = z.infer<typeof driverSchema>
