"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"
import { cn } from "@/lib/utils"
import {
  Users,
  Building2,
  Warehouse,
  Package,
  UserCircle,
  Truck,
  MapPin,
  ShipIcon,
  LayoutDashboard,
  ShieldCheck,
  Shield,
} from "lucide-react"
import { useUIStore } from "@/store/ui-store"
import { useAuthStore } from "@/store/auth-store"

const navItems = [
  { label: "Dashboard", href: "/dashboard", icon: LayoutDashboard },
  { label: "Clientes", href: "/customers", icon: Users },
  { label: "Proveedores", href: "/suppliers", icon: Building2 },
  { label: "Almacenes", href: "/warehouses", icon: Warehouse },
  { label: "Productos", href: "/products", icon: Package },
  { label: "Conductores", href: "/drivers", icon: UserCircle },
  { label: "Vehículos", href: "/vehicles", icon: Truck },
  { label: "Rutas", href: "/routes", icon: MapPin },
  { label: "Envíos", href: "/shipments", icon: ShipIcon },
]

const adminNavItems = [
  { label: "Usuarios", href: "/admin/users", icon: ShieldCheck },
  { label: "Grupos", href: "/admin/groups", icon: Shield },
]

export function Sidebar() {
  const pathname = usePathname()
  const sidebarOpen = useUIStore((state) => state.sidebarOpen)
  const setSidebarOpen = useUIStore((state) => state.setSidebarOpen)
  const user = useAuthStore((state) => state.user)

  const handleNavClick = () => {
    if (window.innerWidth < 768) {
      setSidebarOpen(false)
    }
  }

  const allNavItems = user?.is_superuser
    ? [...navItems, ...adminNavItems]
    : navItems

  return (
    <>
      {/* Overlay mobile */}
      <div
        className={cn(
          "fixed inset-0 z-40 bg-black/50 transition-opacity duration-300 md:hidden",
          sidebarOpen
            ? "opacity-100"
            : "pointer-events-none opacity-0",
        )}
        onClick={() => setSidebarOpen(false)}
      />

      <aside
        className={cn(
          "flex flex-col border-r bg-sidebar transition-transform duration-300 md:transition-all md:duration-300",
          "fixed inset-y-0 left-0 z-50 md:static md:z-auto",
          sidebarOpen
            ? "w-60 translate-x-0"
            : "w-60 -translate-x-full md:w-[60px] md:translate-x-0",
        )}
      >
        <div className="flex h-14 items-center border-b px-3.5 gap-2.5 shrink-0">
          <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-primary text-primary-foreground shrink-0">
            <Truck className="h-3.5 w-3.5" />
          </div>
          {sidebarOpen && (
            <span className="font-semibold text-sm tracking-tight" style={{ fontFamily: "var(--font-poppins), system-ui, sans-serif" }}>
              Logística
            </span>
          )}
        </div>
        <nav className="flex-1 space-y-0.5 p-2 overflow-y-auto">
          {allNavItems.map((item) => {
            const Icon = item.icon
            const active = pathname === item.href || (item.href !== "/dashboard" && pathname.startsWith(item.href))
            return (
              <Link
                key={item.href}
                href={item.href}
                onClick={handleNavClick}
                title={!sidebarOpen ? item.label : undefined}
                className={cn(
                  "flex items-center gap-3 rounded-lg px-2.5 py-2 text-sm font-medium transition-colors duration-150",
                  active
                    ? "bg-primary text-primary-foreground"
                    : "text-sidebar-foreground/70 hover:bg-sidebar-accent hover:text-sidebar-foreground",
                )}
              >
                <Icon className="h-4 w-4 shrink-0" />
                {sidebarOpen && <span>{item.label}</span>}
              </Link>
            )
          })}
        </nav>
      </aside>
    </>
  )
}
