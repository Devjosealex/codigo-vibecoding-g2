"use client"

import { useCustomer } from "@/hooks/use-customers"
import { CustomerForm } from "@/components/customers/customer-form"
import { Skeleton } from "@/components/ui/skeleton"

interface CustomerEditViewProps {
  id: number
}

export function CustomerEditView({ id }: CustomerEditViewProps) {
  const { data: customer, isLoading, isError, error } = useCustomer(id)

  if (isLoading) {
    return (
      <div className="space-y-4">
        <Skeleton className="h-8 w-48" />
        <Skeleton className="h-10 w-full" />
        <Skeleton className="h-10 w-full" />
      </div>
    )
  }

  if (isError || !customer) {
    return (
      <div className="rounded-md bg-destructive/10 p-4 text-sm text-destructive">
        {(error as { message?: string })?.message ??
          "Error al cargar el cliente"}
      </div>
    )
  }

  return <CustomerForm customer={customer} />
}
