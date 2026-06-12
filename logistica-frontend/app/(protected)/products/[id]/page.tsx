import { ProductEditView } from "@/components/products/product-edit-view"

export default async function EditProductPage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const { id } = await params
  return (
    <div className="space-y-6">
      <h1 className="text-3xl font-semibold tracking-tight">
        Editar producto
      </h1>
      <ProductEditView id={Number(id)} />
    </div>
  )
}
