import { createClient } from "@/lib/supabase/server";
import { requireProfile } from "@/lib/auth";
import DogMap from "@/components/DogMap";
import type { Dog } from "@/lib/supabase/types";

export default async function MapPage() {
  await requireProfile();
  const supabase = await createClient();

  const { data: dogs } = await supabase
    .from("dogs")
    .select("*")
    .eq("archived", false);

  const allDogs = (dogs ?? []) as Dog[];
  const located = allDogs.filter((d) => d.current_lat != null);

  return (
    <main className="mx-auto max-w-3xl px-4 py-10">
      <h1 className="text-2xl font-semibold">Community map</h1>
      <p className="mt-1 text-sm text-neutral-500">
        {located.length} of {allDogs.length} dogs have a logged location.
        Locations come from caregiver sightings and QR scans — not GPS.
      </p>
      <div className="mt-4 flex gap-4 text-xs text-neutral-500">
        <span>🟢 Well cared for</span>
        <span>🟡 Attention needed</span>
        <span>🔴 Care gap</span>
      </div>
      <div className="mt-4">
        <DogMap dogs={allDogs} />
      </div>
    </main>
  );
}
