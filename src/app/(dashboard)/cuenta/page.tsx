import { redirect } from "next/navigation";
import { CalendarDays, Mail, UserCircle } from "lucide-react";
import { auth } from "@/auth";
import { VolunteerService } from "@/lib/services/volunteer.service";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { UserAvatar } from "@/components/user-avatar";
import { EditProfileForm } from "@/components/edit-profile-form";
import { ChangePasswordForm } from "@/app/(voluntario)/portal/cuenta/change-password-form";

function formatDate(iso: Date | string) {
  return new Date(iso).toLocaleDateString("es-CR", {
    day: "numeric",
    month: "long",
    year: "numeric",
  });
}

export default async function AdminCuentaPage() {
  const session = await auth();
  if (!session?.user?.id) redirect("/login");

  const me = await VolunteerService.findById(session.user.id);
  if (!me) redirect("/login");

  return (
    <div className="max-w-2xl space-y-6 animate-fade-in">
      <div>
        <h1 className="text-2xl font-bold text-text-primary flex items-center gap-2">
          <UserCircle className="h-7 w-7 text-primary-500 shrink-0" aria-hidden />
          Mi cuenta
        </h1>
        <p className="text-text-secondary mt-1">
          Edita tus datos de perfil y cambia tu contraseña.
        </p>
      </div>

      <Card>
        <CardContent className="pt-6">
          <div className="flex flex-col items-start gap-5 sm:flex-row sm:items-center">
            <UserAvatar
              nombre={me.nombre}
              apellido={me.apellido}
              email={me.email}
              avatarUrl={me.avatarUrl}
              className="h-20 w-20"
              initialsClassName="bg-primary-50 text-primary-600 text-lg"
            />
            <div className="min-w-0 flex-1">
              <h2 className="text-xl font-bold text-text-primary truncate">
                {me.nombre} {me.apellido}
              </h2>
              <span className="mt-1 inline-flex rounded-full bg-primary-50 text-primary-600 px-2.5 py-1 text-xs font-medium">
                Administrador
              </span>
            </div>
          </div>

          <dl className="mt-6 grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div className="flex items-start gap-3">
              <Mail className="mt-0.5 h-5 w-5 shrink-0 text-text-muted" aria-hidden />
              <div className="min-w-0">
                <dt className="text-xs font-medium uppercase tracking-wide text-text-muted">
                  Correo electrónico
                </dt>
                <dd className="text-sm text-text-primary break-words">{me.email}</dd>
              </div>
            </div>
            <div className="flex items-start gap-3">
              <CalendarDays className="mt-0.5 h-5 w-5 shrink-0 text-text-muted" aria-hidden />
              <div className="min-w-0">
                <dt className="text-xs font-medium uppercase tracking-wide text-text-muted">
                  Miembro desde
                </dt>
                <dd className="text-sm text-text-primary">{formatDate(me.createdAt)}</dd>
              </div>
            </div>
          </dl>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <p className="text-sm font-medium text-text-secondary">Editar perfil</p>
        </CardHeader>
        <CardContent>
          <EditProfileForm
            defaultValues={{
              nombre: me.nombre,
              apellido: me.apellido,
              telefono: me.telefono ?? "",
              cedula: me.cedula ?? "",
              sede: me.sede ?? "",
              avatarUrl: me.avatarUrl ?? "",
            }}
          />
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <p className="text-sm font-medium text-text-secondary">Cambiar contraseña</p>
        </CardHeader>
        <CardContent>
          <ChangePasswordForm />
        </CardContent>
      </Card>
    </div>
  );
}
