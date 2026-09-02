import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { requireProfile } from "@/lib/auth";
import {
  claimServiceRequest,
  completeServiceRequest,
  cancelServiceRequest,
} from "@/app/requests/actions";
import type { ServiceRequest } from "@/lib/supabase/types";

const TYPE_LABEL: Record<string, string> = {
  vaccination: "🩺 Vaccination",
  sterilisation: "✂️ Sterilisation",
};

const STATUS_LABEL: Record<string, string> = {
  open: "⬜ Open",
  claimed: "🟡 Claimed",
  completed: "🟢 Completed",
  cancelled: "⚫ Cancelled",
};

export default async function ServiceRequestsPage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string }>;
}) {
  const profile = await requireProfile();
  const { error } = await searchParams;
  const supabase = await createClient();
  const isNgo = profile.role === "ngo";
  const isAdmin = profile.role === "admin";

  const { data: requests } = await supabase
    .from("service_requests")
    .select("*")
    .order("created_at", { ascending: false });

  const all = (requests ?? []) as ServiceRequest[];
  const dogIds = [...new Set(all.map((r) => r.dog_id))];
  const { data: dogsList } =
    dogIds.length > 0
      ? await supabase.from("dogs").select("id, name, pawpass_id").in("id", dogIds)
      : { data: [] as { id: string; name: string; pawpass_id: string }[] };
  const dogsById = new Map((dogsList ?? []).map((d) => [d.id, d]));

  const open = all.filter((r) => r.status === "open");
  const myClaimed = all.filter((r) => r.claimed_by === profile.id && r.status === "claimed");
  const myRequested = all.filter((r) => r.requested_by === profile.id);
  const adminAll = isAdmin ? all : [];

  function RequestRow({ request, showClaim }: { request: ServiceRequest; showClaim: boolean }) {
    const dog = dogsById.get(request.dog_id);
    const canCancel =
      (request.status === "open" || request.status === "claimed") &&
      (isAdmin || request.requested_by === profile.id || request.claimed_by === profile.id);

    return (
      <li className="card p-3 text-sm">
        <div className="flex items-center justify-between gap-2">
          <p className="font-medium">
            {TYPE_LABEL[request.type]}
            {dog && (
              <>
                {" "}for{" "}
                <Link href={`/dogs/${dog.pawpass_id}`} className="underline">
                  {dog.name}
                </Link>
              </>
            )}
          </p>
          <span className="whitespace-nowrap text-xs text-muted">{STATUS_LABEL[request.status]}</span>
        </div>
        {request.notes && <p className="mt-1 text-muted">{request.notes}</p>}
        <div className="mt-2 flex gap-2">
          {showClaim && (
            <form action={claimServiceRequest.bind(null, request.id)}>
              <button className="btn-primary btn-sm">Approve &amp; take it up</button>
            </form>
          )}
          {request.claimed_by === profile.id && request.status === "claimed" && (
            <form action={completeServiceRequest.bind(null, request.id)}>
              <button className="btn-primary btn-sm">Mark completed</button>
            </form>
          )}
          {canCancel && (
            <form action={cancelServiceRequest.bind(null, request.id)}>
              <button className="btn-outline btn-sm">Cancel</button>
            </form>
          )}
        </div>
      </li>
    );
  }

  return (
    <main className="mx-auto max-w-2xl px-4 py-10">
      <h1 className="text-3xl font-bold">Vaccination &amp; sterilisation requests</h1>
      <p className="mt-1 text-sm text-muted">
        Anyone can flag that a dog needs vaccination or sterilisation. An NGO
        approves the request and takes it up from there.
      </p>

      {error && (
        <p className="mt-4 rounded-xl bg-red-50 px-3 py-2 text-sm text-red-700">
          {error}
        </p>
      )}

      {isNgo && (
        <>
          <section className="mt-8">
            <h2 className="text-lg font-bold">Open requests</h2>
            <p className="text-sm text-muted">Waiting for an NGO to take them up.</p>
            <ul className="mt-3 flex flex-col gap-2">
              {open.length === 0 && <p className="text-sm text-muted">Nothing open right now.</p>}
              {open.map((r) => (
                <RequestRow key={r.id} request={r} showClaim />
              ))}
            </ul>
          </section>

          {myClaimed.length > 0 && (
            <section className="mt-8">
              <h2 className="text-lg font-bold">You&apos;ve taken these up</h2>
              <ul className="mt-3 flex flex-col gap-2">
                {myClaimed.map((r) => (
                  <RequestRow key={r.id} request={r} showClaim={false} />
                ))}
              </ul>
            </section>
          )}
        </>
      )}

      <section className="mt-8">
        <h2 className="text-lg font-bold">Requests you&apos;ve made</h2>
        <ul className="mt-3 flex flex-col gap-2">
          {myRequested.length === 0 && (
            <p className="text-sm text-muted">
              None yet. Open a dog&apos;s passport page to request
              vaccination or sterilisation for it.
            </p>
          )}
          {myRequested.map((r) => (
            <RequestRow key={r.id} request={r} showClaim={isNgo && r.status === "open"} />
          ))}
        </ul>
      </section>

      {isAdmin && (
        <section className="mt-8">
          <h2 className="text-lg font-bold">All requests</h2>
          <ul className="mt-3 flex flex-col gap-2">
            {adminAll.length === 0 && <p className="text-sm text-muted">No requests yet.</p>}
            {adminAll.map((r) => (
              <RequestRow key={r.id} request={r} showClaim={false} />
            ))}
          </ul>
        </section>
      )}
    </main>
  );
}
