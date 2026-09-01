"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { requireRole } from "@/lib/auth";
import { demoDogs } from "@/lib/demoDogs";
import { demoNgos, legacyDemoNgoNames } from "@/lib/demoNgos";
import { listDogPhotos, pickRandom } from "@/lib/dogPhotoStorage";
import { looksLikeJunkName, pickUnusedIndianName } from "@/lib/indianDogNames";
import type { UserRole } from "@/lib/supabase/types";

const AHMEDABAD = { lat: 23.0225, lng: 72.5714 };

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

// Renames any dog still stuck with a filename-derived name (e.g. "Street
// Dog (Whatsapp Image 2026 09 01 At 19.35.32 (1))" from before this fix)
// to a proper name, drawn from the same Indian-name pool used for future
// registrations. Dogs with a real, human-given name are left untouched.
export async function renameGenericNamedDogs() {
  const profile = await requireRole(["admin"]);
  const supabase = await createClient();

  const { data: dogs } = await supabase
    .from("dogs")
    .select("id, name")
    .eq("archived", false);

  const allDogs = dogs ?? [];
  const usedNames = new Set(allDogs.map((d) => d.name));
  const targets = allDogs.filter((d) => looksLikeJunkName(d.name));

  for (const dog of targets) {
    const newName = pickUnusedIndianName(usedNames);
    usedNames.add(newName);

    const { error } = await supabase
      .from("dogs")
      .update({ name: newName })
      .eq("id", dog.id);

    if (!error) {
      await supabase.from("timeline_events").insert({
        dog_id: dog.id,
        event_type: "profile_updated",
        description: `${profile.full_name ?? "An admin"} renamed this dog from an auto-generated filename to ${newName}.`,
        created_by: profile.id,
      });
    }
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

  const bucketPhotos = pickRandom(await listDogPhotos(supabase), demoDogs.length);

  for (const [i, demo] of demoDogs.entries()) {
    if (existingNames.has(demo.name)) continue;

    const { data: dog, error } = await supabase
      .from("dogs")
      .insert({
        name: demo.name,
        sex: demo.sex,
        age_estimate: demo.age_estimate,
        coat_notes: demo.coat_notes,
        location_label: demo.location_label,
        photo_url: bucketPhotos[i]?.url ?? null,
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

// Replaces any dog's photo that is missing or still points at the old
// Wikimedia stock photos (from before the dog-photos storage bucket
// existed) with a random photo from the bucket. Existing dogs' photo_url
// values were saved at seed time and don't update on their own just
// because the source code changed.
export async function refreshStalePhotosFromBucket() {
  await requireRole(["admin"]);
  const supabase = await createClient();

  const { data: staleDogs } = await supabase
    .from("dogs")
    .select("id, photo_url")
    .or("photo_url.is.null,photo_url.ilike.%wikimedia%");

  const targets = staleDogs ?? [];
  if (targets.length === 0) {
    revalidatePath("/console");
    return;
  }

  const bucketPhotos = pickRandom(await listDogPhotos(supabase), targets.length);
  if (bucketPhotos.length === 0) {
    revalidatePath("/console");
    return;
  }

  for (const [i, dog] of targets.entries()) {
    const photo = bucketPhotos[i % bucketPhotos.length];
    await supabase.from("dogs").update({ photo_url: photo.url }).eq("id", dog.id);
  }

  revalidatePath("/console");
  revalidatePath("/dogs");
  revalidatePath("/map");
  revalidatePath("/");
}

// Registers a new dog profile, through the normal registration path, for
// every photo in the dog-photos storage bucket that isn't already attached
// to a dog. Add photos via the Supabase dashboard's Storage UI and click
// this again, no code or filename coordination needed.
export async function seedRealDogProfiles() {
  const profile = await requireRole(["admin"]);
  const supabase = await createClient();

  const bucketPhotos = await listDogPhotos(supabase);

  const { data: existingDogs } = await supabase
    .from("dogs")
    .select("name, photo_url")
    .eq("archived", false);

  const usedUrls = new Set((existingDogs ?? []).map((d) => d.photo_url));
  const usedNames = new Set((existingDogs ?? []).map((d) => d.name));

  const newPhotos = bucketPhotos.filter((photo) => !usedUrls.has(photo.url));

  for (const photo of newPhotos) {
    const name = pickUnusedIndianName(usedNames);
    usedNames.add(name);

    const { data: dog, error } = await supabase
      .from("dogs")
      .insert({
        name,
        sex: "unknown",
        photo_url: photo.url,
        status: "well_cared_for",
        current_lat: AHMEDABAD.lat + (Math.random() - 0.5) * 0.06,
        current_lng: AHMEDABAD.lng + (Math.random() - 0.5) * 0.06,
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
        description: `${dog.name} was registered and given Dogesh Bhai ID ${dog.pawpass_id}.`,
        created_by: profile.id,
      });
    }
  }

  revalidatePath("/console");
  revalidatePath("/dogs");
  revalidatePath("/map");
  revalidatePath("/");
}

export async function seedDemoNgos() {
  const profile = await requireRole(["admin"]);
  const supabase = await createClient();

  // Replace any earlier demo NGOs seeded before locality suffixes were added.
  await supabase.from("organisations").delete().in("name", legacyDemoNgoNames);

  const { data: existing } = await supabase
    .from("organisations")
    .select("name")
    .in(
      "name",
      demoNgos.map((n) => n.name),
    );
  const existingNames = new Set((existing ?? []).map((n) => n.name));

  const newOrgs = demoNgos
    .filter((n) => !existingNames.has(n.name))
    .map((n) => ({
      name: n.name,
      type: n.type,
      verification_status: "verified" as const,
      created_by: profile.id,
    }));

  if (newOrgs.length > 0) {
    await supabase.from("organisations").insert(newOrgs);
  }

  revalidatePath("/learn");
  revalidatePath("/console");
}
