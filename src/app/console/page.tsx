import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { requireRole } from "@/lib/auth";
import { yesterdayISODate } from "@/lib/dates";
import { archiveDog, unarchiveDog } from "@/app/console/actions";
import {
  mergeDuplicateFlag,
  dismissDuplicateFlag,
} from "@/app/dogs/duplicate-actions";
import RoleSelect from "@/components/RoleSelect";
import type { Dog, DuplicateFlag, Profile } from "@/lib/supabase/types";

export default async function ConsolePage() {
  const profile = await requireRole(["admin", "ngo"]);
  const isAdmin = profile.role === "admin";
  const supabase = await createClient();

  const [
    { data: dogs },
    { data: archivedDogs },
    { data: profiles },
    { data: pendingHealthEvents },
    { data: activeCases },
    { data: pendingFlags },
    { data: schedules },
    { data: yesterdayCompleted },
  ] = await Promise.all([
    supabase.from("dogs").select("*").eq("archived", false),
    isAdmin
      ? supabase.from("dogs").select("*").eq("archived", true)
      : Promise.resolve({ data: [] as Dog[] }),
    isAdmin
      ? supabase.from("profiles").select("*")
      : Promise.resolve({ data: [] as Profile[] }),
    supabase
      .from("health_events")
      .select("id", { count: "exact" })
      .eq("verification_status", "community"),
    supabase
      .from("medical_cases")
      .select("id", { count: "exact" })
      .neq("status", "resolved"),
    supabase
      .from("duplicate_flags")
      .select("*, dogA:dogs!duplicate_flags_dog_a_fkey(name, pawpass_id), dogB:dogs!duplicate_flags_dog_b_fkey(name, pawpass_id)")
      .eq("status", "pending"),
    supabase.from("care_schedules").select("id"),
    supabase
      .from("care_tasks")
      .select("schedule_id")
      .eq("due_date", yesterdayISODate())
      .eq("status", "completed"),
  ]);

  const allDogs = (dogs ?? []) as Dog[];
  const counts = {
    well: allDogs.filter((d) => d.status === "well_cared_for").length,
    attention: allDogs.filter((d) => d.status === "attention_needed").length,
    gap: allDogs.filter((d) => d.status === "care_gap").length,
  };

  const completedScheduleIds = new Set(
    (yesterdayCompleted ?? []).map((t) => t.schedule_id),
  );
  const missedCount = (schedules ?? []).filter(
    (s) => !completedScheduleIds.has(s.id),
  ).length;

  return (
    <main className="mx-auto max-w-3xl px-4 py-10">
      <h1 className="text-2xl font-semibold">
        {isAdmin ? "Admin console" : "NGO console"}
      </h1>

      <section className="mt-6 grid grid-cols-2 gap-3 sm:grid-cols-4">
        <div className="rounded-md border p-3">
          <p className="text-2xl font-semibold">{allDogs.length}</p>
          <p className="text-xs text-neutral-500">
            dogs — 🟢{counts.well} 🟡{counts.attention} 🔴{counts.gap}
          </p>
        </div>
        <div className="rounded-md border p-3">
          <p className="text-2xl font-semibold">{missedCount}</p>
          <p className="text-xs text-neutral-500">missed feeding tasks</p>
        </div>
        <Link href="/verify" className="rounded-md border p-3 hover:bg-neutral-50">
          <p className="text-2xl font-semibold">{pendingHealthEvents?.length ?? 0}</p>
          <p className="text-xs text-neutral-500">health records to verify</p>
        </Link>
        <div className="rounded-md border p-3">
          <p className="text-2xl font-semibold">{activeCases?.length ?? 0}</p>
          <p className="text-xs text-neutral-500">active emergencies</p>
        </div>
      </section>

      <section className="mt-8">
        <h2 className="text-lg font-medium">Duplicate flags</h2>
        <ul className="mt-2 flex flex-col gap-2">
          {((pendingFlags ?? []) as unknown as (DuplicateFlag & {
            dogA: { name: string; pawpass_id: string } | null;
            dogB: { name: string; pawpass_id: string } | null;
          })[]).map((flag) => (
            <li key={flag.id} className="rounded-md border p-3 text-sm">
              <p>
                <Link href={`/dogs/${flag.dogA?.pawpass_id}`} className="underline">
                  {flag.dogA?.name}
                </Link>{" "}
                vs{" "}
                <Link href={`/dogs/${flag.dogB?.pawpass_id}`} className="underline">
                  {flag.dogB?.name}
                </Link>
              </p>
              {flag.note && <p className="text-neutral-500">{flag.note}</p>}
              {isAdmin && (
                <div className="mt-2 flex flex-wrap gap-2">
                  <form
                    action={mergeDuplicateFlag.bind(
                      null,
                      flag.id,
                      flag.dog_a,
                      flag.dog_b,
                    )}
                  >
                    <button className="rounded-md bg-neutral-900 px-2 py-1 text-xs text-white">
                      Keep {flag.dogA?.name}, archive {flag.dogB?.name}
                    </button>
                  </form>
                  <form
                    action={mergeDuplicateFlag.bind(
                      null,
                      flag.id,
                      flag.dog_b,
                      flag.dog_a,
                    )}
                  >
                    <button className="rounded-md bg-neutral-900 px-2 py-1 text-xs text-white">
                      Keep {flag.dogB?.name}, archive {flag.dogA?.name}
                    </button>
                  </form>
                  <form action={dismissDuplicateFlag.bind(null, flag.id)}>
                    <button className="rounded-md border px-2 py-1 text-xs">
                      Different dogs
                    </button>
                  </form>
                </div>
              )}
            </li>
          ))}
          {(pendingFlags ?? []).length === 0 && (
            <p className="text-sm text-neutral-500">No duplicate flags pending.</p>
          )}
        </ul>
      </section>

      <section className="mt-8">
        <h2 className="text-lg font-medium">Dogs</h2>
        <ul className="mt-2 flex flex-col gap-2">
          {allDogs.map((dog) => (
            <li
              key={dog.id}
              className="flex items-center justify-between rounded-md border p-3 text-sm"
            >
              <Link href={`/dogs/${dog.pawpass_id}`} className="underline">
                {dog.name} — {dog.pawpass_id}
              </Link>
              {isAdmin && (
                <form action={archiveDog.bind(null, dog.id)}>
                  <button className="text-xs text-red-600 underline">
                    Archive
                  </button>
                </form>
              )}
            </li>
          ))}
        </ul>
      </section>

      {isAdmin && (archivedDogs ?? []).length > 0 && (
        <section className="mt-8">
          <h2 className="text-lg font-medium">Archived dogs</h2>
          <ul className="mt-2 flex flex-col gap-2">
            {((archivedDogs ?? []) as Dog[]).map((dog) => (
              <li
                key={dog.id}
                className="flex items-center justify-between rounded-md border p-3 text-sm text-neutral-500"
              >
                <span>{dog.name} — {dog.pawpass_id}</span>
                <form action={unarchiveDog.bind(null, dog.id)}>
                  <button className="text-xs underline">Unarchive</button>
                </form>
              </li>
            ))}
          </ul>
        </section>
      )}

      {isAdmin && (
        <section className="mt-8">
          <h2 className="text-lg font-medium">Users</h2>
          <ul className="mt-2 flex flex-col gap-2">
            {((profiles ?? []) as Profile[]).map((p) => (
              <li
                key={p.id}
                className="flex items-center justify-between rounded-md border p-3 text-sm"
              >
                <span>{p.full_name ?? p.id}</span>
                <RoleSelect userId={p.id} role={p.role} />
              </li>
            ))}
          </ul>
        </section>
      )}
    </main>
  );
}
