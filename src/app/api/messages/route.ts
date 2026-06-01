import { NextRequest, NextResponse } from "next/server";
import { insforgeAdmin } from "@/lib/insforgeAdmin";

export async function POST(req: NextRequest) {
  const { channel, author, text, timestamp_label } = await req.json();

  if (!channel || !author || !text) {
    return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
  }

  // Insert message — DB trigger auto-publishes to realtime channel
  const { data, error } = await insforgeAdmin.database
    .from("messages")
    .insert([{ thread_channel: channel, author, text, timestamp_label }])
    .select()
    .single();

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ ok: true, message: data });
}
