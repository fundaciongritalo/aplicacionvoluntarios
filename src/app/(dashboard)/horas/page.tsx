import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Clock } from "lucide-react";
import { HourLogService } from "@/lib/services/hour-log.service";
import {
  PendingHourLogsTable,
  type PendingHourLogRow,
} from "@/components/pending-hour-logs-table";

const estadoLabel: Record<string, string> = {
  validado: "Validado",
  rechazado: "Rechazado",
};

export default async function HorasValidacionPage() {
  let rows: PendingHourLogRow[] = [];
  let processed: Awaited<ReturnType<typeof HourLogService.findAll>> = [];

  try {
    const [pendingLogs, processedLogs] = await Promise.all([
      HourLogService.findAll({ estado: "pendiente" }),
      HourLogService.findProcessed(50),
    ]);
    rows = pendingLogs.map((log) => ({
      id: log.id,
      fecha: new Date(log.fecha).toLocaleDateString("es", {
        day: "numeric",
        month: "short",
        year: "numeric",
      }),
      horas: Number(log.horas),
      notas: log.notas,
      volunteer: log.volunteer,
      activity: log.activity,
    }));
    processed = processedLogs;
  } catch {
    rows = [];
    processed = [];
  }

  return (
    <div className="space-y-8 animate-fade-in">
      <div>
        <h1 className="text-2xl font-bold text-text-primary flex items-center gap-2">
          <Clock className="h-7 w-7 text-primary-500" aria-hidden />
          Validación de horas
        </h1>
        <p className="text-text-secondary mt-1">
          Aprueba o rechaza los registros enviados por los voluntarios.
        </p>
      </div>

      <Card>
        <CardHeader>
          <p className="text-sm font-medium text-text-secondary">
            Pendientes ({rows.length})
          </p>
        </CardHeader>
        <CardContent>
          <PendingHourLogsTable logs={rows} />
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <p className="text-sm font-medium text-text-secondary">
            Últimos procesados ({processed.length})
          </p>
        </CardHeader>
        <CardContent>
          {processed.length === 0 ? (
            <p className="text-text-secondary text-center py-8">
              Aún no hay registros procesados.
            </p>
          ) : (
            <div className="overflow-x-auto rounded-xl border border-border">
              <table className="w-full text-sm">
                <thead>
                  <tr className="bg-surface-secondary border-b border-border text-left">
                    <th className="p-3 font-semibold text-text-primary">Voluntario</th>
                    <th className="p-3 font-semibold text-text-primary">Actividad</th>
                    <th className="p-3 font-semibold text-text-primary">Fecha</th>
                    <th className="p-3 font-semibold text-text-primary">Horas</th>
                    <th className="p-3 font-semibold text-text-primary">Estado</th>
                    <th className="p-3 font-semibold text-text-primary">Validado por</th>
                  </tr>
                </thead>
                <tbody>
                  {processed.map((log) => (
                    <tr
                      key={log.id}
                      className="border-b border-border last:border-0"
                    >
                      <td className="p-3 text-text-primary">
                        {log.volunteer.nombre} {log.volunteer.apellido}
                      </td>
                      <td className="p-3 text-text-secondary">
                        {log.activity.nombre}
                      </td>
                      <td className="p-3 text-text-secondary">
                        {new Date(log.fecha).toLocaleDateString("es", {
                          day: "numeric",
                          month: "short",
                          year: "numeric",
                        })}
                      </td>
                      <td className="p-3 font-medium">{Number(log.horas)}</td>
                      <td className="p-3">
                        <span
                          className={
                            log.estado === "validado"
                              ? "text-accent-green font-medium"
                              : "text-accent-red font-medium"
                          }
                        >
                          {estadoLabel[log.estado] ?? log.estado}
                        </span>
                      </td>
                      <td className="p-3 text-text-secondary">
                        {log.validatedBy
                          ? `${log.validatedBy.nombre} ${log.validatedBy.apellido}`
                          : "—"}
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
