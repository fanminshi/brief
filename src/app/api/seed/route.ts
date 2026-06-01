import { NextRequest, NextResponse } from "next/server";
import { insforgeAdmin } from "@/lib/insforgeAdmin";
import { mentionThreads, focusItems, waitingItems, archiveItems } from "@/lib/data";

export async function POST(_req: NextRequest) {
  // Check if already seeded
  const { data: existing } = await insforgeAdmin.database
    .from("threads")
    .select("channel")
    .limit(1);

  if (existing && existing.length > 0) {
    return NextResponse.json({ seeded: false, message: "Already seeded" });
  }

  // Seed threads
  const threadRows = mentionThreads.map((t) => ({
    channel: t.channel,
    title: t.threadTitle,
    brief_question: t.threadBrief.main_question,
    brief_confusion: t.threadBrief.current_confusion,
    brief_decision: t.threadBrief.prior_decision,
    brief_open_question: t.threadBrief.open_question,
    brief_latest_update: t.threadBrief.latest_update ?? null,
    is_active: t.isActive,
    is_unread: t.isUnread,
    mentioned_by: t.mentionedBy,
    mention_snippet: t.mentionSnippet,
    relative_time: t.relativeTime,
  }));

  const { error: threadError } = await insforgeAdmin.database
    .from("threads")
    .insert(threadRows);

  if (threadError) {
    return NextResponse.json({ error: threadError.message }, { status: 500 });
  }

  // Seed messages for each thread
  const messageRows = mentionThreads.flatMap((t) =>
    t.messages.map((m) => ({
      thread_channel: t.channel,
      author: m.author,
      text: m.text,
      timestamp_label: m.timestamp,
    }))
  );

  const { error: msgError } = await insforgeAdmin.database
    .from("messages")
    .insert(messageRows);

  if (msgError) {
    return NextResponse.json({ error: msgError.message }, { status: 500 });
  }

  // Seed focus items
  const focusRows = focusItems.map((f) => ({
    id: f.id,
    type: f.type,
    state: f.state,
    channel: f.channel,
    is_dm: f.isDM,
    person: f.person,
    summary: f.summary,
    why_shown: f.whyShown,
    suggested_action: f.suggestedAction,
    source_timestamp: f.sourceTimestamp,
    confidence: f.confidence,
  }));

  await insforgeAdmin.database.from("focus_items").insert(focusRows);

  // Seed waiting items
  const waitingRows = waitingItems.map((w) => ({
    id: w.id,
    person: w.person,
    question: w.question,
    original_reason: w.originalReason,
    status: w.status,
    sent_at: w.sentAt,
    answer: w.answer ?? null,
  }));

  await insforgeAdmin.database.from("waiting_items").insert(waitingRows);

  // Seed archive items
  const archiveRows = archiveItems.map((a) => ({
    id: a.id,
    original_type: a.originalType,
    summary: a.summary,
    resolved_at: a.resolvedAt,
    channel: a.channel,
    person: a.person,
  }));

  await insforgeAdmin.database.from("archive_items").insert(archiveRows);

  return NextResponse.json({ seeded: true, threads: threadRows.length, messages: messageRows.length });
}
