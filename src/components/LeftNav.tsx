"use client"

import { Zap, Hash, Circle } from "lucide-react"
import clsx from "clsx"

interface LeftNavProps {
  activeChannel: string
  onChannelChange: (ch: string) => void
}

const CHANNELS: { name: string; unread?: number }[] = [
  { name: "oncall-p0", unread: 23 },
  { name: "product", unread: 31 },
  { name: "eval-infra", unread: 2 },
  { name: "ml-pipeline", unread: 15 },
  { name: "security", unread: 8 },
  { name: "platform", unread: 1 },
  { name: "design-review", unread: 12 },
  { name: "planning" },
  { name: "infra" },
  { name: "general" },
]

const DMS: { name: string; online: boolean }[] = [
  { name: "Alice", online: true },
  { name: "Bob", online: false },
  { name: "Carol", online: false },
  { name: "Dan", online: false },
]

export default function LeftNav({ activeChannel, onChannelChange }: LeftNavProps) {
  return (
    <div className="h-screen flex flex-col bg-slate-900 border-r border-slate-800/50">
      {/* App header */}
      <div className="flex-shrink-0 px-4 py-3.5 border-b border-slate-800/50 flex items-center gap-2">
        <div className="w-6 h-6 bg-indigo-600 rounded-md flex items-center justify-center flex-shrink-0">
          <Zap size={13} className="text-white" />
        </div>
        <span className="text-slate-100 font-semibold text-sm tracking-tight">Brief</span>
      </div>

      {/* Nav body */}
      <div className="flex-1 overflow-y-auto py-3 space-y-5">
        {/* Channels */}
        <div>
          <p className="px-4 text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1">Channels</p>
          <div className="space-y-0.5">
            {CHANNELS.map((ch) => {
              const isActive = activeChannel === ch.name
              return (
                <button
                  key={ch.name}
                  onClick={() => onChannelChange(ch.name)}
                  className={clsx(
                    "w-full flex items-center gap-2 px-4 py-1.5 text-sm transition-colors rounded-none",
                    isActive
                      ? "bg-indigo-600/20 text-indigo-300"
                      : ch.unread
                      ? "text-slate-100 hover:bg-slate-800/60"
                      : "text-slate-500 hover:bg-slate-800/40 hover:text-slate-300"
                  )}
                >
                  <Hash size={13} className="flex-shrink-0 opacity-60" />
                  <span className="flex-1 text-left truncate">{ch.name}</span>
                  {ch.unread && !isActive && (
                    <span className="bg-indigo-500 text-white text-xs font-semibold rounded-full px-1.5 py-0.5 min-w-[18px] text-center flex-shrink-0">
                      {ch.unread}
                    </span>
                  )}
                </button>
              )
            })}
          </div>
        </div>

        {/* Direct Messages */}
        <div>
          <p className="px-4 text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1">Direct Messages</p>
          <div className="space-y-0.5">
            {DMS.map((dm) => {
              const isActive = activeChannel === dm.name
              return (
                <button
                  key={dm.name}
                  onClick={() => onChannelChange(dm.name)}
                  className={clsx(
                    "w-full flex items-center gap-2 px-4 py-1.5 text-sm transition-colors",
                    isActive
                      ? "bg-indigo-600/20 text-indigo-300"
                      : "text-slate-500 hover:bg-slate-800/40 hover:text-slate-300"
                  )}
                >
                  <div className="relative flex-shrink-0">
                    <div className="w-5 h-5 rounded-full bg-slate-700 flex items-center justify-center">
                      <span className="text-xs text-slate-300 font-medium">{dm.name.charAt(0)}</span>
                    </div>
                    {dm.online && (
                      <span className="absolute -bottom-0.5 -right-0.5 w-2 h-2 bg-emerald-500 rounded-full border border-slate-900" />
                    )}
                  </div>
                  <span className="flex-1 text-left truncate">{dm.name}</span>
                </button>
              )
            })}
          </div>
        </div>
      </div>

      {/* User footer */}
      <div className="flex-shrink-0 border-t border-slate-800/50 px-4 py-3 flex items-center gap-2">
        <div className="relative flex-shrink-0">
          <div className="w-7 h-7 rounded-full bg-gradient-to-br from-indigo-500 to-violet-500 flex items-center justify-center">
            <span className="text-white text-xs font-semibold">F</span>
          </div>
          <span className="absolute -bottom-0.5 -right-0.5 w-2.5 h-2.5 bg-emerald-500 rounded-full border border-slate-900" />
        </div>
        <div className="flex-1 min-w-0">
          <p className="text-slate-200 text-xs font-medium truncate">Fanmin</p>
          <p className="text-slate-500 text-xs truncate flex items-center gap-1">
            <Circle size={6} className="fill-emerald-500 text-emerald-500" />
            Active
          </p>
        </div>
      </div>
    </div>
  )
}
