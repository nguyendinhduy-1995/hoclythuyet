/**
 * Daily Store — Build and track "5 minute" daily sessions
 * Priority order: (a) due review items, (b) weak topic questions, (c) random
 */

const STORAGE_KEY = "thayduy_daily_v1";
const DAILY_QUESTION_COUNT = 10;

import { syncEvent, syncDailySnapshot } from "./syncEngine";
import { getOverallStats, getAccuracyRate } from "./progressStore";
import { getStreak } from "./streakStore";
import { getDueCount } from "./reviewStore";
import { getWeakTopicsFromMocks } from "./mockStore";

export interface DailySession {
    dateKey: string;         // "2026-02-19" in Asia/Ho_Chi_Minh
    questionIds: string[];
    completedIds: string[];
    completed: boolean;
}

interface DailyData {
    sessions: Record<string, DailySession>;
}

function todayVN(): string {
    return new Date().toLocaleDateString("sv-SE", { timeZone: "Asia/Ho_Chi_Minh" });
}

function getData(): DailyData {
    if (typeof window === "undefined") return { sessions: {} };
    try {
        const raw = localStorage.getItem(STORAGE_KEY);
        return raw ? JSON.parse(raw) : { sessions: {} };
    } catch { return { sessions: {} }; }
}

function setData(data: DailyData) {
    if (typeof window === "undefined") return;
    try { localStorage.setItem(STORAGE_KEY, JSON.stringify(data)); } catch { }
}

/** Build today's session with priority queue */
export function buildDailySession(
    dueQuestionIds: string[],
    weakTopicQuestionIds: string[],
    allQuestionIds: string[],
    count: number = DAILY_QUESTION_COUNT
): string[] {
    const selected: string[] = [];
    const used = new Set<string>();

    // (a) Due review items first
    for (const id of dueQuestionIds) {
        if (selected.length >= count) break;
        if (!used.has(id)) { selected.push(id); used.add(id); }
    }

    // (b) Weak topic questions
    for (const id of weakTopicQuestionIds) {
        if (selected.length >= count) break;
        if (!used.has(id)) { selected.push(id); used.add(id); }
    }

    // (c) Random fill
    const shuffled = [...allQuestionIds].sort(() => Math.random() - 0.5);
    for (const id of shuffled) {
        if (selected.length >= count) break;
        if (!used.has(id)) { selected.push(id); used.add(id); }
    }

    return selected;
}

/** Get or create today's session */
export function getTodaySession(): DailySession | null {
    const data = getData();
    const today = todayVN();
    return data.sessions[today] || null;
}

/** Save today's session */
export function saveTodaySession(questionIds: string[]) {
    const data = getData();
    const today = todayVN();
    data.sessions[today] = {
        dateKey: today,
        questionIds,
        completedIds: [],
        completed: false,
    };
    // Keep only last 7 days
    const keys = Object.keys(data.sessions).sort();
    while (keys.length > 7) {
        delete data.sessions[keys.shift()!];
    }
    setData(data);
}

/** Mark a question as completed in today's session */
export function markCompleted(questionId: string) {
    const data = getData();
    const today = todayVN();
    const session = data.sessions[today];
    if (!session) return;

    if (!session.completedIds.includes(questionId)) {
        session.completedIds.push(questionId);
    }
    session.completed = session.completedIds.length >= session.questionIds.length;
    setData(data);

    // ── CRM Sync: fire event + snapshot when session completes ──
    if (session.completed) {
        try {
            syncEvent("DAILY_COMPLETED", {
                questions: session.questionIds.length,
                correct: session.completedIds.length, // simplified: all completed are answered
            });

            const overall = getOverallStats();
            const streak = getStreak();
            const weakTopics = getWeakTopicsFromMocks().slice(0, 3).map(t => ({
                topicId: t.topicId, accuracy: t.accuracy
            }));

            syncDailySnapshot({
                minutes: 5, // daily session ~5 min
                questionsAnswered: overall.answered,
                correct: overall.correct,
                accuracy: getAccuracyRate(),
                streakCurrent: streak.currentStreak,
                streakLongest: streak.longestStreak,
                dueCount: getDueCount(),
                topWeakTopics: weakTopics,
            });
        } catch { /* sync failures are non-blocking */ }
    }
}

/** Check if today's session is done */
export function isTodayComplete(): boolean {
    const session = getTodaySession();
    return session?.completed ?? false;
}
