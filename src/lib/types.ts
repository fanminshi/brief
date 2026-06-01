export interface Message {
  id: string;
  author: string;
  text: string;
  timestamp: string;
}

export interface CurrentThread {
  channel: string;
  title: string;
  messages: Message[];
}

export interface PastThread {
  id: string;
  title: string;
  date: string;
  summary: string;
  decision: string;
  messages: string[];
}

export interface Doc {
  id: string;
  title: string;
  summary: string;
  relevantSection: string;
  url: string;
}

export interface ThreadBrief {
  main_question: string;
  current_confusion: string;
  prior_decision: string;
  open_question: string;
  latest_update?: string;
}

export interface MentionThread {
  id: string;
  channel: string;
  threadTitle: string;
  mentionedBy: string;
  mentionSnippet: string;
  relativeTime: string;
  isUnread: boolean;
  isActive: boolean;
  messages: Message[];
  threadBrief: ThreadBrief;
}

export interface MemoryChunk {
  id: string;
  type: "past_thread" | "doc" | "current_thread";
  title: string;
  date?: string | null;
  text: string;
  metadata: Record<string, unknown>;
  embedding?: number[];
}

export interface SearchResult extends MemoryChunk {
  score: number;
}

export interface IntentParsed {
  summary: string;
  bullets: string[];
}

export interface RetrievedContext {
  type: "past_thread" | "doc" | "current_thread";
  title: string;
  date: string | null;
  summary: string;
  reason_relevant: string;
  score: number;
}

export interface Verification {
  grounded_in_context: boolean;
  clarity: "poor" | "okay" | "good";
  misinterpretation_risk: "low" | "medium" | "high";
  grammar: "needs_work" | "clean";
  missing_detail: string | null;
  suggested_follow_up: string | null;
}

export interface MisinterpretationDetection {
  detected: boolean;
  explanation: string;
}

export interface CompilationResult {
  intent_parsed: IntentParsed;
  retrieved_context: RetrievedContext[];
  draft_reply: string;
  verification: Verification;
  misinterpretation_detection: MisinterpretationDetection;
  final_reply: string;
}

export interface AskMemorySource {
  type: "past_thread" | "doc" | "current_thread";
  title: string;
  date: string | null;
  summary: string;
  score: number;
}

export interface AskMemoryResult {
  answer: string;
  sources: AskMemorySource[];
}

export interface DraftSafety {
  sources: Array<{ title: string; type: "thread" | "doc"; visible: boolean }>
  hasRestrictedSource: boolean
  confidence: "high" | "medium" | "low"
  staleness?: string
  conflicts?: string
}

export type ChatEntry =
  | { id: string; role: "user"; text: string }
  | { id: string; role: "assistant"; type: "notification"; text: string }
  | { id: string; role: "assistant"; type: "chat"; text: string; suggestedReply?: string; targetChannel?: string }
  | { id: string; role: "assistant"; type: "memory"; answer: string; sources: AskMemorySource[] }
  | { id: string; role: "assistant"; type: "reply"; result: CompilationResult; finalReply: string; draftSafety: DraftSafety }

export interface FocusItem {
  id: string
  type: "needs_reply" | "needs_decision" | "blocked_on_you" | "follow_up_due" | "fyi" | "decision_logged" | "risk_detected"
  state: "needs_response" | "draft_ready" | "waiting_on_them" | "resolved" | "dismissed" | "snoozed"
  channel: string
  isDM: boolean
  person: string
  summary: string
  whyShown: string[]
  suggestedAction: string
  sourceTimestamp: string
  confidence: "high" | "medium" | "low"
}

export interface WaitingItem {
  id: string
  person: string
  question: string
  originalReason: string
  status: "asking" | "waiting" | "answered" | "needs_review" | "closed" | "cancelled"
  sentAt: string
  answer?: string
}

export interface ArchiveItem {
  id: string
  originalType: string
  summary: string
  resolvedAt: string
  channel: string
  person: string
}
