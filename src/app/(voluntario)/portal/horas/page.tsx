import { auth } from "@/auth";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { HourLogService } from "@/lib/services/hour-log.service";
import { ActivityService } from "@/lib/services/activity.service";
import { VolunteerHoursPanel } from "@/components/volunteer-hours-panel";

const estadoLabel: Record<string, string> = {
  pendiente: "Pendiente",
  validado: "Validado",
  rechazado: "Rechazado",
};

export default async function PortalHorasPage() {
  const session = await auth();
  const userId = session?.user?.id ?? "";
  const activo = session?.user?.estado === "activo";

  let logs: Awaited<ReturnType<typeof HourLogService.findAll>> = [];
  let enrolled: Awaited<
    ReturnType<typeof ActivityService.findEnrolledForVolunteer>
  > = [];

  try {
    const [logsData, enrolledData] = await Promise.all([
      HourLogService.findAll({ volunteerId: userId }),
      ActivityService.findEnrolledForVolunteer(userId),
    ]);
    logs = logsData;
    enrolled = enrolledData;
  } catch {
    logs = [];
    enrolled = [];
  }

  const activityOptions = enrolled.map((e) => ({
    id: e.activity.id,
    nombre: e.activity.nombre,
  }));

  return (
    <div className="space-y-8 animate-fade-in">
      <div>
        <h1 className="text-2xl font-bold text-text-primary">Mis horas</h1>
        <p className="text-text-secondary mt-1">
          Registra las horas realizadas en actividades en las que estás inscrito.
        </p>
      </div>

      {!activo ? (
        <div className="rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-900">
          Tu cuenta debe estar activa para enviar registros de horas.
        </div>
      ) : null}

      <VolunteerHoursPanel
        activities={activityOptions}
        disabled={!activo}
      />

      <Card>
        <CardHeader>
          <p className="text-sm font-medium text-text-secondary">
            Historial ({logs.length})
          </p>
        </CardHeader>
        <CardContent>
          {logs.length === 0 ? (
            <p className="text-text-secondary text-center py-8">
              Aún no tienes registros de horas.
            </p>
          ) : (
            <div className="overflow-x-auto rounded-xl border border-border">
              <table className="w-full text-sm">
                <thead>
                  <tr className="bg-surface-secondary border-b border-border text-left">
                    <th className="p-3 font-semibold text-text-primary">
                      Actividad
                    </th>
                    <th className="p-3 font-semibold text-text-primary">Fecha</th>
                    <th className="p-3 font-semibold text-text-primary">Horas</th>
                    <th className="p-3 font-semibold text-text-primary">Estado</th>
                  </tr>
                </thead>
                <tbody>
                  {logs.map((log) => (
                    <tr
                      key={log.id}
                      className="border-b border-border last:border-0"
                    >
                      <td className="p-3 text-text-primary">
                        {log.activity.nombre}
                      </td>
                      <td className="p-3 text-text-secondary">
                        {new Date(log.fecha).toLocaleDateString("es")}
                      </td>
                      <td className="p-3 font-medium">{Number(log.horas)}</td>
                      <td className="p-3">
                        <span
                          className={
                            log.estado === "validado"
                              ? "text-accent-green font-medium"
                              : log.estado === "rechazado"
                                ? "text-accent-red font-medium"
                                : "text-text-secondary"
                          }
                        >
                          {estadoLabel[log.estado] ?? log.estado}
                        </span>
                        {log.validatedBy && (
                          <span className="block text-xs text-text-muted mt-0.5">
                            por {log.validatedBy.nombre} {log.validatedBy.apellido}
                          </span>
                        )}
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
