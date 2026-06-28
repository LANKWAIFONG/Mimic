import Link from "next/link";
import LoginForm from "./login-form";

export default async function LoginPage({
  searchParams,
}: {
  searchParams: Promise<{ redirectTo?: string; confirmEmail?: string }>;
}) {
  const { redirectTo, confirmEmail } = await searchParams;

  return (
    <div className="flex flex-1 items-center justify-center px-6 py-24">
      <div className="w-full max-w-sm rounded-2xl border border-border bg-background-elevated p-8">
        <h1 className="text-xl font-semibold tracking-tight">Sign in</h1>
        <p className="mt-1 text-sm text-muted">
          Welcome back to Mimic One.
        </p>

        {confirmEmail && (
          <p className="mt-4 rounded-lg border border-accent-2 bg-accent-soft px-3 py-2 text-sm text-foreground">
            Check your inbox to confirm your email before signing in.
          </p>
        )}

        <LoginForm redirectTo={redirectTo} />

        <p className="mt-6 text-center text-sm text-muted">
          Don&apos;t have an account?{" "}
          <Link href="/signup" className="text-foreground underline">
            Sign up
          </Link>
        </p>
      </div>
    </div>
  );
}
