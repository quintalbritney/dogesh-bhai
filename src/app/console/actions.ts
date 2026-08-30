"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { requireRole } from "@/lib/auth";
import { demoDogs } from "@/lib/demoDogs";
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

export async function archiveDuplicateNamedDogs() {
  await requireRole(["admin"]);
  const supabase = await createClient();

  const { data: dogs } = await supabase
    .from("dogs")
    .select("id, name, created_at")
    .eq("archived", false)
    .order("created_at", { ascending: true });

  const seenNames = new Set<string>();
  const duplicateIds: string[] = [];

  for (const dog of dogs ?? []) {
    if (seenNames.has(dog.name)) {
      duplicateIds.push(dog.id);
    } else {
      seenNames.add(dog.name);
    }
  }

  if (duplicateIds.length > 0) {
    await supabase.from("dogs").update({ archived: true }).in("id", duplicateIds);
  }

  revalidatePath("/console");
  revalidatePath("/dogs");
  revalidatePath("/map");
  revalidatePath("/");
}

export async function seedDemoDogs() {
  const profile = await requireRole(["admin"]);
  const supabase = await createClient();

  const { data: existing } = await supabase
    .from("dogs")
    .select("name")
    .in(
      "name",
      demoDogs.map((d) => d.name),
    );
  const existingNames = new Set((existing ?? []).map((d) => d.name));

  for (const demo of demoDogs) {
    if (existingNames.has(demo.name)) continue;

    const { data: dog, error } = await supabase
      .from("dogs")
      .insert({
        name: demo.name,
        sex: demo.sex,
        age_estimate: demo.age_estimate,
        coat_notes: demo.coat_notes,
        location_label: demo.location_label,
        photo_url: demo.photo_url,
        status: demo.status,
        current_lat: demo.coords.lat,
        current_lng: demo.coords.lng,
        created_by: profile.id,
      })
      .select()
      .single();

    if (!error && dog) {
      await supabase.from("timeline_events").insert({
        dog_id: dog.id,
        event_type: "registered",
        ref_table: "dogs",
        ref_id: dog.id,
        description: `${demo.name} was registered and given Dogesh Bhai ID ${dog.pawpass_id}.`,
        created_by: profile.id,
      });
    }
  }

  revalidatePath("/console");
  revalidatePath("/dogs");
  revalidatePath("/map");
  revalidatePath("/");
}
