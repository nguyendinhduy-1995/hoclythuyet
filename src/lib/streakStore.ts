/**
 * Streak Store — Daily streak tracking
 * Timezone: Asia/Ho_Chi_Minh
 */

const STORAGE_KEY = "thayduy_streak_v1";

export interface StreakData {
    currentStreak: number;
    longestStreak: number;
    lastActiveDate: string; // "2026-02-19"
}

function todayVN(): string {
    return new Date().toLocaleDateString("sv-SE", { timeZone: "Asia/Ho_Chi_Minh" });
}

function yesterdayVN(): string {
    const d = new Date();
    d.setDate(d.getDate() - 1);
    return d.toLocaleDateString("sv-SE", { timeZone: "Asia/Ho_Chi_Minh" });
}

function getData(): StreakData {
    if (typeof window === "undefined") return { currentStreak: 0, longestStreak: 0, lastActiveDate: "" };
    try {
        const raw = localStorage.getItem(STORAGE_KEY);
        return raw ? JSON.parse(raw) : { currentStreak: 0, longestStreak: 0, lastActiveDate: "" };
    } catch { return { currentStreak: 0, longestStreak: 0, lastActiveDate: "" }; }
}

function setData(data: StreakData) {
    if (typeof window === "undefined") return;
    try { localStorage.setItem(STORAGE_KEY, JSON.stringify(data)); } catch { }
}

/** Record activity for today — call when student answers a question */
export function recordActivity() {
    const today = todayVN();
    const data = getData();

    if (data.lastActiveDate === today) {
        // Already recorded today
        return;
    }

    if (data.lastActiveDate === yesterdayVN()) {
        // Consecutive day
        data.currentStreak++;
    } else if (data.lastActiveDate === "") {
        // First ever
        data.currentStreak = 1;
    } else {
        // Streak broken
        data.currentStreak = 1;
    }

    data.longestStreak = Math.max(data.longestStreak, data.currentStreak);
    data.lastActiveDate = today;
    setData(data);
}

/** Get current streak data */
export function getStreak(): StreakData {
    const data = getData();
    const today = todayVN();

    // Check if streak is still valid (last active was today or yesterday)
    if (data.lastActiveDate !== today && data.lastActiveDate !== yesterdayVN()) {
        // Streak broken but don't reset longestStreak
        return { ...data, currentStreak: 0 };
    }

    return data;
}

/** Reset streak data */
export function resetStreak() {
    if (typeof window === "undefined") return;
    try { localStorage.removeItem(STORAGE_KEY); } catch { }
}
