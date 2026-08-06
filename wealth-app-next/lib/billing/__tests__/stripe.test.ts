// The webhook signature verifier is the security boundary: a forged event
// sets is_paid=true for free. These tests are the adversary.

import { describe, it, expect } from "vitest";
import { createHmac } from "node:crypto";
import { verifyWebhook, StripeError } from "../stripe";

const SECRET = "whsec_test_0123456789abcdef";

function sign(body: string, secret = SECRET, t = 1_700_000_000): string {
  const sig = createHmac("sha256", secret).update(`${t}.${body}`, "utf8").digest("hex");
  return `t=${t},v1=${sig}`;
}

const evt = (over: Record<string, unknown> = {}) =>
  JSON.stringify({ id: "evt_1", type: "customer.subscription.updated", data: { object: { id: "sub_1" } }, ...over });

describe("verifyWebhook", () => {
  const now = 1_700_000_000;

  it("accepts a correctly signed, fresh event", () => {
    const body = evt();
    const e = verifyWebhook(body, sign(body, SECRET, now), { secret: SECRET, nowSec: now });
    expect(e.id).toBe("evt_1");
    expect(e.type).toBe("customer.subscription.updated");
  });

  it("REJECTS a body signed with the wrong secret", () => {
    const body = evt();
    expect(() => verifyWebhook(body, sign(body, "whsec_attacker", now), { secret: SECRET, nowSec: now }))
      .toThrow(StripeError);
  });

  it("REJECTS a tampered body under a valid-looking signature", () => {
    // Sign the original, then change the amount — the classic forgery.
    const original = evt({ data: { object: { id: "sub_1", status: "active" } } });
    const header = sign(original, SECRET, now);
    const tampered = evt({ data: { object: { id: "sub_1", status: "active", metadata: { org_id: "evil" } } } });
    expect(() => verifyWebhook(tampered, header, { secret: SECRET, nowSec: now })).toThrow(/mismatch/i);
  });

  it("REJECTS a replayed event outside the tolerance window", () => {
    const body = evt();
    const oldHeader = sign(body, SECRET, now - 10_000); // ~2.7h old
    expect(() => verifyWebhook(body, oldHeader, { secret: SECRET, nowSec: now }))
      .toThrow(/replay|tolerance/i);
  });

  it("accepts an event within the tolerance window", () => {
    const body = evt();
    const header = sign(body, SECRET, now - 200); // inside 300s
    expect(() => verifyWebhook(body, header, { secret: SECRET, nowSec: now })).not.toThrow();
  });

  it("REJECTS when no secret is configured (fail closed)", () => {
    const body = evt();
    expect(() => verifyWebhook(body, sign(body), { secret: "", nowSec: now })).toThrow(/not set/i);
  });

  it("REJECTS a missing signature header", () => {
    expect(() => verifyWebhook(evt(), null, { secret: SECRET, nowSec: now })).toThrow(/missing/i);
  });

  it("REJECTS a malformed signature header", () => {
    expect(() => verifyWebhook(evt(), "garbage", { secret: SECRET, nowSec: now })).toThrow(/malformed/i);
  });

  it("accepts one of several v1 signatures (secret rotation)", () => {
    const body = evt();
    const good = createHmac("sha256", SECRET).update(`${now}.${body}`, "utf8").digest("hex");
    const header = `t=${now},v1=deadbeef,v1=${good}`;
    expect(() => verifyWebhook(body, header, { secret: SECRET, nowSec: now })).not.toThrow();
  });

  it("REJECTS a verified-but-structurally-invalid event body", () => {
    const body = JSON.stringify({ id: "evt_1" }); // no type/data
    expect(() => verifyWebhook(body, sign(body, SECRET, now), { secret: SECRET, nowSec: now }))
      .toThrow(/missing id\/type\/data/i);
  });
});
