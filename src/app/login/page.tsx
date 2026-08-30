import Link from "next/link";
import {
  signInWithPassword,
  signInWithGoogle,
} from "@/app/auth/actions";
import AuthShell from "@/components/AuthShell";

export default async function LoginPage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string }>;
}) {
  const { error } = await searchParams;

  return (
    <AuthShell quote="Everything you do, do it with love.">
      <h1 className="text-3xl font-bold">Welcome back</h1>
      <p className="mt-1 text-sm text-muted">
        One dog. One record. A community that remembers.
      </p>

      {error && (
        <p className="mt-4 rounded-xl bg-red-50 px-3 py-2 text-sm text-red-700">
          {error}
        </p>
      )}

      <form action={signInWithPassword} className="mt-6 flex flex-col gap-3">
        <input
          name="email"
          type="email"
          required
          placeholder="Email"
          className="input"
        />
        <input
          name="password"
          type="password"
          required
          placeholder="Password"
          className="input"
        />
        <button type="submit" className="btn-primary mt-1 w-full py-3">
          Log in
        </button>
      </form>

      <form action={signInWithGoogle} className="mt-3">
        <button type="submit" className="btn-outline w-full py-3">
          Continue with Google
        </button>
      </form>

      <p className="mt-6 text-sm text-muted">
        No account?{" "}
        <Link href="/signup" className="font-medium text-primary underline">
          Sign up
        </Link>
      </p>
    </AuthShell>
  );
}
