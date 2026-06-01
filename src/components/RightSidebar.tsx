"use client"

import { useRef, useEffect, useState } from "react"
import {
  Send,
  CheckCircle2,
  Loader2,
  RefreshCw,
  ArrowUp,
  ChevronDown,
  ChevronUp,
  ShieldAlert,
  Eye,
  EyeOff,
  FileText,
  MessageSquare,
  AlertTriangle,
  Sparkles,
  CornerUpLeft,
} from "lucide-react"
import clsx from "clsx"
import type {
  ChatEntry,
  FocusItem,
  WaitingItem,
  ArchiveItem,
  DraftSafety,
} from "@/lib/types"

type Tab = "ask" | "focus" | "waiting" | "archive"

interface RightSidebarProps {
  activeTab: Tab
  onTabChange: (tab: Tab) => void
  chatHistory: ChatEntry[]
  chatInput: string
  onChatInputChange: (v: string) => void
  isThinking: boolean
  onSend: () => void
  onSendReply: (text: string, channel?: string) => void
  onUpdateFinalReply: (id: string, text: string) => void
  focusItems: FocusItem[]
  onFocusDismiss: (id: string) => void
  onFocusDraftReply: (item: FocusItem) => void
  onFocusOpen: (channel: string) => void
  onFocusSnooze: (id: string) => void
  onFocusDelegate: (item: FocusItem, person: string) => void
  waitingItems: WaitingItem[]
  onWaitingClose: (id: string) => void
  onWaitingNudge: (id: string) => void
  onWaitingCancel: (id: string) => void
  onViewTranscript: (person: string) => void
  archiveItems: ArchiveItem[]
  onRestoreToFocus: (id: string) => void
  onRestoreToWaiting: (id: string) => void
}

const MODES: string[] = []

// ── Type badge helpers ──────────────────────────────────────────────────────

const TYPE_LABELS: Record<FocusItem["type"], string> = {
  needs_reply: "Needs reply",
  needs_decision: "Needs decision",
  blocked_on_you: "Blocked on you",
  follow_up_due: "Follow-up due",
  fyi: "FYI",
  decision_logged: "Decision logged",
  risk_detected: "Risk detected",
}

const TYPE_BADGE_CLASSES: Record<FocusItem["type"], string> = {
  needs_reply: "bg-blue-500/15 text-blue-400",
  needs_decision: "bg-violet-500/15 text-violet-400",
  blocked_on_you: "bg-rose-500/15 text-rose-400",
  follow_up_due: "bg-amber-500/15 text-amber-400",
  fyi: "bg-slate-500/15 text-slate-400",
  decision_logged: "bg-emerald-500/15 text-emerald-400",
  risk_detected: "bg-orange-500/15 text-orange-400",
}

const CONFIDENCE_DOT: Record<FocusItem["confidence"], string> = {
  high: "bg-emerald-500",
  medium: "bg-amber-500",
  low: "bg-rose-500",
}

const STATUS_BADGE: Record<WaitingItem["status"], string> = {
  asking: "bg-blue-500/15 text-blue-400",
  waiting: "bg-amber-500/15 text-amber-400",
  answered: "bg-emerald-500/15 text-emerald-400",
  needs_review: "bg-violet-500/15 text-violet-400",
  closed: "bg-slate-500/15 text-slate-400",
  cancelled: "bg-slate-500/15 text-slate-400",
}

// ── Draft Safety Strip ──────────────────────────────────────────────────────

function DraftSafetyStrip({ safety }: { safety: DraftSafety }) {
  const restricted = safety.sources.filter((s) => !s.visible)

  return (
    <div className="mt-2 space-y-1.5">
      {restricted.length > 0 && (
        <div className="flex items-start gap-1.5 bg-rose-500/10 border border-rose-500/20 rounded-lg px-3 py-2">
          <ShieldAlert size={12} className="text-rose-400 flex-shrink-0 mt-0.5" />
          <span className="text-rose-400 text-xs leading-relaxed">
            {restricted.length === 1
              ? `"${restricted[0].title}" is not visible to all recipients — remove or paraphrase before sending.`
              : `${restricted.length} sources are not visible to all recipients.`}
          </span>
        </div>
      )}
      <div className="bg-slate-900/80 border border-slate-800/50 rounded-lg px-3 py-2.5 space-y-2">
        <div className="flex items-center gap-2">
          <span className="text-slate-500 text-xs font-medium uppercase tracking-wider">Sources</span>
          <span className="text-slate-700 text-xs">·</span>
          <span
            className={clsx(
              "text-xs font-medium",
              safety.confidence === "high"
                ? "text-emerald-400"
                : safety.confidence === "medium"
                ? "text-amber-400"
                : "text-rose-400"
            )}
          >
            confidence {safety.confidence}
          </span>
          {safety.staleness && (
            <>
              <span className="text-slate-700 text-xs">·</span>
              <span className="text-amber-400 text-xs">{safety.staleness}</span>
            </>
          )}
        </div>
        {safety.sources.map((src, i) => (
          <div key={i} className="flex items-center gap-2">
            <span
              className={clsx(
                "inline-flex items-center gap-1 text-xs rounded px-1.5 py-0.5 flex-shrink-0",
                src.type === "thread" ? "bg-violet-500/15 text-violet-300" : "bg-cyan-500/15 text-cyan-300"
              )}
            >
              {src.type === "thread" ? <MessageSquare size={9} /> : <FileText size={9} />}
              {src.title}
            </span>
            <span className="ml-auto flex-shrink-0">
              {src.visible ? (
                <span className="flex items-center gap-1 text-xs text-emerald-400">
                  <Eye size={10} /> visible
                </span>
              ) : (
                <span className="flex items-center gap-1 text-xs text-rose-400">
                  <EyeOff size={10} /> restricted
                </span>
              )}
            </span>
          </div>
        ))}
        {safety.conflicts && (
          <div className="flex items-start gap-1.5 border-t border-slate-800/50 pt-2">
            <AlertTriangle size={12} className="text-amber-400 flex-shrink-0 mt-0.5" />
            <div className="min-w-0">
              <p className="text-amber-400 text-xs font-medium mb-0.5">Conflicting sources</p>
              <p className="text-amber-300/80 text-xs leading-relaxed">{safety.conflicts}</p>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}

// ── Ask Tab ─────────────────────────────────────────────────────────────────

function AskTab({
  chatHistory,
  chatInput,
  onChatInputChange,
  isThinking,
  onSend,
  onSendReply,
}: {
  chatHistory: ChatEntry[]
  chatInput: string
  onChatInputChange: (v: string) => void
  isThinking: boolean
  onSend: () => void
  onSendReply: (text: string, channel?: string) => void
}) {
  const bottomRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" })
  }, [chatHistory, isThinking])

  return (
    <div className="flex flex-col h-full">
      {/* Chat history */}
      <div className="flex-1 overflow-y-auto px-4 py-4 space-y-4 min-h-0">
        {chatHistory.length === 0 && (
          <div className="flex flex-col items-center justify-center h-full text-center gap-2 pb-8">
            <p className="text-slate-500 text-sm">Chat with AI to draft your reply.</p>
            <p className="text-slate-600 text-xs">When you agree on a message, send it to the thread.</p>
          </div>
        )}

        {chatHistory.map((entry) => {
          if (entry.role === "user") {
            return (
              <div key={entry.id} className="flex justify-end">
                <div className="bg-indigo-600/20 border border-indigo-500/20 rounded-2xl rounded-tr-sm px-3.5 py-2.5 max-w-[85%]">
                  <p className="text-slate-200 text-sm leading-relaxed">{entry.text}</p>
                </div>
              </div>
            )
          }

          if (entry.role === "assistant" && entry.type === "chat") {
            return (
              <div key={entry.id} className="space-y-2">
                {entry.text && (
                  <p className="text-slate-200 text-sm leading-relaxed">{entry.text}</p>
                )}
                {entry.suggestedReply && (
                  <div className="bg-slate-900/60 border border-indigo-500/20 rounded-xl p-3 space-y-2.5">
                    <div className="flex items-center justify-between">
                      <p className="text-xs text-indigo-300 font-medium flex items-center gap-1">
                        <Sparkles size={10} /> Suggested reply
                      </p>
                      {entry.targetChannel && (
                        <span className="text-xs text-slate-500">→ #{entry.targetChannel}</span>
                      )}
                    </div>
                    <p className="text-slate-200 text-sm leading-relaxed">{entry.suggestedReply}</p>
                    <button
                      onClick={() => onSendReply(entry.suggestedReply!, entry.targetChannel)}
                      className="w-full bg-indigo-600 hover:bg-indigo-500 text-white rounded-lg py-2 text-xs font-semibold flex items-center justify-center gap-1.5 transition-colors"
                    >
                      <Send size={11} />
                      Send to {entry.targetChannel ? `#${entry.targetChannel}` : "thread"}
                    </button>
                  </div>
                )}
              </div>
            )
          }

          if (entry.role === "assistant" && entry.type === "memory") {
            return (
              <div key={entry.id} className="space-y-2">
                <p className="text-slate-200 text-sm leading-relaxed">{entry.answer}</p>
                {entry.sources.length > 0 && (
                  <div className="space-y-1.5">
                    {entry.sources.map((src, i) => (
                      <div key={i} className="flex items-center gap-2">
                        <span className={clsx("text-xs rounded px-1.5 py-0.5 flex-shrink-0", src.type === "past_thread" ? "bg-violet-500/15 text-violet-400" : "bg-cyan-500/15 text-cyan-400")}>
                          {src.type === "past_thread" ? "thread" : "doc"}
                        </span>
                        <span className="text-slate-400 text-xs">{src.title}</span>
                        {src.date && <span className="text-slate-600 text-xs">{src.date}</span>}
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )
          }

          if (entry.role === "assistant" && entry.type === "reply") {
            return (
              <div key={entry.id} className="space-y-2">
                {entry.result.misinterpretation_detection.detected && (
                  <div className="bg-amber-500/10 border border-amber-500/20 rounded-lg p-3">
                    <p className="text-amber-400 text-xs font-medium mb-0.5">Possible misinterpretation</p>
                    <p className="text-amber-300/80 text-xs leading-relaxed">{entry.result.misinterpretation_detection.explanation}</p>
                  </div>
                )}
                <div className="bg-slate-900/60 border border-slate-800 rounded-xl p-4 space-y-3">
                  <p className="text-slate-200 text-sm leading-relaxed">{entry.finalReply}</p>
                  <DraftSafetyStrip safety={entry.draftSafety} />
                  <button
                    onClick={() => onSendReply(entry.finalReply)}
                    className="w-full bg-indigo-600 hover:bg-indigo-500 text-white rounded-lg py-2 text-xs font-semibold flex items-center justify-center gap-1.5 transition-colors"
                  >
                    <Send size={11} />
                    Send to thread
                  </button>
                </div>
              </div>
            )
          }

          return null
        })}

        {isThinking && (
          <div className="flex items-center gap-2 py-1">
            <Loader2 size={13} className="text-indigo-400 animate-spin" />
            <span className="text-slate-500 text-xs">Thinking…</span>
          </div>
        )}
        <div ref={bottomRef} />
      </div>

      {/* Input */}
      <div className="flex-shrink-0 border-t border-slate-800/50 p-3 flex items-end gap-2">
        <textarea
          value={chatInput}
          onChange={(e) => onChatInputChange(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter" && !e.shiftKey) {
              e.preventDefault()
              onSend()
            }
          }}
          rows={2}
          className="flex-1 bg-slate-900/60 border border-slate-800/50 rounded-xl text-slate-200 text-sm px-3.5 py-2.5 resize-none focus:outline-none focus:ring-1 focus:ring-indigo-500/40 placeholder-slate-600"
          placeholder="Talk to AI… ↵ to send"
        />
        <button
          onClick={onSend}
          disabled={isThinking || !chatInput.trim()}
          className="bg-indigo-600 hover:bg-indigo-500 disabled:bg-slate-800 disabled:text-slate-600 text-white rounded-xl p-2.5 transition-colors flex-shrink-0"
        >
          {isThinking ? <Loader2 size={16} className="animate-spin" /> : <ArrowUp size={16} />}
        </button>
      </div>
    </div>
  )
}

// ── Focus Tab ────────────────────────────────────────────────────────────────

const DELEGATE_PEOPLE = ["Alice", "Bob", "Carol", "Dan"]

const DELEGATE_AVATAR_COLORS: Record<string, string> = {
  Alice: "from-violet-500 to-purple-600",
  Bob: "from-blue-500 to-cyan-600",
  Carol: "from-rose-500 to-pink-600",
  Dan: "from-amber-500 to-orange-600",
}

function FocusTab({
  focusItems,
  onFocusDismiss,
  onFocusDraftReply,
  onFocusOpen,
  onFocusSnooze,
  onFocusDelegate,
}: {
  focusItems: FocusItem[]
  onFocusDismiss: (id: string) => void
  onFocusDraftReply: (item: FocusItem) => void
  onFocusOpen: (channel: string) => void
  onFocusSnooze: (id: string) => void
  onFocusDelegate: (item: FocusItem, person: string) => void
}) {
  const [expandedWhy, setExpandedWhy] = useState<Set<string>>(new Set())
  const [expandedDelegate, setExpandedDelegate] = useState<Set<string>>(new Set())
  const [showSnoozed, setShowSnoozed] = useState(false)

  function toggleWhy(id: string) {
    setExpandedWhy((prev) => {
      const next = new Set(prev)
      if (next.has(id)) next.delete(id)
      else next.add(id)
      return next
    })
  }

  function toggleDelegate(id: string) {
    setExpandedDelegate((prev) => {
      const next = new Set(prev)
      if (next.has(id)) next.delete(id)
      else next.add(id)
      return next
    })
  }

  const activeItems = focusItems.filter((i) => i.state !== "snoozed")
  const snoozedItems = focusItems.filter((i) => i.state === "snoozed")
  const visibleItems = showSnoozed ? focusItems : activeItems

  if (focusItems.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center h-full text-center pb-12 px-6">
        <CheckCircle2 size={24} className="text-emerald-500 mb-3" />
        <p className="text-slate-400 text-sm font-medium">You're all caught up</p>
        <p className="text-slate-600 text-xs mt-1">No items need your attention right now.</p>
      </div>
    )
  }

  if (activeItems.length === 0 && !showSnoozed) {
    return (
      <div className="flex flex-col items-center justify-center h-full text-center pb-12 px-6">
        <CheckCircle2 size={24} className="text-emerald-500 mb-3" />
        <p className="text-slate-400 text-sm font-medium">You're all caught up</p>
        <p className="text-slate-600 text-xs mt-1">No items need your attention right now.</p>
        {snoozedItems.length > 0 && (
          <button
            onClick={() => setShowSnoozed(true)}
            className="mt-3 text-xs text-slate-500 hover:text-slate-300 transition-colors underline underline-offset-2"
          >
            Show snoozed ({snoozedItems.length})
          </button>
        )}
      </div>
    )
  }

  return (
    <div className="flex flex-col flex-1 min-h-0">
      <div className="flex-1 overflow-y-auto px-3 py-3 space-y-2">
        {visibleItems.map((item) => {
          const isSnoozed = item.state === "snoozed"
          return (
            <div
              key={item.id}
              className={clsx(
                "bg-slate-900/60 border border-slate-800 rounded-xl p-4",
                isSnoozed && "opacity-50"
              )}
            >
              {/* Top row */}
              <div className="flex items-center gap-2 flex-wrap mb-1.5">
                <span className={clsx("text-xs font-medium rounded px-1.5 py-0.5 flex-shrink-0", TYPE_BADGE_CLASSES[item.type])}>
                  {TYPE_LABELS[item.type]}
                </span>
                <span className="text-slate-500 text-xs">#{item.channel}</span>
                <div className="ml-auto flex items-center gap-1.5">
                  <span className={clsx("w-1.5 h-1.5 rounded-full flex-shrink-0", CONFIDENCE_DOT[item.confidence])} />
                  <span className="text-slate-600 text-xs">{item.confidence}</span>
                </div>
              </div>

              {/* Person + time */}
              <div className="flex items-center gap-1.5 mb-2">
                <span className="text-slate-300 text-xs font-medium">{item.person}</span>
                <span className="text-slate-600 text-xs">·</span>
                <span className="text-slate-500 text-xs">{item.sourceTimestamp}</span>
              </div>

              {/* Summary */}
              <p className="text-slate-300 text-sm leading-relaxed mb-3">{item.summary}</p>

              {/* Why am I seeing this */}
              <div className="mb-3">
                <button
                  onClick={() => toggleWhy(item.id)}
                  className="flex items-center gap-1 text-xs text-slate-500 hover:text-slate-300 transition-colors"
                >
                  {expandedWhy.has(item.id) ? <ChevronUp size={12} /> : <ChevronDown size={12} />}
                  Why am I seeing this?
                </button>
                {expandedWhy.has(item.id) && (
                  <ul className="mt-2 space-y-1 pl-1">
                    {item.whyShown.map((reason, i) => (
                      <li key={i} className="flex items-start gap-1.5 text-xs text-slate-500">
                        <span className="text-slate-700 mt-0.5 flex-shrink-0">•</span>
                        {reason}
                      </li>
                    ))}
                  </ul>
                )}
              </div>

              {/* Delegate person picker */}
              {expandedDelegate.has(item.id) && (
                <div className="flex items-center gap-2 mb-3 flex-wrap">
                  <span className="text-xs text-slate-500">Delegate to:</span>
                  {DELEGATE_PEOPLE.map((person) => (
                    <button
                      key={person}
                      onClick={() => {
                        onFocusDelegate(item, person)
                        toggleDelegate(item.id)
                      }}
                      className={clsx(
                        "flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-medium text-white transition-opacity hover:opacity-90",
                        `bg-gradient-to-r ${DELEGATE_AVATAR_COLORS[person]}`
                      )}
                    >
                      <span className="w-3.5 h-3.5 rounded-full bg-white/20 flex items-center justify-center text-[10px] font-bold flex-shrink-0">
                        {person[0]}
                      </span>
                      {person}
                    </button>
                  ))}
                </div>
              )}

              {/* Actions */}
              <div className="flex items-center gap-2 flex-wrap">
                {!isSnoozed && (
                  <button
                    onClick={() => onFocusDraftReply(item)}
                    className="bg-indigo-600 hover:bg-indigo-500 text-white rounded-lg px-3 py-1.5 text-xs font-semibold transition-colors flex-shrink-0"
                  >
                    {item.suggestedAction}
                  </button>
                )}
                <button
                  onClick={() => onFocusOpen(item.channel)}
                  className="bg-slate-800/80 hover:bg-slate-800 text-slate-400 hover:text-slate-200 rounded-lg px-2.5 py-1.5 text-xs transition-colors"
                >
                  Open
                </button>
                {isSnoozed ? (
                  <button
                    onClick={() => onFocusSnooze(item.id)}
                    className="bg-slate-800/80 hover:bg-slate-800 text-indigo-400 hover:text-indigo-200 rounded-lg px-2.5 py-1.5 text-xs transition-colors"
                  >
                    Unsnooze
                  </button>
                ) : (
                  <button
                    onClick={() => onFocusSnooze(item.id)}
                    className="bg-slate-800/80 hover:bg-slate-800 text-slate-400 hover:text-slate-200 rounded-lg px-2.5 py-1.5 text-xs transition-colors"
                  >
                    Snooze
                  </button>
                )}
                {!isSnoozed && (
                  <button
                    onClick={() => toggleDelegate(item.id)}
                    className={clsx(
                      "bg-slate-800/80 hover:bg-slate-800 rounded-lg px-2.5 py-1.5 text-xs transition-colors",
                      expandedDelegate.has(item.id)
                        ? "text-indigo-400 hover:text-indigo-200"
                        : "text-slate-400 hover:text-slate-200"
                    )}
                  >
                    Delegate
                  </button>
                )}
                <button
                  onClick={() => onFocusDismiss(item.id)}
                  className="bg-slate-800/80 hover:bg-slate-800 text-slate-400 hover:text-slate-200 rounded-lg px-2.5 py-1.5 text-xs transition-colors ml-auto"
                >
                  Dismiss
                </button>
              </div>
            </div>
          )
        })}
      </div>
      {snoozedItems.length > 0 && (
        <div className="flex-shrink-0 border-t border-slate-800/50 px-4 py-2.5 text-center">
          <button
            onClick={() => setShowSnoozed((v) => !v)}
            className="text-xs text-slate-500 hover:text-slate-300 transition-colors underline underline-offset-2"
          >
            {showSnoozed ? "Hide snoozed" : `Show snoozed (${snoozedItems.length})`}
          </button>
        </div>
      )}
    </div>
  )
}

// ── Waiting Tab ──────────────────────────────────────────────────────────────

function WaitingTab({
  waitingItems,
  onWaitingClose,
  onWaitingNudge,
  onWaitingCancel,
  onViewTranscript,
}: {
  waitingItems: WaitingItem[]
  onWaitingClose: (id: string) => void
  onWaitingNudge: (id: string) => void
  onWaitingCancel: (id: string) => void
  onViewTranscript: (person: string) => void
}) {
  const active = waitingItems.filter((i) => i.status !== "cancelled" && i.status !== "closed")

  if (active.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center h-full text-center pb-12 px-6">
        <CheckCircle2 size={24} className="text-emerald-500 mb-3" />
        <p className="text-slate-400 text-sm font-medium">Nothing waiting</p>
        <p className="text-slate-600 text-xs mt-1">No outstanding questions or follow-ups.</p>
      </div>
    )
  }

  return (
    <div className="flex-1 overflow-y-auto px-3 py-3 space-y-2">
      {active.map((item) => (
        <div key={item.id} className="bg-slate-900/60 border border-slate-800 rounded-xl p-4">
          {/* Person + status */}
          <div className="flex items-center gap-2 mb-2">
            <span className="text-slate-200 text-xs font-semibold">{item.person}</span>
            <span className={clsx("text-xs rounded px-1.5 py-0.5 font-medium", STATUS_BADGE[item.status])}>
              {item.status.replace("_", " ")}
            </span>
            <span className="text-slate-600 text-xs ml-auto">{item.sentAt}</span>
          </div>

          {/* Question */}
          <p className="text-slate-300 text-sm leading-relaxed mb-1">{item.question}</p>

          {/* Original reason */}
          <p className="text-slate-500 text-xs leading-relaxed mb-3">{item.originalReason}</p>

          {/* Answer */}
          {item.status === "answered" && item.answer && (
            <div className="bg-emerald-500/10 border border-emerald-500/20 rounded-lg p-3 mb-3">
              <p className="text-emerald-400 text-xs font-medium mb-1">Answer received</p>
              <p className="text-emerald-300/80 text-xs leading-relaxed">{item.answer}</p>
            </div>
          )}

          {/* Actions */}
          <div className="flex items-center gap-2">
            <button
              onClick={() => onViewTranscript(item.person)}
              className="bg-slate-800/80 hover:bg-slate-800 text-slate-400 hover:text-slate-200 rounded-lg px-2.5 py-1.5 text-xs transition-colors"
            >
              View DM
            </button>
            {item.status === "waiting" && (
              <button
                onClick={() => onWaitingNudge(item.id)}
                className="bg-slate-800/80 hover:bg-slate-800 text-slate-400 hover:text-slate-200 rounded-lg px-2.5 py-1.5 text-xs transition-colors"
              >
                Nudge
              </button>
            )}
            {item.status === "answered" && (
              <button
                onClick={() => onWaitingClose(item.id)}
                className="bg-emerald-600 hover:bg-emerald-500 text-white rounded-lg px-2.5 py-1.5 text-xs font-medium transition-colors"
              >
                Mark done
              </button>
            )}
            <button
              onClick={() => onWaitingCancel(item.id)}
              className="bg-slate-800/80 hover:bg-slate-800 text-slate-400 hover:text-slate-200 rounded-lg px-2.5 py-1.5 text-xs transition-colors ml-auto"
            >
              Cancel
            </button>
          </div>
        </div>
      ))}
    </div>
  )
}

// ── Archive Tab ──────────────────────────────────────────────────────────────

type ArchiveFilter = "all" | "threads" | "decisions" | "dismissed"

function ArchiveTab({
  archiveItems,
  onRestoreToFocus,
  onRestoreToWaiting,
}: {
  archiveItems: ArchiveItem[]
  onRestoreToFocus: (id: string) => void
  onRestoreToWaiting: (id: string) => void
}) {
  const [filter, setFilter] = useState<ArchiveFilter>("all")

  const filteredItems = archiveItems.filter((item) => {
    if (filter === "all") return true
    if (filter === "threads") return item.originalType === "past_thread"
    if (filter === "decisions") return item.originalType === "needs_decision" || item.originalType === "decision_logged"
    if (filter === "dismissed") return true
    return true
  })

  if (archiveItems.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center h-full text-center pb-12 px-6">
        <p className="text-slate-400 text-sm font-medium">Archive is empty</p>
        <p className="text-slate-600 text-xs mt-1">Resolved items will appear here.</p>
      </div>
    )
  }

  const FILTERS: { id: ArchiveFilter; label: string }[] = [
    { id: "all", label: "All" },
    { id: "threads", label: "Threads" },
    { id: "decisions", label: "Decisions" },
    { id: "dismissed", label: "Dismissed" },
  ]

  return (
    <div className="flex flex-col flex-1 min-h-0">
      {/* Filter pills */}
      <div className="flex-shrink-0 flex items-center gap-1.5 px-3 pt-3 pb-2 flex-wrap">
        {FILTERS.map((f) => (
          <button
            key={f.id}
            onClick={() => setFilter(f.id)}
            className={clsx(
              "rounded-full px-2.5 py-0.5 text-xs font-medium transition-colors",
              filter === f.id
                ? "bg-indigo-600 text-white"
                : "bg-slate-800/80 text-slate-500 hover:text-slate-300 hover:bg-slate-800"
            )}
          >
            {f.label}
          </button>
        ))}
      </div>
      <div className="flex-1 overflow-y-auto px-3 pb-3 space-y-2">
        {filteredItems.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-12 text-center px-6">
            <p className="text-slate-500 text-sm">No items in this filter.</p>
          </div>
        ) : (
          filteredItems.map((item) => (
            <div key={item.id} className="bg-slate-900/60 border border-slate-800 rounded-xl p-4">
              <div className="flex items-start gap-2 mb-2">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-1.5 flex-wrap mb-1">
                    <span className="text-slate-500 text-xs">{item.originalType.replace(/_/g, " ")}</span>
                    <span className="text-slate-700 text-xs">·</span>
                    <span className="text-slate-500 text-xs">#{item.channel}</span>
                    <span className="text-slate-700 text-xs">·</span>
                    <span className="text-slate-500 text-xs">{item.person}</span>
                  </div>
                  <p className="text-slate-300 text-sm leading-relaxed">{item.summary}</p>
                </div>
                <span className="text-slate-600 text-xs flex-shrink-0 ml-2 mt-0.5">{item.resolvedAt}</span>
              </div>
              <div className="flex items-center gap-2 mt-1">
                <button
                  onClick={() => onRestoreToFocus(item.id)}
                  className="bg-slate-800/80 hover:bg-slate-800 text-slate-400 hover:text-slate-200 rounded-lg px-2.5 py-1.5 text-xs transition-colors"
                >
                  Restore to Focus
                </button>
                <button
                  onClick={() => onRestoreToWaiting(item.id)}
                  className="bg-slate-800/80 hover:bg-slate-800 text-slate-400 hover:text-slate-200 rounded-lg px-2.5 py-1.5 text-xs transition-colors"
                >
                  Restore to Waiting
                </button>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  )
}

// ── RightSidebar ─────────────────────────────────────────────────────────────

export default function RightSidebar({
  activeTab,
  onTabChange,
  chatHistory,
  chatInput,
  onChatInputChange,
  isThinking,
  onSend,
  onSendReply,
  onUpdateFinalReply,
  focusItems,
  onFocusDismiss,
  onFocusDraftReply,
  onFocusOpen,
  onFocusSnooze,
  onFocusDelegate,
  waitingItems,
  onWaitingClose,
  onWaitingNudge,
  onWaitingCancel,
  onViewTranscript,
  archiveItems,
  onRestoreToFocus,
  onRestoreToWaiting,
}: RightSidebarProps) {
  const focusCount = focusItems.length

  const TABS: { id: Tab; label: string; badge?: number }[] = [
    { id: "ask", label: "Ask" },
    { id: "focus", label: "Focus", badge: focusCount > 0 ? focusCount : undefined },
    { id: "waiting", label: "Waiting" },
    { id: "archive", label: "Archive" },
  ]

  return (
    <div className="h-screen flex flex-col bg-slate-950">
      {/* Tab header */}
      <div className="flex-shrink-0 border-b border-slate-800/50 px-3 pt-3 pb-0">
        <div className="flex items-center gap-0.5">
          {TABS.map((tab) => (
            <button
              key={tab.id}
              onClick={() => onTabChange(tab.id)}
              className={clsx(
                "flex items-center gap-1.5 px-3 py-2 text-xs font-semibold border-b-2 transition-colors",
                activeTab === tab.id
                  ? "border-indigo-500 text-indigo-300"
                  : "border-transparent text-slate-500 hover:text-slate-300"
              )}
            >
              {tab.label}
              {tab.badge !== undefined && (
                <span
                  className={clsx(
                    "rounded-full w-4 h-4 flex items-center justify-center text-xs font-semibold",
                    activeTab === tab.id
                      ? "bg-indigo-500 text-white"
                      : "bg-slate-700 text-slate-300"
                  )}
                >
                  {tab.badge}
                </span>
              )}
            </button>
          ))}
        </div>
      </div>

      {/* Tab content */}
      <div className="flex-1 flex flex-col min-h-0">
        {activeTab === "ask" && (
          <AskTab
            chatHistory={chatHistory}
            chatInput={chatInput}
            onChatInputChange={onChatInputChange}
            isThinking={isThinking}
            onSend={onSend}
            onSendReply={onSendReply}
          />
        )}
        {activeTab === "focus" && (
          <FocusTab
            focusItems={focusItems}
            onFocusDismiss={onFocusDismiss}
            onFocusDraftReply={onFocusDraftReply}
            onFocusOpen={onFocusOpen}
            onFocusSnooze={onFocusSnooze}
            onFocusDelegate={onFocusDelegate}
          />
        )}
        {activeTab === "waiting" && (
          <WaitingTab
            waitingItems={waitingItems}
            onWaitingClose={onWaitingClose}
            onWaitingNudge={onWaitingNudge}
            onWaitingCancel={onWaitingCancel}
            onViewTranscript={onViewTranscript}
          />
        )}
        {activeTab === "archive" && (
          <ArchiveTab
            archiveItems={archiveItems}
            onRestoreToFocus={onRestoreToFocus}
            onRestoreToWaiting={onRestoreToWaiting}
          />
        )}
      </div>
    </div>
  )
}
