// Next.js calls this once per server process, before any request is
// handled. It is the only place the app can refuse to start.
//
// The check is nodejs-runtime only: the edge runtime has no process.stdout
// and re-running it per edge invocation would be noise, not safety.

export async function register() {
  if (process.env.NEXT_RUNTIME !== "nodejs") return;
  const { assertEnv } = await import("./lib/env");
  assertEnv();
}
