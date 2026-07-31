import Link from "next/link";
import { buttonVariants } from "@/components/ui/button";

export default function NotFound() {
  return (
    <div className="min-h-[70vh] flex flex-col items-center justify-center text-center px-6">
      <div className="max-w-md space-y-4">
        <div className="font-display text-6xl text-accent">404</div>
        <h1 className="font-display text-3xl">Page not found</h1>
        <p className="text-muted-foreground">
          The page you&apos;re looking for doesn&apos;t exist or may have moved.
        </p>
        <div className="pt-2">
          <Link href="/" className={buttonVariants({ variant: "default" })}>Back to home</Link>
        </div>
      </div>
    </div>
  );
}
