/**
 * Sync Engine — Outbox pattern for PWA offline resilience
 *
 * Queue sync items in localStorage, flush to server API proxy when online.
 * The server proxy forwards to CRM with service-to-service auth.
 */

import { getCrmStudentId } from "./crmAuth";

const OUTBOX_KEY = "sync_outbox";
const FLUSH_INTERVAL_MS = 60_000; // 1 minute

export type SyncItemType = "daily" | "attempt" | "ai-summary" | "events";

export interface SyncItem {
    id: string; // ULID-like unique ID
    type: SyncItemType;
    payload: Record<string, unknown>;
    createdAt: string;
    retries: number;
}

/** Generate a simple unique ID */
function generateId(): string {
    const ts = Date.now().toString(36);
    const rand = Math.random().toString(36).substring(2, 8);
    return `${ts}_${rand}`;
}

/** Get current outbox */
function getOutbox(): SyncItem[] {
    if (typeof window === "undefined") return [];
    try {
        const raw = localStorage.getItem(OUTBOX_KEY);
        return raw ? JSON.parse(raw) : [];
    } catch {
        return [];
    }
}

/** Save outbox */
function saveOutbox(items: SyncItem[]) {
    if (typeof window === "undefined") return;
    localStorage.setItem(OUTBOX_KEY, JSON.stringify(items));
}

/**
 * Push a sync item to the outbox.
 * Automatically injects studentId from CRM cookie.
 */
export function pushToOutbox(type: SyncItemType, payload: Record<string, unknown>) {
    const studentId = getCrmStudentId();
    if (!studentId) return; // No CRM session — skip sync

    const item: SyncItem = {
        id: generateId(),
        type,
        payload: { ...payload, studentId },
        createdAt: new Date().toISOString(),
        retries: 0,
    };

    const outbox = getOutbox();
    outbox.push(item);
    saveOutbox(outbox);

    // Try immediate flush if online
    if (navigator.onLine) {
        flushOutbox();
    }
}

/**
 * Flush outbox — send each item to proxy API, remove on success.
 */
let flushing = false;
export async function flushOutbox() {
    if (flushing) return;
    flushing = true;

    try {
        const outbox = getOutbox();
        if (outbox.length === 0) return;

        const remaining: SyncItem[] = [];

        for (const item of outbox) {
            try {
                const res = await fetch("/api/sync/push", {
                    method: "POST",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify(item),
                });

                if (res.ok) {
                    // Success — don't add to remaining
                    continue;
                }

                // Retry up to 5 times
                if (item.retries < 5) {
                    remaining.push({ ...item, retries: item.retries + 1 });
                }
                // else: drop after 5 retries
            } catch {
                // Network error — keep for retry
                if (item.retries < 5) {
                    remaining.push({ ...item, retries: item.retries + 1 });
                }
            }
        }

        saveOutbox(remaining);
    } finally {
        flushing = false;
    }
}

/** Get outbox count (for UI display) */
export function getOutboxCount(): number {
    return getOutbox().length;
}

/**
 * Initialize sync engine — auto-flush on visibility change + interval.
 * Call this once from the app root.
 */
let initialized = false;
export function initSyncEngine() {
    if (typeof window === "undefined" || initialized) return;
    initialized = true;

    // Flush on page focus
    document.addEventListener("visibilitychange", () => {
        if (document.visibilityState === "visible" && navigator.onLine) {
            flushOutbox();
        }
    });

    // Flush when coming back online
    window.addEventListener("online", () => {
        flushOutbox();
    });

    // Periodic flush
    setInterval(() => {
        if (navigator.onLine) flushOutbox();
    }, FLUSH_INTERVAL_MS);

    // Initial flush
    if (navigator.onLine) {
        setTimeout(flushOutbox, 3000);
    }
}

/**
 * Helper: push daily snapshot to outbox.
 */
export function syncDailySnapshot(data: {
    minutes: number;
    questionsAnswered: number;
    correct: number;
    accuracy: number;
    streakCurrent: number;
    streakLongest: number;
    dueCount: number;
    topWeakTopics?: { topicId: string; accuracy: number }[];
}) {
    const now = new Date();
    const dateKey = now.toLocaleDateString("sv-SE", { timeZone: "Asia/Ho_Chi_Minh" });
    pushToOutbox("daily", {
        dateKey,
        ...data,
        lastActiveAt: now.toISOString(),
    });
}

/**
 * Helper: push attempt summary to outbox.
 */
export function syncAttemptSummary(data: {
    mode: string;
    startedAt: string;
    finishedAt: string;
    score: number;
    total: number;
    accuracy: number;
    topicBreakdown?: { topicId: string; total: number; correct: number; accuracy: number }[];
}) {
    const attemptId = `att_${generateId()}`;
    pushToOutbox("attempt", { attemptId, ...data });
}

/**
 * Helper: push AI summary to outbox.
 */
export function syncAiSummary(data: {
    passProbability: number;
    strengths: string[];
    weaknesses: string[];
    todayPlan: string[];
}) {
    pushToOutbox("ai-summary", {
        ...data,
        generatedAt: new Date().toISOString(),
    });
}

/**
 * Helper: push event to outbox.
 */
export function syncEvent(type: string, payload?: Record<string, unknown>) {
    const eventId = `evt_${generateId()}`;
    pushToOutbox("events", {
        eventId,
        type,
        occurredAt: new Date().toISOString(),
        payload: payload ?? {},
    });
}
