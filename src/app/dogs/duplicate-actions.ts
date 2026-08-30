"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { requireProfile, requireRole } from "@/lib/auth";

export async function flagPossibleDuplicate(
  dogId: string,
  pawpassId: string,
  formData: FormData,
) {
  await requireProfile();
  const supabase = await createClient();

  const otherPawpassId = String(formData.get("other_pawpass_id") ?? "")
    .trim()
    .toUpperCase();
  const note = String(formData.get("note") ?? "") || null;

  if (!otherPawpassId || otherPawpassId === pawpassId.toUpperCase()) {
    redirect(
      `/dogs/${pawpassId}?error=${encodeURIComponent("Enter a different dog's PawPass ID to compare against")}`,
    );
  }

  const { data: otherDog } = await supabase
    .from("dogs")
    .select("id")
    .eq("pawpass_id", otherPawpassId)
    .single();

  if (!otherDog) {
    redirect(
      `/dogs/${pawpassId}?error=${encodeURIComponent(`No dog found with PawPass ID ${otherPawpassId}`)}`,
    );
  }

  await supabase.from("duplicate_flags").insert({
    dog_a: dogId,
    dog_b: otherDog.id,
    note,
  });

  revalidatePath(`/dogs/${pawpassId}`);
  revalidatePath("/console");
}

export async function mergeDuplicateFlag(
  flagId: string,
  keepDogId: string,
  archiveDogId: string,
) {
  const profile = await requireRole(["admin"]);
  const supabase = await createClient();

  await supabase
    .from("dogs")
    .update({ archived: true, merged_into: keepDogId })
    .eq("id", archiveDogId);

  await supabase.from("timeline_events").insert({
    dog_id: keepDogId,
    event_type: "duplicate_merged",
    description: "A duplicate profile was merged into this record.",
    created_by: profile.id,
  });

  await supabase
    .from("duplicate_flags")
    .update({ status: "same", resolved_by: profile.id })
    .eq("id", flagId);

  revalidatePath("/console");
  revalidatePath("/dogs");
}

export async function dismissDuplicateFlag(flagId: string) {
  const profile = await requireRole(["admin"]);
  const supabase = await createClient();

  await supabase
    .from("duplicate_flags")
    .update({ status: "different", resolved_by: profile.id })
    .eq("id", flagId);

  revalidatePath("/console");
}
