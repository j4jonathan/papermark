// Force dynamic rendering for this route
export const dynamic = 'force-dynamic';
export const runtime = "edge";

import { NextResponse } from "next/server";

import { getFeatureFlags } from "@/lib/featureFlags";

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const teamId = searchParams.get("teamId");

  try {
    const features = await getFeatureFlags({ teamId: teamId || undefined });
    return NextResponse.json(features);
  } catch (error) {
    console.error("Error fetching feature flags:", error);
    return NextResponse.json(
      { error: "Failed to fetch feature flags" },
      { status: 500 },
    );
  }
}
