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
  useCreateProduct,
  useUpdateProduct,
  useProductSuppliers,
  useProductWarehouses,
} from "@/hooks/use-products"
import type { Product } from "@/lib/products.api"

const productSchema = z.object({
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

type ProductFormValues = z.infer<typeof productSchema>

interface ProductFormProps {
  product?: Product
}

export function ProductForm({ product }: ProductFormProps) {
  const router = useRouter()
  const createMutation = useCreateProduct()
  const updateMutation = useUpdateProduct(product?.id ?? 0)
  const { data: suppliers } = useProductSuppliers()
  const { data: warehouses } = useProductWarehouses()
  const isEditing = !!product

  const {
    register,
    handleSubmit,
    setValue,
    watch,
    formState: { errors },
  } = useForm<ProductFormValues>({
    resolver: zodResolver(productSchema),
    defaultValues: product
      ? {
          name: product.name,
          sku: product.sku,
          supplier: product.supplier,
          warehouse: product.warehouse,
          description: product.description ?? "",
          weight_kg: product.weight_kg ?? "",
          length_cm: product.length_cm ?? "",
          width_cm: product.width_cm ?? "",
          height_cm: product.height_cm ?? "",
          unit_price: product.unit_price,
          stock_quantity: product.stock_quantity,
        }
      : {
          supplier: null,
          warehouse: null,
          stock_quantity: 0,
        },
  })

  const selectedSupplier = watch("supplier")
  const selectedWarehouse = watch("warehouse")

  async function onSubmit(data: ProductFormValues) {
    const payload = {
      ...data,
      description: data.description || undefined,
      weight_kg: data.weight_kg || undefined,
      length_cm: data.length_cm || undefined,
      width_cm: data.width_cm || undefined,
      height_cm: data.height_cm || undefined,
    }

    if (isEditing && product) {
      await updateMutation.mutateAsync(payload)
    } else {
      await createMutation.mutateAsync(payload)
    }
    router.push("/products")
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
          <Label htmlFor="sku">SKU *</Label>
          <Input id="sku" {...register("sku")} />
          {errors.sku && (
            <p className="text-sm text-destructive">{errors.sku.message}</p>
          )}
        </div>

        <div className="space-y-2">
          <Label>Proveedor</Label>
          <Select
            value={selectedSupplier?.toString() ?? ""}
            onValueChange={(v) =>
              setValue("supplier", v ? Number(v) : null)
            }
          >
            <SelectTrigger>
              <SelectValue placeholder="Seleccionar proveedor" />
            </SelectTrigger>
            <SelectContent>
              {(suppliers ?? []).map((s) => (
                <SelectItem key={s.id} value={String(s.id)}>
                  {s.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div className="space-y-2">
          <Label>Almacén</Label>
          <Select
            value={selectedWarehouse?.toString() ?? ""}
            onValueChange={(v) =>
              setValue("warehouse", v ? Number(v) : null)
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

        <div className="space-y-2 sm:col-span-2">
          <Label htmlFor="description">Descripción</Label>
          <Input id="description" {...register("description")} />
        </div>

        <div className="space-y-2">
          <Label htmlFor="unit_price">Precio unitario *</Label>
          <Input
            id="unit_price"
            type="number"
            step="0.01"
            {...register("unit_price")}
          />
          {errors.unit_price && (
            <p className="text-sm text-destructive">
              {errors.unit_price.message}
            </p>
          )}
        </div>

        <div className="space-y-2">
          <Label htmlFor="stock_quantity">Stock</Label>
          <Input
            id="stock_quantity"
            type="number"
            {...register("stock_quantity", { valueAsNumber: true })}
          />
          {errors.stock_quantity && (
            <p className="text-sm text-destructive">
              {errors.stock_quantity.message}
            </p>
          )}
        </div>

        <div className="space-y-2">
          <Label htmlFor="weight_kg">Peso (kg)</Label>
          <Input
            id="weight_kg"
            type="number"
            step="0.001"
            {...register("weight_kg")}
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="length_cm">Largo (cm)</Label>
          <Input
            id="length_cm"
            type="number"
            step="0.01"
            {...register("length_cm")}
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="width_cm">Ancho (cm)</Label>
          <Input
            id="width_cm"
            type="number"
            step="0.01"
            {...register("width_cm")}
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="height_cm">Alto (cm)</Label>
          <Input
            id="height_cm"
            type="number"
            step="0.01"
            {...register("height_cm")}
          />
        </div>
      </div>

      <div className="flex gap-2">
        <Button type="submit" disabled={isPending}>
          {isPending
            ? "Guardando..."
            : isEditing
              ? "Actualizar producto"
              : "Crear producto"}
        </Button>
        <Button
          type="button"
          variant="outline"
          onClick={() => router.push("/products")}
        >
          Cancelar
        </Button>
      </div>
    </form>
  )
}
