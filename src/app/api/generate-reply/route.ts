import { NextRequest, NextResponse } from "next/server";
import { ensureVectorStoreInitialized, searchMemory } from "@/lib/vectorStore";
import { CompilationResult } from "@/lib/types";

export async function POST(req: NextRequest) {
  const body = await req.json();
  const { currentThread, userIntent, responseMode } = body;

  await ensureVectorStoreInitialized();

  const chunks = await searchMemory(
    (currentThread?.title || "") + " " + (userIntent || ""),
    3
  );

  const memoryText = chunks
    .map((result) => {
      if (result.type === "past_thread") {
        return `Past Thread: ${result.title} (${result.date ?? ""})\n${result.text}`;
      }
      return `Doc: ${result.title}\n${result.text}`;
    })
    .join("\n\n");

  const threadText = (currentThread?.messages ?? [])
    .map((m: { author: string; text: string }) => `${m.author}: ${m.text}`)
    .join("\n");

  const { default: OpenAI } = await import("openai");
  const client = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

  const response = await client.chat.completions.create({
    model: "gpt-5.4-mini",
    max_completion_tokens: 10000,
    response_format: { type: "json_object" },
    messages: [
      {
        role: "system",
        content:
          "You are an AI communication compiler for a workplace chat app. Parse intent, use retrieved memory, draft reply, check grounding, detect ambiguity. Output valid JSON only. No markdown, no code fences — raw JSON only.",
      },
      {
        role: "user",
        content:
          "Thread:\n" +
          threadText +
          "\n\nIntent:\n" +
          (userIntent || "") +
          "\n\nMode:\n" +
          (responseMode || "Answer clearly") +
          "\n\nMemory:\n" +
          memoryText +
          "\n\nReturn JSON with keys: intent_parsed.{summary,bullets[]}, retrieved_context[].{type,title,date,summary,reason_relevant,score}, draft_reply, verification.{grounded_in_context,clarity,misinterpretation_risk,grammar,missing_detail,suggested_follow_up}, misinterpretation_detection.{detected,explanation}, final_reply.",
      },
    ],
  });

  const text = response.choices[0]?.message?.content;
  if (!text) {
    return NextResponse.json({ error: "No response from model" }, { status: 500 });
  }

  const result = JSON.parse(text) as CompilationResult;
  return NextResponse.json(result);
}
