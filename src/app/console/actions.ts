"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { requireRole } from "@/lib/auth";
import type { UserRole } from "@/lib/supabase/types";

export async function setUserRole(userId: string, role: UserRole) {
  await requireRole(["admin"]);
  const supabase = await createClient();

  await supabase.from("profiles").update({ role }).eq("id", userId);

  revalidatePath("/console");
}

export async function archiveDog(dogId: string) {
  await requireRole(["admin"]);
  const supabase = await createClient();

  await supabase.from("dogs").update({ archived: true }).eq("id", dogId);

  revalidatePath("/console");
  revalidatePath("/dogs");
}

export async function unarchiveDog(dogId: string) {
  await requireRole(["admin"]);
  const supabase = await createClient();

  await supabase
    .from("dogs")
    .update({ archived: false, merged_into: null })
    .eq("id", dogId);

  revalidatePath("/console");
  revalidatePath("/dogs");
}
