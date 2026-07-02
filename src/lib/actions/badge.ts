"use server";

import { auth } from "@/auth";
import { revalidatePath } from "next/cache";
import { BadgeService } from "@/lib/services/badge.service";
import { assignSchema, createBadgeSchema, badgeIdSchema } from "@/lib/validations/badge";

function revalidateAfterBadgeStructuralChange() {
  revalidatePath("/badges");
  revalidatePath("/voluntarios");
  revalidatePath("/portal/insignias");
}

export async function assignBadgeAction(input: Record<string, unknown>) {
  const session = await auth();
  if (!session?.user || session.user.role !== "admin") {
    return { success: false as const, error: "No autorizado" };
  }

  const parsed = assignSchema.safeParse(input);
  if (!parsed.success) {
    return {
      success: false as const,
      error: parsed.error.issues.map((i) => i.message).join(", "),
    };
  }

  try {
    await BadgeService.assignToUser(parsed.data.userId, parsed.data.badgeId, session.user.id);
    revalidatePath("/badges");
    revalidatePath("/voluntarios");
    revalidatePath("/portal/insignias");
    return { success: true as const };
  } catch (e) {
    return { success: false as const, error: (e as Error).message };
  }
}

export async function createBadgeAction(input: Record<string, unknown>) {
  const session = await auth();
  if (!session?.user || session.user.role !== "admin") {
    return { success: false as const, error: "No autorizado" };
  }

  const parsed = createBadgeSchema.safeParse(input);
  if (!parsed.success) {
    return {
      success: false as const,
      error: parsed.error.issues.map((i) => i.message).join(", "),
    };
  }

  try {
    await BadgeService.create({
      nombre: parsed.data.nombre,
      descripcion: parsed.data.descripcion ?? "",
      icono: parsed.data.icono?.trim()
        ? parsed.data.icono.trim()
        : "🏆",
      criterio: parsed.data.criterio,
      valorCriterio: parsed.data.valorCriterio,
    });
    revalidatePath("/badges");
    return { success: true as const };
  } catch (e) {
    return { success: false as const, error: (e as Error).message };
  }
}

export async function updateBadgeAction(
  id: string,
  input: Record<string, unknown>,
) {
  const session = await auth();
  if (!session?.user || session.user.role !== "admin") {
    return { success: false as const, error: "No autorizado" };
  }

  const idParsed = badgeIdSchema.safeParse(id);
  if (!idParsed.success) {
    return {
      success: false as const,
      error: idParsed.error.issues.map((i) => i.message).join(", "),
    };
  }

  const parsed = createBadgeSchema.safeParse(input);
  if (!parsed.success) {
    return {
      success: false as const,
      error: parsed.error.issues.map((i) => i.message).join(", "),
    };
  }

  try {
    await BadgeService.update(idParsed.data, {
      nombre: parsed.data.nombre,
      descripcion: parsed.data.descripcion ?? "",
      icono: parsed.data.icono?.trim() ? parsed.data.icono.trim() : "🏆",
      criterio: parsed.data.criterio,
      valorCriterio: parsed.data.valorCriterio,
    });
    revalidateAfterBadgeStructuralChange();
    return { success: true as const };
  } catch (e) {
    return { success: false as const, error: (e as Error).message };
  }
}

export async function deleteBadgeAction(id: string) {
  const session = await auth();
  if (!session?.user || session.user.role !== "admin") {
    return { success: false as const, error: "No autorizado" };
  }

  const idParsed = badgeIdSchema.safeParse(id);
  if (!idParsed.success) {
    return {
      success: false as const,
      error: idParsed.error.issues.map((i) => i.message).join(", "),
    };
  }

  try {
    await BadgeService.delete(idParsed.data);
    revalidateAfterBadgeStructuralChange();
    return { success: true as const };
  } catch (e) {
    return { success: false as const, error: (e as Error).message };
  }
}
