import { MemoryChunk } from "./types";

export function buildChunks(): MemoryChunk[] {
  return [
    {
      id: "pt1",
      type: "past_thread",
      title: "Launch Readiness",
      date: "May 12",
      text: "Launch Readiness May 12: The team discussed whether unified eval was ready for default rollout. Decision: Backend merge is allowed, but default rollout is blocked until dashboard parity is validated. Messages: Alice: Can we make unified eval the default next week? Carol: Only if dashboard parity is validated. Bob: Backend merge should not be blocked by dashboard parity.",
      metadata: {
        decision:
          "Backend merge is allowed, but default rollout is blocked until dashboard parity is validated.",
        date: "May 12",
      },
    },
    {
      id: "pt2",
      type: "past_thread",
      title: "Metrics Export Validation",
      date: "May 15",
      text: "Metrics Export Validation May 15: Metrics export works but release reporting still needs validation. Carol: Metrics are exporting correctly. Dan: Release reporting still does not match legacy dashboard. Alice: We should not make this default until reporting is validated.",
      metadata: {
        decision:
          "Metrics export works, but release reporting still needs validation.",
        date: "May 15",
      },
    },
    {
      id: "doc1",
      type: "doc",
      title: "Release Validation Checklist",
      date: null,
      text: "Release Validation Checklist: Default rollout requires dashboard parity, release reporting validation, and metrics export verification. Default rollout criteria section covers all requirements for making unified eval the default.",
      metadata: {
        url: "#",
        section: "Default rollout criteria",
      },
    },
    {
      id: "doc2",
      type: "doc",
      title: "Unified Eval Migration Guide",
      date: null,
      text: "Unified Eval Migration Guide: New workflows should use the unified_eval job format. Legacy jobs can migrate later. Migration path section explains the transition process.",
      metadata: {
        url: "#",
        section: "Migration path",
      },
    },
    {
      id: "current",
      type: "current_thread",
      title: "Unified Eval Default Rollout",
      date: null,
      text: "Current thread eval-infra: Alice: Are we ready to make unified eval the default this week? Bob: Backend is merged, so I think we are good. Carol: Wait, I thought dashboard parity was still missing. Dan: Is dashboard parity actually a launch blocker? Alice: I am confused. Are we blocked or not?",
      metadata: {
        channel: "eval-infra",
      },
    },
  ];
}
