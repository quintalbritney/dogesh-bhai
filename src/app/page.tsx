import Link from "next/link";
import { getCurrentProfile } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import PawPrint from "@/components/PawPrint";
import PhotoCarousel from "@/components/PhotoCarousel";
import { listDogPhotos, pickRandom } from "@/lib/dogPhotoStorage";
import { todayISODate } from "@/lib/dates";
import { completeCareTask, markCareCheckedNoActionNeeded } from "@/app/dogs/actions";
import { decideHealthEventVerification } from "@/app/dogs/health-actions";
import type { CareSchedule, CareTask, Dog, HealthEvent } from "@/lib/supabase/types";

const STATUS_DOT: Record<string, string> = {
  well_cared_for: "🟢",
  attention_needed: "🟡",
  care_gap: "🔴",
};

const FEATURES = [
  { emoji: "🪪", label: "Identity", desc: "A PawPass ID for every dog" },
  { emoji: "🩺", label: "Health", desc: "Vet-verified records" },
  { emoji: "❤️", label: "Care", desc: "Feeding & backup caregivers" },
  { emoji: "📍", label: "Map", desc: "Sightings & QR check-ins" },
  { emoji: "🚨", label: "Rescue", desc: "Report & track emergencies" },
  { emoji: "📚", label: "Learn", desc: "Hygiene & first aid guides" },
];

export default async function HomePage() {
  const profile = await getCurrentProfile();
  const supabase = await createClient();

  const [
    { data: recentDogs },
    { count: dogCount },
    { count: completedTaskCount },
    { count: verifiedCount },
    { count: resolvedCaseCount },
    { data: happyDogs },
  ] = await Promise.all([
    supabase
      .from("dogs")
      .select("*")
      .eq("archived", false)
      .order("created_at", { ascending: false })
      .limit(8),
    supabase
      .from("dogs")
      .select("id", { count: "exact", head: true })
      .eq("archived", false),
    supabase
      .from("care_tasks")
      .select("id", { count: "exact", head: true })
      .eq("status", "completed"),
    supabase
      .from("health_events")
      .select("id", { count: "exact", head: true })
      .eq("verification_status", "verified"),
    supabase
      .from("medical_cases")
      .select("id", { count: "exact", head: true })
      .eq("status", "resolved"),
    supabase
      .from("dogs")
      .select("*")
      .eq("archived", false)
      .eq("status", "well_cared_for")
      .order("created_at", { ascending: false })
      .limit(4),
  ]);

  const dogs = (recentDogs ?? []) as Dog[];

  if (!profile) {
    const bucketPhotos = await listDogPhotos(supabase);
    const [heroPhoto] = pickRandom(bucketPhotos, 1);
    const galleryPhotos = pickRandom(bucketPhotos, 6);
    const carouselPhotos = pickRandom(bucketPhotos, Math.min(8, bucketPhotos.length));
    const tails = (happyDogs ?? []) as Dog[];

    return (
      <main className="flex-1 overflow-hidden">
        {/* Hero — bright yellow backdrop, framed photo, no dark overlay */}
        <section className="relative bg-background">
          <div className="paw-pattern pointer-events-none absolute inset-0" />
          <div className="relative mx-auto flex max-w-5xl flex-col-reverse items-center gap-10 px-4 py-16 md:flex-row md:py-24">
            <div className="text-center md:w-1/2 md:text-left">
              <span className="inline-flex items-center gap-1.5 rounded-full bg-secondary/10 px-4 py-1.5 text-sm font-semibold text-secondary">
                <PawPrint className="h-4 w-4" />
                For India&apos;s community dogs
              </span>
              <h1 className="mt-5 text-5xl font-extrabold tracking-tight text-foreground sm:text-6xl">
                Dogesh Bhai
              </h1>
              <p className="quote mt-3 text-xl text-secondary">
                &ldquo;Everything you do, do it with love.&rdquo;
              </p>
              <p className="mt-4 max-w-md text-base text-foreground/80 md:mx-0 mx-auto">
                Don&apos;t just map the dog. Map its care. A digital health
                and care passport for community dogs, connecting identity,
                health records and caregivers so nothing essential gets
                missed.
              </p>
              <div className="mt-8 flex flex-wrap items-center justify-center gap-3 md:justify-start">
                <Link href="/signup" className="btn-primary px-8 py-3.5 text-base">
                  Join the Care Circle
                </Link>
                <Link href="/login" className="btn-secondary px-8 py-3.5 text-base">
                  Log in
                </Link>
              </div>
            </div>
            <div className="relative md:w-1/2">
              <div className="absolute -left-6 -top-6 h-24 w-24 rounded-full bg-accent/60" />
              <div className="absolute -bottom-8 -right-4 h-16 w-16 rotate-12 text-primary/70">
                <PawPrint className="paw-float h-16 w-16" />
              </div>
              {heroPhoto ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  src={heroPhoto.url}
                  alt="A community street dog"
                  className="relative aspect-square w-full rounded-[2.5rem] border-4 border-white object-cover shadow-xl"
                />
              ) : (
                <div className="relative flex aspect-square w-full items-center justify-center rounded-[2.5rem] border-4 border-white bg-primary/10 text-primary shadow-xl">
                  <PawPrint className="h-16 w-16" />
                </div>
              )}
            </div>
          </div>
        </section>

        {/* Feature grid — bright blue section, circular icons */}
        <section className="bg-header-bg py-16 text-header-foreground">
          <div className="mx-auto max-w-5xl px-4">
            <h2 className="text-center text-3xl font-bold">
              One dog. One record. A community that remembers.
            </h2>
            <div className="mt-12 grid grid-cols-2 gap-8 sm:grid-cols-3 md:grid-cols-6">
              {FEATURES.map((f) => (
                <div key={f.label} className="flex flex-col items-center text-center">
                  <div className="flex h-20 w-20 items-center justify-center rounded-full bg-white text-3xl shadow-md">
                    {f.emoji}
                  </div>
                  <p className="mt-3 font-bold">{f.label}</p>
                  <p className="mt-1 text-xs text-header-foreground/70">{f.desc}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* About us */}
        <section className="relative overflow-hidden bg-surface py-20">
          <div className="mx-auto flex max-w-4xl flex-col items-center gap-6 px-4 text-center">
            <PawPrint className="h-8 w-8 text-primary" />
            <h2 className="text-3xl font-bold">About us</h2>
            <p className="quote max-w-xl text-lg text-secondary">
              &ldquo;Every street has a story. Every doggo deserves a name in
              it.&rdquo;
            </p>
            <p className="max-w-2xl text-base text-foreground/80">
              Dogesh Bhai started with a simple frustration: community dogs
              get fed by kind strangers, treated by kind vets, and worried
              about by kind neighbours, but none of that kindness ever talks
              to each other. One person doesn&apos;t know the dog was already
              vaccinated. Another doesn&apos;t know who to call when it&apos;s
              hurt. So the same dog gets forgotten, over and over, by people
              who never stopped caring.
            </p>
            <p className="max-w-2xl text-base text-foreground/80">
              We believe every pawprint deserves a paper trail. Not to own the
              dog, just to remember it, so the next kind stranger doesn&apos;t
              have to start from zero.
            </p>
          </div>
        </section>

        {/* Live dog grid */}
        <section className="bg-surface py-20">
          <div className="mx-auto max-w-5xl px-4">
            <div className="flex items-center justify-center gap-2 text-center">
              <PawPrint className="h-5 w-5 text-primary" />
              <h2 className="text-3xl font-bold">Meet the dogs</h2>
            </div>
            <p className="mt-2 text-center text-muted">
              Real profiles on Dogesh Bhai, tap a dog to see its passport.
            </p>

            {dogs.length > 0 ? (
              <div className="mt-10 grid grid-cols-2 gap-5 sm:grid-cols-4">
                {dogs.map((dog) => (
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
                          <PawPrint className="h-10 w-10" />
                        </div>
                      )}
                    </div>
                    <div className="p-3">
                      <p className="flex items-center justify-between font-bold">
                        {dog.name} <span>{STATUS_DOT[dog.status]}</span>
                      </p>
                      <p className="text-xs text-muted">
                        {dog.location_label ?? dog.pawpass_id}
                      </p>
                    </div>
                  </Link>
                ))}
              </div>
            ) : galleryPhotos.length > 0 ? (
              <div className="mt-10 grid grid-cols-2 gap-4 sm:grid-cols-4">
                {galleryPhotos.map((photo) => (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img
                    key={photo.fileName}
                    src={photo.url}
                    alt={`A community dog, ${photo.label}`}
                    className="aspect-square w-full rounded-2xl object-cover shadow-sm"
                  />
                ))}
              </div>
            ) : (
              <p className="mt-10 text-center text-sm text-muted">
                No dog photos yet.
              </p>
            )}

            <div className="mt-8 text-center">
              <Link href="/dogs" className="font-medium text-secondary underline">
                See all dogs →
              </Link>
            </div>
          </div>
        </section>

        {/* Happy tails */}
        {tails.length > 0 && (
          <section className="bg-background py-20">
            <div className="mx-auto max-w-5xl px-4">
              <div className="flex items-center justify-center gap-2 text-center">
                <PawPrint className="h-5 w-5 text-primary" />
                <h2 className="text-3xl font-bold">Happy tails</h2>
              </div>
              <p className="quote mt-2 text-center text-muted">
                &ldquo;A wagging tail is proof that somebody showed up.&rdquo;
              </p>
              <div className="mt-10 grid grid-cols-2 gap-5 sm:grid-cols-4">
                {tails.map((dog) => (
                  <Link
                    key={dog.id}
                    href={`/dogs/${dog.pawpass_id}`}
                    className="card group overflow-hidden transition hover:-translate-y-1 hover:shadow-lg"
                  >
                    <div className="aspect-square w-full overflow-hidden bg-surface">
                      {dog.photo_url ? (
                        // eslint-disable-next-line @next/next/no-img-element
                        <img
                          src={dog.photo_url}
                          alt={dog.name}
                          className="h-full w-full object-cover object-top transition group-hover:scale-105"
                        />
                      ) : (
                        <div className="flex h-full w-full items-center justify-center text-primary">
                          <PawPrint className="h-10 w-10" />
                        </div>
                      )}
                    </div>
                    <div className="p-3">
                      <p className="font-bold">{dog.name} 🟢</p>
                      <p className="text-xs text-muted">
                        {dog.location_label ?? "Cared for, fed, never forgotten"}
                      </p>
                    </div>
                  </Link>
                ))}
              </div>
            </div>
          </section>
        )}

        {/* Honest, live stats */}
        <section className="bg-background py-16">
          <div className="mx-auto max-w-4xl px-4">
            <h2 className="text-center text-2xl font-bold">Our community, so far</h2>
            <div className="mt-8 grid grid-cols-2 gap-4 sm:grid-cols-4">
              <div className="card p-4 text-center">
                <p className="text-3xl font-extrabold text-primary">{dogCount ?? 0}</p>
                <p className="mt-1 text-xs text-muted">dogs with a record</p>
              </div>
              <div className="card p-4 text-center">
                <p className="text-3xl font-extrabold text-primary">
                  {completedTaskCount ?? 0}
                </p>
                <p className="mt-1 text-xs text-muted">care tasks completed</p>
              </div>
              <div className="card p-4 text-center">
                <p className="text-3xl font-extrabold text-primary">
                  {verifiedCount ?? 0}
                </p>
                <p className="mt-1 text-xs text-muted">health records verified</p>
              </div>
              <div className="card p-4 text-center">
                <p className="text-3xl font-extrabold text-primary">
                  {resolvedCaseCount ?? 0}
                </p>
                <p className="mt-1 text-xs text-muted">emergencies resolved</p>
              </div>
            </div>
          </div>
        </section>

        {/* Come join us */}
        <section className="relative overflow-hidden bg-surface py-20">
          <div className="mx-auto grid max-w-5xl items-center gap-10 px-4 md:grid-cols-2">
            <div className="text-center md:text-left">
              <span className="inline-flex items-center gap-1.5 rounded-full bg-primary/10 px-4 py-1.5 text-sm font-semibold text-primary">
                <PawPrint className="h-4 w-4" />
                Come join us
              </span>
              <h2 className="mt-4 text-3xl font-bold">
                Somewhere near you, a good boy is waiting to be noticed.
              </h2>
              <p className="quote mt-3 text-lg text-secondary">
                &ldquo;You don&apos;t need a leash to belong to someone.&rdquo;
              </p>
              <p className="mt-4 text-base text-foreground/80">
                Volunteers feed and check in on doggos day to day. NGOs take
                on the paperwork of vaccination and municipal registration.
                Vets verify what&apos;s real. However much time you have,
                there&apos;s a pawprint-sized place for you in the Care
                Circle.
              </p>
              <div className="mt-6 flex flex-wrap justify-center gap-3 md:justify-start">
                <Link href="/signup" className="btn-primary px-8 py-3.5 text-base">
                  Join the Care Circle
                </Link>
              </div>
            </div>
            {carouselPhotos.length > 0 && <PhotoCarousel photos={carouselPhotos} />}
          </div>
        </section>

        {/* Learn teaser */}
        <section className="bg-secondary py-16 text-center text-white">
          <div className="mx-auto max-w-2xl px-4">
            <h2 className="text-2xl font-bold">New to caring for street dogs?</h2>
            <p className="mt-2 text-white/85">
              Learn basic hygiene, first aid, and where to find help nearby.
            </p>
            <Link href="/learn" className="btn-primary mt-6 inline-flex px-8 py-3">
              Read the guide
            </Link>
          </div>
        </section>

        {/* Final CTA */}
        <section className="relative bg-background px-4 py-20 text-center">
          <div className="paw-pattern pointer-events-none absolute inset-0" />
          <PawPrint className="relative mx-auto h-8 w-8 text-primary" />
          <p className="quote mx-auto mt-4 max-w-lg text-2xl text-foreground">
            &ldquo;A dog doesn&apos;t need much. Just someone who remembers.&rdquo;
          </p>
          <div className="mt-8">
            <Link href="/signup" className="btn-primary px-8 py-3.5 text-base">
              Give Moti a Voice
            </Link>
          </div>
        </section>
      </main>
    );
  }

  const canVerify = profile.role === "vet" || profile.role === "admin";
  const today = todayISODate();

  const [{ data: myAssignments }, { data: pendingEvents }] = await Promise.all([
    supabase
      .from("caregiver_assignments")
      .select("dog_id")
      .eq("user_id", profile.id)
      .eq("status", "active"),
    canVerify
      ? supabase
          .from("health_events")
          .select("*")
          .eq("verification_status", "community")
          .order("created_at", { ascending: true })
          .limit(5)
      : Promise.resolve({ data: [] as HealthEvent[] }),
  ]);

  const myDogIds = (myAssignments ?? []).map((a) => a.dog_id);

  const [{ data: myDogsList }, { data: mySchedules }] = await Promise.all([
    myDogIds.length > 0
      ? supabase.from("dogs").select("*").in("id", myDogIds)
      : Promise.resolve({ data: [] as Dog[] }),
    myDogIds.length > 0
      ? supabase.from("care_schedules").select("*").in("dog_id", myDogIds)
      : Promise.resolve({ data: [] as CareSchedule[] }),
  ]);
  const myDogsById = new Map((myDogsList ?? []).map((d) => [d.id, d as Dog]));

  const myCareToday = await Promise.all(
    ((mySchedules ?? []) as CareSchedule[]).map(async (schedule) => {
      const { data: tasks } = await supabase
        .from("care_tasks")
        .select("*")
        .eq("schedule_id", schedule.id)
        .eq("due_date", today);
      const done = ((tasks ?? []) as CareTask[]).some(
        (t) => t.status === "completed" || t.status === "checked_no_action_needed",
      );
      return { schedule, dog: myDogsById.get(schedule.dog_id), done };
    }),
  );
  const careDueToday = myCareToday.filter((r) => !r.done && r.dog);

  const pending = (pendingEvents ?? []) as HealthEvent[];
  const verifyDogIds = [...new Set(pending.map((e) => e.dog_id))];
  const verifySubmitterIds = [...new Set(pending.map((e) => e.submitted_by))];
  const [{ data: verifyDogsList }, { data: verifySubmitters }] = await Promise.all([
    verifyDogIds.length > 0
      ? supabase.from("dogs").select("id, name, pawpass_id").in("id", verifyDogIds)
      : Promise.resolve({ data: [] as { id: string; name: string; pawpass_id: string }[] }),
    verifySubmitterIds.length > 0
      ? supabase.from("profiles").select("id, full_name").in("id", verifySubmitterIds)
      : Promise.resolve({ data: [] as { id: string; full_name: string | null }[] }),
  ]);
  const verifyDogsById = new Map((verifyDogsList ?? []).map((d) => [d.id, d]));
  const verifySubmittersById = new Map((verifySubmitters ?? []).map((p) => [p.id, p]));

  return (
    <main className="mx-auto max-w-3xl px-4 py-10">
      <h1 className="text-2xl font-semibold">
        Welcome back{profile.full_name ? `, ${profile.full_name}` : ""} 🐾
      </h1>
      <p className="quote mt-1 text-muted">Everything you do, do it with love.</p>
      <div className="mt-6 grid gap-3 sm:grid-cols-3">
        <Link href="/dogs/new" className="card p-4 transition hover:border-primary">
          <p className="font-medium">Register a dog</p>
          <p className="text-sm text-muted">Give a dog a Dogesh Bhai ID</p>
        </Link>
        <Link href="/tasks" className="card p-4 transition hover:border-primary">
          <p className="font-medium">Today&apos;s care</p>
          <p className="text-sm text-muted">See what&apos;s due</p>
        </Link>
        <Link href="/dogs" className="card p-4 transition hover:border-primary">
          <p className="font-medium">All dogs</p>
          <p className="text-sm text-muted">Browse the community</p>
        </Link>
      </div>

      {canVerify && (
        <div className="mt-10">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-bold">Verification queue</h2>
            <Link href="/verify" className="text-sm font-medium text-primary underline">
              See all →
            </Link>
          </div>
          {pending.length === 0 ? (
            <p className="mt-2 text-sm text-muted">Nothing waiting on you.</p>
          ) : (
            <ul className="mt-3 flex flex-col gap-2">
              {pending.map((event) => {
                const dog = verifyDogsById.get(event.dog_id);
                const submitter = verifySubmittersById.get(event.submitted_by);
                return (
                  <li key={event.id} className="card flex items-center justify-between gap-2 p-3 text-sm">
                    <div>
                      <p className="font-medium capitalize">
                        {event.type.replace("_", " ")}
                        {dog && <> for {dog.name}</>}
                      </p>
                      <p className="text-xs text-muted">
                        Added by {submitter?.full_name ?? "a volunteer"}
                      </p>
                    </div>
                    {dog && (
                      <div className="flex shrink-0 gap-2">
                        <form
                          action={decideHealthEventVerification.bind(
                            null,
                            event.id,
                            dog.id,
                            dog.pawpass_id,
                            "verified",
                          )}
                        >
                          <button className="btn-primary btn-sm">Verify</button>
                        </form>
                      </div>
                    )}
                  </li>
                );
              })}
            </ul>
          )}
        </div>
      )}

      {myCareToday.length > 0 && (
        <div className="mt-10">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-bold">Today&apos;s care</h2>
            <Link href="/tasks" className="text-sm font-medium text-primary underline">
              See all →
            </Link>
          </div>
          {careDueToday.length === 0 ? (
            <p className="mt-2 text-sm text-muted">
              🟢 Every dog you care for is sorted for today.
            </p>
          ) : (
            <ul className="mt-3 flex flex-col gap-2">
              {careDueToday.map(({ schedule, dog }) =>
                dog ? (
                  <li key={schedule.id} className="card flex items-center justify-between gap-2 p-3 text-sm">
                    <span>
                      {dog.name}, {schedule.task_type}
                    </span>
                    <div className="flex shrink-0 gap-2">
                      <form
                        action={completeCareTask.bind(null, schedule.id, dog.id, dog.pawpass_id, undefined)}
                      >
                        <button className="btn-primary btn-sm">Mark as fed ❤️</button>
                      </form>
                      <form
                        action={markCareCheckedNoActionNeeded.bind(
                          null,
                          schedule.id,
                          dog.id,
                          dog.pawpass_id,
                          undefined,
                        )}
                      >
                        <button className="btn-outline btn-sm">Just checking in</button>
                      </form>
                    </div>
                  </li>
                ) : null,
              )}
            </ul>
          )}
        </div>
      )}

      {dogs.length > 0 && (
        <div className="mt-10">
          <h2 className="text-lg font-bold">Recently added</h2>
          <div className="mt-3 grid grid-cols-3 gap-3 sm:grid-cols-4">
            {dogs.slice(0, 4).map((dog) => (
              <Link
                key={dog.id}
                href={`/dogs/${dog.pawpass_id}`}
                className="card overflow-hidden"
              >
                <div className="aspect-square w-full bg-background">
                  {dog.photo_url ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img
                      src={dog.photo_url}
                      alt={dog.name}
                      className="h-full w-full object-cover"
                    />
                  ) : (
                    <div className="flex h-full w-full items-center justify-center text-primary">
                      <PawPrint className="h-8 w-8" />
                    </div>
                  )}
                </div>
                <p className="p-2 text-center text-sm font-medium">{dog.name}</p>
              </Link>
            ))}
          </div>
        </div>
      )}
    </main>
  );
}
