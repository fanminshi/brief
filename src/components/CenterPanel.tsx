"use client";

import { Brain } from "lucide-react";
import clsx from "clsx";
import { useEffect, useRef } from "react";
import { Message, ThreadBrief } from "@/lib/types";
import { insforge } from "@/lib/insforgeClient";

interface CenterPanelProps {
  channel: string;
  threadTitle: string;
  messages: Message[];
  threadBrief: ThreadBrief;
  onNewMessage: (msg: Message) => void;
}

const DM_NAMES = new Set(["Alice", "Bob", "Carol", "Dan", "Eve", "Sarah", "Mike", "Jenny", "Tom", "Frank"])
const isDM = (channel: string) => DM_NAMES.has(channel)

const avatarGradients: Record<string, string> = {
  Alice: "from-violet-500 to-purple-600",
  Bob: "from-blue-500 to-cyan-600",
  Carol: "from-emerald-500 to-teal-600",
  Dan: "from-amber-500 to-orange-600",
  Eve: "from-rose-500 to-pink-600",
  Fanmin: "from-indigo-500 to-violet-500",
};

function getGradient(author: string): string {
  return avatarGradients[author] ?? "from-slate-600 to-slate-700";
}

export default function CenterPanel({ channel, threadTitle, messages, threadBrief, onNewMessage }: CenterPanelProps) {
  const bottomRef = useRef<HTMLDivElement>(null);

  // Auto-scroll to bottom when messages change
  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  // Realtime subscription for live messages
  useEffect(() => {
    const channelKey = `thread:${channel}`;
    let subscribed = false;

    async function subscribe() {
      try {
        await insforge.realtime.connect();
        const res = await insforge.realtime.subscribe(channelKey);
        if (!res.ok) return;
        subscribed = true;

        insforge.realtime.on("new_message", (payload: { meta?: { channel?: string }; id?: string; author?: string; text?: string; timestamp_label?: string }) => {
          if (payload.meta?.channel !== channelKey) return;
          onNewMessage({
            id: payload.id ?? String(Date.now()),
            author: payload.author ?? "Unknown",
            text: payload.text ?? "",
            timestamp: payload.timestamp_label ?? "",
          });
        });
      } catch {
        // Realtime not available — graceful degradation
      }
    }

    subscribe();

    return () => {
      if (subscribed) {
        insforge.realtime.unsubscribe(channelKey);
      }
    };
  }, [channel, onNewMessage]);

  return (
    <div className="h-screen flex flex-col bg-slate-950">
      {/* Header */}
      <div className="flex-shrink-0 border-b border-slate-800/50 px-5 py-3">
        <div className="flex items-baseline gap-2">
          {isDM(channel) ? (
            <>
              <span className="text-slate-500 text-xs">DM</span>
              <span className="text-slate-100 font-semibold text-sm">{channel}</span>
            </>
          ) : (
            <>
              <span className="text-slate-500 text-sm">#</span>
              <span className="text-slate-100 font-semibold text-sm">{channel}</span>
              <span className="text-slate-600 text-xs mx-1">·</span>
              <span className="text-slate-400 text-sm">{threadTitle}</span>
            </>
          )}
          <span className="text-slate-600 text-xs ml-auto">{messages.length} messages</span>
        </div>
      </div>

      {/* AI Thread Brief */}
      <div className="flex-shrink-0 border-b border-slate-800/30 px-5 py-2.5 bg-indigo-950/20">
        <div className="flex items-start gap-2">
          <Brain size={11} className="text-indigo-400 mt-0.5 flex-shrink-0" />
          <p className="text-xs text-slate-400 leading-relaxed">
            <span className="text-indigo-300 font-medium">Q: </span>
            {threadBrief.main_question}
            <span className="text-slate-700 mx-2">·</span>
            <span className="text-emerald-400 font-medium">Decision: </span>
            {threadBrief.prior_decision}
            {threadBrief.open_question && (
              <>
                <span className="text-slate-700 mx-2">·</span>
                <span className="text-amber-400 font-medium">Open: </span>
                {threadBrief.open_question}
              </>
            )}
          </p>
        </div>
        {threadBrief.latest_update && (
          <div className="flex items-center gap-2 mt-1.5 ml-[18px]">
            <div className="w-1.5 h-1.5 rounded-full bg-emerald-500 flex-shrink-0" />
            <span className="text-xs text-emerald-400">{threadBrief.latest_update}</span>
          </div>
        )}
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto px-5 py-4 space-y-5">
        {messages.map((message) => (
          <div key={message.id} className="flex gap-3">
            <div
              className={clsx(
                "w-7 h-7 rounded-full bg-gradient-to-br flex items-center justify-center text-white text-xs font-semibold flex-shrink-0 mt-0.5",
                getGradient(message.author)
              )}
            >
              {message.author.charAt(0)}
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex items-baseline gap-2">
                <span className={clsx("text-sm font-medium", message.author === "Fanmin" ? "text-indigo-300" : "text-slate-200")}>
                  {message.author}
                </span>
                <span className="text-slate-600 text-xs">{message.timestamp}</span>
              </div>
              <p className="text-slate-300 text-sm mt-0.5 leading-relaxed">{message.text}</p>
            </div>
          </div>
        ))}
        <div ref={bottomRef} />
      </div>
    </div>
  );
}
