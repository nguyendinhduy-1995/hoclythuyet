"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import ExamClient from "./ExamClient";
import { getWrongQuestionIds, getTopWrongIds } from "@/lib/progressStore";

interface Props {
    filter: "wrong" | "top-wrong";
}

export default function FilteredExamLoader({ filter }: Props) {
    const [loading, setLoading] = useState(true);
    const [questions, setQuestions] = useState<Array<{
        id: string;
        content: string;
        answers: Array<{ id: string; content: string; isCorrect: boolean }>;
        explanation?: string;
        topicId: string;
        imageUrl?: string | null;
        isCritical?: boolean;
    }>>([]);

    useEffect(() => {
        async function loadQuestions() {
            // Get question IDs from localStorage
            const ids = filter === "wrong"
                ? getWrongQuestionIds()
                : getTopWrongIds(50);

            if (ids.length === 0) {
                setLoading(false);
                return;
            }

            // Fetch questions by IDs from API
            const params = new URLSearchParams();
            params.set("questionIds", ids.join(","));
            params.set("mode", "practice");
            params.set("pageSize", String(ids.length));

            try {
                const res = await fetch(`/api/questions?${params.toString()}`);
                if (res.ok) {
                    const data = await res.json();
                    setQuestions(data.questions || []);
                }
            } catch {
                // ignore fetch errors
            }

            setLoading(false);
        }

        loadQuestions();
    }, [filter]);

    if (loading) {
        return (
            <div style={{
                display: "flex",
                flexDirection: "column",
                justifyContent: "center",
                alignItems: "center",
                minHeight: "100vh",
                gap: "1rem",
                background: "var(--background)",
            }}>
                <div style={{
                    width: 48,
                    height: 48,
                    border: "4px solid var(--border)",
                    borderTopColor: "var(--primary)",
                    borderRadius: "50%",
                    animation: "spin 0.8s linear infinite",
                }} />
                <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
                <p style={{ color: "var(--muted)", fontSize: "0.875rem", fontWeight: 500 }}>
                    Đang tải câu hỏi...
                </p>
            </div>
        );
    }

    if (questions.length === 0) {
        return (
            <div style={{
                display: "flex",
                flexDirection: "column",
                justifyContent: "center",
                alignItems: "center",
                minHeight: "100vh",
                gap: "1.25rem",
                padding: "2rem",
                textAlign: "center",
                background: "var(--background)",
            }}>
                <div style={{
                    width: 96,
                    height: 96,
                    borderRadius: "50%",
                    background: filter === "wrong"
                        ? "linear-gradient(135deg, #dcfce7, #bbf7d0)"
                        : "linear-gradient(135deg, #fff7ed, #ffedd5)",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    fontSize: "2.5rem",
                    boxShadow: "0 4px 16px rgba(0,0,0,0.06)",
                    animation: "bounceIn 0.5s cubic-bezier(0.68, -0.55, 0.27, 1.55)",
                }}>
                    {filter === "wrong" ? "🎉" : "📚"}
                </div>
                <style>{`
                    @keyframes bounceIn {
                        0% { transform: scale(0.3); opacity: 0; }
                        50% { transform: scale(1.08); }
                        70% { transform: scale(0.95); }
                        100% { transform: scale(1); opacity: 1; }
                    }
                `}</style>
                <h2 style={{
                    fontSize: "1.375rem",
                    fontWeight: 800,
                    color: "var(--heading)",
                    lineHeight: 1.3,
                }}>
                    {filter === "wrong" ? "🎊 Tuyệt vời! Chưa có câu sai!" : "📖 Chưa có dữ liệu"}
                </h2>
                <p style={{
                    fontSize: "0.9375rem",
                    color: "var(--muted)",
                    maxWidth: "320px",
                    lineHeight: 1.6,
                }}>
                    {filter === "wrong"
                        ? "Bạn chưa trả lời sai câu nào. Hãy ôn tập các chủ đề để hệ thống ghi nhận và theo dõi kết quả của bạn."
                        : "Hãy làm bài ôn tập trước để hệ thống tổng hợp các câu bạn hay sai nhất. Luyện đề càng nhiều, kết quả càng chính xác!"}
                </p>

                <div style={{
                    display: "flex",
                    gap: "0.75rem",
                    marginTop: "0.5rem",
                    flexWrap: "wrap",
                    justifyContent: "center",
                }}>
                    <Link
                        href="/"
                        style={{
                            padding: "0.75rem 1.5rem",
                            background: "var(--card-bg)",
                            color: "var(--text)",
                            borderRadius: "999px",
                            textDecoration: "none",
                            fontWeight: 600,
                            fontSize: "0.875rem",
                            border: "1.5px solid var(--border)",
                            transition: "all 0.2s",
                        }}
                    >
                        ← Trang chủ
                    </Link>
                    <Link
                        href="/exam/35?type=B"
                        style={{
                            padding: "0.75rem 1.5rem",
                            background: "linear-gradient(135deg, #f97316, #ea580c)",
                            color: "#fff",
                            borderRadius: "999px",
                            textDecoration: "none",
                            fontWeight: 700,
                            fontSize: "0.875rem",
                            boxShadow: "0 4px 12px rgba(249, 115, 22, 0.3)",
                            transition: "all 0.2s",
                        }}
                    >
                        🚗 Thi thử B
                    </Link>
                </div>

                {/* Helpful tip */}
                <div style={{
                    marginTop: "1.5rem",
                    padding: "0.875rem 1.25rem",
                    background: "var(--primary-light)",
                    borderRadius: "12px",
                    maxWidth: "340px",
                    border: "1px solid rgba(249, 115, 22, 0.1)",
                }}>
                    <p style={{
                        fontSize: "0.8125rem",
                        color: "var(--primary-dark)",
                        lineHeight: 1.5,
                        fontWeight: 500,
                    }}>
                        💡 <strong>Mẹo:</strong> Sau khi ôn tập, các câu trả lời sai sẽ tự động được lưu lại ở đây để bạn luyện tập thêm.
                    </p>
                </div>
            </div>
        );
    }

    const examConfig = {
        id: filter === "wrong" ? "wrong" : "top-wrong",
        questionCount: questions.length,
        isPractice: true,
        topicId: null,
        timeLimit: 0,
        passThreshold: 0,
        examLabel: filter === "wrong" ? `Câu Sai (${questions.length})` : `50 Câu Hay Sai`,
    };

    return (
        <ExamClient
            initialQuestions={questions}
            config={examConfig}
        />
    );
}
