import Link from "next/link";
import { getCurrentProfile } from "@/lib/auth";
import { signOut } from "@/app/auth/actions";
import { createClient } from "@/lib/supabase/server";
import PawPrint from "@/components/PawPrint";

export default async function NavBar() {
  const profile = await getCurrentProfile();

  let unreadCount = 0;
  if (profile) {
    const supabase = await createClient();
    const { count } = await supabase
      .from("notifications")
      .select("id", { count: "exact", head: true })
      .eq("user_id", profile.id)
      .eq("read_status", false);
    unreadCount = count ?? 0;
  }

  return (
    <header className="sticky top-0 z-20">
      <div className="bg-header-bg/90 py-1.5 text-center text-xs font-medium text-header-foreground/90">
        🐾 Every street dog deserves a record and someone who remembers it.
      </div>
      <div className="bg-header-bg text-header-foreground shadow-sm">
        <nav className="mx-auto flex max-w-5xl flex-wrap items-center justify-between gap-y-2 px-4 py-3">
          <Link href="/" className="flex items-center gap-1.5 text-lg font-extrabold">
            <PawPrint className="h-5 w-5 text-accent" />
            Dogesh Bhai
          </Link>

          {profile ? (
            <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-sm font-medium">
              <Link href="/dogs" className="hover:text-accent">
                All dogs
              </Link>
              <Link href="/map" className="hover:text-accent">
                Map
              </Link>
              <Link href="/vets" className="hover:text-accent">
                Vets
              </Link>
              <Link href="/requests" className="hover:text-accent">
                Requests
              </Link>
              <Link href="/tasks" className="hover:text-accent">
                Today&apos;s care
              </Link>
              <Link href="/learn" className="hover:text-accent">
                Learn
              </Link>
              {(profile.role === "vet" || profile.role === "admin") && (
                <Link href="/verify" className="hover:text-accent">
                  Verification queue
                </Link>
              )}
              {(profile.role === "admin" || profile.role === "ngo") && (
                <Link href="/console" className="hover:text-accent">
                  Console
                </Link>
              )}
              <Link href="/notifications" className="hover:text-accent">
                Notifications
                {unreadCount > 0 && (
                  <span className="ml-1 rounded-full bg-primary px-1.5 py-0.5 text-xs font-bold text-primary-foreground">
                    {unreadCount}
                  </span>
                )}
              </Link>
              <Link href="/dogs/new" className="btn-primary btn-sm">
                + Register a dog
              </Link>
              <form action={signOut}>
                <button className="text-header-foreground/70 underline">
                  Log out
                </button>
              </form>
            </div>
          ) : (
            <div className="flex items-center gap-4 text-sm font-medium">
              <Link href="/learn" className="hover:text-accent">
                Learn
              </Link>
              <Link href="/login" className="hover:text-accent">
                Log in
              </Link>
              <Link href="/signup" className="btn-primary btn-sm">
                Sign up
              </Link>
            </div>
          )}
        </nav>
      </div>
    </header>
  );
}
