/**
 * Progress Store — localStorage-based student progress tracking
 * Mirrors OTOMOTO app behavior: per-question tracking, topic stats, wrong answer lists
 */

const STORAGE_KEY = "thayduy_progress_v1";

export interface QuestionRecord {
    correct: number;
    wrong: number;
    lastAnswer: "correct" | "wrong";
    lastAt: number;
    topicId: string;
}

export interface ProgressData {
    questions: Record<string, QuestionRecord>;
}

export interface Stats {
    total: number;
    answered: number;
    correct: number;
    wrong: number;
}

// Topic counts matching actual questions.json data
const TOPIC_COUNTS: Record<string, number> = {
    "t-diem-liet": 60,   // isCritical questions across all topics
    "t-khai-niem": 180,
    "t-van-hoa": 25,
    "t-ky-thuat": 58,
    "t-cau-tao": 37,
    "t-bien-bao": 185,
    "t-tinh-huong": 115,
};

const TOTAL_QUESTIONS = 600;

function getData(): ProgressData {
    if (typeof window === "undefined") return { questions: {} };
    try {
        const raw = localStorage.getItem(STORAGE_KEY);
        if (!raw) return { questions: {} };
        return JSON.parse(raw) as ProgressData;
    } catch {
        return { questions: {} };
    }
}

function setData(data: ProgressData) {
    if (typeof window === "undefined") return;
    try {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
    } catch {
        // localStorage full or unavailable
    }
    // Trigger debounced CRM sync
    scheduleCrmSync();
}

/* ── Debounced CRM sync ── */
let _syncTimer: ReturnType<typeof setTimeout> | null = null;

function scheduleCrmSync() {
    if (typeof window === "undefined") return;
    if (_syncTimer) clearTimeout(_syncTimer);
    _syncTimer = setTimeout(() => {
        _syncTimer = null;
        pushProgressToCrm();
    }, 5000); // 5s debounce
}

async function pushProgressToCrm() {
    if (typeof window === "undefined") return;
    try {
        const raw = localStorage.getItem("thayduy_crm_link");
        if (!raw) return; // Not linked to CRM — skip

        const link = JSON.parse(raw) as { token: string };
        if (!link?.token) return;

        const overall = getOverallStats();
        if (overall.answered === 0) return;

        const topicIds = Object.keys(TOPIC_COUNTS);
        const topicNames: Record<string, string> = {
            "t-diem-liet": "Câu hỏi điểm liệt",
            "t-khai-niem": "Khái niệm và quy tắc",
            "t-van-hoa": "Văn hóa giao thông",
            "t-ky-thuat": "Kỹ thuật lái xe",
            "t-cau-tao": "Cấu tạo sửa chữa",
            "t-bien-bao": "Biển báo đường bộ",
            "t-tinh-huong": "Sa hình tình huống",
        };

        const topics = topicIds.map((id) => {
            const s = getTopicStats(id);
            return { id, name: topicNames[id] || id, answered: s.answered, total: s.total, correct: s.correct };
        });

        const accuracy = overall.answered > 0 ? Math.round((overall.correct / overall.answered) * 100) : 0;

        const res = await fetch("/api/crm/sync-progress", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
                token: link.token,
                progress: {
                    answered: overall.answered,
                    correct: overall.correct,
                    wrong: overall.wrong,
                    streak: 0,
                    accuracy,
                    topics,
                },
            }),
        });

        if (res.status === 401) {
            // Token expired — clear link
            localStorage.removeItem("thayduy_crm_link");
            console.warn("[progressStore] CRM token expired, unlinked.");
        }
    } catch (err) {
        console.warn("[progressStore] CRM sync failed:", err);
    }
}

/** Save a single answer result */
export function saveAnswer(
    questionId: string,
    topicId: string,
    isCorrect: boolean
) {
    const data = getData();
    const existing = data.questions[questionId];

    if (existing) {
        if (isCorrect) {
            existing.correct++;
        } else {
            existing.wrong++;
        }
        existing.lastAnswer = isCorrect ? "correct" : "wrong";
        existing.lastAt = Date.now();
        existing.topicId = topicId;
    } else {
        data.questions[questionId] = {
            correct: isCorrect ? 1 : 0,
            wrong: isCorrect ? 0 : 1,
            lastAnswer: isCorrect ? "correct" : "wrong",
            lastAt: Date.now(),
            topicId,
        };
    }

    setData(data);
}

/** Save multiple answers at once (for exam mode submit) */
export function saveAnswersBatch(
    results: Array<{
        questionId: string;
        topicId: string;
        isCorrect: boolean;
    }>
) {
    const data = getData();

    for (const r of results) {
        const existing = data.questions[r.questionId];
        if (existing) {
            if (r.isCorrect) {
                existing.correct++;
            } else {
                existing.wrong++;
            }
            existing.lastAnswer = r.isCorrect ? "correct" : "wrong";
            existing.lastAt = Date.now();
            existing.topicId = r.topicId;
        } else {
            data.questions[r.questionId] = {
                correct: r.isCorrect ? 1 : 0,
                wrong: r.isCorrect ? 0 : 1,
                lastAnswer: r.isCorrect ? "correct" : "wrong",
                lastAt: Date.now(),
                topicId: r.topicId,
            };
        }
    }

    setData(data);
}

/** Get overall stats across all 600 questions */
export function getOverallStats(): Stats {
    const data = getData();
    const records = Object.values(data.questions);

    let correct = 0;
    let wrong = 0;

    for (const r of records) {
        if (r.lastAnswer === "correct") {
            correct++;
        } else {
            wrong++;
        }
    }

    return {
        total: TOTAL_QUESTIONS,
        answered: records.length,
        correct,
        wrong,
    };
}

/** Get stats for a specific topic */
export function getTopicStats(topicId: string): Stats {
    const data = getData();
    const total = TOPIC_COUNTS[topicId] || 0;

    let answered = 0;
    let correct = 0;
    let wrong = 0;

    for (const r of Object.values(data.questions)) {
        if (r.topicId === topicId) {
            answered++;
            if (r.lastAnswer === "correct") {
                correct++;
            } else {
                wrong++;
            }
        }
    }

    return { total, answered, correct, wrong };
}

/** Get IDs of questions that were last answered wrong */
export function getWrongQuestionIds(): string[] {
    const data = getData();
    return Object.entries(data.questions)
        .filter(([, r]) => r.lastAnswer === "wrong")
        .map(([id]) => id);
}

/** Get top N questions most frequently answered wrong */
export function getTopWrongIds(n = 50): string[] {
    const data = getData();
    return Object.entries(data.questions)
        .filter(([, r]) => r.wrong > 0)
        .sort(([, a], [, b]) => b.wrong - a.wrong)
        .slice(0, n)
        .map(([id]) => id);
}

/** Get count of currently wrong questions (for badge) */
export function getWrongCount(): number {
    return getWrongQuestionIds().length;
}

/** Reset all progress */
export function resetProgress() {
    if (typeof window === "undefined") return;
    try {
        localStorage.removeItem(STORAGE_KEY);
    } catch {
        // ignore
    }
}

/** Get the last study timestamp */
export function getLastStudyDate(): number | null {
    const data = getData();
    const records = Object.values(data.questions);
    if (records.length === 0) return null;
    return Math.max(...records.map((r) => r.lastAt));
}

/** Get accuracy rate (0-100) */
export function getAccuracyRate(): number {
    const data = getData();
    const records = Object.values(data.questions);
    if (records.length === 0) return 0;
    const correct = records.filter((r) => r.lastAnswer === "correct").length;
    return Math.round((correct / records.length) * 100);
}
