"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { AlertCircle, CheckCircle2, Phone, Building2, IdCard } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import {
  updateProfileSchema,
  type UpdateProfileFormData,
} from "@/lib/validations/auth";
import { updateOwnProfileAction } from "@/lib/actions/account";

interface EditProfileFormProps {
  defaultValues: {
    nombre: string;
    apellido: string;
    telefono: string;
    cedula: string;
    sede: string;
    avatarUrl: string;
  };
}

export function EditProfileForm({ defaultValues }: EditProfileFormProps) {
  const router = useRouter();
  const [serverError, setServerError] = useState("");
  const [success, setSuccess] = useState(false);
  const [loading, setLoading] = useState(false);

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<UpdateProfileFormData>({
    resolver: zodResolver(updateProfileSchema),
    defaultValues,
  });

  async function onSubmit(data: UpdateProfileFormData) {
    setServerError("");
    setSuccess(false);
    setLoading(true);

    try {
      const result = await updateOwnProfileAction(data);
      if (result.success) {
        setSuccess(true);
        router.refresh();
      } else {
        setServerError(result.error ?? "No se pudo actualizar el perfil.");
      }
    } catch {
      setServerError("Error al actualizar el perfil. Intenta de nuevo.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-4" noValidate>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <Input
          label="Nombre"
          placeholder="Nombre"
          error={errors.nombre?.message}
          {...register("nombre")}
        />
        <Input
          label="Apellido"
          placeholder="Apellido"
          error={errors.apellido?.message}
          {...register("apellido")}
        />
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <Input
          label="Teléfono"
          placeholder="(opcional)"
          icon={<Phone className="h-5 w-5" />}
          error={errors.telefono?.message}
          {...register("telefono")}
        />
        <Input
          label="Cédula"
          placeholder="(opcional)"
          icon={<IdCard className="h-5 w-5" />}
          error={errors.cedula?.message}
          {...register("cedula")}
        />
      </div>

      <Input
        label="Sede"
        placeholder="Ej: San José, Guanacaste…"
        icon={<Building2 className="h-5 w-5" />}
        error={errors.sede?.message}
        {...register("sede")}
      />

      <div>
        <Input
          label="URL de la imagen de perfil"
          type="text"
          placeholder="https://…"
          error={errors.avatarUrl?.message}
          {...register("avatarUrl")}
        />
        <p className="mt-1.5 text-xs text-text-muted">
          Suba la imagen a Postimages.org y pegue aquí el &apos;Enlace
          directo&apos; terminado en formato de imagen.
        </p>
      </div>

      {serverError && (
        <div className="flex items-start gap-2 p-3 bg-error-surface border border-error-border rounded-lg">
          <AlertCircle className="h-5 w-5 text-accent-red shrink-0 mt-0.5" />
          <p className="text-sm text-accent-red">{serverError}</p>
        </div>
      )}

      {success && (
        <div className="flex items-start gap-2 p-3 bg-success-surface border border-success-border rounded-lg">
          <CheckCircle2 className="h-5 w-5 text-accent-green shrink-0 mt-0.5" />
          <p className="text-sm text-accent-green">Perfil actualizado correctamente.</p>
        </div>
      )}

      <div className="flex justify-end pt-2">
        <Button type="submit" formNoValidate loading={loading}>
          Guardar cambios
        </Button>
      </div>
    </form>
  );
}
