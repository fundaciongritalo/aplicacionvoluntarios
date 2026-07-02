import { prisma } from "@/lib/prisma";
import { Prisma, type BadgeCriteria } from "@prisma/client";

export interface CreateBadgeInput {
  nombre: string;
  descripcion: string;
  icono: string;
  criterio: BadgeCriteria;
  valorCriterio: number;
}

const DUPLICATE_NOMBRE_MSG = "Ya existe una insignia con ese nombre.";

export class BadgeService {
  static async findAll() {
    return prisma.badge.findMany({
      orderBy: { nombre: "asc" },
    });
  }

  static async findById(id: string) {
    return prisma.badge.findUnique({
      where: { id },
    });
  }

  static async create(input: CreateBadgeInput) {
    const nombreNormalized = input.nombre.trim();
    const existingName = await prisma.badge.findFirst({
      where: { nombre: nombreNormalized },
      select: { id: true },
    });
    if (existingName) {
      throw new Error(DUPLICATE_NOMBRE_MSG);
    }

    try {
      return await prisma.badge.create({
        data: {
          nombre: nombreNormalized,
          descripcion: (input.descripcion ?? "").trim(),
          icono: (input.icono ?? "").trim() || "🏆",
          criterio: input.criterio,
          valorCriterio: input.valorCriterio,
        },
      });
    } catch (e) {
      if (
        e instanceof Prisma.PrismaClientKnownRequestError &&
        e.code === "P2002"
      ) {
        throw new Error(DUPLICATE_NOMBRE_MSG);
      }
      throw e;
    }
  }

  static async update(id: string, input: CreateBadgeInput) {
    const current = await prisma.badge.findUnique({ where: { id } });
    if (!current) throw new Error("Insignia no encontrada");

    const nombreNormalized = input.nombre.trim();
    const nameOwner = await prisma.badge.findFirst({
      where: { nombre: nombreNormalized, NOT: { id } },
      select: { id: true },
    });
    if (nameOwner) {
      throw new Error(DUPLICATE_NOMBRE_MSG);
    }

    try {
      return await prisma.badge.update({
        where: { id },
        data: {
          nombre: nombreNormalized,
          descripcion: (input.descripcion ?? "").trim(),
          icono: (input.icono ?? "").trim() || "🏆",
          criterio: input.criterio,
          valorCriterio: input.valorCriterio,
        },
      });
    } catch (e) {
      if (
        e instanceof Prisma.PrismaClientKnownRequestError &&
        e.code === "P2002"
      ) {
        throw new Error(DUPLICATE_NOMBRE_MSG);
      }
      throw e;
    }
  }

  static async delete(id: string) {
    const current = await prisma.badge.findUnique({ where: { id } });
    if (!current) throw new Error("Insignia no encontrada");

    await prisma.badge.delete({ where: { id } });
  }

  static async listForUser(userId: string) {
    return prisma.userBadge.findMany({
      where: { userId },
      include: { badge: true },
      orderBy: { earnedAt: "desc" },
    });
  }

  /** Asignación manual (admin); ignora criterios automáticos. */
  static async assignToUser(userId: string, badgeId: string, assignedById?: string) {
    const user = await prisma.user.findFirst({
      where: { id: userId, role: "voluntario", deletedAt: null },
      select: { id: true },
    });
    if (!user) throw new Error("Voluntario no encontrado");

    const badge = await prisma.badge.findUnique({ where: { id: badgeId } });
    if (!badge) throw new Error("Insignia no encontrada");

    return prisma.userBadge.upsert({
      where: {
        userId_badgeId: { userId, badgeId },
      },
      create: { userId, badgeId, assignedById },
      update: {},
    });
  }
}
