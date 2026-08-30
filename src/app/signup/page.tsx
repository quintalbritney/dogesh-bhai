import Link from "next/link";
import {
  signUpWithPassword,
  signInWithGoogle,
} from "@/app/auth/actions";
import AuthShell from "@/components/AuthShell";

export default async function SignupPage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string }>;
}) {
  const { error } = await searchParams;

  return (
    <AuthShell quote="A dog doesn't need much. Just someone who remembers.">
      <h1 className="text-3xl font-bold">Join the Care Circle</h1>
      <p className="mt-1 text-sm text-muted">
        Every account starts as a caregiver. Vet, NGO, and admin access is
        granted by an admin afterwards.
      </p>

      {error && (
        <p className="mt-4 rounded-xl bg-red-50 px-3 py-2 text-sm text-red-700">
          {error}
        </p>
      )}

      <form action={signUpWithPassword} className="mt-6 flex flex-col gap-3">
        <input
          name="full_name"
          type="text"
          required
          placeholder="Full name"
          className="input"
        />
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
          minLength={6}
          placeholder="Password"
          className="input"
        />
        <button type="submit" className="btn-primary mt-1 w-full py-3">
          Create account
        </button>
      </form>

      <form action={signInWithGoogle} className="mt-3">
        <button type="submit" className="btn-outline w-full py-3">
          Continue with Google
        </button>
      </form>

      <p className="mt-6 text-sm text-muted">
        Already have an account?{" "}
        <Link href="/login" className="font-medium text-primary underline">
          Log in
        </Link>
      </p>
    </AuthShell>
  );
}
