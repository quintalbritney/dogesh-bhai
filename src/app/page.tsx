import Link from "next/link";
import { getCurrentProfile } from "@/lib/auth";
import PawPrint from "@/components/PawPrint";
import { stockPhotos, stockPhotoGallery } from "@/lib/stockPhotos";

export default async function HomePage() {
  const profile = await getCurrentProfile();

  if (!profile) {
    return (
      <main className="flex-1">
        {/* Hero */}
        <section className="relative flex min-h-[85vh] items-center overflow-hidden">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={stockPhotos.hero}
            alt="An Indian community street dog"
            className="absolute inset-0 h-full w-full object-cover"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/50 to-black/20" />
          <PawPrint className="pointer-events-none absolute -right-10 -top-10 h-64 w-64 rotate-12 text-white/10" />

          <div className="relative z-10 mx-auto max-w-3xl px-4 py-24 text-center text-white">
            <span className="inline-flex items-center gap-1.5 rounded-full bg-white/15 px-4 py-1.5 text-sm font-medium backdrop-blur-sm">
              <PawPrint className="h-4 w-4" />
              For India&apos;s community dogs
            </span>
            <h1 className="mt-6 text-5xl font-extrabold tracking-tight sm:text-6xl">
              Dogesh Bhai
            </h1>
            <p className="quote mt-4 text-xl text-white/90">
              &ldquo;Everything you do, do it with love.&rdquo;
            </p>
            <p className="mx-auto mt-4 max-w-xl text-base text-white/80">
              Don&apos;t just map the dog. Map its care. A digital health and
              care passport for community dogs — connecting identity, health
              records and caregivers so nothing essential gets missed.
            </p>
            <div className="mt-8 flex flex-wrap items-center justify-center gap-3">
              <Link href="/signup" className="btn-primary px-8 py-3.5 text-base">
                Join the Care Circle
              </Link>
              <Link
                href="/login"
                className="btn-outline border-white/40 px-8 py-3.5 text-base text-white"
              >
                Log in
              </Link>
            </div>
          </div>
        </section>

        {/* How it works */}
        <section className="mx-auto max-w-5xl px-4 py-20">
          <h2 className="text-center text-3xl font-bold">
            One dog. One record. A community that remembers.
          </h2>
          <div className="mt-12 grid gap-6 sm:grid-cols-3">
            <div className="card p-6 text-center">
              <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-primary/15 text-2xl">
                🪪
              </div>
              <h3 className="mt-4 font-semibold">Give it an identity</h3>
              <p className="mt-2 text-sm text-muted">
                Every dog gets a persistent PawPass ID — a photo, a name, a
                place it calls home.
              </p>
            </div>
            <div className="card p-6 text-center">
              <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-secondary/15 text-2xl">
                🩺
              </div>
              <h3 className="mt-4 font-semibold">Know its health</h3>
              <p className="mt-2 text-sm text-muted">
                Vaccinations, sterilisation, treatments — verified by real
                vets, not guesswork.
              </p>
            </div>
            <div className="card p-6 text-center">
              <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-accent/20 text-2xl">
                ❤️
              </div>
              <h3 className="mt-4 font-semibold">Give it care</h3>
              <p className="mt-2 text-sm text-muted">
                Feeding schedules, backup caregivers, and a record of what
                happened today — not just good intentions.
              </p>
            </div>
          </div>
        </section>

        {/* Gallery */}
        <section className="bg-surface py-20">
          <div className="mx-auto max-w-5xl px-4">
            <div className="flex items-center justify-center gap-2 text-center">
              <PawPrint className="h-5 w-5 text-primary" />
              <h2 className="text-3xl font-bold">Meet the community</h2>
            </div>
            <p className="mt-2 text-center text-muted">
              Real dogs, real streets — the ones this app is built for.
            </p>
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
          </div>
        </section>

        {/* Final CTA */}
        <section className="mx-auto max-w-2xl px-4 py-20 text-center">
          <PawPrint className="mx-auto h-8 w-8 text-primary" />
          <p className="quote mt-4 text-2xl">
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
    <main className="mx-auto max-w-2xl px-4 py-10">
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
    </main>
  );
}
