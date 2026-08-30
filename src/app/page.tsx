import Link from "next/link";
import { getCurrentProfile } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import PawPrint from "@/components/PawPrint";
import { stockPhotos, stockPhotoGallery } from "@/lib/stockPhotos";
import type { Dog } from "@/lib/supabase/types";

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
  ]);

  const dogs = (recentDogs ?? []) as Dog[];

  if (!profile) {
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
                and care passport for community dogs — connecting identity,
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
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={stockPhotos.hero}
                alt="An Indian community street dog"
                className="relative aspect-square w-full rounded-[2.5rem] border-4 border-white object-cover shadow-xl"
              />
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

        {/* Live dog grid */}
        <section className="bg-surface py-20">
          <div className="mx-auto max-w-5xl px-4">
            <div className="flex items-center justify-center gap-2 text-center">
              <PawPrint className="h-5 w-5 text-primary" />
              <h2 className="text-3xl font-bold">Meet the dogs</h2>
            </div>
            <p className="mt-2 text-center text-muted">
              Real profiles on Dogesh Bhai — tap a dog to see its passport.
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
                          className="h-full w-full object-cover transition group-hover:scale-105"
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
            ) : (
              <div className="mt-10 grid grid-cols-2 gap-4 sm:grid-cols-4">
                {stockPhotoGallery.map((photo) => (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img
                    key={photo.src}
                    src={photo.src}
                    alt={photo.alt}
                    className="aspect-square w-full rounded-2xl object-cover shadow-sm"
                  />
                ))}
              </div>
            )}

            <div className="mt-8 text-center">
              <Link href="/dogs" className="font-medium text-secondary underline">
                See all dogs →
              </Link>
            </div>
          </div>
        </section>

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
