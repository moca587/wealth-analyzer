import type { Proposal } from "@/lib/orders/proposal";

export async function saveProposal(proposal: Proposal) {
  const response = await fetch("/api/proposal", {
    method: "PUT",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(proposal),
  });

  const data = await response.json().catch(() => null);

  if (!response.ok) {
    throw new Error(data?.error ?? "Could not save proposal.");
  }

  return data;
}
