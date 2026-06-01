# Brief

An AI-powered team communication assistant that helps engineering leads stay on top of their inbox. Built at the Applied Intelligence Hackathon.

## What it does

Brief sits alongside your team's messaging threads and gives you an AI co-pilot for managing the noise:

- **Thread briefs** — summarizes the current state of a thread so you can catch up fast
- **AI chat assistant** — ask questions about a thread, get context-aware answers, or request a suggested reply
- **Smart delegation** — the AI can identify when a question should be routed to a teammate and sends a proxy message on your behalf
- **Focus queue** — surfaces threads that need your attention (mentions, decisions, blocked teammates)
- **Waiting tracker** — tracks things you've delegated and lets you nudge or cancel follow-ups
- **Memory search** — vector-based semantic search over past conversations using OpenAI embeddings
- **Realtime messages** — new messages appear live via InsForge realtime subscriptions

## Stack

- **Frontend:** Next.js 14, React, Tailwind CSS
- **AI:** Anthropic Claude (chat & reply generation), OpenAI (embeddings & memory search)
- **Backend:** InsForge (Postgres, realtime, edge functions)

## Getting started

1. Clone the repo and install dependencies:

```bash
npm install
```

2. Copy the example env file and fill in your keys:

```bash
cp .env.local.example .env.local
```

```
OPENAI_API_KEY=...
ANTHROPIC_API_KEY=...
```

3. Run the dev server:

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

## Project structure

```
src/
  app/
    api/
      chat/          # Main AI chat endpoint (Claude)
      ask-memory/    # Semantic memory search (OpenAI embeddings)
      generate-reply/# Draft reply generation
      messages/      # Persist & broadcast messages
      seed/          # Seed initial DB data
      thread-brief/  # Thread summary endpoint
  components/
    LeftNav          # Channel/DM sidebar
    CenterPanel      # Thread view with messages
    RightSidebar     # AI chat, Focus, Waiting, Archive tabs
  lib/
    vectorStore      # In-memory vector store with cosine similarity
    embeddings       # OpenAI embedding helpers
    chunkMemory      # Splits conversation history into searchable chunks
    insforgeClient   # InsForge browser client
    insforgeAdmin    # InsForge server-side client
    data             # Seed data for threads and focus items
    types            # Shared TypeScript types
```
