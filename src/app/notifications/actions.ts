"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { requireProfile } from "@/lib/auth";

export async function markAllNotificationsRead() {
  const profile = await requireProfile();
  const supabase = await createClient();

  await supabase
    .from("notifications")
    .update({ read_status: true })
    .eq("user_id", profile.id)
    .eq("read_status", false);

  revalidatePath("/notifications");
}
