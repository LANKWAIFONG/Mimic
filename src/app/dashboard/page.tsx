import { createClient } from "@/lib/supabase/server";
import { signOut } from "@/app/actions/auth";

export default async function DashboardPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  return (
    <div className="mx-auto w-full max-w-5xl flex-1 px-6 py-16">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-semibold tracking-tight">Rankings</h1>
        <form action={signOut}>
          <button className="rounded-full border border-border px-4 py-1.5 text-sm text-muted transition-colors hover:border-accent hover:text-foreground">
            Sign out
          </button>
        </form>
      </div>
      <p className="mt-2 text-sm text-muted">
        Signed in as {user?.email}
      </p>
      <p className="mt-8 text-sm text-muted">
        Scoring engine coming next — top S&amp;P 500 picks will appear here.
      </p>
    </div>
  );
}
