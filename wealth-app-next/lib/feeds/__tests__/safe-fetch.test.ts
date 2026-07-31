// ─────────────────────────────────────────────────────────────────
// safeFetch — proves the guard is wired into the ACTUAL fetch path,
// not merely available as a validator someone might forget to call.
// A real HTTP server is started on loopback: if the guard regressed,
// these tests would reach it and fail.
// ─────────────────────────────────────────────────────────────────

import { describe, it, expect, beforeAll, afterAll } from "vitest";
import { createServer, type Server } from "node:http";
import { safeFetch, FeedFetchError } from "../ssrf";

let server: Server;
let port = 0;
let hits = 0;

beforeAll(async () => {
  server = createServer((_req, res) => {
    hits++;
    res.writeHead(200, { "Content-Type": "application/json" });
    res.end(JSON.stringify({ schema: "wa.feed/v1", secret: "INTERNAL DATA" }));
  });
  await new Promise<void>((resolve) => server.listen(0, "127.0.0.1", resolve));
  port = (server.address() as { port: number }).port;
});

afterAll(async () => {
  await new Promise<void>((resolve) => server.close(() => resolve()));
});

describe("safeFetch guard", () => {
  it("refuses to reach a live loopback service (the server is up and never hit)", async () => {
    const before = hits;
    await expect(safeFetch(`http://127.0.0.1:${port}/positions`, {})).rejects.toThrow(FeedFetchError);
    expect(hits, "the guard must block before any request is issued").toBe(before);
  });

  it("refuses localhost by name as well as by address", async () => {
    const before = hits;
    await expect(safeFetch(`http://localhost:${port}/positions`, {})).rejects.toThrow(FeedFetchError);
    expect(hits).toBe(before);
  });

  it("refuses the cloud metadata endpoint", async () => {
    await expect(safeFetch("http://169.254.169.254/latest/meta-data/iam/security-credentials/", {}))
      .rejects.toThrow(/not reachable/i);
  });

  it("refuses non-http schemes", async () => {
    await expect(safeFetch("file:///etc/passwd", {})).rejects.toThrow(/scheme/i);
  });

  it("reports blocked attempts with the 'blocked' code so the route can answer 400", async () => {
    try {
      await safeFetch(`http://127.0.0.1:${port}/x`, {});
      throw new Error("should have thrown");
    } catch (e) {
      expect(e).toBeInstanceOf(FeedFetchError);
      expect((e as FeedFetchError).code).toBe("blocked");
    }
  });
});
