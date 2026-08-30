import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { requireProfile } from "@/lib/auth";
import PawPrint from "@/components/PawPrint";
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
        <h1 className="text-3xl font-bold">All dogs</h1>
        <Link href="/dogs/new" className="btn-primary btn-sm">
          + Register a dog
        </Link>
      </div>

      {allDogs.length === 0 && (
        <p className="mt-4 text-sm text-muted">
          No dogs registered yet in this community.
        </p>
      )}

      <ul className="mt-4 flex flex-col gap-2">
        {allDogs.map((dog) => (
          <li key={dog.id}>
            <Link
              href={`/dogs/${dog.pawpass_id}`}
              className="card flex items-center justify-between p-3 transition hover:border-primary"
            >
              <div className="flex items-center gap-3">
                {dog.photo_url ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img
                    src={dog.photo_url}
                    alt={dog.name}
                    className="h-10 w-10 rounded-full object-cover"
                  />
                ) : (
                  <span className="flex h-10 w-10 items-center justify-center rounded-full bg-primary/15 text-primary">
                    <PawPrint className="h-5 w-5" />
                  </span>
                )}
                <div>
                  <p className="font-medium">{dog.name}</p>
                  <p className="font-mono text-xs text-muted">{dog.pawpass_id}</p>
                </div>
              </div>
              <span>{STATUS_LABEL[dog.status]}</span>
            </Link>
          </li>
        ))}
      </ul>
    </main>
  );
}
