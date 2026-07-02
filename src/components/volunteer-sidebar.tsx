"use client";

import Link from "next/link";
import Image from "next/image";
import { usePathname } from "next/navigation";
import {
  LayoutDashboard,
  CalendarDays,
  Clock,
  Award,
  LineChart,
  LogOut,
  Menu,
  X,
  KeyRound,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { logoutAction } from "@/lib/actions/auth";
import { useState } from "react";
import { UserAvatar } from "@/components/user-avatar";
import { RoleSwitch } from "@/components/role-switch";

interface VolunteerSidebarProfile {
  nombre: string;
  apellido: string;
  email: string;
  avatarUrl?: string | null;
}

interface VolunteerSidebarProps {
  profile: VolunteerSidebarProfile;
  isAdmin?: boolean;
}

const navItems = [
  { href: "/portal", label: "Inicio", icon: LayoutDashboard },
  { href: "/portal/actividades", label: "Actividades", icon: CalendarDays },
  { href: "/portal/horas", label: "Mis horas", icon: Clock },
  { href: "/portal/progreso", label: "Tu progreso", icon: LineChart },
  { href: "/portal/insignias", label: "Mis insignias", icon: Award },
  { href: "/portal/cuenta", label: "Mi cuenta", icon: KeyRound },
];

function linkActive(pathname: string, href: string) {
  if (href === "/portal") return pathname === "/portal";
  return pathname === href || pathname.startsWith(`${href}/`);
}

export function VolunteerSidebar({ profile, isAdmin }: VolunteerSidebarProps) {
  const pathname = usePathname();
  const [mobileOpen, setMobileOpen] = useState(false);

  async function handleLogout() {
    await logoutAction();
  }

  const sidebarContent = (
    <>
      <div className="p-5 flex items-center gap-3">
        <Image
          src="/logo-white.png"
          alt="Fundación Grítalo"
          width={36}
          height={36}
          priority
        />
        <div>
          <p className="text-primary-200 text-xs">Fundación</p>
          <p className="font-bold text-text-inverse text-sm leading-tight">
            Grítalo
          </p>
        </div>
      </div>

      {isAdmin && (
        <RoleSwitch activePanel="voluntario" onNavigate={() => setMobileOpen(false)} />
      )}

      <nav className="flex-1 px-3 mt-2 space-y-1">
        {navItems.map((item) => {
          const isActive = linkActive(pathname, item.href);
          return (
            <Link
              key={item.href}
              href={item.href}
              onClick={() => setMobileOpen(false)}
              className={cn(
                "flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors",
                isActive
                  ? "bg-surface/10 text-text-inverse"
                  : "text-primary-200 hover:bg-surface/20 hover:text-text-inverse",
              )}
            >
              <item.icon className="h-5 w-5 shrink-0" aria-hidden="true" />
              {item.label}
            </Link>
          );
        })}
      </nav>

      <div className="p-4 border-t border-surface/10">
        <div className="flex items-center gap-3 mb-3">
          <UserAvatar
            nombre={profile.nombre}
            apellido={profile.apellido}
            email={profile.email}
            avatarUrl={profile.avatarUrl}
            className="h-9 w-9 shrink-0"
            initialsClassName="bg-accent-green text-text-inverse text-sm font-bold flex items-center justify-center"
          />
          <div className="flex-1 min-w-0">
            <p className="text-sm font-medium text-text-inverse truncate">
              {profile.nombre} {profile.apellido}
            </p>
            <p className="text-xs text-primary-200">
              {isAdmin ? "Administrador" : "Voluntario"}
            </p>
          </div>
        </div>
        <button
          onClick={handleLogout}
          className="flex items-center gap-2 text-sm text-primary-200 hover:text-text-inverse transition-colors w-full cursor-pointer"
        >
          <LogOut className="h-4 w-4" />
          Cerrar Sesión
        </button>
      </div>
    </>
  );

  return (
    <>
      <button
        onClick={() => setMobileOpen(true)}
        aria-label="Abrir menú"
        className="fixed top-4 left-4 z-50 lg:hidden bg-primary-500 text-text-inverse p-2 rounded-lg shadow-lg cursor-pointer"
      >
        <Menu className="h-5 w-5" aria-hidden="true" />
      </button>

      {mobileOpen && (
        <div
          className="fixed inset-0 bg-primary-900/50 z-40 lg:hidden"
          onClick={() => setMobileOpen(false)}
        />
      )}

      <aside
        className={cn(
          "fixed inset-y-0 left-0 z-50 w-64 bg-primary-500 flex flex-col transition-transform duration-300 lg:hidden",
          mobileOpen ? "translate-x-0" : "-translate-x-full",
        )}
      >
        <button
          onClick={() => setMobileOpen(false)}
          aria-label="Cerrar menú"
          className="absolute top-4 right-4 text-text-inverse/70 hover:text-text-inverse cursor-pointer"
        >
          <X className="h-5 w-5" aria-hidden="true" />
        </button>
        {sidebarContent}
      </aside>

      <aside className="hidden lg:flex w-64 bg-primary-500 flex-col fixed inset-y-0 left-0">
        {sidebarContent}
      </aside>
    </>
  );
}
