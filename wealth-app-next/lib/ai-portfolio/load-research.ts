import { createClient } from "@/lib/supabase/server";

import { LEGACY_CURATED_RESEARCH } from "@/lib/ai-portfolio/legacy-curated-research";

import type {
  ResearchItem,
  ResearchProvider,
} from "@/lib/ai-portfolio/research";

type ResearchRow = {
  provider: string;
  title: string | null;
  summary: string | null;
  shared: boolean | null;
  published_at: string | null;
  enabled: boolean | null;
};

export async function loadResearchProviders(): Promise<ResearchProvider[]> {
  //   console.log("loadResearchProviders CALLED");

  const supabase = await createClient();

  // Only use reasonably recent research.
  const cutoff = new Date();

  cutoff.setDate(cutoff.getDate() - 180);

  // load from supabase
  const { data, error } = await supabase
    .from("institutional_research")
    .select(
      `
        provider,
        title,
        summary,
        shared,
        published_at,
        enabled
      `,
    )
    .gte("published_at", cutoff.toISOString())
    .order("published_at", {
      ascending: false,
    }); // newest research first

  if (error) {
    console.warn(
      "Could not load institutional research. Using legacy fallback.",
      error,
    );

    return LEGACY_CURATED_RESEARCH; // does not need transformation
  }

  if (!data || data.length === 0) {
    return LEGACY_CURATED_RESEARCH;
  }

  //   console.log("institutional research rows:", data.length);
  //   console.log("using Supabase research");

  const rows = data as ResearchRow[];

  // Group research rows by provider.
  const byProvider = new Map<string, ResearchProvider>();

  for (const row of rows) {
    if (!row.provider) {
      continue;
    } // skip rows without a provider

    // check whether we've already seen this provider
    let provider = byProvider.get(row.provider);

    if (!provider) {
      provider = {
        id: row.provider,

        enabled: row.enabled ?? true,

        items: [],
      };

      // store it in the map
      byProvider.set(row.provider, provider);
    }

    const item: ResearchItem = {
      title: row.title ?? undefined,

      summary: row.summary ?? undefined,

      shared: row.shared ?? false,
    };

    provider.items.push(item);
  }

  const providers = Array.from(byProvider.values());

  console.log(
    "ACTUAL research providers:",
    providers.map((provider) => ({
      id: provider.id,
      items: provider.items.length,
    })),
  );

  return providers;

  return Array.from(byProvider.values());
}
