"use client"

import { useState, useMemo } from "react"
import { Button } from "@/components/ui/button"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { Separator } from "@/components/ui/separator"
import { Plus, Trash2 } from "lucide-react"
import {
  useCreateShipmentItem,
  useDeleteShipmentItem,
  useShipmentProducts,
  useShipment,
} from "@/hooks/use-shipments"

interface ShipmentItemsProps {
  shipmentId: number
}

export function ShipmentItems({ shipmentId }: ShipmentItemsProps) {
  const { data: shipment } = useShipment(shipmentId)
  const { data: products } = useShipmentProducts()
  const createMutation = useCreateShipmentItem()
  const deleteMutation = useDeleteShipmentItem()

  const [selectedProduct, setSelectedProduct] = useState("")
  const [quantity, setQuantity] = useState("1")

  const productMap = useMemo(
    () => new Map((products ?? []).map((p) => [p.id, p])),
    [products],
  )

  async function handleAddItem() {
    if (!selectedProduct || !quantity) return
    await createMutation.mutateAsync({
      shipment: shipmentId,
      product: Number(selectedProduct),
      quantity: Number(quantity),
    })
    setSelectedProduct("")
    setQuantity("1")
  }

  const items = shipment?.items ?? []

  return (
    <div className="space-y-4">
      <Separator />
      <h2 className="text-xl font-semibold tracking-tight">Productos</h2>

      <div className="flex flex-wrap gap-2 items-end">
        <div className="space-y-1 flex-1 min-w-[200px]">
          <Label>Producto</Label>
          <Select
            value={selectedProduct}
            onValueChange={(v) => setSelectedProduct(v ?? "")}
          >
            <SelectTrigger>
              <SelectValue placeholder="Seleccionar producto" />
            </SelectTrigger>
            <SelectContent>
              {(products ?? []).map((p) => (
                <SelectItem key={p.id} value={String(p.id)}>
                  {p.name} ({p.sku})
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <div className="space-y-1 w-24">
          <Label htmlFor="item-qty">Cantidad</Label>
          <Input
            id="item-qty"
            type="number"
            min={1}
            value={quantity}
            onChange={(e) => setQuantity(e.target.value)}
          />
        </div>
        <Button
          type="button"
          onClick={handleAddItem}
          disabled={
            createMutation.isPending || !selectedProduct || !quantity
          }
        >
          <Plus className="h-4 w-4" />
          Agregar
        </Button>
      </div>

      <div className="rounded-md border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Producto</TableHead>
              <TableHead>SKU</TableHead>
              <TableHead className="text-right">Cantidad</TableHead>
              <TableHead className="text-right">Precio unit.</TableHead>
              <TableHead className="text-right">Subtotal</TableHead>
              <TableHead className="w-10" />
            </TableRow>
          </TableHeader>
          <TableBody>
            {items.length === 0 ? (
              <TableRow>
                <TableCell
                  colSpan={6}
                  className="h-16 text-center text-muted-foreground"
                >
                  Sin productos. Agrega el primero arriba.
                </TableCell>
              </TableRow>
            ) : (
              items.map((item) => {
                const product = productMap.get(item.product)
                const subtotal =
                  Number(item.unit_price_at_shipment) * item.quantity
                return (
                  <TableRow key={item.id}>
                    <TableCell>
                      {product?.name ?? `Producto #${item.product}`}
                    </TableCell>
                    <TableCell className="text-muted-foreground">
                      {product?.sku ?? "—"}
                    </TableCell>
                    <TableCell className="text-right">
                      {item.quantity}
                    </TableCell>
                    <TableCell className="text-right">
                      S/ {Number(item.unit_price_at_shipment).toFixed(2)}
                    </TableCell>
                    <TableCell className="text-right">
                      S/ {subtotal.toFixed(2)}
                    </TableCell>
                    <TableCell>
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => deleteMutation.mutate(item.id)}
                        disabled={deleteMutation.isPending}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </TableCell>
                  </TableRow>
                )
              })
            )}
          </TableBody>
        </Table>
      </div>
    </div>
  )
}
