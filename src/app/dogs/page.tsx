import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { requireProfile } from "@/lib/auth";
import PawPrint from "@/components/PawPrint";
import type { Dog } from "@/lib/supabase/types";

const STATUS_LABEL: Record<string, string> = {
  well_cared_for: "🟢 Well cared for",
  attention_needed: "🟡 Attention needed",
  care_gap: "🔴 Care gap",
};

const STATS = [
  { key: "total", label: "Total dogs", emoji: "🐾", bg: "bg-secondary/15", fg: "text-secondary" },
  { key: "well_cared_for", label: "Well cared for", emoji: "🟢", bg: "bg-status-good/15", fg: "text-status-good" },
  { key: "attention_needed", label: "Need attention", emoji: "🟡", bg: "bg-status-warn/15", fg: "text-status-warn" },
  { key: "care_gap", label: "Care gaps", emoji: "🔴", bg: "bg-status-bad/15", fg: "text-status-bad" },
] as const;

export default async function AllDogsPage() {
  await requireProfile();
  const supabase = await createClient();

  const { data: dogs } = await supabase
    .from("dogs")
    .select("*")
    .eq("archived", false)
    .order("created_at", { ascending: false });

  const allDogs = (dogs ?? []) as Dog[];
  const counts = {
    total: allDogs.length,
    well_cared_for: allDogs.filter((d) => d.status === "well_cared_for").length,
    attention_needed: allDogs.filter((d) => d.status === "attention_needed").length,
    care_gap: allDogs.filter((d) => d.status === "care_gap").length,
  };

  return (
    <main className="relative mx-auto max-w-6xl px-4 py-10">
      {/* Decorative paws filling the wide side gutters */}
      <PawPrint className="pointer-events-none absolute -left-2 top-24 hidden h-16 w-16 -rotate-12 text-primary/15 xl:block" />
      <PawPrint className="pointer-events-none absolute -left-6 top-72 hidden h-10 w-10 rotate-6 text-secondary/15 xl:block" />
      <PawPrint className="pointer-events-none absolute -right-2 top-40 hidden h-20 w-20 rotate-12 text-accent/25 xl:block" />
      <PawPrint className="pointer-events-none absolute -right-8 top-96 hidden h-12 w-12 -rotate-6 text-primary/15 xl:block" />

      <div className="flex flex-wrap items-center justify-between gap-3">
        <h1 className="text-3xl font-bold">All dogs</h1>
        <Link href="/dogs/new" className="btn-primary btn-sm">
          + Register a dog
        </Link>
      </div>

      <div className="mt-6 grid grid-cols-2 gap-3 sm:grid-cols-4">
        {STATS.map((s) => (
          <div key={s.key} className="card flex items-center gap-3 p-4">
            <span className={`flex h-11 w-11 items-center justify-center rounded-full text-xl ${s.bg} ${s.fg}`}>
              {s.emoji}
            </span>
            <div>
              <p className="text-2xl font-extrabold">{counts[s.key]}</p>
              <p className="text-xs text-muted">{s.label}</p>
            </div>
          </div>
        ))}
      </div>

      {allDogs.length === 0 && (
        <p className="mt-8 text-sm text-muted">No dogs registered yet in this community.</p>
      )}

      <div className="mt-8 grid grid-cols-2 gap-5 sm:grid-cols-3 md:grid-cols-4">
        {allDogs.map((dog) => (
          <Link
            key={dog.id}
            href={`/dogs/${dog.pawpass_id}`}
            className="card group overflow-hidden transition hover:-translate-y-1 hover:shadow-lg"
          >
            <div className="aspect-square w-full overflow-hidden bg-background">
              {dog.photo_url ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  src={dog.photo_url}
                  alt={dog.name}
                  className="h-full w-full object-cover object-top transition group-hover:scale-105"
                />
              ) : (
                <div className="flex h-full w-full items-center justify-center text-primary">
                  <PawPrint className="h-12 w-12" />
                </div>
              )}
            </div>
            <div className="p-3">
              <p className="font-bold">{dog.name}</p>
              <p className="font-mono text-xs text-muted">{dog.pawpass_id}</p>
              <p className="mt-1 text-xs">{STATUS_LABEL[dog.status]}</p>
            </div>
          </Link>
        ))}
      </div>
    </main>
  );
}
