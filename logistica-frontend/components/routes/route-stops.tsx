"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
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
import { Plus, Trash2, GripVertical } from "lucide-react"
import {
  useCreateRouteStop,
  useDeleteRouteStop,
  useRoute,
} from "@/hooks/use-routes"
import type { Route } from "@/lib/routes.api"

interface RouteStopsProps {
  routeId: number
}

export function RouteStops({ routeId }: RouteStopsProps) {
  const { data: route, isLoading } = useRoute(routeId)
  const createMutation = useCreateRouteStop()
  const deleteMutation = useDeleteRouteStop()

  const [address, setAddress] = useState("")
  const [city, setCity] = useState("")

  async function handleAddStop() {
    if (!address.trim() || !city.trim()) return

    const nextOrder = (route?.stops?.length ?? 0) + 1
    await createMutation.mutateAsync({
      route: routeId,
      stop_order: nextOrder,
      address: address.trim(),
      city: city.trim(),
    })
    setAddress("")
    setCity("")
  }

  async function handleDeleteStop(stopId: number) {
    await deleteMutation.mutateAsync(stopId)
  }

  const stops = route?.stops ?? []

  return (
    <div className="space-y-4">
      <Separator />
      <h2 className="text-xl font-semibold tracking-tight">Paradas</h2>

      <div className="flex flex-wrap gap-2 items-end">
        <div className="space-y-1 flex-1 min-w-[200px]">
          <Label htmlFor="stop-address">Dirección</Label>
          <Input
            id="stop-address"
            placeholder="Av. Principal 123"
            value={address}
            onChange={(e) => setAddress(e.target.value)}
          />
        </div>
        <div className="space-y-1 flex-1 min-w-[150px]">
          <Label htmlFor="stop-city">Ciudad</Label>
          <Input
            id="stop-city"
            placeholder="Lima"
            value={city}
            onChange={(e) => setCity(e.target.value)}
          />
        </div>
        <Button
          type="button"
          onClick={handleAddStop}
          disabled={
            createMutation.isPending || !address.trim() || !city.trim()
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
              <TableHead className="w-10">#</TableHead>
              <TableHead>Dirección</TableHead>
              <TableHead>Ciudad</TableHead>
              <TableHead className="w-10" />
            </TableRow>
          </TableHeader>
          <TableBody>
            {stops.length === 0 ? (
              <TableRow>
                <TableCell
                  colSpan={4}
                  className="h-16 text-center text-muted-foreground"
                >
                  {isLoading
                    ? "Cargando..."
                    : "Sin paradas. Agrega la primera arriba."}
                </TableCell>
              </TableRow>
            ) : (
              stops
                .sort((a, b) => a.stop_order - b.stop_order)
                .map((stop) => (
                  <TableRow key={stop.id}>
                    <TableCell className="text-muted-foreground">
                      <GripVertical className="h-4 w-4 inline" />
                      {stop.stop_order}
                    </TableCell>
                    <TableCell>{stop.address}</TableCell>
                    <TableCell>{stop.city}</TableCell>
                    <TableCell>
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => handleDeleteStop(stop.id)}
                        disabled={deleteMutation.isPending}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </TableCell>
                  </TableRow>
                ))
            )}
          </TableBody>
        </Table>
      </div>
    </div>
  )
}
