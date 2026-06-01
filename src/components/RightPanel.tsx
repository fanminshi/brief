"use client"

import { useRef, useEffect } from "react"
import {
  Send,
  CheckCircle2,
  AlertTriangle,
  Loader2,
  RefreshCw,
  ArrowUp,
} from "lucide-react"
import clsx from "clsx"
import { ChatEntry, CompilationResult } from "@/lib/types"

interface RightPanelProps {
  chatHistory: ChatEntry[]
  chatInput: string
  onChatInputChange: (v: string) => void
  selectedMode: string
  onModeChange: (mode: string) => void
  isThinking: boolean
  onSend: () => void
  onSendReply: (text: string) => void
  onUpdateFinalReply: (id: string, text: string) => void
}

const MODES = ["Answer clearly", "Ask clarification", "Push back", "Find decision", "Ask owner"]

export default function RightPanel({
  chatHistory,
  chatInput,
  onChatInputChange,
  selectedMode,
  onModeChange,
  isThinking,
  onSend,
  onSendReply,
  onUpdateFinalReply,
}: RightPanelProps) {
  const bottomRef = useRef<HTMLDivElement>(null)
  const textareaRef = useRef<HTMLTextAreaElement>(null)

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" })
  }, [chatHistory, isThinking])

  const lastEntry = chatHistory[chatHistory.length - 1]
  const showModePills =
    !isThinking &&
    lastEntry?.role === "assistant" &&
    lastEntry.type === "reply"

  return (
    <div className="h-screen flex flex-col bg-slate-950">
      {/* Header */}
      <div className="flex-shrink-0 border-b border-slate-800/50 px-4 py-3">
        <span className="text-slate-300 text-sm font-semibold">AI</span>
        <p className="text-slate-600 text-xs mt-0.5">Ask anything or describe what you want to say</p>
      </div>

      {/* Chat history */}
      <div className="flex-1 overflow-y-auto px-4 py-4 space-y-4">
        {chatHistory.length === 0 && (
          <div className="flex flex-col items-center justify-center h-full text-center pb-8">
            <p className="text-slate-600 text-sm">Ask about past decisions, or describe what you want to say.</p>
            <p className="text-slate-700 text-xs mt-1">The AI figures out the rest.</p>
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

          if (entry.role === "assistant" && entry.type === "notification") {
            return (
              <div key={entry.id} className="space-y-1">
                {entry.text.split("\n").map((line, i) => (
                  <p key={i} className={clsx("text-sm leading-relaxed", line.startsWith("•") ? "text-slate-400 pl-2" : "text-slate-300")}>
                    {line}
                  </p>
                ))}
              </div>
            )
          }

          if (entry.role === "assistant" && entry.type === "memory") {
            return (
              <div key={entry.id} className="space-y-2">
                <p className="text-slate-200 text-sm leading-relaxed">{entry.answer}</p>
                {entry.sources.length > 0 && (
                  <div className="space-y-1.5 pt-1">
                    {entry.sources.map((src, i) => (
                      <div key={i} className="flex items-center gap-2">
                        <span
                          className={clsx(
                            "text-xs rounded px-1.5 py-0.5 flex-shrink-0",
                            src.type === "past_thread"
                              ? "bg-violet-500/15 text-violet-400"
                              : "bg-cyan-500/15 text-cyan-400"
                          )}
                        >
                          {src.type === "past_thread" ? "thread" : "doc"}
                        </span>
                        <span className="text-slate-400 text-xs">{src.title}</span>
                        {src.date && <span className="text-slate-600 text-xs">{src.date}</span>}
                        <span className="text-slate-700 text-xs ml-auto">{src.score.toFixed(2)}</span>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )
          }

          if (entry.role === "assistant" && entry.type === "reply") {
            return (
              <div key={entry.id} className="space-y-3">
                {/* Context hits */}
                {entry.result.retrieved_context.length > 0 && (
                  <div className="space-y-1.5">
                    <p className="text-xs text-slate-600 uppercase tracking-wider">Context</p>
                    {entry.result.retrieved_context.map((item, i) => (
                      <div key={i} className="flex items-start gap-2">
                        <span
                          className={clsx(
                            "text-xs rounded px-1.5 py-0.5 flex-shrink-0 mt-0.5",
                            item.type === "past_thread"
                              ? "bg-violet-500/15 text-violet-400"
                              : "bg-cyan-500/15 text-cyan-400"
                          )}
                        >
                          {item.type === "past_thread" ? "thread" : "doc"}
                        </span>
                        <div className="min-w-0">
                          <span className="text-slate-300 text-xs font-medium">{item.title}</span>
                          {item.date && <span className="text-slate-600 text-xs ml-1.5">{item.date}</span>}
                          <p className="text-slate-500 text-xs mt-0.5 leading-relaxed">{item.summary}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                )}

                {/* Verification */}
                <div className="flex flex-wrap gap-x-3 gap-y-1">
                  <span className="flex items-center gap-1 text-xs text-emerald-400">
                    <CheckCircle2 size={11} /> Grounded
                  </span>
                  {entry.result.verification.clarity === "good" && (
                    <span className="flex items-center gap-1 text-xs text-emerald-400">
                      <CheckCircle2 size={11} /> Clear
                    </span>
                  )}
                  <span className="flex items-center gap-1 text-xs text-emerald-400">
                    <CheckCircle2 size={11} /> Grammar clean
                  </span>
                  {entry.result.verification.misinterpretation_risk !== "low" && (
                    <span className="flex items-center gap-1 text-xs text-amber-400">
                      <AlertTriangle size={11} /> Risk: {entry.result.verification.misinterpretation_risk}
                    </span>
                  )}
                </div>

                {/* Misinterpretation */}
                {entry.result.misinterpretation_detection.detected && (
                  <div className="bg-amber-500/10 border border-amber-500/20 rounded-lg p-3">
                    <p className="text-amber-400 text-xs font-medium mb-0.5">Possible misinterpretation</p>
                    <p className="text-amber-300/80 text-xs leading-relaxed">
                      {entry.result.misinterpretation_detection.explanation}
                    </p>
                  </div>
                )}

                {/* Reply */}
                <div>
                  <p className="text-xs text-slate-600 uppercase tracking-wider mb-1.5">Reply</p>
                  <textarea
                    value={entry.finalReply}
                    onChange={(e) => onUpdateFinalReply(entry.id, e.target.value)}
                    className="w-full bg-slate-900/60 border border-slate-800/50 rounded-xl text-slate-200 text-sm p-3 resize-none h-28 focus:outline-none focus:ring-1 focus:ring-indigo-500/40"
                  />
                  <div className="flex gap-2 mt-1.5">
                    <button className="bg-slate-800 hover:bg-slate-700 text-slate-400 rounded-lg px-3 py-1.5 text-xs flex items-center gap-1.5 transition-colors">
                      <RefreshCw size={10} />
                      Regenerate
                    </button>
                    <button
                      onClick={() => onSendReply(entry.finalReply)}
                      className="flex-1 bg-indigo-600 hover:bg-indigo-500 text-white rounded-lg py-1.5 text-xs font-semibold flex items-center justify-center gap-1.5 transition-colors"
                    >
                      <Send size={10} />
                      Send Reply
                    </button>
                  </div>
                </div>
              </div>
            )
          }

          return null
        })}

        {/* Thinking indicator */}
        {isThinking && (
          <div className="flex items-center gap-2">
            <Loader2 size={13} className="text-indigo-400 animate-spin" />
            <span className="text-slate-500 text-xs">Thinking...</span>
          </div>
        )}

        <div ref={bottomRef} />
      </div>

      {/* Composer */}
      <div className="flex-shrink-0 border-t border-slate-800/50 p-3 space-y-2">
        {/* Mode pills — only visible after a compiled reply */}
        {showModePills && (
          <div className="flex flex-wrap gap-1.5">
            {MODES.map((mode) => (
              <button
                key={mode}
                onClick={() => onModeChange(mode)}
                className={clsx(
                  "rounded-full px-2.5 py-0.5 text-xs font-medium transition-colors",
                  selectedMode === mode
                    ? "bg-indigo-600 text-white"
                    : "bg-slate-800/80 text-slate-500 hover:text-slate-300 hover:bg-slate-800"
                )}
              >
                {mode}
              </button>
            ))}
          </div>
        )}

        <div className="flex items-end gap-2">
          <textarea
            ref={textareaRef}
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
            placeholder="Ask or say anything… ↵ to send"
          />
          <button
            onClick={onSend}
            disabled={isThinking || !chatInput.trim()}
            className="bg-indigo-600 hover:bg-indigo-500 disabled:bg-slate-800 disabled:text-slate-600 text-white rounded-xl p-2.5 transition-colors flex-shrink-0"
          >
            <ArrowUp size={16} />
          </button>
        </div>
      </div>
    </div>
  )
}
