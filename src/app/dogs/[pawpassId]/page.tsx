import { notFound } from "next/navigation";
import { headers } from "next/headers";
import QRCode from "qrcode";
import { createClient } from "@/lib/supabase/server";
import { requireProfile } from "@/lib/auth";
import { todayISODate, yesterdayISODate } from "@/lib/dates";
import Timeline from "@/components/Timeline";
import LogSightingButton from "@/components/LogSightingButton";
import PhotoLightbox from "@/components/PhotoLightbox";
import PawPrint from "@/components/PawPrint";
import SubmitButton from "@/components/SubmitButton";
import {
  assignSelfAsCaregiver,
  leaveCaregiverTeam,
  createFeedingSchedule,
  completeCareTask,
  markCareCheckedNoActionNeeded,
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
import {
  connectDogToNgo,
  setMunicipalRegistration,
  setCollarAttached,
} from "@/app/dogs/pipeline-actions";
import VerificationBadge from "@/components/VerificationBadge";
import type {
  CaregiverAssignment,
  CareSchedule,
  CaseStatus,
  CareTask,
  DogRegistrationMilestone,
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

const STATUS_CHIP_CLASS: Record<string, string> = {
  well_cared_for: "bg-status-good/15 text-status-good border-status-good/30",
  attention_needed: "bg-status-warn/15 text-status-warn border-status-warn/30",
  care_gap: "bg-status-bad/15 text-status-bad border-status-bad/30",
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
  const isAdmin = profile.role === "admin";

  const [
    { data: milestones },
    { data: isVaccinated },
    { data: ngoProfiles },
    { data: assignedOrg },
  ] = await Promise.all([
    supabase
      .from("dog_registration_milestones")
      .select("*")
      .eq("dog_id", dog.id)
      .single(),
    supabase.rpc("dog_is_vaccinated", { target_dog_id: dog.id }),
    isAdmin
      ? supabase.from("profiles").select("org_id").eq("role", "ngo").not("org_id", "is", null)
      : Promise.resolve({ data: [] as { org_id: string | null }[] }),
    dog.assigned_org_id
      ? supabase.from("organisations").select("name").eq("id", dog.assigned_org_id).single()
      : Promise.resolve({ data: null as { name: string } | null }),
  ]);

  const ngoOrgIds = Array.from(
    new Set((ngoProfiles ?? []).map((p) => p.org_id).filter((id): id is string => Boolean(id))),
  );
  const { data: ngoOrgs } = isAdmin && ngoOrgIds.length > 0
    ? await supabase.from("organisations").select("id, name").in("id", ngoOrgIds)
    : { data: [] as { id: string; name: string }[] };

  const canManageMilestones =
    isAdmin || (profile.role === "ngo" && profile.org_id === dog.assigned_org_id);
  const dogMilestones = milestones as DogRegistrationMilestone | null;

  const activeAssignments = (assignments ?? []) as unknown as (CaregiverAssignment & {
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
      const isDone = (t: CareTask) =>
        t.status === "completed" || t.status === "checked_no_action_needed";
      const todayTask = rows.find((t) => t.due_date === today && isDone(t));
      return {
        schedule,
        todayDone: Boolean(todayTask),
        todayCheckedOnly: todayTask?.status === "checked_no_action_needed",
        yesterdayDone: rows.some((t) => t.due_date === yesterday && isDone(t)),
      };
    }),
  );

  return (
    <main className="mx-auto max-w-2xl px-4 py-10">
      {dog.photo_url ? (
        <PhotoLightbox
          src={dog.photo_url}
          alt={dog.name}
          className="aspect-[4/3] w-full border-4 border-white object-cover object-top shadow-lg"
        />
      ) : (
        <div className="flex aspect-[4/3] w-full items-center justify-center rounded-3xl bg-primary/10 text-primary">
          <PawPrint className="h-16 w-16" />
        </div>
      )}

      <div className="mt-4 flex items-start justify-between gap-4">
        <div>
          <p className="font-mono text-xs text-muted">{dog.pawpass_id}</p>
          <h1 className="text-3xl font-extrabold">{dog.name}</h1>
          <p className="text-sm text-muted">
            {dog.location_label ?? "Location not set"}
          </p>
        </div>
        <span
          className={`whitespace-nowrap rounded-full border px-3 py-1 text-sm font-medium ${STATUS_CHIP_CLASS[dog.status]}`}
        >
          {STATUS_LABEL[dog.status]}
        </span>
      </div>

      {canEdit && (
        <details className="mt-3 text-sm text-muted">
          <summary className="cursor-pointer">Edit dog information</summary>
          <form
            action={updateDog.bind(null, dog.id, pawpassId)}
            className="mt-2 flex flex-col gap-2 card p-3"
          >
            <input
              name="name"
              defaultValue={dog.name}
              required
              className="input"
            />
            <select
              name="sex"
              defaultValue={dog.sex}
              className="input"
            >
              <option value="unknown">Not sure</option>
              <option value="male">Male</option>
              <option value="female">Female</option>
            </select>
            <input
              name="age_estimate"
              defaultValue={dog.age_estimate ?? ""}
              placeholder="Approximate age"
              className="input"
            />
            <input
              name="coat_notes"
              defaultValue={dog.coat_notes ?? ""}
              placeholder="Coat / appearance"
              className="input"
            />
            <input
              name="markers"
              defaultValue={dog.markers ?? ""}
              placeholder="Identification markers"
              className="input"
            />
            <input
              name="location_label"
              defaultValue={dog.location_label ?? ""}
              placeholder="Usual location"
              className="input"
            />
            <input
              name="photo_url"
              defaultValue={dog.photo_url ?? ""}
              placeholder="Photo URL"
              className="input"
            />
            <button className="btn-outline self-start">
              Save changes
            </button>
          </form>
        </details>
      )}

      <section className="mt-8 flex flex-wrap items-start gap-6">
        <div>
          <h2 className="text-xl font-bold">Location</h2>
          {lastPing ? (
            <p className="mt-1 text-sm text-muted">
              Last seen {new Date(lastPing.created_at).toLocaleString()}
            </p>
          ) : (
            <p className="mt-1 text-sm text-muted">
              No sightings logged yet.
            </p>
          )}
          <div className="mt-2">
            <LogSightingButton dogId={dog.id} pawpassId={pawpassId} />
          </div>
        </div>

        <div>
          <h2 className="text-xl font-bold">QR tag</h2>
          <p className="mt-1 text-sm text-muted">
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

      <section className="mt-8">
        <h2 className="text-xl font-bold">Registration pipeline</h2>
        <ul className="mt-2 flex flex-col gap-2 text-sm">
          <li className="card p-3">
            <p className="font-medium">
              {dog.assigned_org_id
                ? `🏥 Connected with ${assignedOrg?.name ?? "an NGO"}`
                : "⬜ Not yet connected with an NGO"}
            </p>
            {isAdmin && !dog.assigned_org_id && (
              <form
                action={connectDogToNgo.bind(null, dog.id, pawpassId)}
                className="mt-2 flex flex-wrap gap-2"
              >
                <select name="org_id" required className="input" defaultValue="">
                  <option value="" disabled>
                    Choose an NGO…
                  </option>
                  {(ngoOrgs ?? []).map((org) => (
                    <option key={org.id} value={org.id}>
                      {org.name}
                    </option>
                  ))}
                </select>
                <button className="btn-outline btn-sm">Connect</button>
                {(ngoOrgs ?? []).length === 0 && (
                  <p className="w-full text-xs text-muted">
                    No NGO accounts have signed up yet.
                  </p>
                )}
              </form>
            )}
          </li>

          <li className="card p-3">
            <p className="font-medium">
              {isVaccinated ? "🩺 Vaccinated (verified)" : "⬜ Not yet vaccinated"}
            </p>
            <p className="text-xs text-muted">
              Based on a verified vaccination record in Health below.
            </p>
          </li>

          <li className="card p-3">
            <p className="font-medium">
              {dogMilestones?.municipally_registered
                ? `🏛️ Municipally registered${dogMilestones.municipal_reference ? ` (ref. ${dogMilestones.municipal_reference})` : ""}`
                : "⬜ Not yet municipally registered"}
            </p>
            {canManageMilestones && !dogMilestones?.municipally_registered && (
              <form
                action={setMunicipalRegistration.bind(null, dog.id, pawpassId)}
                className="mt-2 flex flex-wrap gap-2"
              >
                <input
                  name="municipal_reference"
                  placeholder="Municipal reference (optional)"
                  className="input"
                />
                <button className="btn-outline btn-sm">
                  Mark municipally registered
                </button>
              </form>
            )}
          </li>

          <li className="card p-3">
            <p className="font-medium">
              {dogMilestones?.collar_attached
                ? `🪪 QR collar attached${dogMilestones.collar_serial ? ` (${dogMilestones.collar_serial})` : ""}`
                : "⬜ QR collar not yet attached"}
            </p>
            {canManageMilestones && !dogMilestones?.collar_attached && (
              <form
                action={setCollarAttached.bind(null, dog.id, pawpassId)}
                className="mt-2 flex flex-wrap gap-2"
              >
                <input
                  name="collar_serial"
                  placeholder="Collar serial (optional)"
                  className="input"
                />
                <button className="btn-outline btn-sm">
                  Mark collar attached
                </button>
              </form>
            )}
          </li>
        </ul>
      </section>

      <details className="mt-4 text-sm text-muted">
        <summary className="cursor-pointer">
          This looks like a dog we already have a record for
        </summary>
        <form
          action={flagPossibleDuplicate.bind(null, dog.id, pawpassId)}
          className="mt-2 flex flex-col gap-2 card p-3"
        >
          <input
            name="other_pawpass_id"
            placeholder="Other dog's PawPass ID, e.g. PP-PIL-000002"
            className="input"
          />
          <input
            name="note"
            placeholder="Why do you think it's the same dog?"
            className="input"
          />
          <button className="btn-outline self-start">
            Flag as possible duplicate
          </button>
        </form>
      </details>

      <section className="mt-8">
        <h2 className="text-xl font-bold">Care team</h2>
        {activeAssignments.length === 0 && (
          <p className="mt-1 text-sm text-muted">
            No caregiver yet, this dog has a care gap.
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
              <button className="btn-primary">
                {hasPrimary
                  ? `Help care for ${dog.name} (backup)`
                  : `Help care for ${dog.name} (primary)`}
              </button>
            </form>
          </div>
        )}
      </section>

      <section className="mt-8">
        <h2 className="text-xl font-bold">Care schedule</h2>
        {mySchedules.length === 0 ? (
          <div className="mt-2">
            <p className="text-sm text-muted">No schedule set up yet.</p>
            {isCaregiver && (
              <form action={createFeedingSchedule.bind(null, dog.id, pawpassId)}>
                <button className="btn-outline mt-2">
                  Start a daily feeding schedule
                </button>
              </form>
            )}
          </div>
        ) : (
          <ul className="mt-2 flex flex-col gap-3">
            {scheduleTaskRows.map(({ schedule, todayDone, todayCheckedOnly, yesterdayDone }) => (
              <li key={schedule.id} className="card p-3">
                <p className="text-sm font-medium capitalize">
                  {schedule.frequency} {schedule.task_type}
                </p>
                <div className="mt-2 flex flex-wrap items-center gap-2 text-sm">
                  {todayDone ? (
                    <span>{todayCheckedOnly ? "🟢 Checked in, no feeding needed" : "🟢 Fed today"}</span>
                  ) : (
                    <>
                      <span>Today&apos;s task is due</span>
                      {isCaregiver && (
                        <>
                          <form
                            action={completeCareTask.bind(
                              null,
                              schedule.id,
                              dog.id,
                              pawpassId,
                              undefined,
                            )}
                          >
                            <button className="btn-primary btn-sm">
                              Mark as fed ❤️
                            </button>
                          </form>
                          <form
                            action={markCareCheckedNoActionNeeded.bind(
                              null,
                              schedule.id,
                              dog.id,
                              pawpassId,
                              undefined,
                            )}
                          >
                            <button className="btn-outline btn-sm">
                              Just checking in
                            </button>
                          </form>
                        </>
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
                        <button className="btn-outline btn-sm">
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
        <h2 className="text-xl font-bold">Health</h2>
        <ul className="mt-2 flex flex-col gap-2">
          {((healthEvents ?? []) as HealthEvent[]).map((event) => (
            <li key={event.id} className="card p-3 text-sm">
              <div className="flex items-center justify-between gap-2">
                <span className="font-medium capitalize">
                  {event.type.replace("_", " ")} ({event.event_date})
                </span>
                <VerificationBadge status={event.verification_status} />
              </div>
              {event.provider && (
                <p className="text-muted">Provider: {event.provider}</p>
              )}
              {event.notes && <p className="text-muted">{event.notes}</p>}
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
                    <button className="btn-primary btn-sm">
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
                    <button className="btn-outline btn-sm">
                      Dispute
                    </button>
                  </form>
                </div>
              )}
            </li>
          ))}
          {(healthEvents ?? []).length === 0 && (
            <p className="text-sm text-muted">No health events recorded.</p>
          )}
        </ul>

        <form
          action={submitHealthEvent.bind(null, dog.id, pawpassId)}
          className="mt-3 flex flex-col gap-2 card p-3"
        >
          <p className="text-sm font-medium">Add a health event</p>
          <select
            name="type"
            required
            className="input"
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
            className="input"
          />
          <input
            name="provider"
            placeholder="Provider (e.g. ABC Veterinary Clinic)"
            className="input"
          />
          <textarea
            name="notes"
            placeholder="Notes"
            className="input"
          />
          <SubmitButton pendingText="Submitting…" className="btn-outline self-start">
            Submit health event
          </SubmitButton>
        </form>
      </section>

      <section className="mt-8">
        <h2 className="text-xl font-bold">Emergency cases</h2>
        <ul className="mt-2 flex flex-col gap-2">
          {((medicalCases ?? []) as MedicalCase[]).map((medicalCase) => {
            const canAct =
              medicalCase.claimed_by === profile.id || canModerateCase;
            const nextStatus = NEXT_CASE_STATUS[medicalCase.status];
            return (
              <li key={medicalCase.id} className="card p-3 text-sm">
                <div className="flex items-center justify-between gap-2">
                  <span className="font-medium capitalize">
                    {medicalCase.severity} severity
                  </span>
                  <span>{CASE_STATUS_LABEL[medicalCase.status]}</span>
                </div>
                {medicalCase.location_label && (
                  <p className="text-muted">{medicalCase.location_label}</p>
                )}
                {medicalCase.evidence_url && (
                  <p className="text-muted">{medicalCase.evidence_url}</p>
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
                      <button className="btn-primary btn-sm">
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
                      <button className="btn-outline btn-sm capitalize">
                        Mark as {nextStatus.replace("_", " ")}
                      </button>
                    </form>
                  )}
                </div>
              </li>
            );
          })}
          {(medicalCases ?? []).length === 0 && (
            <p className="text-sm text-muted">No emergency cases reported.</p>
          )}
        </ul>

        <form
          action={reportMedicalCase.bind(null, dog.id, pawpassId)}
          className="mt-3 flex flex-col gap-2 card p-3"
        >
          <p className="text-sm font-medium">Report a health issue</p>
          <select
            name="severity"
            defaultValue="medium"
            className="input"
          >
            <option value="low">Low</option>
            <option value="medium">Medium</option>
            <option value="high">High</option>
            <option value="critical">Critical</option>
          </select>
          <input
            name="location_label"
            placeholder="Where is the dog right now?"
            className="input"
          />
          <input
            name="evidence_url"
            placeholder="Photo link or description of the injury"
            className="input"
          />
          <SubmitButton pendingText="Reporting…" className="btn-danger self-start">
            Report emergency
          </SubmitButton>
        </form>
      </section>

      <section className="mt-8">
        <h2 className="text-xl font-bold">Timeline</h2>
        <div className="mt-2">
          <Timeline events={(timelineEvents ?? []) as TimelineEvent[]} />
        </div>
      </section>
    </main>
  );
}
