import { prisma } from "@/lib/prisma";
import { notDeleted } from "@/lib/soft-delete";
import { ACTIVITY_TYPE_LABELS, VOLUNTEER_STATUS_LABELS } from "@/lib/types";
import type { Prisma, VolunteerStatus } from "@prisma/client";

export type ReportGranularity = "day" | "month" | "year";

export interface ReportFilters {
  from: Date;
  to: Date;
  activityId?: string;
  volunteerId?: string;
}

const DAY_MS = 24 * 60 * 60 * 1000;

const MONTH_LABELS = [
  "Ene",
  "Feb",
  "Mar",
  "Abr",
  "May",
  "Jun",
  "Jul",
  "Ago",
  "Sep",
  "Oct",
  "Nov",
  "Dic",
];

export function pickGranularity(from: Date, to: Date): ReportGranularity {
  const days = Math.round((to.getTime() - from.getTime()) / DAY_MS) + 1;
  if (days <= 31) return "day";
  if (days <= 24 * 31) return "month";
  return "year";
}

function rangeBound(from: Date, to: Date): { gte: Date; lt: Date } {
  return { gte: from, lt: new Date(to.getTime() + DAY_MS) };
}

function buildHourLogWhere(
  filters: ReportFilters,
  estado?: "validado" | "pendiente" | "rechazado",
): Prisma.HourLogWhereInput {
  const where: Prisma.HourLogWhereInput = {
    ...notDeleted,
    volunteer: notDeleted,
    activity: notDeleted,
    fecha: rangeBound(filters.from, filters.to),
  };
  if (estado) where.estado = estado;
  if (filters.activityId) where.activityId = filters.activityId;
  if (filters.volunteerId) where.volunteerId = filters.volunteerId;
  return where;
}

function dayKey(d: Date) {
  return `${d.getUTCFullYear()}-${String(d.getUTCMonth() + 1).padStart(2, "0")}-${String(d.getUTCDate()).padStart(2, "0")}`;
}
function dayLabel(d: Date) {
  return `${d.getUTCDate()} ${MONTH_LABELS[d.getUTCMonth()]}`;
}
function monthKey(d: Date) {
  return `${d.getUTCFullYear()}-${String(d.getUTCMonth() + 1).padStart(2, "0")}`;
}
function monthLabel(d: Date) {
  return `${MONTH_LABELS[d.getUTCMonth()]} ${d.getUTCFullYear()}`;
}

export class ReportService {
  static async getValidatedHoursByPeriod(
    filters: ReportFilters,
    granularity: ReportGranularity,
  ) {
    const logs = await prisma.hourLog.findMany({
      where: buildHourLogWhere(filters, "validado"),
      select: { fecha: true, horas: true },
    });

    const sums = new Map<string, number>();
    for (const log of logs) {
      const f = new Date(log.fecha);
      const dUtc = new Date(
        Date.UTC(f.getUTCFullYear(), f.getUTCMonth(), f.getUTCDate()),
      );
      const k =
        granularity === "day"
          ? dayKey(dUtc)
          : granularity === "month"
            ? monthKey(dUtc)
            : String(dUtc.getUTCFullYear());
      sums.set(k, (sums.get(k) ?? 0) + Number(log.horas));
    }

    const rows: { key: string; label: string; horas: number }[] = [];

    if (granularity === "day") {
      const cur = new Date(filters.from);
      while (cur <= filters.to) {
        const k = dayKey(cur);
        rows.push({
          key: k,
          label: dayLabel(cur),
          horas: Math.round((sums.get(k) ?? 0) * 10) / 10,
        });
        cur.setUTCDate(cur.getUTCDate() + 1);
      }
    } else if (granularity === "month") {
      const cur = new Date(
        Date.UTC(filters.from.getUTCFullYear(), filters.from.getUTCMonth(), 1),
      );
      const end = new Date(
        Date.UTC(filters.to.getUTCFullYear(), filters.to.getUTCMonth(), 1),
      );
      while (cur <= end) {
        const k = monthKey(cur);
        rows.push({
          key: k,
          label: monthLabel(cur),
          horas: Math.round((sums.get(k) ?? 0) * 10) / 10,
        });
        cur.setUTCMonth(cur.getUTCMonth() + 1);
      }
    } else {
      const startY = filters.from.getUTCFullYear();
      const endY = filters.to.getUTCFullYear();
      for (let y = startY; y <= endY; y++) {
        const k = String(y);
        rows.push({
          key: k,
          label: k,
          horas: Math.round((sums.get(k) ?? 0) * 10) / 10,
        });
      }
    }

    return rows;
  }

  static async getActivitiesByType(filters: ReportFilters) {
    const where: Prisma.ActivityWhereInput = {
      ...notDeleted,
      fechaInicio: rangeBound(filters.from, filters.to),
    };
    if (filters.activityId) where.id = filters.activityId;
    if (filters.volunteerId) {
      where.enrollments = {
        some: {
          volunteerId: filters.volunteerId,
          estado: { not: "cancelado" },
        },
      };
    }

    const rows = await prisma.activity.groupBy({
      by: ["tipo"],
      where,
      _count: { _all: true },
    });

    return rows
      .map((r) => ({
        tipo: r.tipo,
        label: ACTIVITY_TYPE_LABELS[r.tipo] ?? r.tipo,
        count: r._count._all,
      }))
      .sort((a, b) => b.count - a.count);
  }

  static async getVolunteersByStatus(filters: ReportFilters) {
    const where: Prisma.UserWhereInput = {
      role: "voluntario",
      ...notDeleted,
    };
    if (filters.volunteerId) where.id = filters.volunteerId;

    const rows = await prisma.user.groupBy({
      by: ["estado"],
      where,
      _count: { _all: true },
    });

    return rows
      .map((r) => ({
        estado: r.estado as VolunteerStatus,
        label: VOLUNTEER_STATUS_LABELS[r.estado] ?? r.estado,
        count: r._count._all,
      }))
      .sort((a, b) => b.count - a.count);
  }

  static async getTopVolunteersByValidatedHours(
    filters: ReportFilters,
    limit = 8,
  ) {
    const grouped = await prisma.hourLog.groupBy({
      by: ["volunteerId"],
      where: buildHourLogWhere(filters, "validado"),
      _sum: { horas: true },
      orderBy: { _sum: { horas: "desc" } },
      take: limit,
    });

    const ids = grouped.map((g) => g.volunteerId);
    if (ids.length === 0) return [];

    const users = await prisma.user.findMany({
      where: { id: { in: ids }, ...notDeleted },
      select: { id: true, nombre: true, apellido: true, email: true },
    });
    const byId = new Map(users.map((u) => [u.id, u]));

    return grouped.map((g) => {
      const u = byId.get(g.volunteerId);
      return {
        id: g.volunteerId,
        nombre: u?.nombre ?? "",
        apellido: u?.apellido ?? "",
        email: u?.email ?? "",
        horas: Math.round(Number(g._sum.horas ?? 0) * 10) / 10,
      };
    });
  }

  static async getSummaryKpis(filters: ReportFilters) {
    const activityWhere: Prisma.ActivityWhereInput = {
      ...notDeleted,
      estado: "publicada",
      fechaInicio: rangeBound(filters.from, filters.to),
    };
    if (filters.activityId) activityWhere.id = filters.activityId;
    if (filters.volunteerId) {
      activityWhere.enrollments = {
        some: {
          volunteerId: filters.volunteerId,
          estado: { not: "cancelado" },
        },
      };
    }

    const [horas, actividades, pendientes] = await Promise.all([
      prisma.hourLog
        .aggregate({
          _sum: { horas: true },
          where: buildHourLogWhere(filters, "validado"),
        })
        .then((r) => Math.round(Number(r._sum.horas ?? 0) * 10) / 10),
      prisma.activity.count({ where: activityWhere }),
      prisma.hourLog.count({
        where: buildHourLogWhere(filters, "pendiente"),
      }),
    ]);

    return {
      totalHorasValidadasAnio: horas,
      actividadesPublicadas: actividades,
      registrosPendientesValidacion: pendientes,
    };
  }

  static async getHoursExportRows(filters: ReportFilters, limit = 1000) {
    const rows = await prisma.hourLog.findMany({
      where: buildHourLogWhere(filters),
      select: {
        fecha: true,
        horas: true,
        estado: true,
        notas: true,
        volunteer: {
          select: { nombre: true, apellido: true, email: true },
        },
        activity: { select: { nombre: true } },
        validatedBy: { select: { nombre: true, apellido: true } },
      },
      orderBy: { fecha: "desc" },
      take: limit,
    });

    return rows.map((r) => ({
      fecha: r.fecha.toISOString().slice(0, 10),
      voluntario: `${r.volunteer.nombre} ${r.volunteer.apellido}`.trim(),
      email: r.volunteer.email,
      actividad: r.activity.nombre,
      horas: Number(r.horas),
      estado: r.estado,
      validadoPor: r.validatedBy
        ? `${r.validatedBy.nombre} ${r.validatedBy.apellido}`.trim()
        : "",
      notas: r.notas,
    }));
  }

  static async listActivitiesForFilter() {
    const rows = await prisma.activity.findMany({
      where: notDeleted,
      select: {
        id: true,
        nombre: true,
        fechaInicio: true,
        estado: true,
      },
      orderBy: [{ fechaInicio: "desc" }, { nombre: "asc" }],
    });
    return rows.map((r) => ({
      id: r.id,
      nombre: r.nombre,
      year: r.fechaInicio.getUTCFullYear(),
      estado: String(r.estado),
    }));
  }

  static async listVolunteersForFilter() {
    return prisma.user.findMany({
      where: { role: "voluntario", ...notDeleted },
      select: { id: true, nombre: true, apellido: true, email: true },
      orderBy: [{ apellido: "asc" }, { nombre: "asc" }],
    });
  }
}
