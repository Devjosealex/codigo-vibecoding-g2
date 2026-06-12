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
  useCreateCustomer,
  useUpdateCustomer,
} from "@/hooks/use-customers"
import type { Customer } from "@/lib/customers.api"

const customerSchema = z.object({
  name: z.string().min(1, "El nombre es requerido").max(200),
  customer_type: z.enum(["company", "individual"]),
  email: z.string().min(1, "El email es requerido").email("Email inválido"),
  tax_id: z.string().max(20).optional().or(z.literal("")),
  phone: z.string().max(20).optional().or(z.literal("")),
  address: z.string().optional().or(z.literal("")),
  city: z.string().max(100).optional().or(z.literal("")),
  country: z.string().optional().or(z.literal("")),
})

type CustomerFormValues = z.infer<typeof customerSchema>

interface CustomerFormProps {
  customer?: Customer
}

export function CustomerForm({ customer }: CustomerFormProps) {
  const router = useRouter()
  const createMutation = useCreateCustomer()
  const updateMutation = useUpdateCustomer(customer?.id ?? 0)
  const isEditing = !!customer

  const {
    register,
    handleSubmit,
    setValue,
    watch,
    formState: { errors },
  } = useForm<CustomerFormValues>({
    resolver: zodResolver(customerSchema),
    defaultValues: customer
      ? {
          name: customer.name,
          customer_type: customer.customer_type,
          email: customer.email,
          tax_id: customer.tax_id ?? "",
          phone: customer.phone ?? "",
          address: customer.address ?? "",
          city: customer.city ?? "",
          country: customer.country ?? "Peru",
        }
      : {
          customer_type: "company",
          country: "Peru",
        },
  })

  const selectedType = watch("customer_type")

  async function onSubmit(data: CustomerFormValues) {
    const payload = {
      ...data,
      tax_id: data.tax_id || undefined,
      phone: data.phone || undefined,
      address: data.address || undefined,
      city: data.city || undefined,
      country: data.country || "Peru",
    }

    if (isEditing && customer) {
      await updateMutation.mutateAsync(payload)
    } else {
      await createMutation.mutateAsync(payload)
    }
    router.push("/customers")
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
          <Label htmlFor="customer_type">Tipo de cliente *</Label>
          <Select
            value={selectedType}
            onValueChange={(v) =>
              setValue("customer_type", v as "company" | "individual")
            }
          >
            <SelectTrigger>
              <SelectValue placeholder="Selecciona un tipo" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="company">Empresa</SelectItem>
              <SelectItem value="individual">Persona natural</SelectItem>
            </SelectContent>
          </Select>
          {errors.customer_type && (
            <p className="text-sm text-destructive">
              {errors.customer_type.message}
            </p>
          )}
        </div>

        <div className="space-y-2">
          <Label htmlFor="tax_id">RUC/DNI</Label>
          <Input id="tax_id" {...register("tax_id")} />
        </div>

        <div className="space-y-2">
          <Label htmlFor="email">Email *</Label>
          <Input id="email" type="email" {...register("email")} />
          {errors.email && (
            <p className="text-sm text-destructive">{errors.email.message}</p>
          )}
        </div>

        <div className="space-y-2">
          <Label htmlFor="phone">Teléfono</Label>
          <Input id="phone" {...register("phone")} />
        </div>

        <div className="space-y-2 sm:col-span-2">
          <Label htmlFor="address">Dirección</Label>
          <Input id="address" {...register("address")} />
        </div>

        <div className="space-y-2">
          <Label htmlFor="city">Ciudad</Label>
          <Input id="city" {...register("city")} />
        </div>

        <div className="space-y-2">
          <Label htmlFor="country">País</Label>
          <Input id="country" {...register("country")} />
        </div>
      </div>

      <div className="flex gap-2">
        <Button type="submit" disabled={isPending}>
          {isPending
            ? "Guardando..."
            : isEditing
              ? "Actualizar cliente"
              : "Crear cliente"}
        </Button>
        <Button
          type="button"
          variant="outline"
          onClick={() => router.push("/customers")}
        >
          Cancelar
        </Button>
      </div>
    </form>
  )
}
