import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { requireProfile } from "@/lib/auth";
import type { Dog } from "@/lib/supabase/types";

const STATUS_LABEL: Record<string, string> = {
  well_cared_for: "🟢",
  attention_needed: "🟡",
  care_gap: "🔴",
};

export default async function AllDogsPage() {
  await requireProfile();
  const supabase = await createClient();

  const { data: dogs } = await supabase
    .from("dogs")
    .select("*")
    .eq("archived", false)
    .order("created_at", { ascending: false });

  const allDogs = (dogs ?? []) as Dog[];

  return (
    <main className="mx-auto max-w-2xl px-4 py-10">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-semibold">All dogs</h1>
        <Link href="/dogs/new" className="text-sm underline">
          + Register a dog
        </Link>
      </div>

      {allDogs.length === 0 && (
        <p className="mt-4 text-sm text-neutral-500">
          No dogs registered yet in this community.
        </p>
      )}

      <ul className="mt-4 flex flex-col gap-2">
        {allDogs.map((dog) => (
          <li key={dog.id}>
            <Link
              href={`/dogs/${dog.pawpass_id}`}
              className="flex items-center justify-between rounded-md border p-3 hover:bg-neutral-50"
            >
              <div>
                <p className="font-medium">{dog.name}</p>
                <p className="font-mono text-xs text-neutral-400">
                  {dog.pawpass_id}
                </p>
              </div>
              <span>{STATUS_LABEL[dog.status]}</span>
            </Link>
          </li>
        ))}
      </ul>
    </main>
  );
}
