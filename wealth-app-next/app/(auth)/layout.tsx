import Link from "next/link";

export default function AuthLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen grid lg:grid-cols-2">
      {/* Left: branded panel */}
      <div className="relative hidden lg:flex flex-col justify-between bg-gradient-to-br from-accent to-purple-600 p-12 text-white overflow-hidden">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_20%_30%,_rgba(255,255,255,.1)_0%,_transparent_50%),_radial-gradient(circle_at_80%_70%,_rgba(255,255,255,.08)_0%,_transparent_50%)]" />
        <div className="relative">
          <Link href="/" className="inline-flex items-center gap-2 font-bold text-xl">
            <span className="grid h-9 w-9 place-items-center rounded-lg bg-white/15 backdrop-blur-sm">W</span>
            Wealth Analyzer
          </Link>
        </div>
        <div className="relative">
          <h2 className="font-display text-4xl leading-tight mb-4">
            &ldquo;The portfolio that thinks like a private banker.&rdquo;
          </h2>
          <p className="text-white/80 leading-relaxed max-w-md">
            Capture your full financial picture, stress-test it against 1,000 market paths, and see exactly which goals are funded — and which need work.
          </p>
        </div>
        <div className="relative text-sm text-white/60">© 2026 Wealth Analyzer</div>
      </div>

      {/* Right: form */}
      <div className="flex flex-col justify-center items-center p-8 lg:p-12">
        <div className="w-full max-w-md animate-fade-in">{children}</div>
      </div>
    </div>
  );
}
