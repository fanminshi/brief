import { NextRequest, NextResponse } from "next/server";
import OpenAI from "openai";

// InsForge AI gateway via OpenRouter
const openai = new OpenAI({
  baseURL: "https://openrouter.ai/api/v1",
  apiKey: process.env.OPENROUTER_API_KEY,
});

export async function POST(req: NextRequest) {
  const { messages, threadContext, user } = await req.json();

  const threadMessages = (threadContext?.messages ?? [])
    .map((m: { author: string; text: string }) => `${m.author}: ${m.text}`)
    .join("\n");

  const systemPrompt = [
    `You are a workplace communication assistant for ${user?.name ?? "the user"}.`,
    ``,
    `About the user:`,
    `- Name: ${user?.name ?? "Unknown"}`,
    `- Role: ${user?.role ?? "Team member"}`,
    `- Any message they send to the thread will appear as coming from ${user?.name ?? "them"}.`,
    `- If a thread mentions them by name, they are the one being asked.`,
    `- If they have authority to approve something (a rollback, a launch, a PR), they can do so directly.`,
    ``,
    `Current thread: ${threadContext?.title ?? ""} in #${threadContext?.channel ?? ""}`,
    `Recent messages:`,
    threadMessages,
    ``,
    `Rules:`,
    `- Have a natural conversation. Answer questions, summarize, give context — just talk.`,
    `- No markdown. No asterisks, bullet dashes, or headers.`,
    `- When the user makes a clear decision or gives approval ("let's rollback", "approve it", "ship it", "go ahead", "tell them X"), immediately output a DRAFT — don't confirm first, just draft it.`,
    `- Only skip drafting if the user is asking a question or requesting information.`,
    `- When drafting, put the reply on its own line starting with exactly "DRAFT:" followed by the message text.`,
    `- Keep responses to 1-2 sentences max. Be direct, skip preamble.`,
    `- Always end with what the user should do next or offer to draft a reply. Never just summarize without a next action.`,
    ``,
    `Delegation rules:`,
    `- Team members you can delegate to: Alice, Bob, Carol, Dan, Eve, Sarah, Mike, Jenny, Tom, Frank.`,
    `- If the user asks a question you can't answer from the thread context, offer to ask a specific person. Example: "I don't see that in the thread — want me to ask Carol?"`,
    `- When the user agrees to delegate (says "yes", "sure", "ask them", "go ahead", "ask [person]"), output on its own line: DELEGATE:[person]:[the question to ask them]`,
    `- The DELEGATE line must be the last line of your response.`,
  ].join("\n");

  const response = await openai.chat.completions.create({
    model: process.env.OPENROUTER_CHAT_MODEL ?? "openai/gpt-4o-mini",
    max_completion_tokens: 10000,
    messages: [
      { role: "system", content: systemPrompt },
      ...messages,
    ],
  });

  const content = response.choices[0]?.message?.content ?? "";

  const draftMatch = content.match(/^DRAFT:\s*(.+)$/m);
  const suggestedReply = draftMatch ? draftMatch[1].trim() : null;

  const delegateMatch = content.match(/^DELEGATE:\s*([^:]+):\s*(.+)$/m);
  const delegate = delegateMatch
    ? { person: delegateMatch[1].trim(), question: delegateMatch[2].trim() }
    : null;

  const displayText = content
    .replace(/^DRAFT:.*$/m, "")
    .replace(/^DELEGATE:.*$/m, "")
    .replace(/\*\*(.+?)\*\*/g, "$1")
    .replace(/\*(.+?)\*/g, "$1")
    .trim();

  return NextResponse.json({ text: displayText || "", suggestedReply, delegate });
}
