import Link from "next/link";
import SignupForm from "./signup-form";

export default function SignupPage() {
  return (
    <div className="flex flex-1 items-center justify-center px-6 py-24">
      <div className="w-full max-w-sm rounded-2xl border border-border bg-background-elevated p-8">
        <h1 className="text-xl font-semibold tracking-tight">
          Create your account
        </h1>
        <p className="mt-1 text-sm text-muted">
          Start ranking the S&amp;P 500 with Mimic One.
        </p>

        <SignupForm />

        <p className="mt-6 text-center text-sm text-muted">
          Already have an account?{" "}
          <Link href="/login" className="text-foreground underline">
            Sign in
          </Link>
        </p>
      </div>
    </div>
  );
}
