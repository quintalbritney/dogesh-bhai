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
    <header className="sticky top-0 z-20 border-b border-border/70 bg-background/80 backdrop-blur-md">
      <nav className="mx-auto flex max-w-5xl items-center justify-between px-4 py-3">
        <Link href="/" className="flex items-center gap-1.5 text-lg font-bold">
          <PawPrint className="h-5 w-5 text-primary" />
          Dogesh Bhai
        </Link>

        {profile ? (
          <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-sm font-medium">
            <Link href="/dogs" className="hover:text-primary">
              All dogs
            </Link>
            <Link href="/map" className="hover:text-primary">
              Map
            </Link>
            <Link href="/tasks" className="hover:text-primary">
              Today&apos;s care
            </Link>
            {(profile.role === "vet" || profile.role === "admin") && (
              <Link href="/verify" className="hover:text-primary">
                Verification queue
              </Link>
            )}
            {(profile.role === "admin" || profile.role === "ngo") && (
              <Link href="/console" className="hover:text-primary">
                Console
              </Link>
            )}
            <Link href="/notifications" className="hover:text-primary">
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
              <button className="text-muted underline">Log out</button>
            </form>
          </div>
        ) : (
          <div className="flex items-center gap-3 text-sm font-medium">
            <Link href="/login" className="hover:text-primary">
              Log in
            </Link>
            <Link href="/signup" className="btn-primary btn-sm">
              Sign up
            </Link>
          </div>
        )}
      </nav>
    </header>
  );
}
