"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { requireProfile, requireRole } from "@/lib/auth";
import { notifyUser } from "@/lib/notifications";
import type { ServiceRequestType } from "@/lib/supabase/types";

export async function createServiceRequest(
  dogId: string,
  pawpassId: string,
  formData: FormData,
) {
  const profile = await requireProfile();
  const supabase = await createClient();

  const type = String(formData.get("type") ?? "") as ServiceRequestType;
  const notes = String(formData.get("notes") ?? "") || null;

  if (type !== "vaccination" && type !== "sterilisation") {
    redirect(`/dogs/${pawpassId}?error=${encodeURIComponent("Choose vaccination or sterilisation")}`);
  }

  const { data: request, error } = await supabase
    .from("service_requests")
    .insert({ dog_id: dogId, type, notes, requested_by: profile.id })
    .select()
    .single();

  if (!error && request) {
    await supabase.from("timeline_events").insert({
      dog_id: dogId,
      event_type: "service_requested",
      ref_table: "service_requests",
      ref_id: request.id,
      description: `${profile.full_name ?? "A caregiver"} requested ${type} for this dog.`,
      created_by: profile.id,
    });
  }

  revalidatePath(`/dogs/${pawpassId}`);
  revalidatePath("/requests");
}

export async function claimServiceRequest(requestId: string) {
  const profile = await requireRole(["ngo"]);
  const supabase = await createClient();

  const { data: request, error } = await supabase
    .from("service_requests")
    .update({
      status: "claimed",
      claimed_by: profile.id,
      claimed_by_org_id: profile.org_id,
      claimed_at: new Date().toISOString(),
    })
    .eq("id", requestId)
    .eq("status", "open")
    .select()
    .single();

  if (!error && request) {
    await supabase.from("timeline_events").insert({
      dog_id: request.dog_id,
      event_type: "service_request_claimed",
      ref_table: "service_requests",
      ref_id: request.id,
      description: `${profile.full_name ?? "An NGO"} took up this dog's ${request.type} request.`,
      created_by: profile.id,
    });

    if (request.requested_by !== profile.id) {
      await notifyUser(
        supabase,
        request.requested_by,
        "service_request_claimed",
        `An NGO has taken up your ${request.type} request.`,
      );
    }
  }

  revalidatePath("/requests");
  revalidatePath("/");
}

export async function completeServiceRequest(requestId: string) {
  const profile = await requireProfile();
  const supabase = await createClient();

  const { data: request, error } = await supabase
    .from("service_requests")
    .update({ status: "completed", completed_at: new Date().toISOString() })
    .eq("id", requestId)
    .select()
    .single();

  if (!error && request) {
    await supabase.from("timeline_events").insert({
      dog_id: request.dog_id,
      event_type: "service_request_completed",
      ref_table: "service_requests",
      ref_id: request.id,
      description: `${profile.full_name ?? "An NGO"} completed this dog's ${request.type} request.`,
      created_by: profile.id,
    });
  } else if (error) {
    redirect(`/requests?error=${encodeURIComponent(error.message)}`);
  }

  revalidatePath("/requests");
}

export async function cancelServiceRequest(requestId: string) {
  await requireProfile();
  const supabase = await createClient();

  const { error } = await supabase
    .from("service_requests")
    .update({ status: "cancelled" })
    .eq("id", requestId);

  if (error) {
    redirect(`/requests?error=${encodeURIComponent(error.message)}`);
  }

  revalidatePath("/requests");
}
