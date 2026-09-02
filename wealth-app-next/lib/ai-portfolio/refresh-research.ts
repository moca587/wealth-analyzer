import { createClient } from "@/lib/supabase/server";

import { fetchFidelityResearch } from "@/lib/ai-portfolio/research-sources/fidelity";
import { fetchBlackRockResearch } from "@/lib/ai-portfolio/research-sources/blackrock";
import { fetchJpmorganResearch } from "@/lib/ai-portfolio/research-sources/jpmorgan";
import { fetchSchwabResearch } from "@/lib/ai-portfolio/research-sources/schwab";
import { fetchVanguardResearch } from "@/lib/ai-portfolio/research-sources/vanguard";
import { fetchCapitalGroupResearch } from "@/lib/ai-portfolio/research-sources/capital-group";
import { fetchFranklinResearch } from "@/lib/ai-portfolio/research-sources/franklin";
import { fetchNuveenResearch } from "@/lib/ai-portfolio/research-sources/nuveen";

export async function refreshResearch() {
  const [fidelityItems, blackRockItems, schwabItems, nuveenItems] =
    await Promise.all([
      fetchFidelityResearch(),
      fetchBlackRockResearch(),
      fetchSchwabResearch(),
      fetchNuveenResearch(),
    ]);

  const items = [
    ...fidelityItems,
    ...blackRockItems,
    ...schwabItems,
    ...nuveenItems,
  ];
  if (items.length === 0) {
    return {
      count: 0,
    };
  }

  const supabase = await createClient();

  // transform every item into the format the database expects
  const rows = items.map((item) => ({
    provider: item.provider,
    source_id: item.sourceId,
    title: item.title,
    summary: item.summary,
    source_url: item.sourceUrl,
    published_at: item.publishedAt,
    enabled: true,
    shared: false,
    updated_at: new Date().toISOString(),
  }));

  // persist
  const { error } = await supabase.from("institutional_research").upsert(rows, {
    onConflict: "provider,source_id",
  });

  if (error) {
    throw new Error(`Could not refresh research: ${error.message}`);
  }

  return {
    count: rows.length,
  };
}
