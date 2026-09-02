import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { requireRole } from "@/lib/auth";
import { decideHealthEventVerification } from "@/app/dogs/health-actions";
import type { Dog, HealthEvent } from "@/lib/supabase/types";

export default async function VerificationQueuePage() {
  await requireRole(["vet", "admin"]);
  const supabase = await createClient();

  const { data: events } = await supabase
    .from("health_events")
    .select("*")
    .eq("verification_status", "community")
    .order("created_at", { ascending: true });

  const pending = (events ?? []) as HealthEvent[];
  const dogIds = [...new Set(pending.map((e) => e.dog_id))];
  const submitterIds = [...new Set(pending.map((e) => e.submitted_by))];

  const [{ data: dogsList }, { data: submitters }] = await Promise.all([
    dogIds.length > 0
      ? supabase.from("dogs").select("*").in("id", dogIds)
      : Promise.resolve({ data: [] as Dog[] }),
    submitterIds.length > 0
      ? supabase.from("profiles").select("id, full_name").in("id", submitterIds)
      : Promise.resolve({ data: [] as { id: string; full_name: string | null }[] }),
  ]);
  const dogsById = new Map((dogsList ?? []).map((d) => [d.id, d as Dog]));
  const submittersById = new Map((submitters ?? []).map((p) => [p.id, p]));

  return (
    <main className="mx-auto max-w-2xl px-4 py-10">
      <h1 className="text-3xl font-bold">Verification queue</h1>
      <p className="mt-1 text-sm text-muted">
        {pending.length} health record{pending.length === 1 ? "" : "s"} awaiting
        verification.
      </p>

      <ul className="mt-6 flex flex-col gap-3">
        {pending.map((event) => {
          const dog = dogsById.get(event.dog_id);
          const submitter = submittersById.get(event.submitted_by);
          return (
            <li key={event.id} className="card p-3 text-sm">
              <div className="flex items-center justify-between gap-2">
                <span className="font-medium capitalize">
                  {event.type.replace("_", " ")} ({event.event_date})
                </span>
                {dog && (
                  <Link href={`/dogs/${dog.pawpass_id}`} className="underline">
                    {dog.name}
                  </Link>
                )}
              </div>
              <p className="text-xs text-muted">
                Added by {submitter?.full_name ?? "a volunteer"}
              </p>
              {event.provider && (
                <p className="text-muted">Provider: {event.provider}</p>
              )}
              {event.notes && <p className="text-muted">{event.notes}</p>}
              {dog && (
                <div className="mt-2 flex gap-2">
                  <form
                    action={decideHealthEventVerification.bind(
                      null,
                      event.id,
                      dog.id,
                      dog.pawpass_id,
                      "verified",
                    )}
                  >
                    <button className="btn-primary btn-sm">
                      Verify
                    </button>
                  </form>
                  <form
                    action={decideHealthEventVerification.bind(
                      null,
                      event.id,
                      dog.id,
                      dog.pawpass_id,
                      "disputed",
                    )}
                  >
                    <button className="btn-outline btn-sm">
                      Dispute
                    </button>
                  </form>
                </div>
              )}
            </li>
          );
        })}
        {pending.length === 0 && (
          <p className="text-sm text-muted">Nothing waiting on you.</p>
        )}
      </ul>
    </main>
  );
}
