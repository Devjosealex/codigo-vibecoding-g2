"use client"

import { useRoute } from "@/hooks/use-routes"
import { RouteForm } from "@/components/routes/route-form"
import { RouteStops } from "@/components/routes/route-stops"
import { Skeleton } from "@/components/ui/skeleton"

interface RouteEditViewProps {
  id: number
}

export function RouteEditView({ id }: RouteEditViewProps) {
  const { data: route, isLoading, isError, error } = useRoute(id)

  if (isLoading) {
    return (
      <div className="space-y-4">
        <Skeleton className="h-8 w-48" />
        <Skeleton className="h-10 w-full" />
        <Skeleton className="h-10 w-full" />
      </div>
    )
  }

  if (isError || !route) {
    return (
      <div className="rounded-md bg-destructive/10 p-4 text-sm text-destructive">
        {(error as { message?: string })?.message ??
          "Error al cargar la ruta"}
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <RouteForm route={route} />
      <RouteStops routeId={id} />
    </div>
  )
}
