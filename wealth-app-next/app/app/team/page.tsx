import { TeamManager } from "@/components/team/team-manager";

export const dynamic = "force-dynamic";

export default function TeamPage() {
  return (
    <div className="container max-w-4xl py-10 animate-fade-in">
      <div className="mb-8">
        <h1 className="font-display text-4xl mb-2">Your firm</h1>
        <p className="text-muted-foreground">
          People, roles, seats, and which advisor sees which client.
        </p>
      </div>
      <TeamManager />
    </div>
  );
}
