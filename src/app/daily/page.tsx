"use client";

import React, { useState, useEffect, useCallback } from "react";
import Link from "next/link";
import styles from "./page.module.css";
import { getDueItems, updateReview } from "@/lib/reviewStore";
import { buildDailySession, getTodaySession, saveTodaySession, markCompleted } from "@/lib/dailyStore";
import { recordActivity, getStreak } from "@/lib/streakStore";
import { saveAnswer } from "@/lib/progressStore";
import { getWeakTopicsFromMocks } from "@/lib/mockStore";
import type { Question } from "@/lib/types";
import { explainMistake } from "@/lib/aiClient";

export default function DailyPage() {
    const [questions, setQuestions] = useState<Question[]>([]);
    const [currentIdx, setCurrentIdx] = useState(0);
    const [selected, setSelected] = useState<string | null>(null);
    const [showResult, setShowResult] = useState(false);
    const [results, setResults] = useState<{ qId: string; correct: boolean }[]>([]);
    const [loading, setLoading] = useState(true);
    const [finished, setFinished] = useState(false);
    const [streak, setStreak] = useState(0);
    const [aiExplain, setAiExplain] = useState<{ explanation: string; tip: string; loading: boolean } | null>(null);

    useEffect(() => {
        async function init() {
            // Check if already have today's session
            let session = getTodaySession();
            let qIds: string[];

            if (session && !session.completed) {
                qIds = session.questionIds.filter(id => !session!.completedIds.includes(id));
            } else if (session?.completed) {
                setFinished(true);
                setLoading(false);
                return;
            } else {
                // Build new session
                const dueItems = getDueItems();
                const dueIds = dueItems.map(i => i.questionId);
                const weakTopics = getWeakTopicsFromMocks();

                // Get weak topic question IDs
                let weakIds: string[] = [];
                if (weakTopics.length > 0) {
                    const topicParam = weakTopics.map(t => t.topicId).slice(0, 2).join(",");
                    const res = await fetch(`/api/questions?topicId=${topicParam}&mode=practice`);
                    const data = await res.json();
                    weakIds = (data.questions || []).map((q: Question) => q.id);
                }

                // Get all IDs for random fill
                const allRes = await fetch("/api/questions?mode=practice");
                const allData = await allRes.json();
                const allIds = (allData.questions || []).map((q: Question) => q.id);

                qIds = buildDailySession(dueIds, weakIds, allIds);
                saveTodaySession(qIds);
            }

            if (qIds.length === 0) { setFinished(true); setLoading(false); return; }

            // Fetch the questions
            const resp = await fetch(`/api/questions?questionIds=${qIds.join(",")}&mode=practice`);
            const data = await resp.json();

            // Sort to match qIds order
            const qMap = new Map<string, Question>();
            for (const q of data.questions || []) qMap.set(q.id, q);
            const ordered = qIds.map(id => qMap.get(id)).filter(Boolean) as Question[];

            setQuestions(ordered);
            setStreak(getStreak().currentStreak);
            setLoading(false);
        }
        init();
    }, []);

    const current = questions[currentIdx];
    const correctAnswer = current?.answers.find(a => a.isCorrect);

    const handleSelect = useCallback((answerId: string) => {
        if (showResult) return;
        setSelected(answerId);
        setShowResult(true);

        const isCorrect = current.answers.find(a => a.id === answerId)?.isCorrect ?? false;
        setResults(prev => [...prev, { qId: current.id, correct: isCorrect }]);

        // Save progress
        saveAnswer(current.id, current.topicId, isCorrect);
        markCompleted(current.id);
        recordActivity();

        // Update SM-2 review
        updateReview(current.id, isCorrect);
    }, [showResult, current]);

    const handleNext = useCallback(() => {
        if (currentIdx + 1 >= questions.length) {
            setFinished(true);
            return;
        }
        setCurrentIdx(p => p + 1);
        setSelected(null);
        setShowResult(false);
        setAiExplain(null);
    }, [currentIdx, questions.length]);

    const handleAI = useCallback(async () => {
        if (!correctAnswer || !current) return;
        const wrong = selected ? current.answers.find(a => a.id === selected)?.content : "";
        setAiExplain({ explanation: "", tip: "", loading: true });
        const r = await explainMistake(current.content, wrong || "", correctAnswer.content, current.explanation);
        setAiExplain({ explanation: r.explanation, tip: r.tip, loading: false });
    }, [current, correctAnswer, selected]);

    const totalCorrect = results.filter(r => r.correct).length;

    if (loading) {
        return (
            <div className={styles.page}>
                <header className={styles.header}><div className={styles.headerInner}><Link href="/" className={styles.backBtn}>←</Link><h1 className={styles.headerTitle}>⚡ Học 5 phút</h1><div style={{ width: 32 }} /></div></header>
                <div className={styles.loading}><div className={styles.spinner} /> Đang tạo bài học...</div>
            </div>
        );
    }

    if (finished) {
        return (
            <div className={styles.page}>
                <header className={styles.header}><div className={styles.headerInner}><Link href="/" className={styles.backBtn}>←</Link><h1 className={styles.headerTitle}>⚡ Kết quả phiên học</h1><div style={{ width: 32 }} /></div></header>
                <main className={styles.main}>
                    <div className={styles.finishCard}>
                        <div className={styles.finishEmoji}>🎯</div>
                        <h2 className={styles.finishTitle}>Phiên học hoàn tất!</h2>
                        <div className={styles.finishStats}>
                            <div className={styles.finishStat}><span className={styles.finishStatNum}>{totalCorrect}/{results.length}</span><span className={styles.finishStatLabel}>Đúng</span></div>
                            <div className={styles.finishStat}><span className={styles.finishStatNum}>{results.length > 0 ? Math.round(totalCorrect / results.length * 100) : 0}%</span><span className={styles.finishStatLabel}>Chính xác</span></div>
                            <div className={styles.finishStat}><span className={styles.finishStatNum}>🔥{getStreak().currentStreak}</span><span className={styles.finishStatLabel}>Chuỗi ngày</span></div>
                        </div>
                        <div className={styles.finishActions}>
                            <Link href="/" className={styles.primaryBtn}>🏠 Về trang chủ</Link>
                            <Link href="/so-tay-sai" className={styles.outlineBtn}>📓 Xem câu sai</Link>
                        </div>
                    </div>
                </main>
            </div>
        );
    }

    return (
        <div className={styles.page}>
            <header className={styles.header}>
                <div className={styles.headerInner}>
                    <Link href="/" className={styles.backBtn}>←</Link>
                    <h1 className={styles.headerTitle}>⚡ Học 5 phút</h1>
                    <span className={styles.progress}>{currentIdx + 1}/{questions.length}</span>
                </div>
                <div className={styles.progressBarWrap}><div className={styles.progressBar} style={{ width: `${((currentIdx + (showResult ? 1 : 0)) / questions.length) * 100}%` }} /></div>
            </header>

            <main className={styles.main}>
                <div className={styles.questionCard}>
                    <p className={styles.questionText}>{current.content}</p>
                    {current.imageUrl && <img src={current.imageUrl} alt="" className={styles.questionImage} />}
                    <div className={styles.answerList}>
                        {current.answers.map(a => {
                            let cls = styles.answerBtn;
                            if (showResult) {
                                if (a.isCorrect) cls += ` ${styles.answerCorrect}`;
                                else if (a.id === selected && !a.isCorrect) cls += ` ${styles.answerWrong}`;
                            } else if (a.id === selected) {
                                cls += ` ${styles.answerSelected}`;
                            }
                            return (
                                <button key={a.id} className={cls} onClick={() => handleSelect(a.id)} disabled={showResult}>
                                    {a.content}
                                </button>
                            );
                        })}
                    </div>

                    {showResult && (
                        <div className={styles.resultSection}>
                            {current.explanation && <p className={styles.explanation}>📖 {current.explanation}</p>}
                            {selected && !current.answers.find(a => a.id === selected)?.isCorrect && (
                                <button className={styles.aiBtn} onClick={handleAI} disabled={aiExplain?.loading}>
                                    {aiExplain?.loading ? "⏳ Đang hỏi AI..." : "🤖 Vì sao sai?"}
                                </button>
                            )}
                            {aiExplain && !aiExplain.loading && (
                                <div className={styles.aiResponse}>
                                    <p>{aiExplain.explanation}</p>
                                    {aiExplain.tip && <p className={styles.aiTip}>💡 {aiExplain.tip}</p>}
                                </div>
                            )}
                            <button className={styles.nextBtn} onClick={handleNext}>
                                {currentIdx + 1 >= questions.length ? "✅ Hoàn tất" : "➡️ Câu tiếp theo"}
                            </button>
                        </div>
                    )}
                </div>
            </main>
        </div>
    );
}
