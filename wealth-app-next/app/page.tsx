import Link from "next/link";
import { Button } from "@/components/ui/button";

export default function LandingPage() {
  return (
    <div className="min-h-screen">
      {/* ─── NAV ─── */}
      <nav className="fixed inset-x-0 top-0 z-50 border-b border-border/60 bg-background/80 backdrop-blur-md">
        <div className="container flex h-16 items-center justify-between">
          <Link href="/" className="flex items-center gap-2 font-bold text-lg tracking-tight text-primary">
            <span className="grid h-8 w-8 place-items-center rounded-lg bg-gradient-to-br from-accent to-accent-3 text-white shadow-md">W</span>
            Wealth Analyzer
          </Link>
          <div className="flex items-center gap-4">
            <Link href="/login" className="text-sm font-medium text-muted-foreground hover:text-foreground">
              Log in
            </Link>
            <Button asChild>
              <Link href="/signup">Get started &rarr;</Link>
            </Button>
          </div>
        </div>
      </nav>

      {/* ─── HERO ─── */}
      <section className="relative overflow-hidden pt-40 pb-24">
        <div className="absolute inset-0 -z-10 bg-[radial-gradient(ellipse_at_top_right,_rgba(124,58,237,.08),_transparent_50%),_radial-gradient(ellipse_at_bottom_left,_rgba(0,87,184,.08),_transparent_50%)]" />
        <div className="container max-w-5xl text-center animate-fade-in">
          <div className="mb-6 inline-flex items-center gap-2 rounded-full border border-accent/20 bg-accent/5 px-4 py-1.5 text-xs font-semibold text-accent">
            <span className="h-2 w-2 rounded-full bg-emerald-500 shadow-[0_0_0_3px_rgba(16,185,129,.2)]" />
            Monte Carlo simulation · 16 research sources · country-aware
          </div>
          <h1 className="font-display text-5xl md:text-7xl leading-[1.05] tracking-tight mb-6">
            Plan your wealth.<br />
            <span className="bg-gradient-to-br from-accent to-purple-600 bg-clip-text text-transparent">
              Stress-test the future.
            </span>
          </h1>
          <p className="mx-auto max-w-2xl text-lg text-muted-foreground leading-relaxed mb-10">
            Build a complete financial plan in your browser. Run 1,000+ Monte Carlo paths against your goals.
            See the probability of reaching each milestone — and what changes when markets don&apos;t cooperate.
          </p>
          <div className="flex flex-wrap items-center justify-center gap-3">
            <Button asChild size="xl">
              <Link href="/signup">Create your plan &rarr;</Link>
            </Button>
            <Button asChild variant="outline" size="xl">
              <Link href="/login">I already have an account</Link>
            </Button>
          </div>
          <p className="mt-6 text-xs text-muted-foreground">
            Free during beta · no credit card · your data lives in your account, not in our analytics
          </p>
        </div>
      </section>

      {/* ─── FEATURE STRIP ─── */}
      <section className="border-y border-border bg-card py-16">
        <div className="container grid grid-cols-2 md:grid-cols-4 gap-8 text-center">
          {[
            { v: "1,000+", l: "Monte Carlo paths per simulation" },
            { v: "7", l: "Risk profiles, blended for two-client households" },
            { v: "19", l: "Inflation regions with 50-year averages" },
            { v: "100%", l: "Browser-based — your data stays yours" }
          ].map((s) => (
            <div key={s.l}>
              <div className="font-display text-5xl text-accent leading-none mb-2">{s.v}</div>
              <div className="text-sm text-muted-foreground">{s.l}</div>
            </div>
          ))}
        </div>
      </section>

      {/* ─── FOOTER ─── */}
      <footer className="border-t border-border py-12 text-sm text-muted-foreground">
        <div className="container flex flex-wrap items-center justify-between gap-4">
          <div>© 2026 Wealth Analyzer</div>
          <div className="flex gap-6">
            <Link href="/login" className="hover:text-foreground">Log in</Link>
            <Link href="/signup" className="hover:text-foreground">Sign up</Link>
          </div>
        </div>
      </footer>
    </div>
  );
}
