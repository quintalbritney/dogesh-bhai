"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { requireProfile } from "@/lib/auth";
import { notifyUser } from "@/lib/notifications";
import type { CaseSeverity, CaseStatus } from "@/lib/supabase/types";

export async function reportMedicalCase(
  dogId: string,
  pawpassId: string,
  formData: FormData,
) {
  const profile = await requireProfile();
  const supabase = await createClient();

  const severity = String(formData.get("severity") ?? "medium") as CaseSeverity;
  const location_label = String(formData.get("location_label") ?? "") || null;
  const evidence_url = String(formData.get("evidence_url") ?? "") || null;

  const { data: medicalCase, error } = await supabase
    .from("medical_cases")
    .insert({
      dog_id: dogId,
      severity,
      location_label,
      evidence_url,
      reported_by: profile.id,
    })
    .select()
    .single();

  if (error || !medicalCase) {
    redirect(`/dogs/${pawpassId}?error=${encodeURIComponent(error?.message ?? "Could not report case")}`);
  }

  await supabase.from("timeline_events").insert({
    dog_id: dogId,
    event_type: "emergency_reported",
    ref_table: "medical_cases",
    ref_id: medicalCase.id,
    description: `${profile.full_name ?? "Someone"} reported a ${severity} severity health issue.`,
    created_by: profile.id,
  });

  revalidatePath(`/dogs/${pawpassId}`);
}

export async function claimMedicalCase(
  caseId: string,
  dogId: string,
  pawpassId: string,
) {
  const profile = await requireProfile();
  const supabase = await createClient();

  const { data: medicalCase, error } = await supabase
    .from("medical_cases")
    .update({ claimed_by: profile.id, status: "claimed" })
    .eq("id", caseId)
    .is("claimed_by", null)
    .select()
    .single();

  if (!error && medicalCase) {
    await supabase.from("timeline_events").insert({
      dog_id: dogId,
      event_type: "emergency_claimed",
      ref_table: "medical_cases",
      ref_id: medicalCase.id,
      description: `${profile.full_name ?? "A responder"} claimed this case and is on the way.`,
      created_by: profile.id,
    });

    if (medicalCase.reported_by !== profile.id) {
      await notifyUser(
        supabase,
        medicalCase.reported_by,
        "emergency_claimed",
        `${profile.full_name ?? "A responder"} claimed the case you reported and is on the way.`,
      );
    }
  }

  revalidatePath(`/dogs/${pawpassId}`);
}

export async function advanceMedicalCaseStatus(
  caseId: string,
  dogId: string,
  pawpassId: string,
  nextStatus: CaseStatus,
) {
  const profile = await requireProfile();
  const supabase = await createClient();

  const update: { status: CaseStatus; resolved_at?: string } = {
    status: nextStatus,
  };
  if (nextStatus === "resolved") {
    update.resolved_at = new Date().toISOString();
  }

  const { data: medicalCase, error } = await supabase
    .from("medical_cases")
    .update(update)
    .eq("id", caseId)
    .select()
    .single();

  if (!error && medicalCase) {
    await supabase.from("timeline_events").insert({
      dog_id: dogId,
      event_type: "emergency_status_changed",
      ref_table: "medical_cases",
      ref_id: medicalCase.id,
      description:
        nextStatus === "resolved"
          ? `${profile.full_name ?? "A responder"} resolved this case.`
          : `Case status changed to ${nextStatus.replace("_", " ")}.`,
      created_by: profile.id,
    });

    if (nextStatus === "resolved" && medicalCase.reported_by !== profile.id) {
      await notifyUser(
        supabase,
        medicalCase.reported_by,
        "emergency_resolved",
        "The health issue you reported has been resolved.",
      );
    }
  }

  revalidatePath(`/dogs/${pawpassId}`);
}
