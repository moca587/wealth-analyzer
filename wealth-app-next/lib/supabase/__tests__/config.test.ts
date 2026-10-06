import { afterEach, describe, expect, it } from "vitest";
import { authCookieName, serverSupabaseUrl } from "../config";

const save = { ...process.env };
afterEach(() => {
  process.env = { ...save };
});

describe("supabase config", () => {
  it("server URL falls back to the public URL when no override is set", () => {
    process.env.NEXT_PUBLIC_SUPABASE_URL = "https://abc.supabase.co";
    delete process.env.SUPABASE_INTERNAL_URL;
    expect(serverSupabaseUrl()).toBe("https://abc.supabase.co");
  });

  it("uses SUPABASE_INTERNAL_URL for server calls when set", () => {
    process.env.NEXT_PUBLIC_SUPABASE_URL = "http://localhost:54321";
    process.env.SUPABASE_INTERNAL_URL = "http://kong:8000";
    expect(serverSupabaseUrl()).toBe("http://kong:8000");
  });

  it("cookie name comes from the PUBLIC url, so browser and server agree", () => {
    process.env.NEXT_PUBLIC_SUPABASE_URL = "http://localhost:54321";
    process.env.SUPABASE_INTERNAL_URL = "http://kong:8000";
    expect(authCookieName()).toBe("sb-localhost-auth-token");
  });

  it("matches the library default for a hosted project (sessions survive)", () => {
    process.env.NEXT_PUBLIC_SUPABASE_URL = "https://abcdef.supabase.co";
    expect(authCookieName()).toBe("sb-abcdef-auth-token");
  });
});
