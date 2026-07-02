import { prisma } from "@/lib/prisma";
import { notDeleted } from "@/lib/soft-delete";
import type { HourLogStatus } from "@prisma/client";

export interface CreateHourLogInput {
  volunteerId: string;
  activityId: string;
  fecha: string;
  horas: number;
  notas?: string;
}

export interface UpdateHourLogInput {
  estado: HourLogStatus;
  validatedById?: string;
}

export class HourLogService {
  static async findAll(filters?: { volunteerId?: string; estado?: HourLogStatus }) {
    return prisma.hourLog.findMany({
      where: {
        ...notDeleted,
        volunteer: notDeleted,
        activity: notDeleted,
        ...(filters?.volunteerId && { volunteerId: filters.volunteerId }),
        ...(filters?.estado && { estado: filters.estado }),
      },
      include: {
        volunteer: { select: { id: true, nombre: true, apellido: true } },
        activity: { select: { id: true, nombre: true } },
        validatedBy: { select: { id: true, nombre: true, apellido: true } },
      },
      orderBy: { createdAt: "desc" },
    });
  }

  static async findProcessed(take = 50) {
    return prisma.hourLog.findMany({
      where: {
        ...notDeleted,
        volunteer: notDeleted,
        activity: notDeleted,
        estado: { in: ["validado", "rechazado"] },
      },
      include: {
        volunteer: { select: { id: true, nombre: true, apellido: true } },
        activity: { select: { id: true, nombre: true } },
        validatedBy: { select: { id: true, nombre: true, apellido: true } },
      },
      orderBy: { createdAt: "desc" },
      take,
    });
  }

  static async findById(id: string) {
    return prisma.hourLog.findFirst({
      where: {
        id,
        ...notDeleted,
        volunteer: notDeleted,
        activity: notDeleted,
      },
      include: {
        volunteer: { select: { id: true, nombre: true, apellido: true, email: true } },
        activity: { select: { id: true, nombre: true } },
        validatedBy: { select: { id: true, nombre: true, apellido: true } },
      },
    });
  }

  static async create(input: CreateHourLogInput) {
    const enrollment = await prisma.activityEnrollment.findFirst({
      where: {
        activityId: input.activityId,
        volunteerId: input.volunteerId,
        activity: notDeleted,
        volunteer: notDeleted,
      },
    });
    if (!enrollment) {
      throw new Error("El voluntario no está inscrito en esta actividad");
    }

    return prisma.hourLog.create({
      data: {
        volunteerId: input.volunteerId,
        activityId: input.activityId,
        fecha: new Date(input.fecha),
        horas: input.horas,
        notas: input.notas ?? "",
      },
    });
  }

  static async updateStatus(id: string, input: UpdateHourLogInput) {
    const log = await prisma.hourLog.findFirst({
      where: { id, ...notDeleted },
    });
    if (!log) throw new Error("Registro de horas no encontrado");
    if (log.estado !== "pendiente") {
      throw new Error("Solo se pueden validar registros pendientes");
    }

    return prisma.hourLog.update({
      where: { id },
      data: {
        estado: input.estado,
        validatedById: input.validatedById,
      },
    });
  }
}
