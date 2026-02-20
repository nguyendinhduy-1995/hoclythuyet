/**
 * Review Store — SM-2 Lite Spaced Repetition
 * Stores ReviewItems in localStorage, schedules review based on SM-2 algorithm.
 * Timezone: Asia/Ho_Chi_Minh for all date calculations.
 */

const STORAGE_KEY = "thayduy_review_v1";

export interface ReviewItem {
    questionId: string;
    topicId: string;
    dueAt: string;          // ISO date "2026-02-20"
    intervalDays: number;
    repetitions: number;
    easeFactor: number;     // starts 2.5, min 1.3
    lapses: number;
    createdAt: number;      // epoch ms
}

interface ReviewData {
    items: Record<string, ReviewItem>;
}

/* ── Timezone helper ── */
export function todayVN(): string {
    return new Date().toLocaleDateString("sv-SE", { timeZone: "Asia/Ho_Chi_Minh" });
}

function addDays(dateStr: string, days: number): string {
    const d = new Date(dateStr + "T00:00:00+07:00");
    d.setDate(d.getDate() + days);
    return d.toISOString().slice(0, 10);
}

/* ── Storage ── */
function getData(): ReviewData {
    if (typeof window === "undefined") return { items: {} };
    try {
        const raw = localStorage.getItem(STORAGE_KEY);
        return raw ? JSON.parse(raw) : { items: {} };
    } catch { return { items: {} }; }
}

function setData(data: ReviewData) {
    if (typeof window === "undefined") return;
    try { localStorage.setItem(STORAGE_KEY, JSON.stringify(data)); } catch { }
}

/* ── SM-2 Core ── */
function computeNextReview(
    item: ReviewItem,
    correct: boolean
): ReviewItem {
    const today = todayVN();
    const updated = { ...item };

    if (correct) {
        updated.repetitions++;
        if (updated.repetitions === 1) {
            updated.intervalDays = 1;
        } else if (updated.repetitions === 2) {
            updated.intervalDays = 3;
        } else {
            updated.intervalDays = Math.round(updated.intervalDays * updated.easeFactor);
        }
        // quality=4 for correct
        const q = 4;
        updated.easeFactor = Math.max(
            1.3,
            updated.easeFactor + 0.1 - (5 - q) * (0.08 + (5 - q) * 0.02)
        );
    } else {
        updated.lapses++;
        updated.repetitions = 0;
        updated.intervalDays = 1;
        updated.easeFactor = Math.max(1.3, updated.easeFactor - 0.2);
    }

    updated.dueAt = addDays(today, updated.intervalDays);
    return updated;
}

/* ── Public API ── */

/** Add or update a review item when student answers wrong */
export function addToReview(questionId: string, topicId: string) {
    const data = getData();
    const existing = data.items[questionId];

    if (existing) {
        // Already in review — mark as lapsed
        data.items[questionId] = computeNextReview(existing, false);
    } else {
        // New review item
        const today = todayVN();
        data.items[questionId] = {
            questionId,
            topicId,
            dueAt: addDays(today, 1),
            intervalDays: 1,
            repetitions: 0,
            easeFactor: 2.5,
            lapses: 1,
            createdAt: Date.now(),
        };
    }

    setData(data);
}

/** Update review after student answers a due item */
export function updateReview(questionId: string, correct: boolean) {
    const data = getData();
    const item = data.items[questionId];
    if (!item) return;

    data.items[questionId] = computeNextReview(item, correct);

    // If easy enough (repetitions >= 5 and correct), graduate out
    if (correct && data.items[questionId].repetitions >= 5) {
        delete data.items[questionId];
    }

    setData(data);
}

/** Get all items due today or overdue */
export function getDueItems(): ReviewItem[] {
    const data = getData();
    const today = todayVN();
    return Object.values(data.items).filter(item => item.dueAt <= today);
}

/** Get count of due items */
export function getDueCount(): number {
    return getDueItems().length;
}

/** Get all review items */
export function getAllItems(): ReviewItem[] {
    return Object.values(getData().items);
}

/** Get review items by topic */
export function getItemsByTopic(topicId: string): ReviewItem[] {
    return Object.values(getData().items).filter(item => item.topicId === topicId);
}

/** Remove item from review (graduated) */
export function removeFromReview(questionId: string) {
    const data = getData();
    delete data.items[questionId];
    setData(data);
}

/** Reset all review data */
export function resetReview() {
    if (typeof window === "undefined") return;
    try { localStorage.removeItem(STORAGE_KEY); } catch { }
}
