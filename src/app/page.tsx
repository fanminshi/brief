"use client"

import { useState, useEffect, useCallback } from "react"
import { CheckCircle2 } from "lucide-react"
import CenterPanel from "@/components/CenterPanel"
import RightSidebar from "@/components/RightSidebar"
import LeftNav from "@/components/LeftNav"
import {
  mentionThreads,
  focusItems as initialFocusItems,
  waitingItems as initialWaitingItems,
  archiveItems as initialArchiveItems,
} from "@/lib/data"
import type { ChatEntry, MentionThread, FocusItem, WaitingItem, ArchiveItem, DraftSafety, Message } from "@/lib/types"

type RightTab = "ask" | "focus" | "waiting" | "archive"

function isQuestion(input: string): boolean {
  const t = input.toLowerCase().trim()
  return (
    t.endsWith("?") ||
    /^(what|who|when|did|is|are|was|were|has|have|can|should|why|how|where|which|find|search|tell me|show me|look up)/.test(t)
  )
}

export default function Home() {
  const [activeChannel, setActiveChannel] = useState("eval-infra")
  const [threads, setThreads] = useState<MentionThread[]>(mentionThreads)
  const [chatHistory, setChatHistory] = useState<ChatEntry[]>([])
  const [chatInput, setChatInput] = useState("")
  const [selectedMode, setSelectedMode] = useState("Answer clearly")
  const [isThinking, setIsThinking] = useState(false)
  const [toast, setToast] = useState<string | null>(null)
  const [activeRightTab, setActiveRightTab] = useState<RightTab>("ask")
  const [focusItems, setFocusItems] = useState<FocusItem[]>(initialFocusItems)
  const [waitingItems, setWaitingItems] = useState<WaitingItem[]>(initialWaitingItems)
  const [archiveItems, setArchiveItems] = useState<ArchiveItem[]>(initialArchiveItems)

  const selectedThread = threads.find((t) => t.channel === activeChannel) ?? threads[0]

  // Seed DB on first load (no-op if already seeded)
  useEffect(() => {
    fetch("/api/seed", { method: "POST" }).catch(() => {})
  }, [])

  const handleNewMessage = useCallback((msg: Message) => {
    setThreads((prev) =>
      prev.map((t) =>
        t.channel === activeChannel ? { ...t, messages: [...t.messages, msg] } : t
      )
    )
  }, [activeChannel])

  function handleChannelChange(ch: string) {
    setActiveChannel(ch)
    setThreads((prev) => prev.map((t) => (t.channel === ch ? { ...t, isUnread: false } : t)))
  }

  async function handleSendWithInput(input: string) {
    if (!input.trim() || isThinking) return
    const entryId = String(Date.now())
    setChatHistory((prev) => [...prev, { id: entryId + "-u", role: "user", text: input }])
    setIsThinking(true)
    try {
      // Build messages array for the API (all prior turns)
      const priorMessages = chatHistory
        .filter((e) => e.role === "user" || (e.role === "assistant" && (e.type === "chat" || e.type === "memory")))
        .map((e) => {
          if (e.role === "user") return { role: "user" as const, content: e.text }
          if (e.role === "assistant" && e.type === "chat") return { role: "assistant" as const, content: e.text }
          if (e.role === "assistant" && e.type === "memory") return { role: "assistant" as const, content: e.answer }
          return null
        })
        .filter((msg): msg is { role: "user" | "assistant"; content: string } =>
          msg !== null && typeof msg.content === "string" && msg.content.trim() !== ""
        )

      const res = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          messages: [...priorMessages, { role: "user", content: input }],
          threadContext: {
            channel: selectedThread.channel,
            title: selectedThread.threadTitle,
            messages: selectedThread.messages,
          },
          user: {
            name: "Fanmin",
            role: "On-call team lead, TL for eval-infra and platform",
          },
        }),
      })
      if (!res.ok) throw new Error(await res.text())
      const result = await res.json()

      // Handle delegation
      if (result.delegate) {
        const { person, question } = result.delegate

        // Deduplicate — skip if already waiting on same person+question
        setWaitingItems((prev) => {
          const already = prev.some(
            (w) => w.person === person && w.question === question && w.status === "waiting"
          )
          if (already) return prev

          // Send a proxy message into the person's DM thread
          const proxyText = `🤖 Fanmin's assistant is asking on their behalf: ${question}`
          fetch("/api/messages", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              channel: person,
              author: "Fanmin's Assistant",
              text: proxyText,
              timestamp_label: new Intl.DateTimeFormat("en-US", { hour: "numeric", minute: "2-digit", hour12: true }).format(new Date()),
            }),
          }).catch(() => {})

          // Also show the message in the local DM thread so it's visible
          setThreads((t) =>
            t.map((thread) =>
              thread.channel === person
                ? {
                    ...thread,
                    messages: [
                      ...thread.messages,
                      {
                        id: "proxy-" + String(Date.now()),
                        author: "Fanmin's Assistant",
                        text: proxyText,
                        timestamp: new Intl.DateTimeFormat("en-US", { hour: "numeric", minute: "2-digit", hour12: true }).format(new Date()),
                      },
                    ],
                  }
                : thread
            )
          )

          const newWaiting: WaitingItem = {
            id: "w-" + String(Date.now()),
            person,
            question,
            originalReason: `You asked in #${selectedThread.channel}: ${input}`,
            status: "waiting",
            sentAt: "Just now",
          }
          setActiveRightTab("waiting")
          return [newWaiting, ...prev]
        })
      }

      setChatHistory((prev) => [
        ...prev,
        {
          id: entryId + "-a",
          role: "assistant",
          type: "chat",
          text: result.text,
          suggestedReply: result.suggestedReply ?? undefined,
          targetChannel: selectedThread.channel,
        },
      ])
    } catch (err) {
      const msg = err instanceof Error ? err.message : "Unknown error"
      setChatHistory((prev) => [
        ...prev,
        { id: entryId + "-a", role: "assistant", type: "chat", text: `Error: ${msg}` },
      ])
    } finally {
      setIsThinking(false)
    }
  }

  async function handleSend() {
    const input = chatInput.trim()
    if (!input) return
    setChatInput("")
    await handleSendWithInput(input)
  }

  function handleAIAssist(draft: string) {
    const intent = `Review and improve this draft reply for the current thread. Keep my intent but make it clearer, more grounded in team context, and flag any potential misinterpretations:\n\n"${draft}"`
    handleSendWithInput(intent)
  }

  function handleRegenerate() {
    const lastUserEntry = [...chatHistory].reverse().find((e) => e.role === "user")
    if (lastUserEntry && lastUserEntry.role === "user") {
      handleSendWithInput(lastUserEntry.text)
    }
  }

  function handleUpdateFinalReply(id: string, text: string) {
    setChatHistory((prev) =>
      prev.map((entry) =>
        entry.id === id && entry.role === "assistant" && entry.type === "reply"
          ? { ...entry, finalReply: text }
          : entry
      )
    )
  }

  function handleSendReply(text: string, channel?: string) {
    if (!text.trim()) return
    const targetChannel = channel ?? activeChannel
    const time = new Intl.DateTimeFormat("en-US", { hour: "numeric", minute: "2-digit", hour12: true }).format(new Date())

    // Persist to DB (realtime will broadcast to all subscribers)
    fetch("/api/messages", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ channel: targetChannel, author: "Fanmin", text, timestamp_label: time }),
    }).catch(() => {})

    // Optimistic local update
    setThreads((prev) =>
      prev.map((t) =>
        t.channel === targetChannel
          ? {
              ...t,
              messages: [...t.messages, { id: "reply-" + String(Date.now()), author: "Fanmin", text, timestamp: time }],
              threadBrief: { ...t.threadBrief, latest_update: "Fanmin replied · " + time },
            }
          : t
      )
    )

    // Resolve focus items for this thread
    setFocusItems((prev) => {
      const resolved = prev.filter((i) => i.channel === targetChannel)
      if (resolved.length > 0) {
        setArchiveItems((arch) => [
          ...resolved.map((i) => ({
            id: "arch-resolved-" + i.id,
            originalType: i.type,
            summary: i.summary,
            resolvedAt: "Just now",
            channel: i.channel,
            person: i.person,
          })),
          ...arch,
        ])
      }
      return prev.filter((i) => i.channel !== targetChannel)
    })

    if (targetChannel !== activeChannel) {
      handleChannelChange(targetChannel)
    }
    setToast("Reply sent to #" + targetChannel)
    setTimeout(() => setToast(null), 3000)
  }

  function handleViewTranscript(person: string) {
    handleChannelChange(person)
  }

  function handleFocusDraftReply(item: FocusItem) {
    handleChannelChange(item.channel)
    setActiveRightTab("ask")
    // Show context in the AI chat so user knows what thread they're replying to
    const contextId = "ctx-" + item.id
    setChatHistory((prev) => {
      const alreadyHasCtx = prev.some((e) => e.id === contextId)
      if (alreadyHasCtx) return prev
      return [
        ...prev,
        {
          id: contextId,
          role: "assistant",
          type: "notification",
          text: `#${item.channel} · ${item.type.replace(/_/g, " ")} from ${item.person}\n${item.summary}`,
        },
      ]
    })
  }

  function handleFocusOpen(channel: string) {
    handleChannelChange(channel)
  }

  function handleFocusDismiss(id: string) {
    const item = focusItems.find((i) => i.id === id)
    if (item) {
      setArchiveItems((prev) => [
        {
          id: "arch-" + id,
          originalType: item.type,
          summary: item.summary,
          resolvedAt: "Just now",
          channel: item.channel,
          person: item.person,
        },
        ...prev,
      ])
    }
    setFocusItems((prev) => prev.filter((i) => i.id !== id))
  }

  function handleRestoreToFocus(id: string) {
    const item = archiveItems.find((a) => a.id === id)
    if (item) {
      const restored: FocusItem = {
        id: "restored-" + id,
        type: item.originalType as FocusItem["type"],
        state: "needs_response",
        channel: item.channel,
        isDM: false,
        person: item.person,
        summary: item.summary,
        whyShown: ["Restored from Archive"],
        suggestedAction: "Draft reply",
        sourceTimestamp: item.resolvedAt,
        confidence: "medium",
      }
      setFocusItems((prev) => [restored, ...prev])
      setArchiveItems((prev) => prev.filter((a) => a.id !== id))
    }
  }

  function handleFocusSnooze(id: string) {
    setFocusItems((prev) =>
      prev.map((i) =>
        i.id === id
          ? { ...i, state: i.state === "snoozed" ? ("needs_response" as const) : ("snoozed" as const) }
          : i
      )
    )
  }

  function handleFocusDelegate(item: FocusItem, person: string) {
    const newWaiting: WaitingItem = {
      id: "waiting-" + String(Date.now()),
      person,
      question: `Can you help with: ${item.summary}`,
      originalReason: `Delegated from Focus — ${item.type.replace(/_/g, " ")}`,
      status: "waiting",
      sentAt: "Just now",
    }
    setWaitingItems((prev) => [newWaiting, ...prev])
    setFocusItems((prev) => prev.filter((i) => i.id !== item.id))
    setActiveRightTab("waiting")
  }

  function handleWaitingNudge(id: string) {
    setToast("Nudge sent")
    setTimeout(() => setToast(null), 3000)
    // suppress unused-id lint — id kept for future targeted nudge logic
    void id
  }

  function handleWaitingCancel(id: string) {
    setWaitingItems((prev) =>
      prev.map((w) => (w.id === id ? { ...w, status: "cancelled" as const } : w))
    )
  }

  function handleRestoreToWaiting(id: string) {
    const item = archiveItems.find((a) => a.id === id)
    if (item) {
      const newWaiting: WaitingItem = {
        id: "waiting-" + id,
        person: item.person,
        question: `Follow up on: ${item.summary}`,
        originalReason: `Restored from Archive — ${item.originalType.replace(/_/g, " ")}`,
        status: "waiting",
        sentAt: "Just now",
      }
      setWaitingItems((prev) => [newWaiting, ...prev])
      setArchiveItems((prev) => prev.filter((a) => a.id !== id))
    }
  }

  function handleWaitingClose(id: string) {
    setWaitingItems((prev) =>
      prev.map((w) => (w.id === id ? { ...w, status: "closed" as const } : w))
    )
  }

  return (
    <main className="flex h-screen bg-slate-950 overflow-hidden">
      <div className="w-56 flex-shrink-0">
        <LeftNav activeChannel={activeChannel} onChannelChange={handleChannelChange} />
      </div>
      <div className="flex-1 min-w-0 border-x border-slate-800/50">
        <CenterPanel
          channel={selectedThread.channel}
          threadTitle={selectedThread.threadTitle}
          messages={selectedThread.messages}
          threadBrief={selectedThread.threadBrief}
          onNewMessage={handleNewMessage}
        />
      </div>
      <div className="w-[440px] flex-shrink-0">
        <RightSidebar
          activeTab={activeRightTab}
          onTabChange={setActiveRightTab}
          chatHistory={chatHistory}
          chatInput={chatInput}
          onChatInputChange={setChatInput}
          isThinking={isThinking}
          onSend={handleSend}
          onSendReply={handleSendReply}
          onUpdateFinalReply={handleUpdateFinalReply}
          focusItems={focusItems}
          onFocusDismiss={handleFocusDismiss}
          onFocusDraftReply={handleFocusDraftReply}
          onFocusOpen={handleFocusOpen}
          onFocusSnooze={handleFocusSnooze}
          onFocusDelegate={handleFocusDelegate}
          waitingItems={waitingItems}
          onWaitingClose={handleWaitingClose}
          onWaitingNudge={handleWaitingNudge}
          onWaitingCancel={handleWaitingCancel}
          onViewTranscript={handleViewTranscript}
          archiveItems={archiveItems}
          onRestoreToFocus={handleRestoreToFocus}
          onRestoreToWaiting={handleRestoreToWaiting}
        />
      </div>

      {toast && (
        <div className="fixed bottom-6 right-6 bg-emerald-600 text-white px-4 py-3 rounded-xl shadow-xl flex items-center gap-2 z-50">
          <CheckCircle2 size={16} />
          <span className="text-sm font-medium">{toast}</span>
        </div>
      )}
    </main>
  )
}
