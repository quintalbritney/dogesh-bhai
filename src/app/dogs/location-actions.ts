"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { requireProfile } from "@/lib/auth";
import type { PingSource } from "@/lib/supabase/types";

export async function logLocationPing(
  dogId: string,
  pawpassId: string,
  lat: number,
  lng: number,
  source: PingSource,
) {
  const profile = await requireProfile();
  const supabase = await createClient();

  const { error } = await supabase.from("location_pings").insert({
    dog_id: dogId,
    lat,
    lng,
    source,
    logged_by: profile.id,
  });

  if (!error) {
    await supabase
      .from("dogs")
      .update({ current_lat: lat, current_lng: lng })
      .eq("id", dogId);

    await supabase.from("timeline_events").insert({
      dog_id: dogId,
      event_type: "location_updated",
      description:
        source === "qr_scan"
          ? `${profile.full_name ?? "Someone"} scanned this dog's QR tag and logged its location.`
          : `${profile.full_name ?? "Someone"} logged a sighting.`,
      created_by: profile.id,
    });
  }

  revalidatePath(`/dogs/${pawpassId}`);
  revalidatePath("/map");
}
