/**
 * AI Client — client-side utility for calling AI API routes
 * Never handles API keys directly
 */

export interface AIExplainResponse {
    explanation: string;
    tip: string;
    trap: string;
    error?: string;
}

export interface AIDiagnosticResponse {
    passRate: number;
    strengths: string[];
    weaknesses: string[];
    todayPlan: string;
    error?: string;
}

export interface AISettingsStatus {
    configured: boolean;
    source: string | null;
    maskedKey: string | null;
    error?: string;
}

/** Ask AI why an answer is wrong */
export async function explainMistake(
    question: string,
    userAnswer: string,
    correctAnswer: string,
    explanation?: string
): Promise<AIExplainResponse> {
    try {
        const res = await fetch("/api/ai/explain", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ question, userAnswer, correctAnswer, explanation }),
        });
        return await res.json();
    } catch {
        return { explanation: "Không thể kết nối AI.", tip: "", trap: "", error: "Network error" };
    }
}

/** Get AI diagnostic/plan for home page */
export async function getDiagnostic(data: {
    accuracy: number;
    dueCount: number;
    streak: number;
    weakTopics: string[];
    recentMockScore: number | null;
    totalAnswered: number;
}): Promise<AIDiagnosticResponse> {
    try {
        const res = await fetch("/api/ai/diagnostic", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(data),
        });
        return await res.json();
    } catch {
        return {
            passRate: 0,
            strengths: [],
            weaknesses: [],
            todayPlan: "Không thể kết nối AI.",
            error: "Network error",
        };
    }
}

/** Check AI settings status (admin only) */
export async function checkAISettings(pin: string): Promise<AISettingsStatus> {
    try {
        const res = await fetch("/api/ai/settings", {
            headers: { "x-admin-pin": pin },
        });
        return await res.json();
    } catch {
        return { configured: false, source: null, maskedKey: null, error: "Network error" };
    }
}

/** Save AI API key (admin only) */
export async function saveAIKey(pin: string, apiKey: string): Promise<{ success?: boolean; error?: string; maskedKey?: string }> {
    try {
        const res = await fetch("/api/ai/settings", {
            method: "PUT",
            headers: { "Content-Type": "application/json", "x-admin-pin": pin },
            body: JSON.stringify({ apiKey }),
        });
        return await res.json();
    } catch {
        return { error: "Network error" };
    }
}
