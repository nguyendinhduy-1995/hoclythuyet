"use client";

import React, { useState, useEffect, useCallback } from "react";
import Link from "next/link";
import styles from "./page.module.css";
import { getWrongQuestionIds } from "@/lib/progressStore";
import type { Question } from "@/lib/types";
import { explainMistake } from "@/lib/aiClient";
import { addToReview } from "@/lib/reviewStore";

const TOPICS = [
    { id: "all", name: "Tất cả" },
    { id: "t-khai-niem", name: "Khái niệm" },
    { id: "t-van-hoa", name: "Văn hóa GT" },
    { id: "t-ky-thuat", name: "Kỹ thuật" },
    { id: "t-cau-tao", name: "Cấu tạo" },
    { id: "t-bien-bao", name: "Biển báo" },
    { id: "t-tinh-huong", name: "Tình huống" },
];

export default function SoTaySaiPage() {
    const [questions, setQuestions] = useState<Question[]>([]);
    const [wrongIds, setWrongIds] = useState<string[]>([]);
    const [selectedTopic, setSelectedTopic] = useState("all");
    const [loading, setLoading] = useState(true);
    const [expandedId, setExpandedId] = useState<string | null>(null);
    const [aiExplain, setAiExplain] = useState<Record<string, { explanation: string; tip: string; trap: string; loading: boolean }>>({});

    useEffect(() => {
        const ids = getWrongQuestionIds();
        setWrongIds(ids);
        if (ids.length > 0) {
            fetch(`/api/questions?questionIds=${ids.join(",")}&mode=practice`)
                .then(r => r.json())
                .then(d => { setQuestions(d.questions || []); setLoading(false); })
                .catch(() => setLoading(false));
        } else {
            setLoading(false);
        }
    }, []);

    const filtered = selectedTopic === "all"
        ? questions
        : questions.filter(q => q.topicId === selectedTopic);

    const handleExplain = useCallback(async (q: Question) => {
        const correct = q.answers.find(a => a.isCorrect);
        const wrong = q.answers.find(a => !a.isCorrect);
        if (!correct) return;

        setAiExplain(prev => ({ ...prev, [q.id]: { explanation: "", tip: "", trap: "", loading: true } }));

        const result = await explainMistake(q.content, wrong?.content || "", correct.content, q.explanation);
        setAiExplain(prev => ({ ...prev, [q.id]: { ...result, loading: false } }));
    }, []);

    const handleAddToReview = useCallback((q: Question) => {
        addToReview(q.id, q.topicId);
        alert("Đã thêm vào lịch ôn lại!");
    }, []);

    if (loading) {
        return (
            <div className={styles.page}>
                <header className={styles.header}>
                    <div className={styles.headerInner}>
                        <Link href="/" className={styles.backBtn}>←</Link>
                        <h1 className={styles.headerTitle}>📓 Sổ Tay Câu Sai</h1>
                        <div style={{ width: 32 }} />
                    </div>
                </header>
                <div className={styles.loading}>Đang tải...</div>
            </div>
        );
    }

    return (
        <div className={styles.page}>
            <header className={styles.header}>
                <div className={styles.headerInner}>
                    <Link href="/" className={styles.backBtn}>←</Link>
                    <h1 className={styles.headerTitle}>📓 Sổ Tay Câu Sai</h1>
                    <div style={{ width: 32 }} />
                </div>
            </header>

            {/* Topic filter */}
            <div className={styles.filterBar}>
                <div className={styles.filterTabs}>
                    {TOPICS.map(t => (
                        <button
                            key={t.id}
                            className={`${styles.filterTab} ${selectedTopic === t.id ? styles.filterTabActive : ""}`}
                            onClick={() => setSelectedTopic(t.id)}
                        >
                            {t.name}
                        </button>
                    ))}
                </div>
            </div>

            <main className={styles.main}>
                {/* Stats bar */}
                <div className={styles.statsBar}>
                    <span>📊 {wrongIds.length} câu sai tổng</span>
                    <span>📋 {filtered.length} câu hiển thị</span>
                    {wrongIds.length > 0 && (
                        <Link
                            href={`/exam/10?questionIds=${wrongIds.slice(0, 10).join(",")}&mode=practice`}
                            className={styles.reviewBtn}
                        >
                            🔄 Ôn lại ({Math.min(10, wrongIds.length)} câu)
                        </Link>
                    )}
                </div>

                {filtered.length === 0 ? (
                    <div className={styles.emptyState}>
                        <span className={styles.emptyIcon}>{wrongIds.length === 0 ? "🎉" : "📂"}</span>
                        <p>{wrongIds.length === 0 ? "Chưa có câu sai nào! Làm bài để bắt đầu." : "Không có câu sai trong chủ đề này."}</p>
                        <Link href="/exam/35?type=B" className={styles.ctaBtn}>📝 Làm đề thi thử</Link>
                    </div>
                ) : (
                    <div className={styles.questionList}>
                        {filtered.map((q, i) => (
                            <div key={q.id} className={styles.questionCard} style={{ animationDelay: `${i * 0.05}s` }}>
                                <button className={styles.questionHeader} onClick={() => setExpandedId(expandedId === q.id ? null : q.id)}>
                                    <span className={styles.questionNum}>#{q.id.replace("q", "")}</span>
                                    <p className={styles.questionText}>{q.content}</p>
                                    <span className={styles.expandIcon}>{expandedId === q.id ? "▲" : "▼"}</span>
                                </button>

                                {expandedId === q.id && (
                                    <div className={styles.questionDetail}>
                                        <div className={styles.answerList}>
                                            {q.answers.map(a => (
                                                <div
                                                    key={a.id}
                                                    className={`${styles.answerItem} ${a.isCorrect ? styles.answerCorrect : styles.answerWrong}`}
                                                >
                                                    <span className={styles.answerMark}>{a.isCorrect ? "✅" : "❌"}</span>
                                                    <span>{a.content}</span>
                                                </div>
                                            ))}
                                        </div>

                                        {q.explanation && (
                                            <div className={styles.explanation}>
                                                <strong>📖 Giải thích:</strong> {q.explanation}
                                            </div>
                                        )}

                                        <div className={styles.actionRow}>
                                            <button className={styles.aiBtn} onClick={() => handleExplain(q)} disabled={aiExplain[q.id]?.loading}>
                                                {aiExplain[q.id]?.loading ? "⏳ Đang hỏi AI..." : "🤖 Vì sao sai?"}
                                            </button>
                                            <button className={styles.reviewAddBtn} onClick={() => handleAddToReview(q)}>
                                                📅 Ôn lại
                                            </button>
                                        </div>

                                        {aiExplain[q.id] && !aiExplain[q.id].loading && (
                                            <div className={styles.aiResponse}>
                                                <p><strong>🤖 AI giải thích:</strong> {aiExplain[q.id].explanation}</p>
                                                {aiExplain[q.id].tip && <p className={styles.aiTip}>💡 Mẹo nhớ: {aiExplain[q.id].tip}</p>}
                                                {aiExplain[q.id].trap && <p className={styles.aiTrap}>⚠️ Bẫy: {aiExplain[q.id].trap}</p>}
                                            </div>
                                        )}
                                    </div>
                                )}
                            </div>
                        ))}
                    </div>
                )}
            </main>
        </div>
    );
}
