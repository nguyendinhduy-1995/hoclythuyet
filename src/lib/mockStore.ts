/**
 * Mock Store — Mock test attempt history with topic breakdown
 */

const STORAGE_KEY = "thayduy_mock_v1";

import { syncAttemptSummary, syncEvent } from "./syncEngine";

export interface TopicBreakdown {
    topicId: string;
    topicName: string;
    correct: number;
    total: number;
    accuracy: number; // 0-100
}

export interface MockResult {
    total: number;
    correct: number;
    wrong: number;
    scorePercent: number;
    passed: boolean;
    topicBreakdown: TopicBreakdown[];
}

export interface MockAttempt {
    id: string;
    type: string;       // "B" | "C" etc
    startedAt: number;
    finishedAt: number | null;
    timeLimitMin: number;
    passThreshold: number;
    questionCount: number;
    responses: { questionId: string; answerId: string | null; topicId: string; correct: boolean }[];
    result: MockResult | null;
}

interface MockData {
    attempts: MockAttempt[];
}

function getData(): MockData {
    if (typeof window === "undefined") return { attempts: [] };
    try {
        const raw = localStorage.getItem(STORAGE_KEY);
        return raw ? JSON.parse(raw) : { attempts: [] };
    } catch { return { attempts: [] }; }
}

function setData(data: MockData) {
    if (typeof window === "undefined") return;
    try { localStorage.setItem(STORAGE_KEY, JSON.stringify(data)); } catch { }
}

// Topic names mapping
const TOPIC_NAMES: Record<string, string> = {
    "t-khai-niem": "Khái niệm & quy tắc",
    "t-van-hoa": "Văn hóa giao thông",
    "t-ky-thuat": "Kỹ thuật lái xe",
    "t-cau-tao": "Cấu tạo sửa chữa",
    "t-bien-bao": "Biển báo đường bộ",
    "t-tinh-huong": "Sa hình tình huống",
    "t-diem-liet": "Câu hỏi điểm liệt",
};

/** Create a new mock attempt */
export function createAttempt(type: string, questionCount: number, timeLimitMin: number, passThreshold: number): string {
    const data = getData();
    const id = `mock_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`;
    data.attempts.push({
        id, type, startedAt: Date.now(), finishedAt: null,
        timeLimitMin, passThreshold, questionCount,
        responses: [], result: null,
    });
    // Keep only last 20 attempts
    if (data.attempts.length > 20) data.attempts = data.attempts.slice(-20);
    setData(data);
    return id;
}

/** Finish a mock attempt with responses */
export function finishAttempt(
    attemptId: string,
    responses: { questionId: string; answerId: string | null; topicId: string; correct: boolean }[]
): MockResult | null {
    const data = getData();
    const attempt = data.attempts.find(a => a.id === attemptId);
    if (!attempt) return null;

    attempt.finishedAt = Date.now();
    attempt.responses = responses;

    // Build topic breakdown
    const topicMap: Record<string, { correct: number; total: number }> = {};
    for (const r of responses) {
        if (!topicMap[r.topicId]) topicMap[r.topicId] = { correct: 0, total: 0 };
        topicMap[r.topicId].total++;
        if (r.correct) topicMap[r.topicId].correct++;
    }

    const topicBreakdown: TopicBreakdown[] = Object.entries(topicMap).map(([topicId, stats]) => ({
        topicId,
        topicName: TOPIC_NAMES[topicId] || topicId,
        correct: stats.correct,
        total: stats.total,
        accuracy: stats.total > 0 ? Math.round((stats.correct / stats.total) * 100) : 0,
    }));

    const correct = responses.filter(r => r.correct).length;
    const result: MockResult = {
        total: responses.length,
        correct,
        wrong: responses.length - correct,
        scorePercent: responses.length > 0 ? Math.round((correct / responses.length) * 100) : 0,
        passed: correct >= attempt.passThreshold,
        topicBreakdown: topicBreakdown.sort((a, b) => a.accuracy - b.accuracy),
    };

    attempt.result = result;
    setData(data);

    // ── CRM Sync: push attempt summary + event ──
    try {
        syncAttemptSummary({
            mode: attempt.type === "B" ? "MOCK" : attempt.type,
            startedAt: new Date(attempt.startedAt).toISOString(),
            finishedAt: new Date(attempt.finishedAt!).toISOString(),
            score: result.correct,
            total: result.total,
            accuracy: result.scorePercent,
            topicBreakdown: result.topicBreakdown.map(t => ({
                topicId: t.topicId,
                total: t.total,
                correct: t.correct,
                accuracy: t.accuracy,
            })),
        });
        syncEvent("MOCK_FINISHED", {
            score: result.correct,
            total: result.total,
            passed: result.passed,
        });
    } catch { /* sync failures are non-blocking */ }

    return result;
}

/** Get all attempts (newest first) */
export function getAttempts(): MockAttempt[] {
    return getData().attempts.slice().reverse();
}

/** Get latest completed attempt */
export function getLatestResult(): MockResult | null {
    const attempts = getData().attempts.filter(a => a.result);
    return attempts.length > 0 ? attempts[attempts.length - 1].result : null;
}

/** Get weak topics from recent attempts (accuracy < 70%) */
export function getWeakTopicsFromMocks(): TopicBreakdown[] {
    const recent = getData().attempts.filter(a => a.result).slice(-5);
    const combined: Record<string, { correct: number; total: number }> = {};

    for (const attempt of recent) {
        if (!attempt.result) continue;
        for (const tb of attempt.result.topicBreakdown) {
            if (!combined[tb.topicId]) combined[tb.topicId] = { correct: 0, total: 0 };
            combined[tb.topicId].correct += tb.correct;
            combined[tb.topicId].total += tb.total;
        }
    }

    return Object.entries(combined)
        .map(([topicId, stats]) => ({
            topicId,
            topicName: TOPIC_NAMES[topicId] || topicId,
            correct: stats.correct,
            total: stats.total,
            accuracy: stats.total > 0 ? Math.round((stats.correct / stats.total) * 100) : 0,
        }))
        .filter(t => t.accuracy < 70)
        .sort((a, b) => a.accuracy - b.accuracy);
}
