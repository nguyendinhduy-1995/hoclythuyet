import { Suspense } from "react";
import ExamClient from "./ExamClient";
import FilteredExamLoader from "./FilteredExamLoader";

interface PageProps {
    params: Promise<{ id: string }>;
    searchParams: Promise<{ mode?: string; topicId?: string; type?: string; upgrade?: string; filter?: string }>;
}

/* ── Exam config lookup by type/upgrade ── */
interface ExamSpec {
    questions: number;
    time: number;   // seconds
    pass: number;
    label: string;
}

const EXAM_SPECS: Record<string, ExamSpec> = {
    // Thi mới (Thông tư 05/2024 BGTVT)
    "B": { questions: 30, time: 20 * 60, pass: 27, label: "Sát Hạch Hạng B" },
    "C1": { questions: 35, time: 22 * 60, pass: 32, label: "Sát Hạch Hạng C1" },
    // Nâng hạng (Thông tư 35/2024 BGTVT)
    "B-C1": { questions: 35, time: 22 * 60, pass: 32, label: "Nâng Hạng B → C1" },
    "B-C": { questions: 40, time: 24 * 60, pass: 36, label: "Nâng Hạng B → C" },
    "B-D1": { questions: 40, time: 24 * 60, pass: 36, label: "Nâng Hạng B → D1" },
    "C1-C": { questions: 40, time: 24 * 60, pass: 36, label: "Nâng Hạng C1 → C" },
    "C-D": { questions: 40, time: 24 * 60, pass: 36, label: "Nâng Hạng C → D" },
};

async function getQuestions(topicId?: string, pageSize?: number, mode?: string, questionIds?: string) {
    const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || "http://localhost:3000";
    const params = new URLSearchParams();
    params.set("pageSize", String(pageSize || 600));
    if (topicId) params.set("topicId", topicId);
    if (mode) params.set("mode", mode);
    if (questionIds) params.set("questionIds", questionIds);

    const res = await fetch(`${baseUrl}/api/questions?${params.toString()}`, { cache: "no-store" });
    if (!res.ok) {
        return { questions: [], pagination: { total: 0, page: 1, pageSize: 600, totalPages: 0 } };
    }
    return res.json();
}

export default async function ExamPage({ params, searchParams }: PageProps) {
    const { id } = await params;
    const { mode, topicId, type, upgrade, filter } = await searchParams;

    const isPractice = mode === "practice";

    // If filter=wrong or filter=top-wrong, delegate to client component
    // (needs localStorage access to get question IDs)
    if (filter === "wrong" || filter === "top-wrong") {
        return (
            <Suspense fallback={<div style={{ display: "flex", justifyContent: "center", alignItems: "center", minHeight: "100vh", color: "#64748b" }}>Đang tải...</div>}>
                <FilteredExamLoader filter={filter} />
            </Suspense>
        );
    }

    // Determine exam spec from type or upgrade key
    const specKey = upgrade || type || null;
    const spec = specKey ? EXAM_SPECS[specKey] : null;

    const questionCount = spec ? spec.questions : (parseInt(id, 10) || 30);
    const timeLimit = isPractice ? 0 : (spec ? spec.time : questionCount <= 30 ? 20 * 60 : questionCount <= 35 ? 22 * 60 : 24 * 60);
    const passThreshold = spec ? spec.pass : (questionCount <= 30 ? 27 : questionCount <= 35 ? 32 : 36);
    const examLabel = spec ? spec.label : (isPractice ? "Luyện Tập" : `Sát Hạch — ${questionCount} Câu`);

    const data = await getQuestions(topicId, questionCount, isPractice ? "practice" : undefined);
    const questions = data.questions || [];

    const examConfig = {
        id,
        questionCount,
        isPractice,
        topicId: topicId || null,
        timeLimit,
        passThreshold,
        examLabel,
    };

    return (
        <Suspense fallback={<div style={{ display: "flex", justifyContent: "center", alignItems: "center", minHeight: "100vh", color: "#64748b" }}>Đang tải...</div>}>
            <ExamClient
                initialQuestions={questions}
                config={examConfig}
            />
        </Suspense>
    );
}
