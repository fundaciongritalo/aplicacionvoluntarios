"use client";

import { useEffect, useRef, useState } from "react";
import { Plus, X } from "lucide-react";
import { AssignBadgeForm } from "@/components/assign-badge-form";
import { BadgeCatalog } from "@/components/badge-catalog";
import { CreateBadgeForm } from "@/components/create-badge-form";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import type { BadgeCatalogRow } from "@/lib/validations/badge";

export interface BadgesBoardVolunteer {
  id: string;
  nombre: string;
  apellido: string;
  email: string;
}

export interface BadgesBoardBadge {
  id: string;
  nombre: string;
  descripcion: string;
  icono: string;
  criterio: string;
  valorCriterio: number;
}

export interface BadgesBoardAssignment {
  id: string;
  earnedAt: string;
  user: { nombre: string; apellido: string; email: string };
  badge: { nombre: string; icono: string };
  assignedBy?: { nombre: string; apellido: string } | null;
}

interface BadgesBoardProps {
  volunteers: BadgesBoardVolunteer[];
  badges: BadgesBoardBadge[];
  assignments: BadgesBoardAssignment[];
}

export function BadgesBoard({ volunteers, badges, assignments }: BadgesBoardProps) {
  const formRef = useRef<HTMLDivElement>(null);
  const [formMode, setFormMode] = useState<"closed" | "create">("closed");

  useEffect(() => {
    if (formMode === "create" && formRef.current) {
      formRef.current.scrollIntoView({ behavior: "smooth", block: "start" });
    }
  }, [formMode]);

  function openCreate() {
    setFormMode("create");
  }

  function closeForm() {
    setFormMode("closed");
  }

  const catalogRows: BadgeCatalogRow[] = badges.map((b) => ({
    id: b.id,
    nombre: b.nombre,
    descripcion: b.descripcion,
    icono: b.icono,
    criterio: b.criterio,
    valorCriterio: b.valorCriterio,
  }));

  return (
    <div className="space-y-6">
      {formMode === "create" && (
        <Card ref={formRef}>
          <div className="flex items-center justify-between px-6 pt-6 pb-2">
            <h2 className="text-lg font-bold text-text-primary">
              Registrar insignia
            </h2>
            <button
              type="button"
              onClick={closeForm}
              className="h-8 w-8 flex items-center justify-center rounded-lg text-text-muted hover:text-text-primary hover:bg-surface-hover transition-colors cursor-pointer"
              aria-label="Cerrar formulario"
            >
              <X className="h-5 w-5" />
            </button>
          </div>
          <CardContent>
            <p className="text-xs text-text-muted mb-4 -mt-1">
              El criterio y el valor sirven como referencia; la entrega puede ser
              siempre manual desde el bloque siguiente.
            </p>
            <CreateBadgeForm onCancel={closeForm} onCreated={closeForm} />
          </CardContent>
        </Card>
      )}

      <div className="flex justify-end">
        <Button
          onClick={openCreate}
          icon={<Plus className="h-4 w-4" />}
          disabled={formMode !== "closed"}
        >
          Agregar insignia
        </Button>
      </div>

      <Card>
        <CardHeader>
          <p className="text-sm font-medium text-text-secondary">
            Asignar insignia
          </p>
        </CardHeader>
        <CardContent>
          <AssignBadgeForm
            volunteers={volunteers}
            badges={badges.map((b) => ({
              id: b.id,
              nombre: b.nombre,
              icono: b.icono,
            }))}
          />
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <p className="text-sm font-medium text-text-secondary">
            Catálogo ({badges.length})
          </p>
        </CardHeader>
        <CardContent>
          {badges.length === 0 ? (
            <p className="text-text-secondary text-sm">
              Aún no hay insignias en el catálogo. Pulse{" "}
              <strong className="font-medium text-text-primary">
                Agregar insignia
              </strong>{" "}
              para crear la primera, o ejecute el seed del proyecto.
            </p>
          ) : (
            <BadgeCatalog badges={catalogRows} />
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <p className="text-sm font-medium text-text-secondary">
            Últimas asignaciones
          </p>
        </CardHeader>
        <CardContent>
          {assignments.length === 0 ? (
            <p className="text-text-secondary text-sm">
              Aún no hay insignias asignadas.
            </p>
          ) : (
            <div className="overflow-x-auto rounded-xl border border-border">
              <table className="w-full text-sm">
                <thead>
                  <tr className="bg-surface-secondary border-b border-border text-left">
                    <th className="p-3 font-semibold text-text-primary">
                      Voluntario
                    </th>
                    <th className="p-3 font-semibold text-text-primary">
                      Insignia
                    </th>
                    <th className="p-3 font-semibold text-text-primary">Fecha</th>
                    <th className="p-3 font-semibold text-text-primary">
                      Asignado por
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {assignments.map((a) => (
                    <tr
                      key={a.id}
                      className="border-b border-border last:border-0"
                    >
                      <td className="p-3 text-text-primary">
                        {a.user.nombre} {a.user.apellido}
                      </td>
                      <td className="p-3">
                        {a.badge.icono} {a.badge.nombre}
                      </td>
                      <td className="p-3 text-text-secondary">
                        {new Date(a.earnedAt).toLocaleDateString("es")}
                      </td>
                      <td className="p-3 text-text-secondary">
                        {a.assignedBy
                          ? `${a.assignedBy.nombre} ${a.assignedBy.apellido}`
                          : "Sistema"}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
