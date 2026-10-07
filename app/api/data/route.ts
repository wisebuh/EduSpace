import { NextResponse } from "next/server";
import { getPlatformData, updatePlatformData } from "@/lib/mock-data";

export async function GET() {
  return NextResponse.json(getPlatformData());
}

export async function PUT(request: Request) {
  try {
    const body = await request.json();
    const updated = updatePlatformData(body);
    return NextResponse.json(updated);
  } catch {
    return NextResponse.json({ error: "Invalid payload" }, { status: 400 });
  }
}
