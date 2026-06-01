import { NextRequest, NextResponse } from "next/server";
import { ensureVectorStoreInitialized, searchMemory } from "@/lib/vectorStore";
import { AskMemoryResult } from "@/lib/types";

export async function POST(req: NextRequest) {
  const { query } = await req.json();

  await ensureVectorStoreInitialized();
  const chunks = await searchMemory(query || "", 3);

  const memoryText = chunks
    .map((chunk, i) => `[${i + 1}] ${JSON.stringify(chunk)}`)
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
          "You are an AI memory search assistant. Answer using only retrieved memory chunks. Output valid JSON only. No markdown, no code fences — raw JSON only.",
      },
      {
        role: "user",
        content:
          `Question: ${query}\n\nRetrieved memory chunks:\n${memoryText}\n\n` +
          `Respond with a JSON object containing:\n` +
          `- "answer": a string answering the question\n` +
          `- "sources": an array of objects, each with "type", "title", "date", "summary", and "score" fields`,
      },
    ],
  });

  const text = response.choices[0]?.message?.content;
  if (!text) {
    return NextResponse.json({ error: "No response from model" }, { status: 500 });
  }

  const result = JSON.parse(text) as AskMemoryResult;
  return NextResponse.json(result);
}
