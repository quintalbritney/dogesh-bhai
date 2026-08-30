import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { requireProfile } from "@/lib/auth";
import { todayISODate, yesterdayISODate } from "@/lib/dates";
import { completeCareTask } from "@/app/dogs/actions";
import type { CareSchedule, CareTask, Dog } from "@/lib/supabase/types";

export default async function TasksPage() {
  const profile = await requireProfile();
  const supabase = await createClient();

  const { data: assignments } = await supabase
    .from("caregiver_assignments")
    .select("dog_id")
    .eq("user_id", profile.id)
    .eq("status", "active");

  const dogIds = (assignments ?? []).map((a) => a.dog_id);

  const { data: dogsList } =
    dogIds.length > 0
      ? await supabase.from("dogs").select("*").in("id", dogIds)
      : { data: [] as Dog[] };
  const dogsById = new Map((dogsList ?? []).map((d) => [d.id, d as Dog]));

  const { data: schedules } =
    dogIds.length > 0
      ? await supabase.from("care_schedules").select("*").in("dog_id", dogIds)
      : { data: [] as CareSchedule[] };

  const today = todayISODate();
  const yesterday = yesterdayISODate();

  const rows = await Promise.all(
    (schedules ?? []).map(async (schedule) => {
      const { data: tasks } = await supabase
        .from("care_tasks")
        .select("*")
        .eq("schedule_id", schedule.id)
        .in("due_date", [today, yesterday]);
      const taskRows = (tasks ?? []) as CareTask[];
      return {
        schedule,
        dog: dogsById.get(schedule.dog_id),
        todayDone: taskRows.some(
          (t) => t.due_date === today && t.status === "completed",
        ),
        yesterdayDone: taskRows.some(
          (t) => t.due_date === yesterday && t.status === "completed",
        ),
      };
    }),
  );

  const due = rows.filter((r) => !r.todayDone);
  const missed = rows.filter((r) => !r.yesterdayDone);
  const done = rows.filter((r) => r.todayDone);

  return (
    <main className="mx-auto max-w-2xl px-4 py-10">
      <h1 className="text-3xl font-bold">Today&apos;s care</h1>
      <p className="quote mt-1 text-muted">Everything you do, do it with love.</p>

      {rows.length === 0 && (
        <p className="mt-4 text-sm text-muted">
          You&apos;re not caring for any dogs yet.{" "}
          <Link href="/dogs" className="font-medium text-primary underline">
            Browse dogs
          </Link>{" "}
          to become a caregiver.
        </p>
      )}

      {missed.length > 0 && (
        <section className="mt-6">
          <h2 className="text-sm font-semibold text-status-bad">🟠 Care missed</h2>
          <ul className="mt-2 flex flex-col gap-2">
            {missed.map(({ schedule, dog }) =>
              dog ? (
                <li
                  key={schedule.id}
                  className="card flex items-center justify-between p-3"
                >
                  <span>
                    {dog.name}&apos;s scheduled care hasn&apos;t been logged.
                  </span>
                  <form
                    action={completeCareTask.bind(
                      null,
                      schedule.id,
                      dog.id,
                      dog.pawpass_id,
                      yesterday,
                    )}
                  >
                    <button className="btn-outline btn-sm">
                      Log it now
                    </button>
                  </form>
                </li>
              ) : null,
            )}
          </ul>
        </section>
      )}

      {due.length > 0 && (
        <section className="mt-6">
          <h2 className="text-sm font-medium">Due today</h2>
          <ul className="mt-2 flex flex-col gap-2">
            {due.map(({ schedule, dog }) =>
              dog ? (
                <li
                  key={schedule.id}
                  className="card flex items-center justify-between p-3"
                >
                  <span>{dog.name} — {schedule.task_type}</span>
                  <form
                    action={completeCareTask.bind(
                      null,
                      schedule.id,
                      dog.id,
                      dog.pawpass_id,
                      undefined,
                    )}
                  >
                    <button className="btn-primary btn-sm">
                      Mark as fed ❤️
                    </button>
                  </form>
                </li>
              ) : null,
            )}
          </ul>
        </section>
      )}

      {done.length > 0 && (
        <section className="mt-6">
          <h2 className="text-sm font-medium">🟢 Completed today</h2>
          <ul className="mt-2 flex flex-col gap-2">
            {done.map(({ schedule, dog }) =>
              dog ? (
                <li key={schedule.id} className="rounded-md border p-3">
                  {dog.name} — {schedule.task_type}
                </li>
              ) : null,
            )}
          </ul>
        </section>
      )}
    </main>
  );
}
