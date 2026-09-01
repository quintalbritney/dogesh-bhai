"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { requireProfile } from "@/lib/auth";

export async function connectDogToNgo(
  dogId: string,
  pawpassId: string,
  formData: FormData,
) {
  const profile = await requireProfile();
  if (profile.role !== "admin") {
    redirect(`/dogs/${pawpassId}?error=${encodeURIComponent("Only an admin can connect a dog with an NGO")}`);
  }
  const supabase = await createClient();
  const orgId = String(formData.get("org_id") ?? "");
  if (!orgId) redirect(`/dogs/${pawpassId}?error=${encodeURIComponent("Choose an NGO first")}`);

  const { data: org, error } = await supabase
    .from("dogs")
    .update({ assigned_org_id: orgId })
    .eq("id", dogId)
    .select("assigned_org_id, organisations!dogs_assigned_org_id_fkey(name)")
    .single();

  if (!error && org) {
    const orgName =
      (org as unknown as { organisations: { name: string } | null }).organisations
        ?.name ?? "an NGO";
    await supabase.from("timeline_events").insert({
      dog_id: dogId,
      event_type: "ngo_assigned",
      description: `${profile.full_name ?? "An admin"} connected this dog with ${orgName}.`,
      created_by: profile.id,
    });
  } else if (error) {
    redirect(`/dogs/${pawpassId}?error=${encodeURIComponent(error.message)}`);
  }

  revalidatePath(`/dogs/${pawpassId}`);
  revalidatePath("/console");
}

export async function setMunicipalRegistration(
  dogId: string,
  pawpassId: string,
  formData: FormData,
) {
  const profile = await requireProfile();
  const supabase = await createClient();
  const municipal_reference = String(formData.get("municipal_reference") ?? "") || null;

  const { error } = await supabase
    .from("dog_registration_milestones")
    .update({
      municipally_registered: true,
      municipal_reference,
      municipally_registered_at: new Date().toISOString(),
      municipally_registered_by: profile.id,
    })
    .eq("dog_id", dogId);

  if (!error) {
    await supabase.from("timeline_events").insert({
      dog_id: dogId,
      event_type: "municipally_registered",
      ref_table: "dog_registration_milestones",
      ref_id: dogId,
      description: `${profile.full_name ?? "A team member"} marked this dog as municipally registered${
        municipal_reference ? ` (ref. ${municipal_reference})` : ""
      }.`,
      created_by: profile.id,
    });
  } else {
    redirect(`/dogs/${pawpassId}?error=${encodeURIComponent(error.message)}`);
  }

  revalidatePath(`/dogs/${pawpassId}`);
}

export async function setCollarAttached(
  dogId: string,
  pawpassId: string,
  formData: FormData,
) {
  const profile = await requireProfile();
  const supabase = await createClient();
  const collar_serial = String(formData.get("collar_serial") ?? "") || null;

  const { error } = await supabase
    .from("dog_registration_milestones")
    .update({
      collar_attached: true,
      collar_serial,
      collared_at: new Date().toISOString(),
      collared_by: profile.id,
    })
    .eq("dog_id", dogId);

  if (!error) {
    await supabase.from("timeline_events").insert({
      dog_id: dogId,
      event_type: "collar_attached",
      ref_table: "dog_registration_milestones",
      ref_id: dogId,
      description: `${profile.full_name ?? "A team member"} attached a QR collar${
        collar_serial ? ` (${collar_serial})` : ""
      }.`,
      created_by: profile.id,
    });
  } else {
    redirect(`/dogs/${pawpassId}?error=${encodeURIComponent(error.message)}`);
  }

  revalidatePath(`/dogs/${pawpassId}`);
}
