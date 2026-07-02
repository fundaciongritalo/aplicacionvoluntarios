import { redirect } from "next/navigation";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { VolunteerSidebar } from "@/components/volunteer-sidebar";
import { IdleLogout } from "@/components/idle-logout";

export default async function PortalLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await auth();
  if (!session?.user) redirect("/login");

  const me = await prisma.user.findUnique({
    where: { id: session.user.id },
    select: {
      deletedAt: true,
      role: true,
      nombre: true,
      apellido: true,
      email: true,
      avatarUrl: true,
    },
  });
  if (!me || me.deletedAt) redirect("/login");
  if (me.role !== "admin" && me.role !== "voluntario") redirect("/login");

  const isAdmin = me.role === "admin";

  const profile = {
    nombre: me.nombre ?? "",
    apellido: me.apellido ?? "",
    email: me.email ?? "",
    avatarUrl: me.avatarUrl,
  };

  return (
    <div className="min-h-screen bg-surface-secondary">
      <IdleLogout />
      <VolunteerSidebar profile={profile} isAdmin={isAdmin} />
      <main id="main-content" className="lg:ml-64 min-h-screen min-w-0 overflow-x-hidden">
        <div className="p-4 sm:p-6 lg:p-8 pt-16 lg:pt-8">{children}</div>
      </main>
    </div>
  );
}
