import { AuthGuard } from "@/components/shared/auth-guard"
import { Sidebar } from "@/components/shared/sidebar"
import { Header } from "@/components/shared/header"

export default function ProtectedLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <AuthGuard>
      <div className="flex min-h-dvh">
        <Sidebar />
        <div className="flex flex-1 flex-col min-w-0">
          <Header />
          <main className="flex-1 overflow-y-auto p-4 md:p-6">{children}</main>
        </div>
      </div>
    </AuthGuard>
  )
}
