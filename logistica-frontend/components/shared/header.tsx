"use client"

import Link from "next/link"
import { useAuthStore } from "@/store/auth-store"
import { useUIStore } from "@/store/ui-store"
import { useMe } from "@/hooks/use-admin"
import { Button } from "@/components/ui/button"
import { LogOut, Menu } from "lucide-react"

function getInitials(name: string) {
  return name
    .split(" ")
    .map((n) => n[0])
    .join("")
    .toUpperCase()
    .slice(0, 2)
}

export function Header() {
  const user = useAuthStore((state) => state.user)
  const logout = useAuthStore((state) => state.logout)
  const toggleSidebar = useUIStore((state) => state.toggleSidebar)
  const { data: profile } = useMe()

  const displayName = profile?.email || user?.username || ""
  const initials = displayName ? getInitials(displayName) : "?"

  return (
    <header className="flex h-14 items-center justify-between border-b bg-card/80 backdrop-blur-sm px-4 sticky top-0 z-30">
      <div className="flex items-center gap-3">
        <Button variant="ghost" size="icon" onClick={toggleSidebar} className="text-muted-foreground hover:text-foreground">
          <Menu className="h-5 w-5" />
        </Button>
      </div>
      <div className="flex items-center gap-2">
        <Link href="/profile" className="flex items-center gap-2.5 hover:opacity-80 transition-opacity">
          <div className="hidden sm:flex flex-col items-end leading-tight">
            <span className="text-sm font-medium text-foreground">
              {user?.username}
            </span>
            {profile?.email && (
              <span className="text-xs text-muted-foreground">
                {profile.email}
              </span>
            )}
          </div>
          <div className="flex h-8 w-8 items-center justify-center rounded-full bg-primary text-xs font-semibold text-primary-foreground ring-2 ring-background shrink-0">
            {initials}
          </div>
        </Link>
        <Button variant="ghost" size="icon" onClick={logout} title="Cerrar sesión" className="text-muted-foreground hover:text-destructive transition-colors">
          <LogOut className="h-4 w-4" />
        </Button>
      </div>
    </header>
  )
}
