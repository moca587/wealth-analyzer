"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { HouseholdSwitcher } from "@/components/nav/household-switcher";

const items = [
  { href: "/app",          label: "Dashboard",    emoji: "🏠" },
  { href: "/app/plan",     label: "Client plan",  emoji: "📋" },
  { href: "/app/feeds",    label: "Data feeds",   emoji: "🔌" },
  { href: "/app/simulate", label: "Simulation",   emoji: "🎲" },
  { href: "/app/report",   label: "Report",       emoji: "📄" },
  { href: "/app/orders",   label: "Orders",       emoji: "📤" },
  { href: "/app/audit",    label: "Audit trail",  emoji: "🧾" },
  { href: "/app/team",     label: "Your firm",    emoji: "👥" }
];

export function Sidebar({ displayName }: { displayName: string | null }) {
  const pathname = usePathname();
  const router = useRouter();

  async function signOut() {
    const supabase = createClient();
    await supabase.auth.signOut();
    router.push("/login");
    router.refresh();
  }

  return (
    <aside className="h-screen w-64 shrink-0 border-r border-border bg-card flex flex-col sticky top-0">
      <div className="p-6 border-b border-border">
        <Link href="/app" className="flex items-center gap-2 font-bold text-lg tracking-tight text-primary">
          <span className="grid h-8 w-8 place-items-center rounded-lg bg-gradient-to-br from-accent to-accent-3 text-white shadow-md">W</span>
          Wealth Analyzer
        </Link>
      </div>
      <HouseholdSwitcher />
      <nav className="flex-1 px-3 py-4 space-y-1">
        {items.map((item) => {
          const active = pathname === item.href || (item.href !== "/app" && pathname.startsWith(item.href));
          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                "flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-colors",
                active ? "bg-accent/10 text-accent" : "text-muted-foreground hover:bg-accent/5 hover:text-foreground"
              )}
            >
              <span className="text-lg">{item.emoji}</span>
              {item.label}
            </Link>
          );
        })}
      </nav>
      <div className="p-4 border-t border-border space-y-3">
        {displayName && (
          <div className="text-xs text-muted-foreground px-3">
            Signed in as<br />
            <strong className="text-foreground">{displayName}</strong>
          </div>
        )}
        <Button variant="outline" size="sm" className="w-full" onClick={signOut}>
          Sign out
        </Button>
      </div>
    </aside>
  );
}
