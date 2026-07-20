import { NextResponse } from "next/server";

const disabled = () =>
  NextResponse.json(
    { error: "feature_unavailable" },
    {
      status: 410,
      headers: { "Cache-Control": "no-store" },
    },
  );

export const GET = disabled;
export const POST = disabled;
