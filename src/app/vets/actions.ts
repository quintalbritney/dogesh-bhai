"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { requireRole } from "@/lib/auth";

export async function createVet(formData: FormData) {
  const profile = await requireRole(["admin", "ngo"]);
  const supabase = await createClient();

  const name = String(formData.get("name") ?? "").trim();
  const address = String(formData.get("address") ?? "") || null;
  const phone = String(formData.get("phone") ?? "") || null;
  const lat = Number(formData.get("lat"));
  const lng = Number(formData.get("lng"));

  if (!name || !Number.isFinite(lat) || !Number.isFinite(lng)) {
    redirect(
      `/vets?error=${encodeURIComponent("Name and a location are required")}`,
    );
  }

  const { error } = await supabase.from("vets").insert({
    name,
    address,
    phone,
    lat,
    lng,
    created_by: profile.id,
  });

  if (error) {
    redirect(`/vets?error=${encodeURIComponent(error.message)}`);
  }

  revalidatePath("/vets");
}
