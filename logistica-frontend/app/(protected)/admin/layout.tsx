// app/(protected)/admin/layout.tsx
import { SuperAdminGuard } from "@/components/shared/auth-guard"

export default function AdminLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return <SuperAdminGuard>{children}</SuperAdminGuard>
}
