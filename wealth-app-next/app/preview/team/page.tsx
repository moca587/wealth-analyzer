import { notFound } from "next/navigation";
import { TeamManager } from "@/components/team/team-manager";

// Design review outside the auth gate, like /preview/plan. 404s in
// production, and /api/team still requires a session, so no data leaks.
export const dynamic = "force-dynamic";

export default function PreviewTeamPage() {
  if (process.env.NODE_ENV === "production") notFound();
  return (
    <div className="container max-w-4xl py-10">
      <h1 className="font-display text-4xl mb-6">Your firm (preview)</h1>
      <TeamManager />
    </div>
  );
}
