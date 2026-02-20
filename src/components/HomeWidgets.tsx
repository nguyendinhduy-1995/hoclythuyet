"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import styles from "./HomeWidgets.module.css";
import { getStreak } from "@/lib/streakStore";
import { getDueCount } from "@/lib/reviewStore";
import { getDiagnostic } from "@/lib/aiClient";

interface Props {
    accuracy: number;
    totalAnswered: number;
}

export function ActionStrip() {
    const [streakCount, setStreakCount] = useState(0);
    const [dueCount, setDueCount] = useState(0);
    const [mounted, setMounted] = useState(false);

    useEffect(() => {
        setMounted(true);
        setStreakCount(getStreak().currentStreak);
        setDueCount(getDueCount());
        const handleFocus = () => {
            setStreakCount(getStreak().currentStreak);
            setDueCount(getDueCount());
        };
        window.addEventListener("focus", handleFocus);
        window.addEventListener("progress-updated", handleFocus);
        return () => {
            window.removeEventListener("focus", handleFocus);
            window.removeEventListener("progress-updated", handleFocus);
        };
    }, []);

    if (!mounted) return null;

    return (
        <div className={styles.actionStrip}>
            <div className={styles.stripItem}>
                <span className={styles.stripEmoji}>🔥</span>
                <span className={styles.stripValue}>{streakCount}</span>
                <span className={styles.stripLabel}>Chuỗi ngày</span>
            </div>
            <div className={styles.stripDivider} />
            <div className={styles.stripItem}>
                <span className={styles.stripEmoji}>📚</span>
                <span className={styles.stripValue}>{dueCount}</span>
                <span className={styles.stripLabel}>Cần ôn</span>
            </div>
            <div className={styles.stripDivider} />
            <Link href="/daily" className={styles.stripCta}>
                ⚡ Học 5 phút
            </Link>
        </div>
    );
}

export function AICoachCard({ accuracy, totalAnswered }: Props) {
    const [aiText, setAiText] = useState("");
    const [strengths, setStrengths] = useState<string[]>([]);
    const [weaknesses, setWeaknesses] = useState<string[]>([]);
    const [loading, setLoading] = useState(false);
    const [done, setDone] = useState(false);
    const [mounted, setMounted] = useState(false);

    useEffect(() => {
        setMounted(true);
    }, []);

    useEffect(() => {
        if (!mounted || totalAnswered < 5 || done) return;

        setLoading(true);
        getDiagnostic({
            accuracy,
            dueCount: getDueCount(),
            streak: getStreak().currentStreak,
            weakTopics: [],
            recentMockScore: null,
            totalAnswered,
        })
            .then((data) => {
                if (!data.error && data.passRate) {
                    setStrengths(data.strengths || []);
                    setWeaknesses(data.weaknesses || []);
                    // Typing effect
                    const text = `Tỉ lệ đậu ước tính: ${data.passRate}%. ${data.todayPlan || ""}`;
                    let i = 0;
                    const timer = setInterval(() => {
                        setAiText(text.slice(0, i + 1));
                        i++;
                        if (i >= text.length) clearInterval(timer);
                    }, 30);
                }
            })
            .catch(() => { })
            .finally(() => {
                setLoading(false);
                setDone(true);
            });
    }, [mounted, totalAnswered, accuracy, done]);

    if (!mounted || (totalAnswered < 5 && !loading)) return null;

    if (!loading && !aiText && !strengths.length) return null;

    return (
        <div className={styles.aiCoachCard}>
            <div className={styles.aiCoachHeader}>
                <span className={styles.aiCoachIcon}>🤖</span>
                <span className={styles.aiCoachTitle}>Hướng dẫn từ thầy</span>
                {loading && (
                    <span className={styles.aiCoachLoading}>đang phân tích...</span>
                )}
            </div>
            {aiText && (
                <p className={styles.aiCoachText}>
                    {aiText}
                    <span className={styles.cursor}>|</span>
                </p>
            )}
            {strengths.length > 0 && !loading && (
                <div className={styles.aiCoachMeta}>
                    <span
                        className={styles.aiCoachBadge}
                        style={{
                            background: "rgba(34,197,94,0.1)",
                            color: "#166534",
                        }}
                    >
                        💪 {strengths[0]}
                    </span>
                    {weaknesses.length > 0 && (
                        <span
                            className={styles.aiCoachBadge}
                            style={{
                                background: "rgba(239,68,68,0.1)",
                                color: "#991b1b",
                            }}
                        >
                            ⚡ {weaknesses[0]}
                        </span>
                    )}
                </div>
            )}
        </div>
    );
}
