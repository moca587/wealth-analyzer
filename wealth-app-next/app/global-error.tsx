"use client";

// Root error boundary — catches errors thrown in the root layout itself, which
// app/error.tsx cannot reach. Must render its own <html>/<body>.

import { useEffect } from "react";

export default function GlobalError({ error, reset }: { error: Error & { digest?: string }; reset: () => void }) {
  useEffect(() => {
    console.error(error);
  }, [error]);

  return (
    <html lang="en">
      <body style={{ fontFamily: "system-ui, sans-serif", display: "flex", minHeight: "100vh", alignItems: "center", justifyContent: "center", margin: 0 }}>
        <div style={{ textAlign: "center", maxWidth: 420, padding: 24 }}>
          <h1 style={{ fontSize: 28, marginBottom: 8 }}>Something went wrong</h1>
          <p style={{ color: "#666", marginBottom: 20 }}>
            The application hit an unexpected error. Please try again.
          </p>
          <button
            onClick={reset}
            style={{ padding: "10px 20px", borderRadius: 8, border: "1px solid #ccc", background: "#0057b8", color: "#fff", cursor: "pointer" }}
          >
            Try again
          </button>
        </div>
      </body>
    </html>
  );
}
