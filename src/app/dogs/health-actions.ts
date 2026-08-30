"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { requireProfile } from "@/lib/auth";
import { notifyUser } from "@/lib/notifications";
import type { HealthEventType } from "@/lib/supabase/types";

export async function submitHealthEvent(
  dogId: string,
  pawpassId: string,
  formData: FormData,
) {
  const profile = await requireProfile();
  const supabase = await createClient();

  const type = String(formData.get("type") ?? "") as HealthEventType;
  const event_date = String(formData.get("event_date") ?? "") || undefined;
  const provider = String(formData.get("provider") ?? "") || null;
  const notes = String(formData.get("notes") ?? "") || null;

  if (!type) {
    redirect(`/dogs/${pawpassId}?error=${encodeURIComponent("Health event type is required")}`);
  }

  const { data: event, error } = await supabase
    .from("health_events")
    .insert({
      dog_id: dogId,
      type,
      event_date,
      provider,
      notes,
      submitted_by: profile.id,
    })
    .select()
    .single();

  if (!error && event) {
    await supabase.from("timeline_events").insert({
      dog_id: dogId,
      event_type: "health_event_submitted",
      ref_table: "health_events",
      ref_id: event.id,
      description: `${profile.full_name ?? "A caregiver"} submitted a ${type.replace("_", " ")} record (unverified).`,
      created_by: profile.id,
    });
  }

  revalidatePath(`/dogs/${pawpassId}`);
}

export async function decideHealthEventVerification(
  eventId: string,
  dogId: string,
  pawpassId: string,
  decision: "verified" | "disputed",
) {
  const profile = await requireProfile();
  if (profile.role !== "vet" && profile.role !== "admin") {
    redirect(`/dogs/${pawpassId}?error=${encodeURIComponent("Only a vet or admin can verify health records")}`);
  }
  const supabase = await createClient();

  const { data: event, error } = await supabase
    .from("health_events")
    .update({
      verification_status: decision,
      verified_by: profile.id,
      verified_at: new Date().toISOString(),
    })
    .eq("id", eventId)
    .select()
    .single();

  if (!error && event) {
    await supabase.from("timeline_events").insert({
      dog_id: dogId,
      event_type: "health_event_verified",
      ref_table: "health_events",
      ref_id: event.id,
      description: `${profile.full_name ?? "A vet"} marked a ${event.type.replace("_", " ")} record as ${decision}.`,
      created_by: profile.id,
    });

    if (event.submitted_by !== profile.id) {
      await notifyUser(
        supabase,
        event.submitted_by,
        "health_event_verified",
        `Your ${event.type.replace("_", " ")} record has been marked ${decision}.`,
      );
    }
  }

  revalidatePath(`/dogs/${pawpassId}`);
  revalidatePath("/verify");
}
