import Link from "next/link";
import { getCurrentProfile } from "@/lib/auth";

export default async function HomePage() {
  const profile = await getCurrentProfile();

  if (!profile) {
    return (
      <main className="mx-auto flex max-w-2xl flex-1 flex-col items-center justify-center gap-6 px-4 text-center">
        <h1 className="text-4xl font-semibold">Dogesh Bhai</h1>
        <p className="max-w-md text-neutral-500">
          Don&apos;t just map the dog. Map its care. A digital health and care
          passport for community dogs — connecting identity, health records
          and caregivers so nothing essential gets missed.
        </p>
        <div className="flex gap-3">
          <Link
            href="/signup"
            className="rounded-md bg-neutral-900 px-4 py-2 text-sm text-white"
          >
            Get started
          </Link>
          <Link href="/login" className="rounded-md border px-4 py-2 text-sm">
            Log in
          </Link>
        </div>
      </main>
    );
  }

  return (
    <main className="mx-auto max-w-2xl px-4 py-10">
      <h1 className="text-2xl font-semibold">
        Welcome back{profile.full_name ? `, ${profile.full_name}` : ""}
      </h1>
      <div className="mt-6 grid gap-3 sm:grid-cols-3">
        <Link href="/dogs/new" className="rounded-md border p-4 hover:bg-neutral-50">
          <p className="font-medium">Register a dog</p>
          <p className="text-sm text-neutral-500">Give a dog a Dogesh Bhai ID</p>
        </Link>
        <Link href="/tasks" className="rounded-md border p-4 hover:bg-neutral-50">
          <p className="font-medium">Today&apos;s care</p>
          <p className="text-sm text-neutral-500">See what&apos;s due</p>
        </Link>
        <Link href="/dogs" className="rounded-md border p-4 hover:bg-neutral-50">
          <p className="font-medium">All dogs</p>
          <p className="text-sm text-neutral-500">Browse the community</p>
        </Link>
      </div>
    </main>
  );
}
