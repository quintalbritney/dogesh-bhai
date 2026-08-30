import { notFound } from "next/navigation";
import { headers } from "next/headers";
import QRCode from "qrcode";
import { createClient } from "@/lib/supabase/server";
import { requireProfile } from "@/lib/auth";
import { todayISODate, yesterdayISODate } from "@/lib/dates";
import Timeline from "@/components/Timeline";
import LogSightingButton from "@/components/LogSightingButton";
import {
  assignSelfAsCaregiver,
  leaveCaregiverTeam,
  createFeedingSchedule,
  completeCareTask,
  updateDog,
} from "@/app/dogs/actions";
import {
  submitHealthEvent,
  decideHealthEventVerification,
} from "@/app/dogs/health-actions";
import {
  reportMedicalCase,
  claimMedicalCase,
  advanceMedicalCaseStatus,
} from "@/app/dogs/case-actions";
import { flagPossibleDuplicate } from "@/app/dogs/duplicate-actions";
import VerificationBadge from "@/components/VerificationBadge";
import type {
  CaregiverAssignment,
  CareSchedule,
  CaseStatus,
  CareTask,
  HealthEvent,
  MedicalCase,
  Profile,
  TimelineEvent,
} from "@/lib/supabase/types";

const NEXT_CASE_STATUS: Partial<Record<CaseStatus, CaseStatus>> = {
  claimed: "responding",
  responding: "at_vet",
  at_vet: "treatment",
  treatment: "resolved",
};

const CASE_STATUS_LABEL: Record<CaseStatus, string> = {
  reported: "🔴 Reported",
  claimed: "🟠 Claimed",
  responding: "🟠 Responder en route",
  at_vet: "🟡 At vet",
  treatment: "🟡 In treatment",
  resolved: "🟢 Resolved",
};

const STATUS_LABEL: Record<string, string> = {
  well_cared_for: "🟢 Well cared for",
  attention_needed: "🟡 Attention needed",
  care_gap: "🔴 Care gap",
};

export default async function DogPassportPage({
  params,
}: {
  params: Promise<{ pawpassId: string }>;
}) {
  const { pawpassId } = await params;
  const profile = await requireProfile();
  const supabase = await createClient();

  const { data: dog } = await supabase
    .from("dogs")
    .select("*")
    .eq("pawpass_id", pawpassId)
    .single();

  if (!dog) notFound();

  const headersList = await headers();
  const host = headersList.get("host") ?? "localhost:3000";
  const proto =
    headersList.get("x-forwarded-proto") ??
    (host.startsWith("localhost") ? "http" : "https");
  const passportUrl = `${proto}://${host}/dogs/${dog.pawpass_id}`;
  const qrDataUrl = await QRCode.toDataURL(passportUrl, { margin: 1, width: 200 });

  const { data: recentPings } = await supabase
    .from("location_pings")
    .select("*")
    .eq("dog_id", dog.id)
    .order("created_at", { ascending: false })
    .limit(1);
  const lastPing = recentPings?.[0];

  const [
    { data: assignments },
    { data: schedules },
    { data: timelineEvents },
    { data: healthEvents },
  ] = await Promise.all([
    supabase
      .from("caregiver_assignments")
      .select("*, profiles(full_name)")
      .eq("dog_id", dog.id)
      .eq("status", "active"),
    supabase.from("care_schedules").select("*").eq("dog_id", dog.id),
    supabase
      .from("timeline_events")
      .select("*")
      .eq("dog_id", dog.id)
      .order("created_at", { ascending: false }),
    supabase
      .from("health_events")
      .select("*")
      .eq("dog_id", dog.id)
      .order("event_date", { ascending: false }),
  ]);

  const { data: medicalCases } = await supabase
    .from("medical_cases")
    .select("*")
    .eq("dog_id", dog.id)
    .order("created_at", { ascending: false });

  const canVerify = profile.role === "vet" || profile.role === "admin";
  const canModerateCase = profile.role === "vet" || profile.role === "admin";

  const activeAssignments = (assignments ?? []) as (CaregiverAssignment & {
    profiles: Pick<Profile, "full_name"> | null;
  })[];
  const mySchedules = (schedules ?? []) as CareSchedule[];

  const myAssignment = activeAssignments.find((a) => a.user_id === profile.id);
  const isCaregiver = Boolean(myAssignment);
  const hasPrimary = activeAssignments.some((a) => a.role === "primary");
  const canEdit =
    dog.created_by === profile.id || isCaregiver || profile.role === "admin";

  const today = todayISODate();
  const yesterday = yesterdayISODate();

  const scheduleTaskRows = await Promise.all(
    mySchedules.map(async (schedule) => {
      const { data: tasks } = await supabase
        .from("care_tasks")
        .select("*")
        .eq("schedule_id", schedule.id)
        .in("due_date", [today, yesterday]);
      const rows = (tasks ?? []) as CareTask[];
      return {
        schedule,
        todayDone: rows.some((t) => t.due_date === today && t.status === "completed"),
        yesterdayDone: rows.some(
          (t) => t.due_date === yesterday && t.status === "completed",
        ),
      };
    }),
  );

  return (
    <main className="mx-auto max-w-2xl px-4 py-10">
      <div className="flex items-start justify-between gap-4">
        <div className="flex items-start gap-4">
          {dog.photo_url && (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={dog.photo_url}
              alt={dog.name}
              className="h-16 w-16 rounded-full border object-cover"
            />
          )}
          <div>
            <p className="font-mono text-xs text-neutral-400">{dog.pawpass_id}</p>
            <h1 className="text-3xl font-semibold">{dog.name}</h1>
            <p className="text-sm text-neutral-500">
              {dog.location_label ?? "Location not set"}
            </p>
          </div>
        </div>
        <span className="whitespace-nowrap rounded-full border px-3 py-1 text-sm">
          {STATUS_LABEL[dog.status]}
        </span>
      </div>

      {canEdit && (
        <details className="mt-3 text-sm text-neutral-500">
          <summary className="cursor-pointer">Edit dog information</summary>
          <form
            action={updateDog.bind(null, dog.id, pawpassId)}
            className="mt-2 flex flex-col gap-2 rounded-md border p-3"
          >
            <input
              name="name"
              defaultValue={dog.name}
              required
              className="rounded-md border px-2 py-1.5 text-sm"
            />
            <select
              name="sex"
              defaultValue={dog.sex}
              className="rounded-md border px-2 py-1.5 text-sm"
            >
              <option value="unknown">Not sure</option>
              <option value="male">Male</option>
              <option value="female">Female</option>
            </select>
            <input
              name="age_estimate"
              defaultValue={dog.age_estimate ?? ""}
              placeholder="Approximate age"
              className="rounded-md border px-2 py-1.5 text-sm"
            />
            <input
              name="coat_notes"
              defaultValue={dog.coat_notes ?? ""}
              placeholder="Coat / appearance"
              className="rounded-md border px-2 py-1.5 text-sm"
            />
            <input
              name="markers"
              defaultValue={dog.markers ?? ""}
              placeholder="Identification markers"
              className="rounded-md border px-2 py-1.5 text-sm"
            />
            <input
              name="location_label"
              defaultValue={dog.location_label ?? ""}
              placeholder="Usual location"
              className="rounded-md border px-2 py-1.5 text-sm"
            />
            <input
              name="photo_url"
              defaultValue={dog.photo_url ?? ""}
              placeholder="Photo URL"
              className="rounded-md border px-2 py-1.5 text-sm"
            />
            <button className="self-start rounded-md border px-3 py-1.5 text-sm">
              Save changes
            </button>
          </form>
        </details>
      )}

      <section className="mt-8 flex flex-wrap items-start gap-6">
        <div>
          <h2 className="text-lg font-medium">Location</h2>
          {lastPing ? (
            <p className="mt-1 text-sm text-neutral-500">
              Last seen {new Date(lastPing.created_at).toLocaleString()}
            </p>
          ) : (
            <p className="mt-1 text-sm text-neutral-500">
              No sightings logged yet.
            </p>
          )}
          <div className="mt-2">
            <LogSightingButton dogId={dog.id} pawpassId={pawpassId} />
          </div>
        </div>

        <div>
          <h2 className="text-lg font-medium">QR tag</h2>
          <p className="mt-1 text-sm text-neutral-500">
            Print this and attach it to {dog.name}&apos;s collar tag.
          </p>
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={qrDataUrl}
            alt={`QR code linking to ${dog.name}'s passport`}
            className="mt-2 h-32 w-32 rounded-md border bg-white p-1"
          />
        </div>
      </section>

      <details className="mt-4 text-sm text-neutral-500">
        <summary className="cursor-pointer">
          This looks like a dog we already have a record for
        </summary>
        <form
          action={flagPossibleDuplicate.bind(null, dog.id, pawpassId)}
          className="mt-2 flex flex-col gap-2 rounded-md border p-3"
        >
          <input
            name="other_pawpass_id"
            placeholder="Other dog's PawPass ID, e.g. PP-PIL-000002"
            className="rounded-md border px-2 py-1.5 text-sm"
          />
          <input
            name="note"
            placeholder="Why do you think it's the same dog?"
            className="rounded-md border px-2 py-1.5 text-sm"
          />
          <button className="self-start rounded-md border px-3 py-1.5 text-sm">
            Flag as possible duplicate
          </button>
        </form>
      </details>

      <section className="mt-8">
        <h2 className="text-lg font-medium">Care team</h2>
        {activeAssignments.length === 0 && (
          <p className="mt-1 text-sm text-neutral-500">
            No caregiver yet — this dog has a care gap.
          </p>
        )}
        <ul className="mt-2 flex flex-col gap-1">
          {activeAssignments.map((a) => (
            <li key={a.id} className="text-sm">
              {a.role === "primary" ? "👤 Primary: " : "👤 Backup: "}
              {a.profiles?.full_name ?? "A caregiver"}
              {a.user_id === profile.id && (
                <form
                  action={leaveCaregiverTeam.bind(null, a.id, pawpassId)}
                  className="inline"
                >
                  <button className="ml-2 text-xs text-red-600 underline">
                    Leave
                  </button>
                </form>
              )}
            </li>
          ))}
        </ul>

        {!isCaregiver && (
          <div className="mt-3 flex gap-2">
            <form
              action={assignSelfAsCaregiver.bind(
                null,
                dog.id,
                pawpassId,
                hasPrimary ? "backup" : "primary",
              )}
            >
              <button className="rounded-md bg-neutral-900 px-3 py-1.5 text-sm text-white">
                {hasPrimary
                  ? `Help care for ${dog.name} (backup)`
                  : `Help care for ${dog.name} (primary)`}
              </button>
            </form>
          </div>
        )}
      </section>

      <section className="mt-8">
        <h2 className="text-lg font-medium">Care schedule</h2>
        {mySchedules.length === 0 ? (
          <div className="mt-2">
            <p className="text-sm text-neutral-500">No schedule set up yet.</p>
            {isCaregiver && (
              <form action={createFeedingSchedule.bind(null, dog.id, pawpassId)}>
                <button className="mt-2 rounded-md border px-3 py-1.5 text-sm">
                  Start a daily feeding schedule
                </button>
              </form>
            )}
          </div>
        ) : (
          <ul className="mt-2 flex flex-col gap-3">
            {scheduleTaskRows.map(({ schedule, todayDone, yesterdayDone }) => (
              <li key={schedule.id} className="rounded-md border p-3">
                <p className="text-sm font-medium capitalize">
                  {schedule.frequency} {schedule.task_type}
                </p>
                <div className="mt-2 flex flex-wrap items-center gap-2 text-sm">
                  {todayDone ? (
                    <span>🟢 Fed today</span>
                  ) : (
                    <>
                      <span>Today&apos;s task is due</span>
                      {isCaregiver && (
                        <form
                          action={completeCareTask.bind(
                            null,
                            schedule.id,
                            dog.id,
                            pawpassId,
                            undefined,
                          )}
                        >
                          <button className="rounded-md bg-neutral-900 px-2 py-1 text-xs text-white">
                            I&apos;ve fed {dog.name}
                          </button>
                        </form>
                      )}
                    </>
                  )}
                </div>
                {!yesterdayDone && (
                  <div className="mt-2 flex items-center gap-2 text-sm text-orange-700">
                    <span>🟠 Yesterday&apos;s care was missed</span>
                    {isCaregiver && (
                      <form
                        action={completeCareTask.bind(
                          null,
                          schedule.id,
                          dog.id,
                          pawpassId,
                          yesterday,
                        )}
                      >
                        <button className="rounded-md border px-2 py-1 text-xs">
                          Log it now
                        </button>
                      </form>
                    )}
                  </div>
                )}
              </li>
            ))}
          </ul>
        )}
      </section>

      <section className="mt-8">
        <h2 className="text-lg font-medium">Health</h2>
        <ul className="mt-2 flex flex-col gap-2">
          {((healthEvents ?? []) as HealthEvent[]).map((event) => (
            <li key={event.id} className="rounded-md border p-3 text-sm">
              <div className="flex items-center justify-between gap-2">
                <span className="font-medium capitalize">
                  {event.type.replace("_", " ")} — {event.event_date}
                </span>
                <VerificationBadge status={event.verification_status} />
              </div>
              {event.provider && (
                <p className="text-neutral-500">Provider: {event.provider}</p>
              )}
              {event.notes && <p className="text-neutral-500">{event.notes}</p>}
              {canVerify && event.verification_status === "community" && (
                <div className="mt-2 flex gap-2">
                  <form
                    action={decideHealthEventVerification.bind(
                      null,
                      event.id,
                      dog.id,
                      pawpassId,
                      "verified",
                    )}
                  >
                    <button className="rounded-md bg-neutral-900 px-2 py-1 text-xs text-white">
                      Verify
                    </button>
                  </form>
                  <form
                    action={decideHealthEventVerification.bind(
                      null,
                      event.id,
                      dog.id,
                      pawpassId,
                      "disputed",
                    )}
                  >
                    <button className="rounded-md border px-2 py-1 text-xs">
                      Dispute
                    </button>
                  </form>
                </div>
              )}
            </li>
          ))}
          {(healthEvents ?? []).length === 0 && (
            <p className="text-sm text-neutral-500">No health events recorded.</p>
          )}
        </ul>

        <form
          action={submitHealthEvent.bind(null, dog.id, pawpassId)}
          className="mt-3 flex flex-col gap-2 rounded-md border p-3"
        >
          <p className="text-sm font-medium">Add a health event</p>
          <select
            name="type"
            required
            className="rounded-md border px-2 py-1.5 text-sm"
          >
            <option value="">Type…</option>
            <option value="vaccination">Vaccination</option>
            <option value="sterilisation">Sterilisation</option>
            <option value="treatment">Treatment</option>
            <option value="injury">Injury</option>
            <option value="vet_visit">Vet visit</option>
          </select>
          <input
            type="date"
            name="event_date"
            defaultValue={today}
            className="rounded-md border px-2 py-1.5 text-sm"
          />
          <input
            name="provider"
            placeholder="Provider (e.g. ABC Veterinary Clinic)"
            className="rounded-md border px-2 py-1.5 text-sm"
          />
          <textarea
            name="notes"
            placeholder="Notes"
            className="rounded-md border px-2 py-1.5 text-sm"
          />
          <button className="self-start rounded-md border px-3 py-1.5 text-sm">
            Submit health event
          </button>
        </form>
      </section>

      <section className="mt-8">
        <h2 className="text-lg font-medium">Emergency cases</h2>
        <ul className="mt-2 flex flex-col gap-2">
          {((medicalCases ?? []) as MedicalCase[]).map((medicalCase) => {
            const canAct =
              medicalCase.claimed_by === profile.id || canModerateCase;
            const nextStatus = NEXT_CASE_STATUS[medicalCase.status];
            return (
              <li key={medicalCase.id} className="rounded-md border p-3 text-sm">
                <div className="flex items-center justify-between gap-2">
                  <span className="font-medium capitalize">
                    {medicalCase.severity} severity
                  </span>
                  <span>{CASE_STATUS_LABEL[medicalCase.status]}</span>
                </div>
                {medicalCase.location_label && (
                  <p className="text-neutral-500">{medicalCase.location_label}</p>
                )}
                {medicalCase.evidence_url && (
                  <p className="text-neutral-500">{medicalCase.evidence_url}</p>
                )}
                <div className="mt-2 flex gap-2">
                  {medicalCase.status === "reported" && (
                    <form
                      action={claimMedicalCase.bind(
                        null,
                        medicalCase.id,
                        dog.id,
                        pawpassId,
                      )}
                    >
                      <button className="rounded-md bg-neutral-900 px-2 py-1 text-xs text-white">
                        Claim this case
                      </button>
                    </form>
                  )}
                  {nextStatus && canAct && (
                    <form
                      action={advanceMedicalCaseStatus.bind(
                        null,
                        medicalCase.id,
                        dog.id,
                        pawpassId,
                        nextStatus,
                      )}
                    >
                      <button className="rounded-md border px-2 py-1 text-xs capitalize">
                        Mark as {nextStatus.replace("_", " ")}
                      </button>
                    </form>
                  )}
                </div>
              </li>
            );
          })}
          {(medicalCases ?? []).length === 0 && (
            <p className="text-sm text-neutral-500">No emergency cases reported.</p>
          )}
        </ul>

        <form
          action={reportMedicalCase.bind(null, dog.id, pawpassId)}
          className="mt-3 flex flex-col gap-2 rounded-md border p-3"
        >
          <p className="text-sm font-medium">Report a health issue</p>
          <select
            name="severity"
            defaultValue="medium"
            className="rounded-md border px-2 py-1.5 text-sm"
          >
            <option value="low">Low</option>
            <option value="medium">Medium</option>
            <option value="high">High</option>
            <option value="critical">Critical</option>
          </select>
          <input
            name="location_label"
            placeholder="Where is the dog right now?"
            className="rounded-md border px-2 py-1.5 text-sm"
          />
          <input
            name="evidence_url"
            placeholder="Photo link or description of the injury"
            className="rounded-md border px-2 py-1.5 text-sm"
          />
          <button className="self-start rounded-md bg-red-700 px-3 py-1.5 text-sm text-white">
            Report emergency
          </button>
        </form>
      </section>

      <section className="mt-8">
        <h2 className="text-lg font-medium">Timeline</h2>
        <div className="mt-2">
          <Timeline events={(timelineEvents ?? []) as TimelineEvent[]} />
        </div>
      </section>
    </main>
  );
}
