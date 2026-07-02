import { Award } from "lucide-react";
import { VolunteerService } from "@/lib/services/volunteer.service";
import { BadgeService } from "@/lib/services/badge.service";
import { prisma } from "@/lib/prisma";
import { BadgesBoard } from "./badges-board";

export default async function BadgesAdminPage() {
  let volunteers: Awaited<ReturnType<typeof VolunteerService.findAll>> = [];
  let badges: Awaited<ReturnType<typeof BadgeService.findAll>> = [];
  let assignments: {
    id: string;
    earnedAt: Date;
    user: { nombre: string; apellido: string; email: string };
    badge: { nombre: string; icono: string };
  }[] = [];

  try {
    const [v, b] = await Promise.all([
      VolunteerService.findAll(),
      BadgeService.findAll(),
    ]);
    volunteers = v;
    badges = b;

    assignments = await prisma.userBadge.findMany({
      include: {
        user: {
          select: { nombre: true, apellido: true, email: true },
        },
        badge: { select: { nombre: true, icono: true } },
        assignedBy: {
          select: { nombre: true, apellido: true },
        },
      },
      orderBy: { earnedAt: "desc" },
      take: 50,
    });
  } catch {
    volunteers = [];
    badges = [];
    assignments = [];
  }

  const serializedAssignments = JSON.parse(JSON.stringify(assignments)) as Array<{
    id: string;
    earnedAt: string;
    user: { nombre: string; apellido: string; email: string };
    badge: { nombre: string; icono: string };
  }>;
  const serializedBadges = JSON.parse(JSON.stringify(badges));

  return (
    <div className="space-y-6 animate-fade-in">
      <div>
        <h1 className="text-2xl font-bold text-text-primary flex items-center gap-2">
          <Award className="h-7 w-7 text-primary-500" aria-hidden />
          Insignias
        </h1>
        <p className="text-text-secondary mt-1">
          El catálogo sirve tanto para insignias concedidas sólo desde el equipo
          (criterio &quot;Especial&quot;) como para insignias otorgadas
          automáticamente cuando un voluntario alcanza horas validadas total,
          actividades distintas o días en la plataforma según cada umbral.
        </p>
      </div>

      <BadgesBoard
        volunteers={volunteers.map((u) => ({
          id: u.id,
          nombre: u.nombre,
          apellido: u.apellido,
          email: u.email,
        }))}
        badges={serializedBadges}
        assignments={serializedAssignments}
      />
    </div>
  );
}
