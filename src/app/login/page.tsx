import Link from "next/link";
import {
  signInWithPassword,
  signInWithGoogle,
} from "@/app/auth/actions";

export default async function LoginPage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string }>;
}) {
  const { error } = await searchParams;

  return (
    <main className="mx-auto flex min-h-screen max-w-sm flex-col justify-center gap-6 px-4">
      <div>
        <h1 className="text-2xl font-semibold">Log in to Dogesh Bhai</h1>
        <p className="text-sm text-neutral-500">
          One dog. One record. A community that remembers.
        </p>
      </div>

      {error && (
        <p className="rounded-md bg-red-50 px-3 py-2 text-sm text-red-700">
          {error}
        </p>
      )}

      <form action={signInWithPassword} className="flex flex-col gap-3">
        <input
          name="email"
          type="email"
          required
          placeholder="Email"
          className="rounded-md border px-3 py-2"
        />
        <input
          name="password"
          type="password"
          required
          placeholder="Password"
          className="rounded-md border px-3 py-2"
        />
        <button
          type="submit"
          className="rounded-md bg-neutral-900 px-3 py-2 text-white"
        >
          Log in
        </button>
      </form>

      <form action={signInWithGoogle}>
        <button
          type="submit"
          className="w-full rounded-md border px-3 py-2 text-sm"
        >
          Continue with Google
        </button>
      </form>

      <p className="text-sm text-neutral-500">
        No account?{" "}
        <Link href="/signup" className="underline">
          Sign up
        </Link>
      </p>
    </main>
  );
}
