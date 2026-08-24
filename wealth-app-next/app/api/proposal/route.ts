import { NextResponse } from "next/server"; // for returning HTTP responses

import { createClient } from "@/lib/supabase/server";
import { resolveHousehold } from "@/lib/tenancy/context";

import { proposalSchema } from "@/lib/proposal/schema";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser(); // who is currently logged in

  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const hh = await resolveHousehold(supabase, request);

  if (!hh.ok) {
    return NextResponse.json(
      {
        error: hh.error,
        code: hh.code,
        households: hh.households,
      },
      { status: hh.status },
    );
  }

  const { data, error } = await supabase
    .from("proposals")
    .select("proposal") // column contains the actual Proposal object as JSONB
    .eq("household_id", hh.household.id)
    .maybeSingle();

  if (error) {
    console.error(error);

    return NextResponse.json(
      { error: "Could not load proposal." },
      { status: 500 },
    );
  }

  // if the proposal exists, return it, otherwise return null
  return NextResponse.json({
    proposal: data?.proposal ?? null,
  });
}

export async function PUT(request: Request) {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const hh = await resolveHousehold(supabase, request);

  if (!hh.ok) {
    return NextResponse.json(
      {
        error: hh.error,
        code: hh.code,
        households: hh.households,
      },
      { status: hh.status },
    );
  }

  let body: unknown;

  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  const parsed = proposalSchema.safeParse(body);

  if (!parsed.success) {
    return NextResponse.json(
      {
        error: "Invalid proposal",
        fieldErrors: parsed.error.flatten(),
      },
      { status: 400 },
    );
  }

  const proposal = parsed.data;

  // insert new row or update row
  const { error } = await supabase.from("proposals").upsert(
    {
      household_id: hh.household.id,

      org_id: hh.household.orgId,

      created_by: user.id,

      proposal,

      updated_at: new Date().toISOString(),
    },
    {
      onConflict: "household_id",
    },
  );

  if (error) {
    console.error(error);

    return NextResponse.json(
      { error: "Could not save proposal." },
      { status: 500 },
    );
  }

  return NextResponse.json({
    ok: true,
  });
}
