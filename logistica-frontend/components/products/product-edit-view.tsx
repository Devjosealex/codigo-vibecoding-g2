"use client"

import { useProduct } from "@/hooks/use-products"
import { ProductForm } from "@/components/products/product-form"
import { Skeleton } from "@/components/ui/skeleton"

interface ProductEditViewProps {
  id: number
}

export function ProductEditView({ id }: ProductEditViewProps) {
  const { data: product, isLoading, isError, error } = useProduct(id)

  if (isLoading) {
    return (
      <div className="space-y-4">
        <Skeleton className="h-8 w-48" />
        <Skeleton className="h-10 w-full" />
        <Skeleton className="h-10 w-full" />
      </div>
    )
  }

  if (isError || !product) {
    return (
      <div className="rounded-md bg-destructive/10 p-4 text-sm text-destructive">
        {(error as { message?: string })?.message ??
          "Error al cargar el producto"}
      </div>
    )
  }

  return <ProductForm product={product} />
}
