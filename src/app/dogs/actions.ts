"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { requireProfile } from "@/lib/auth";
import { todayISODate } from "@/lib/dates";
import { uploadDogPhoto } from "@/lib/dogPhotoStorage";
import type { DogSex } from "@/lib/supabase/types";

export async function createDog(formData: FormData) {
  const profile = await requireProfile();
  const supabase = await createClient();

  const name = String(formData.get("name") ?? "").trim();
  const sex = String(formData.get("sex") ?? "unknown") as DogSex;
  const age_estimate = String(formData.get("age_estimate") ?? "") || null;
  const coat_notes = String(formData.get("coat_notes") ?? "") || null;
  const markers = String(formData.get("markers") ?? "") || null;
  const location_label = String(formData.get("location_label") ?? "") || null;

  const photoFile = formData.get("photo");
  const photo_url =
    photoFile instanceof File ? await uploadDogPhoto(supabase, photoFile) : null;

  if (!name) redirect("/dogs/new?error=Dog+name+is+required");

  const { data: dog, error } = await supabase
    .from("dogs")
    .insert({
      name,
      sex,
      age_estimate,
      coat_notes,
      markers,
      location_label,
      photo_url,
      created_by: profile.id,
    })
    .select()
    .single();

  if (error || !dog) {
    redirect(`/dogs/new?error=${encodeURIComponent(error?.message ?? "Could not register dog")}`);
  }

  await supabase.from("timeline_events").insert({
    dog_id: dog.id,
    event_type: "registered",
    ref_table: "dogs",
    ref_id: dog.id,
    description: `${name} was registered and given Dogesh Bhai ID ${dog.pawpass_id}.`,
    created_by: profile.id,
  });

  redirect(`/dogs/${dog.pawpass_id}`);
}

export async function updateDog(
  dogId: string,
  pawpassId: string,
  formData: FormData,
) {
  const profile = await requireProfile();
  const supabase = await createClient();

  const name = String(formData.get("name") ?? "").trim();
  const sex = String(formData.get("sex") ?? "unknown") as DogSex;
  const age_estimate = String(formData.get("age_estimate") ?? "") || null;
  const coat_notes = String(formData.get("coat_notes") ?? "") || null;
  const markers = String(formData.get("markers") ?? "") || null;
  const location_label = String(formData.get("location_label") ?? "") || null;

  const photoFile = formData.get("photo");
  const newPhotoUrl =
    photoFile instanceof File && photoFile.size > 0
      ? await uploadDogPhoto(supabase, photoFile)
      : undefined; // undefined = leave the existing photo alone

  if (!name) redirect(`/dogs/${pawpassId}?error=${encodeURIComponent("Dog name is required")}`);

  const { error } = await supabase
    .from("dogs")
    .update({
      name,
      sex,
      age_estimate,
      coat_notes,
      markers,
      location_label,
      ...(newPhotoUrl !== undefined ? { photo_url: newPhotoUrl } : {}),
    })
    .eq("id", dogId);

  if (!error) {
    await supabase.from("timeline_events").insert({
      dog_id: dogId,
      event_type: "profile_updated",
      description: `${profile.full_name ?? "A caregiver"} updated ${name}'s profile.`,
      created_by: profile.id,
    });
  } else {
    redirect(`/dogs/${pawpassId}?error=${encodeURIComponent(error.message)}`);
  }

  revalidatePath(`/dogs/${pawpassId}`);
}

export async function assignSelfAsCaregiver(
  dogId: string,
  pawpassId: string,
  role: "primary" | "backup",
) {
  const profile = await requireProfile();
  const supabase = await createClient();

  const { error } = await supabase.from("caregiver_assignments").insert({
    dog_id: dogId,
    user_id: profile.id,
    role,
  });

  if (!error) {
    await supabase.from("timeline_events").insert({
      dog_id: dogId,
      event_type: "caregiver_assigned",
      description: `${profile.full_name ?? "A caregiver"} joined as ${role} caregiver.`,
      created_by: profile.id,
    });
  }

  revalidatePath(`/dogs/${pawpassId}`);
}

export async function leaveCaregiverTeam(assignmentId: string, pawpassId: string) {
  const profile = await requireProfile();
  const supabase = await createClient();

  await supabase
    .from("caregiver_assignments")
    .update({ status: "left" })
    .eq("id", assignmentId)
    .eq("user_id", profile.id);

  revalidatePath(`/dogs/${pawpassId}`);
}

export async function createFeedingSchedule(dogId: string, pawpassId: string) {
  const profile = await requireProfile();
  const supabase = await createClient();

  const { error } = await supabase.from("care_schedules").insert({
    dog_id: dogId,
    task_type: "feeding",
    frequency: "daily",
    created_by: profile.id,
  });

  if (!error) {
    await supabase.from("timeline_events").insert({
      dog_id: dogId,
      event_type: "schedule_created",
      description: "A daily feeding schedule was created.",
      created_by: profile.id,
    });
  }

  revalidatePath(`/dogs/${pawpassId}`);
}

export async function completeCareTask(
  scheduleId: string,
  dogId: string,
  pawpassId: string,
  dueDate?: string,
) {
  const profile = await requireProfile();
  const supabase = await createClient();
  const due_date = dueDate ?? todayISODate();

  const { data: task, error } = await supabase
    .from("care_tasks")
    .upsert(
      {
        schedule_id: scheduleId,
        dog_id: dogId,
        due_date,
        status: "completed",
        completed_by: profile.id,
        completed_at: new Date().toISOString(),
      },
      { onConflict: "schedule_id,due_date" },
    )
    .select()
    .single();

  if (!error && task) {
    await supabase.from("timeline_events").insert({
      dog_id: dogId,
      event_type: "care_completed",
      ref_table: "care_tasks",
      ref_id: task.id,
      description:
        due_date === todayISODate()
          ? `${profile.full_name ?? "A caregiver"} completed today's care.`
          : `${profile.full_name ?? "A caregiver"} completed a missed care task from ${due_date}.`,
      created_by: profile.id,
    });
  }

  revalidatePath(`/dogs/${pawpassId}`);
  revalidatePath("/tasks");
}

export async function markCareCheckedNoActionNeeded(
  scheduleId: string,
  dogId: string,
  pawpassId: string,
  dueDate?: string,
) {
  const profile = await requireProfile();
  const supabase = await createClient();
  const due_date = dueDate ?? todayISODate();

  const { data: task, error } = await supabase
    .from("care_tasks")
    .upsert(
      {
        schedule_id: scheduleId,
        dog_id: dogId,
        due_date,
        status: "checked_no_action_needed",
        completed_by: profile.id,
        completed_at: new Date().toISOString(),
      },
      { onConflict: "schedule_id,due_date" },
    )
    .select()
    .single();

  if (!error && task) {
    await supabase.from("timeline_events").insert({
      dog_id: dogId,
      event_type: "care_checked_no_action_needed",
      ref_table: "care_tasks",
      ref_id: task.id,
      description: `${profile.full_name ?? "A caregiver"} checked in and no feeding was needed.`,
      created_by: profile.id,
    });
  }

  revalidatePath(`/dogs/${pawpassId}`);
  revalidatePath("/tasks");
}
