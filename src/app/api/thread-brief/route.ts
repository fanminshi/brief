import { NextResponse } from "next/server";
import { initialThreadBrief } from "@/lib/data";

export async function POST() {
  return NextResponse.json(initialThreadBrief);
}
