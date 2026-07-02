"use client";

import Link from "next/link";
import { Shield, Heart } from "lucide-react";

interface RoleSwitchProps {
  activePanel: "admin" | "voluntario";
  onNavigate?: () => void;
}

export function RoleSwitch({ activePanel, onNavigate }: RoleSwitchProps) {
  return (
    <div className="mx-3 mb-2 rounded-lg bg-primary-900/30 p-1 flex">
      <Link
        href="/panel"
        onClick={onNavigate}
        className={`flex-1 flex items-center justify-center gap-1.5 py-2 rounded-md text-xs font-semibold transition-all ${
          activePanel === "admin"
            ? "bg-white/15 text-text-inverse shadow-sm"
            : "text-primary-300 hover:text-primary-100"
        }`}
      >
        <Shield className="h-3.5 w-3.5" />
        Admin
      </Link>
      <Link
        href="/portal"
        onClick={onNavigate}
        className={`flex-1 flex items-center justify-center gap-1.5 py-2 rounded-md text-xs font-semibold transition-all ${
          activePanel === "voluntario"
            ? "bg-white/15 text-text-inverse shadow-sm"
            : "text-primary-300 hover:text-primary-100"
        }`}
      >
        <Heart className="h-3.5 w-3.5" />
        Voluntario
      </Link>
    </div>
  );
}
