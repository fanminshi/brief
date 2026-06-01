"use client";

import { Hash } from "lucide-react";
import clsx from "clsx";
import { MentionThread } from "@/lib/types";

interface InboxProps {
  threads: MentionThread[];
  selectedId: string;
  onSelect: (id: string) => void;
}

const authorColors: Record<string, string> = {
  Alice: "from-violet-500 to-purple-600",
  Bob: "from-blue-500 to-cyan-600",
  Carol: "from-emerald-500 to-teal-600",
  Dan: "from-amber-500 to-orange-600",
  Eve: "from-rose-500 to-pink-600",
};

function avatarGradient(name: string) {
  return authorColors[name] ?? "from-slate-600 to-slate-700";
}

export default function Inbox({ threads, selectedId, onSelect }: InboxProps) {
  const active = threads.filter((t) => t.isActive);
  const stale = threads.filter((t) => !t.isActive);
  const unreadCount = threads.filter((t) => t.isUnread).length;

  return (
    <div className="h-screen flex flex-col bg-slate-950 border-r border-slate-800/50">
      {/* Header */}
      <div className="px-4 py-4 border-b border-slate-800/50">
        <div className="flex items-center justify-between">
          <span className="text-slate-100 font-semibold text-sm">Inbox</span>
          {unreadCount > 0 && (
            <span className="bg-indigo-600 text-white text-xs font-semibold rounded-full px-1.5 py-0.5 min-w-[18px] text-center">
              {unreadCount}
            </span>
          )}
        </div>
        <p className="text-slate-600 text-xs mt-0.5">Threads where you&apos;re mentioned</p>
      </div>

      {/* Thread list */}
      <div className="flex-1 overflow-y-auto py-2 px-2">
        {/* Active */}
        {active.map((thread) => (
          <ThreadItem
            key={thread.id}
            thread={thread}
            isSelected={thread.id === selectedId}
            onSelect={onSelect}
            dimmed={false}
          />
        ))}

        {/* Stale divider */}
        {stale.length > 0 && (
          <div className="flex items-center gap-2 px-4 py-2 mt-1">
            <div className="flex-1 border-t border-slate-800/60" />
            <span className="text-slate-700 text-xs">older</span>
            <div className="flex-1 border-t border-slate-800/60" />
          </div>
        )}

        {stale.map((thread) => (
          <ThreadItem
            key={thread.id}
            thread={thread}
            isSelected={thread.id === selectedId}
            onSelect={onSelect}
            dimmed
          />
        ))}
      </div>

      {/* Footer: user */}
      <div className="border-t border-slate-800/50 px-4 py-3 flex items-center gap-2.5">
        <div className="relative flex-shrink-0">
          <div className="w-6 h-6 rounded-full bg-gradient-to-br from-indigo-500 to-violet-500 flex items-center justify-center text-white text-xs font-semibold">
            F
          </div>
          <div className="absolute -bottom-0.5 -right-0.5 w-2 h-2 rounded-full bg-emerald-500 border-2 border-slate-950" />
        </div>
        <span className="text-slate-400 text-xs">Fanmin</span>
      </div>
    </div>
  );
}

function ThreadItem({
  thread,
  isSelected,
  onSelect,
  dimmed,
}: {
  thread: MentionThread;
  isSelected: boolean;
  onSelect: (id: string) => void;
  dimmed: boolean;
}) {
  return (
    <button
      onClick={() => onSelect(thread.id)}
      className={clsx(
        "w-full text-left px-3 py-2.5 rounded-lg transition-colors",
        isSelected
          ? "bg-indigo-500/15"
          : "hover:bg-slate-900/60",
        dimmed && !isSelected && "opacity-50"
      )}
    >
      <div className="flex items-start gap-2.5">
        {/* Unread dot */}
        <div className="flex-shrink-0 mt-1.5">
          {thread.isUnread ? (
            <div className={clsx("w-1.5 h-1.5 rounded-full", thread.isActive ? "bg-indigo-400" : "bg-slate-500")} />
          ) : (
            <div className="w-1.5 h-1.5" />
          )}
        </div>

        {/* Content */}
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-1 mb-0.5">
            <Hash size={10} className="text-slate-600 flex-shrink-0" />
            <span className="text-slate-500 text-xs truncate">{thread.channel}</span>
            <span className="text-slate-700 text-xs ml-auto flex-shrink-0">{thread.relativeTime}</span>
          </div>
          <p className={clsx("text-xs font-medium truncate", isSelected ? "text-indigo-300" : "text-slate-300")}>
            {thread.threadTitle}
          </p>
          <div className="flex items-center gap-1.5 mt-0.5">
            <div
              className={clsx(
                "w-3.5 h-3.5 rounded-full bg-gradient-to-br flex items-center justify-center text-white flex-shrink-0",
                avatarGradient(thread.mentionedBy)
              )}
              style={{ fontSize: "7px", fontWeight: 600 }}
            >
              {thread.mentionedBy.charAt(0)}
            </div>
            <p className="text-slate-500 text-xs truncate">{thread.mentionSnippet}</p>
          </div>
        </div>
      </div>
    </button>
  );
}
