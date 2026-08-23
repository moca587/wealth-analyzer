"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";

import { createClient } from "@/lib/supabase/client";
import { cn } from "@/lib/utils";

import { Button } from "@/components/ui/button";
import { HouseholdSwitcher } from "@/components/nav/household-switcher";

function NavIcon({ path }: { path: string }) {
  return (
    <svg
      viewBox="0 0 16 16"
      fill="currentColor"
      className="h-[14px] w-[14px] shrink-0 opacity-65"
      aria-hidden="true"
    >
      <path d={path} />
    </svg>
  );
}
const navGroups = [
  {
    label: "Profile",
    items: [
      {
        href: "/app/household",
        label: "Household",
        icon: "M8 1L1 7v8h5v-5h4v5h5V7z",
      },
      {
        href: "/app/goals",
        label: "Goals",
        icon: "M8 1a7 7 0 100 14A7 7 0 008 1zm3.5 7.5h-3v3h-1v-3h-3v-1h3v-3h1v3h3v1z",
      },
    ],
  },

  {
    label: "Finances",
    items: [
      {
        href: "/app/expenses",
        label: "Expenses",
        icon: "M14 3H2a1 1 0 00-1 1v8a1 1 0 001 1h12a1 1 0 001-1V4a1 1 0 00-1-1zM2 12V7h12v5H2zm0-6V4h12v2H2z",
      },
      {
        href: "/app/income",
        label: "Income",
        icon: "M8 1a7 7 0 100 14A7 7 0 008 1zm1 9.5H7v-1h2v1zm0-2.5c0 .28-.22.5-.5.5h-.5V5h1v3z",
      },
      {
        href: "/app/assets",
        label: "Assets",
        icon: "M8 1l6 4v6l-6 4-6-4V5l6-4zm0 2.5L4 6v4l4 2.5L12 10V6L8 3.5z",
      },
      {
        href: "/app/liabilities",
        label: "Liabilities",
        icon: "M8 1a7 7 0 100 14A7 7 0 008 1zm-.75 4.5h1.5v5h-1.5v-5zm0 6h1.5v1.5h-1.5z",
      },
    ],
  },

  {
    label: "Portfolio",
    items: [
      {
        href: "/app/portfolio",
        label: "Current Portfolio",
        icon: "M2 2h12v3H2V2zm0 4.5h5.5v7.5H2V6.5zm6.5 0H14v3H8.5v-3zm0 4H14v3.5H8.5v-3.5z",
      },
      {
        href: "/app/proposal",
        label: "Investment Proposal",
        icon: "M3 1h7l3 3v11a1 1 0 0 1-1 1H3a1 1 0 0 1-1-1V2a1 1 0 0 1 1-1zm6.5 1v3h3l-3-3zM4.5 7h7v1h-7V7zm0 2.5h7v1h-7v-1zm0 2.5h5v1h-5v-1z",
      },
      {
        href: "/app/ai-portfolio",
        label: "AI Portfolio Builder",
        icon: "M8 1a3 3 0 00-3 3v1.5L3 7v5l2 1.5V15h6v-1.5L13 12V7l-2-1.5V4a3 3 0 00-3-3zm-1 7a1 1 0 110 2 1 1 0 010-2zm2 0a1 1 0 110 2 1 1 0 010-2z",
        new: true,
      },
      {
        href: "/app/comparison",
        label: "Portfolio Comparison",
        icon: "M2 2v12h5V2H2zm7 0v6h5V2H9zm0 7.5v4.5h5V9.5H9z",
      },
    ],
  },

  {
    label: "Analysis",
    items: [
      {
        href: "/app/simulate",
        label: "Simulation",
        icon: "M1 12l4-5 3 3 3-4 4 5H1z",
      },
      {
        href: "/app/recommendations",
        label: "Recommendations",
        icon: "M8 1a1 1 0 01.894.553l1.382 2.764 3.05.444a1 1 0 01.554 1.705l-2.207 2.151.521 3.038a1 1 0 01-1.451 1.054L8 11.347l-2.723 1.362a1 1 0 01-1.451-1.054l.521-3.038-2.207-2.151a1 1 0 01.554-1.705l3.05-.444L7.106 1.553A1 1 0 018 1z",
      },
    ],
  },

  {
    label: "Reports",
    items: [
      {
        href: "/app/reports",
        label: "PDF Report",
        icon: "M3 1.5A1.5 1.5 0 0 1 4.5 0h5L13 3.5V14.5A1.5 1.5 0 0 1 11.5 16h-7A1.5 1.5 0 0 1 3 14.5v-13zM9 1v3h3L9 1zm-4 6.5h6v1H5v-1zM5 10h6v1H5v-1zm0 2.5h4v1H5v-1z",
      },
    ],
  },
];

const platformItems = [
  {
    href: "/app",
    label: "Dashboard",
    emoji: "🏠",
  },
  {
    href: "/app/plan",
    label: "Client Plan",
    emoji: "📋",
  },
  {
    href: "/app/feeds",
    label: "Data Feeds",
    emoji: "🔌",
  },
  {
    href: "/app/orders",
    label: "Orders",
    emoji: "📤",
  },
  {
    href: "/app/audit",
    label: "Audit Trail",
    emoji: "🧾",
  },
  {
    href: "/app/team",
    label: "Your Firm",
    emoji: "👥",
  },
  {
    href: "/app/billing",
    label: "Billing",
    emoji: "💳",
  },
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

  function isActive(href: string) {
    return pathname === href || (href !== "/app" && pathname.startsWith(href));
  }

  return (
    <aside className="sticky top-0 flex h-screen w-[265px] shrink-0 flex-col border-r border-[#e7edf6] bg-white">
      {/* BRAND */}
      <div className="border-b border-[#e7edf6] px-5 py-5">
        <Link href="/app/household" className="flex items-center gap-3">
          <div className="grid h-9 w-9 place-items-center rounded-[10px] bg-gradient-to-br from-[#0057b8] to-[#4da6ff] text-sm font-extrabold text-white shadow-sm">
            W
          </div>

          <div>
            <div className="text-[15px] font-extrabold tracking-[-0.03em] text-[#16213e]">
              WealthAnalyzer
            </div>

            <div className="mt-0.5 text-[9px] font-medium text-[#9ca3af]">
              Private Wealth Intelligence
            </div>
          </div>
        </Link>
      </div>

      {/* CLIENT / HOUSEHOLD SWITCHER */}
      {/* <div className="border-b border-[#e7edf6]">
        <HouseholdSwitcher />
      </div> */}

      {/* MAIN NAVIGATION */}
      <nav className="flex-1 overflow-y-auto px-3 py-4">
        {navGroups.map((group) => (
          <div key={group.label} className="mb-5">
            <div className="mb-1.5 px-3 text-[9px] font-bold uppercase tracking-[0.13em] text-[#a4acba]">
              {group.label}
            </div>

            <div className="space-y-0.5">
              {group.items.map((item) => {
                const active = isActive(item.href);

                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    className={cn(
                      "group flex items-center gap-3 rounded-[9px] px-3 py-2 text-[12px] font-semibold transition-colors",
                      active
                        ? "bg-[#eaf2ff] text-[#0057b8]"
                        : "text-[#64748b] hover:bg-[#f5f8fc] hover:text-[#16213e]",
                    )}
                  >
                    {/* <span
                      className={cn(
                        "flex w-5 justify-center text-[15px] transition-transform",
                        active
                          ? ""
                          : "group-hover:scale-105"
                      )}
                    >
                      {item.emoji}
                    </span> */}
                    <NavIcon path={item.icon} />

                    <span>{item.label}</span>

                    {"new" in item && item.new && (
                      <span className="ml-auto rounded-full bg-gradient-to-br from-[#7c3aed] to-[#0057b8] px-1.5 py-0.5 text-[8px] font-bold text-white">
                        NEW
                      </span>
                    )}
                  </Link>
                );
              })}
            </div>
          </div>
        ))}

        {/* PLATFORM / ADMIN */}
        {/* <div className="mt-2 border-t border-[#e7edf6] pt-5">
          <div className="mb-1.5 px-3 text-[9px] font-bold uppercase tracking-[0.13em] text-[#a4acba]">
            Platform
          </div>

          <div className="space-y-0.5">
            {platformItems.map((item) => {
              const active = isActive(item.href);

              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className={cn(
                    "group flex items-center gap-3 rounded-[9px] px-3 py-2 text-[12px] font-semibold transition-colors",
                    active
                      ? "bg-[#eaf2ff] text-[#0057b8]"
                      : "text-[#64748b] hover:bg-[#f5f8fc] hover:text-[#16213e]",
                  )}
                >
                  <span className="flex w-5 justify-center text-[15px]">
                    {item.emoji}
                  </span>

                  <span>{item.label}</span>
                </Link>
              );
            })}
          </div>
        </div> */}
      </nav>

      {/* USER / SIGN OUT */}
      <div className="border-t border-[#e7edf6] bg-[#fafcff] p-4">
        {displayName && (
          <div className="mb-3 px-2">
            <div className="text-[9px] font-semibold uppercase tracking-[0.08em] text-[#a4acba]">
              Signed in as
            </div>

            <div className="mt-1 truncate text-[12px] font-bold text-[#16213e]">
              {displayName}
            </div>
          </div>
        )}

        <Button
          variant="outline"
          size="sm"
          className="w-full border-[#dce4ef] bg-white text-[11px] text-[#64748b] hover:bg-[#f5f8fc] hover:text-[#16213e]"
          onClick={signOut}
        >
          Sign out
        </Button>
      </div>
    </aside>
  );
}
