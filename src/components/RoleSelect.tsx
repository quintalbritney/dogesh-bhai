"use client";

import { useTransition } from "react";
import { setUserRole } from "@/app/console/actions";
import type { UserRole } from "@/lib/supabase/types";

const ROLES: UserRole[] = ["caregiver", "vet", "ngo", "admin"];
const ROLE_LABEL: Record<UserRole, string> = {
  caregiver: "Volunteer",
  vet: "vet",
  ngo: "ngo",
  admin: "admin",
};

export default function RoleSelect({
  userId,
  role,
}: {
  userId: string;
  role: UserRole;
}) {
  const [isPending, startTransition] = useTransition();

  return (
    <select
      defaultValue={role}
      disabled={isPending}
      onChange={(e) =>
        startTransition(() => {
          setUserRole(userId, e.target.value as UserRole);
        })
      }
      className="rounded-md border px-2 py-1 text-xs disabled:opacity-50"
    >
      {ROLES.map((r) => (
        <option key={r} value={r}>
          {ROLE_LABEL[r]}
        </option>
      ))}
    </select>
  );
}
