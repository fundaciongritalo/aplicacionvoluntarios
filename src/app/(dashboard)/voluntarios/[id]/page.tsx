import Link from "next/link";
import { notFound } from "next/navigation";
import {
  ArrowLeft,
  Building2,
  Clock,
  Mail,
  Phone,
  Shield,
  Badge as BadgeIcon,
} from "lucide-react";
import { VolunteerService } from "@/lib/services/volunteer.service";
import { Card, CardContent } from "@/components/ui/card";
import { UserAvatar } from "@/components/user-avatar";

const TIPO_LABELS: Record<string, string> = {
  social: "Social",
  comunitario: "Comunitario",
  educacion: "Educación",
  ambiente: "Ambiente",
  salud: "Salud",
  comunicacion: "Comunicación",
  logistica: "Logística",
  otro: "Otro",
};

const ACTIVITY_ESTADO_LABELS: Record<string, string> = {
  borrador: "Borrador",
  publicada: "Publicada",
  finalizada: "Finalizada",
  cancelada: "Cancelada",
};

const VOLUNTEER_ESTADO_LABELS: Record<string, string> = {
  activo: "Activo",
  inactivo: "Inactivo",
  pendiente: "Pendiente",
};

const ENROLLMENT_LABELS: Record<string, string> = {
  inscrito: "Inscrito",
  confirmado: "Confirmado",
  cancelado: "Cancelado",
};

function formatDate(iso: Date | string) {
  return new Date(iso).toLocaleDateString("es-CR", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });
}

interface PageProps {
  params: Promise<{ id: string }>;
}

export default async function VolunteerAdminDetailPage({ params }: PageProps) {
  const { id } = await params;

  const volunteer = await VolunteerService.findAdminDetail(id);
  if (!volunteer) notFound();

  const subtitle = VOLUNTEER_ESTADO_LABELS[volunteer.estado] ?? volunteer.estado;

  return (
    <div className="mx-auto max-w-4xl space-y-6">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <Link
            href="/voluntarios"
            className="mb-2 inline-flex h-8 items-center gap-2 rounded-lg px-2 text-sm text-text-secondary transition-colors hover:bg-surface-hover hover:text-text-primary"
          >
            <ArrowLeft className="h-4 w-4" />
            Volver a voluntarios
          </Link>
          <div className="flex flex-wrap items-center gap-4">
            <UserAvatar
              nombre={volunteer.nombre}
              apellido={volunteer.apellido}
              email={volunteer.email}
              avatarUrl={volunteer.avatarUrl}
              className="h-20 w-20"
              initialsClassName="bg-primary-50 text-primary-600 text-lg"
            />
            <div>
              <h1 className="text-2xl font-bold text-text-primary">
                {volunteer.nombre} {volunteer.apellido}
              </h1>
              <p className="text-sm text-text-secondary">{subtitle}</p>
              <div className="mt-2 flex flex-wrap gap-x-4 gap-y-1 text-sm text-text-secondary">
                <span className="flex items-center gap-1">
                  <Mail className="h-4 w-4 shrink-0" />
                  {volunteer.email}
                </span>
                {volunteer.telefono ? (
                  <span className="flex items-center gap-1">
                    <Phone className="h-4 w-4 shrink-0" />
                    {volunteer.telefono}
                  </span>
                ) : null}
                {volunteer.sede?.trim() ? (
                  <span className="flex items-center gap-1">
                    <Building2 className="h-4 w-4 shrink-0" />
                    {volunteer.sede}
                  </span>
                ) : null}
              </div>
              {volunteer.cedula ? (
                <p className="mt-2 text-sm text-text-secondary">
                  Cédula: <span className="text-text-primary">{volunteer.cedula}</span>
                </p>
              ) : null}
            </div>
          </div>
        </div>
      </div>

      <Card>
        <CardContent className="pt-6">
          <div className="grid gap-6 sm:grid-cols-2">
            <div className="flex items-start gap-3 rounded-xl border border-border bg-surface-secondary p-4">
              <Clock className="h-10 w-10 shrink-0 text-primary-500" />
              <div>
                <p className="text-xs font-medium uppercase tracking-wide text-text-muted">
                  Horas acumuladas (validadas)
                </p>
                <p className="mt-1 text-3xl font-bold text-text-primary">
                  {volunteer.horasAcumuladas.toLocaleString("es-CR", {
                    minimumFractionDigits: 0,
                    maximumFractionDigits: 1,
                  })}
                </p>
              </div>
            </div>
            <div className="flex items-start gap-3 rounded-xl border border-border bg-surface-secondary p-4">
              <Shield className="h-10 w-10 shrink-0 text-primary-500" />
              <div>
                <p className="text-xs font-medium uppercase tracking-wide text-text-muted">
                  Registro en la plataforma
                </p>
                <p className="mt-1 text-lg font-semibold text-text-primary">
                  {formatDate(volunteer.createdAt)}
                </p>
              </div>
            </div>
          </div>
          {volunteer.habilidades.length > 0 ? (
            <div className="mt-6">
              <h2 className="text-sm font-semibold text-text-primary">Habilidades</h2>
              <p className="mt-1 text-sm text-text-secondary">
                {volunteer.habilidades.join(", ")}
              </p>
            </div>
          ) : null}
        </CardContent>
      </Card>

      <section>
        <h2 className="mb-3 flex items-center gap-2 text-lg font-bold text-text-primary">
          <BadgeIcon className="h-5 w-5 text-primary-500" />
          Insignias
        </h2>
        {volunteer.userBadges.length === 0 ? (
          <Card>
            <CardContent className="py-8 text-center text-sm text-text-secondary">
              Este voluntario aún no tiene insignias registradas.
            </CardContent>
          </Card>
        ) : (
          <div className="grid gap-3 sm:grid-cols-2">
            {volunteer.userBadges.map((ub) => (
              <Card key={ub.id}>
                <CardContent className="flex gap-4 pt-5">
                  <span className="text-4xl shrink-0" aria-hidden>
                    {ub.badge.icono || "🏆"}
                  </span>
                  <div className="min-w-0">
                    <p className="font-semibold text-text-primary">{ub.badge.nombre}</p>
                    <p className="mt-1 text-sm text-text-secondary line-clamp-3">
                      {ub.badge.descripcion}
                    </p>
                    <p className="mt-2 text-xs text-text-muted">
                      Obtenida el {formatDate(ub.earnedAt)}
                      {" · "}
                      {ub.assignedBy
                        ? `Asignada por ${ub.assignedBy.nombre} ${ub.assignedBy.apellido}`
                        : "Asignación automática"}
                    </p>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </section>

      <section>
        <h2 className="mb-3 text-lg font-bold text-text-primary">
          Actividades en las que ha participado
        </h2>
        {volunteer.enrollments.length === 0 ? (
          <Card>
            <CardContent className="py-8 text-center text-sm text-text-secondary">
              Sin inscripciones a actividades todavía.
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-2">
            {volunteer.enrollments.map((en) => {
              const act = en.activity;
              return (
                <Card key={en.id}>
                  <CardContent className="flex flex-col gap-2 pt-5 sm:flex-row sm:items-center sm:justify-between">
                    <div>
                      <p className="font-medium text-text-primary">{act.nombre}</p>
                      <p className="text-xs text-text-muted">
                        {TIPO_LABELS[act.tipo] ?? act.tipo} ·{" "}
                        {formatDate(act.fechaInicio)} – {formatDate(act.fechaCierre)}
                      </p>
                      <span className="mt-2 inline-flex text-xs text-text-secondary">
                        Actividad:{" "}
                        <span className="ml-1 font-medium">
                          {ACTIVITY_ESTADO_LABELS[act.estado] ?? act.estado}
                        </span>
                      </span>
                    </div>
                    <span
                      className="inline-flex w-fit shrink-0 rounded-full bg-surface-secondary px-2.5 py-1 text-xs font-medium text-text-primary"
                      title="Estado en la participación del voluntario"
                    >
                      {ENROLLMENT_LABELS[en.estado] ?? en.estado}
                    </span>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        )}
      </section>
    </div>
  );
}
