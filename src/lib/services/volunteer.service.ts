import { prisma } from "@/lib/prisma";
import { notDeleted } from "@/lib/soft-delete";
import bcrypt from "bcryptjs";
import { Prisma, type VolunteerStatus, type UserRole } from "@prisma/client";

export interface CreateVolunteerInput {
  email: string;
  password: string;
  nombre: string;
  apellido: string;
  cedula?: string;
  telefono?: string;
  sede?: string;
  habilidades?: string[];
  avatarUrl?: string;
}

export interface UpdateVolunteerInput {
  nombre?: string;
  apellido?: string;
  cedula?: string;
  telefono?: string;
  sede?: string;
  estado?: VolunteerStatus;
  habilidades?: string[];
  /** Texto en claro; si viene con contenido, se guarda como hash (solo uso admin) */
  password?: string;
}

const VOLUNTEER_SELECT = {
  id: true,
  email: true,
  nombre: true,
  apellido: true,
  cedula: true,
  telefono: true,
  sede: true,
  role: true,
  isProtected: true,
  estado: true,
  habilidades: true,
  avatarUrl: true,
  createdAt: true,
  updatedAt: true,
} as const;

const ACTIVITY_CARD_SELECT = {
  id: true,
  nombre: true,
  tipo: true,
  fechaInicio: true,
  fechaCierre: true,
  estado: true,
} as const;

export class VolunteerService {
  static async findAdminDetail(id: string) {
    const user = await prisma.user.findFirst({
      where: { id, role: "voluntario", ...notDeleted },
      select: {
        ...VOLUNTEER_SELECT,
        enrollments: {
          where: {
            activity: notDeleted,
          },
          select: {
            id: true,
            estado: true,
            createdAt: true,
            activity: { select: ACTIVITY_CARD_SELECT },
          },
          orderBy: { createdAt: "desc" },
        },
        userBadges: {
          orderBy: { earnedAt: "desc" },
          include: {
            badge: true,
            assignedBy: {
              select: { nombre: true, apellido: true },
            },
          },
        },
      },
    });

    if (!user) return null;

    const hoursAgg = await prisma.hourLog.aggregate({
      where: {
        volunteerId: id,
        estado: "validado",
        ...notDeleted,
      },
      _sum: { horas: true },
    });

    const horasAcumuladas = hoursAgg._sum.horas
      ? Number(hoursAgg._sum.horas)
      : 0;

    return { ...user, horasAcumuladas };
  }

  static async findAll(filters?: { estado?: VolunteerStatus }) {
    return prisma.user.findMany({
      where: {
        role: "voluntario",
        ...notDeleted,
        ...(filters?.estado && { estado: filters.estado }),
      },
      select: VOLUNTEER_SELECT,
      orderBy: { createdAt: "desc" },
    });
  }

  static async findById(id: string) {
    return prisma.user.findFirst({
      where: { id, ...notDeleted },
      select: VOLUNTEER_SELECT,
    });
  }

  static async create(input: CreateVolunteerInput) {
    const existing = await prisma.user.findUnique({
      where: { email: input.email },
    });
    if (existing) {
      throw new Error("Ya existe un usuario con ese correo electrónico");
    }

    const passwordHash = await bcrypt.hash(input.password, 12);
    const avatarTrim = input.avatarUrl?.trim();

    return prisma.user.create({
      data: {
        email: input.email,
        passwordHash,
        nombre: input.nombre,
        apellido: input.apellido,
        cedula: input.cedula,
        telefono: input.telefono ?? "",
        sede: input.sede ?? "",
        role: "voluntario",
        estado: "activo",
        habilidades: input.habilidades ?? [],
        ...(avatarTrim ? { avatarUrl: avatarTrim } : {}),
      },
      select: VOLUNTEER_SELECT,
    });
  }

  static async update(id: string, input: UpdateVolunteerInput) {
    const user = await prisma.user.findFirst({ where: { id, ...notDeleted } });
    if (!user) throw new Error("Voluntario no encontrado");

    const { password: plainPassword, ...rest } = input;

    const data: Prisma.UserUpdateInput = { ...rest };

    const trimmed = plainPassword?.trim();
    if (trimmed) {
      data.passwordHash = await bcrypt.hash(trimmed, 12);
    }

    return prisma.user.update({
      where: { id },
      data,
      select: VOLUNTEER_SELECT,
    });
  }

  static async findAllUsers(filters?: { estado?: VolunteerStatus; role?: UserRole }) {
    return prisma.user.findMany({
      where: {
        ...notDeleted,
        ...(filters?.estado && { estado: filters.estado }),
        ...(filters?.role && { role: filters.role }),
      },
      select: VOLUNTEER_SELECT,
      orderBy: { createdAt: "desc" },
    });
  }

  static async changeRole(id: string, newRole: UserRole, requesterId: string) {
    const user = await prisma.user.findFirst({
      where: { id, ...notDeleted },
      select: { ...VOLUNTEER_SELECT, isProtected: true },
    });
    if (!user) throw new Error("Usuario no encontrado");
    if (user.id === requesterId) {
      throw new Error("No puedes cambiar tu propio rol");
    }
    if (user.isProtected && newRole !== "admin") {
      throw new Error("Este administrador está protegido y no puede ser degradado");
    }

    const adminCount = await prisma.user.count({
      where: { role: "admin", ...notDeleted },
    });

    if (user.role === "admin" && newRole === "voluntario" && adminCount <= 1) {
      throw new Error("Debe existir al menos un administrador en el sistema");
    }

    return prisma.user.update({
      where: { id },
      data: { role: newRole },
      select: VOLUNTEER_SELECT,
    });
  }

  static async delete(id: string) {
    const user = await prisma.user.findFirst({ where: { id, ...notDeleted } });
    if (!user) throw new Error("Voluntario no encontrado");
    if (user.role === "admin") throw new Error("No se puede eliminar un administrador");
    if (user.isProtected) throw new Error("Este usuario está protegido y no puede ser eliminado");

    await prisma.$executeRaw(
      Prisma.sql`UPDATE "User" SET "deletedAt" = ${new Date()} WHERE id = ${id}`,
    );
  }
}
