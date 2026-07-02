"use server";

import bcrypt from "bcryptjs";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import {
  changePasswordSchema,
  updateProfileSchema,
  type ChangePasswordFormData,
  type UpdateProfileFormData,
} from "@/lib/validations/auth";

export async function changeOwnPasswordAction(data: ChangePasswordFormData) {
  const session = await auth();
  if (!session?.user?.id) {
    return { success: false as const, error: "No autorizado" };
  }

  const parsed = changePasswordSchema.safeParse(data);
  if (!parsed.success) {
    return {
      success: false as const,
      error: parsed.error.issues.map((i) => i.message).join(", "),
    };
  }

  const user = await prisma.user.findFirst({
    where: { id: session.user.id, deletedAt: null },
    select: { id: true, passwordHash: true },
  });

  if (!user?.passwordHash) {
    return {
      success: false as const,
      error: "No se puede cambiar la contraseña de esta cuenta.",
    };
  }

  const ok = await bcrypt.compare(parsed.data.currentPassword, user.passwordHash);
  if (!ok) {
    return {
      success: false as const,
      error: "La contraseña actual no es correcta.",
    };
  }

  const newHash = await bcrypt.hash(parsed.data.newPassword, 12);
  await prisma.user.update({
    where: { id: user.id },
    data: { passwordHash: newHash },
  });

  return { success: true as const };
}

export async function updateOwnProfileAction(data: UpdateProfileFormData) {
  const session = await auth();
  if (!session?.user?.id) {
    return { success: false as const, error: "No autorizado" };
  }

  const parsed = updateProfileSchema.safeParse(data);
  if (!parsed.success) {
    return {
      success: false as const,
      error: parsed.error.issues.map((i) => i.message).join(", "),
    };
  }

  const { nombre, apellido, telefono, cedula, sede, avatarUrl } = parsed.data;

  await prisma.user.update({
    where: { id: session.user.id },
    data: {
      nombre,
      apellido,
      telefono: telefono?.trim() || "",
      cedula: cedula?.trim() || "",
      sede: sede?.trim() || "",
      avatarUrl: avatarUrl?.trim() || null,
    },
  });

  return { success: true as const };
}
