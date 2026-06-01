"use client";

import { Hash, Zap } from "lucide-react";
import clsx from "clsx";

const CHANNELS = ["eval-infra", "launch-readiness", "metrics-dashboard", "random"];

interface SidebarProps {
  activeChannel: string;
  onChannelChange: (channel: string) => void;
}

export default function Sidebar({ activeChannel, onChannelChange }: SidebarProps) {
  return (
    <div className="h-screen flex flex-col items-center bg-slate-950 border-r border-slate-800/50 py-3">
      <div className="w-7 h-7 rounded-lg bg-gradient-to-br from-indigo-500 to-violet-600 flex items-center justify-center mb-5">
        <Zap size={13} className="text-white" />
      </div>

      <div className="flex-1 flex flex-col gap-0.5 items-center w-full px-2">
        {CHANNELS.map((channel) => (
          <button
            key={channel}
            title={`#${channel}`}
            onClick={() => onChannelChange(channel)}
            className={clsx(
              "w-full h-8 rounded-md flex items-center justify-center transition-colors",
              activeChannel === channel
                ? "bg-indigo-500/20 text-indigo-400"
                : "text-slate-600 hover:text-slate-400 hover:bg-slate-800/50"
            )}
          >
            <Hash size={13} />
          </button>
        ))}
      </div>

      <div className="relative">
        <div className="w-7 h-7 rounded-full bg-gradient-to-br from-indigo-500 to-violet-500 flex items-center justify-center text-white text-xs font-semibold">
          F
        </div>
        <div className="absolute -bottom-0.5 -right-0.5 w-2.5 h-2.5 rounded-full bg-emerald-500 border-2 border-slate-950" />
      </div>
    </div>
  );
}
