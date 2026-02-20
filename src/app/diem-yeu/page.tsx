"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import styles from "./page.module.css";
import { getOverallStats, getTopicStats } from "@/lib/progressStore";
import { getWeakTopicsFromMocks } from "@/lib/mockStore";

const TOPICS = [
    { id: "t-khai-niem", name: "Khái niệm & quy tắc", icon: "📚" },
    { id: "t-van-hoa", name: "Văn hóa giao thông", icon: "🤝" },
    { id: "t-ky-thuat", name: "Kỹ thuật lái xe", icon: "🔧" },
    { id: "t-cau-tao", name: "Cấu tạo sửa chữa", icon: "⚙️" },
    { id: "t-bien-bao", name: "Biển báo đường bộ", icon: "🚧" },
    { id: "t-tinh-huong", name: "Sa hình tình huống", icon: "🖼️" },
];

interface TopicWeakness {
    id: string;
    name: string;
    icon: string;
    accuracy: number;
    answered: number;
    total: number;
    correct: number;
    wrong: number;
}

export default function DiemYeuPage() {
    const [topics, setTopics] = useState<TopicWeakness[]>([]);
    const [overall, setOverall] = useState({ total: 600, answered: 0, correct: 0, wrong: 0 });

    useEffect(() => {
        const stats = getOverallStats();
        setOverall(stats);

        const topicData: TopicWeakness[] = TOPICS.map(t => {
            const s = getTopicStats(t.id);
            return {
                id: t.id, name: t.name, icon: t.icon,
                accuracy: s.answered > 0 ? Math.round((s.correct / s.answered) * 100) : -1,
                answered: s.answered, total: s.total, correct: s.correct, wrong: s.wrong,
            };
        }).sort((a, b) => {
            if (a.accuracy === -1) return 1;
            if (b.accuracy === -1) return -1;
            return a.accuracy - b.accuracy;
        });

        setTopics(topicData);
    }, []);

    const overallAccuracy = overall.answered > 0 ? Math.round((overall.correct / overall.answered) * 100) : 0;

    return (
        <div className={styles.page}>
            <header className={styles.header}>
                <div className={styles.headerInner}>
                    <Link href="/" className={styles.backBtn}>←</Link>
                    <h1 className={styles.headerTitle}>📊 Phân tích điểm yếu</h1>
                    <div style={{ width: 32 }} />
                </div>
            </header>

            <main className={styles.main}>
                {/* Overall */}
                <div className={styles.overviewCard}>
                    <div className={styles.gauge}>
                        <svg width={100} height={100} viewBox="0 0 100 100">
                            <circle cx={50} cy={50} r={42} fill="none" stroke="var(--border)" strokeWidth={8} />
                            <circle cx={50} cy={50} r={42} fill="none" stroke={overallAccuracy >= 80 ? "#22c55e" : overallAccuracy >= 50 ? "#f59e0b" : "#ef4444"} strokeWidth={8} strokeDasharray={`${overallAccuracy * 2.64} 264`} strokeLinecap="round" transform="rotate(-90 50 50)" />
                            <text x={50} y={46} textAnchor="middle" fontSize={22} fontWeight={800} fill="var(--heading)">{overallAccuracy}%</text>
                            <text x={50} y={62} textAnchor="middle" fontSize={9} fill="var(--muted)">Chính xác</text>
                        </svg>
                    </div>
                    <div className={styles.overviewStats}>
                        <div className={styles.oStat}><span className={styles.oNum}>{overall.answered}</span><span className={styles.oLabel}>Đã làm</span></div>
                        <div className={styles.oStat}><span className={styles.oNum} style={{ color: "#22c55e" }}>{overall.correct}</span><span className={styles.oLabel}>Đúng</span></div>
                        <div className={styles.oStat}><span className={styles.oNum} style={{ color: "#ef4444" }}>{overall.wrong}</span><span className={styles.oLabel}>Sai</span></div>
                    </div>
                </div>

                {/* Topic breakdown */}
                <h2 className={styles.sectionTitle}>📋 Theo chủ đề</h2>
                <div className={styles.topicList}>
                    {topics.map(t => (
                        <div key={t.id} className={styles.topicCard}>
                            <div className={styles.topicHeader}>
                                <span className={styles.topicIcon}>{t.icon}</span>
                                <div className={styles.topicInfo}>
                                    <span className={styles.topicName}>{t.name}</span>
                                    <span className={styles.topicMeta}>
                                        {t.answered}/{t.total} câu • {t.correct} đúng • {t.wrong} sai
                                    </span>
                                </div>
                                <span className={`${styles.topicAccuracy} ${t.accuracy >= 80 ? styles.acc80 : t.accuracy >= 50 ? styles.acc50 : t.accuracy >= 0 ? styles.accLow : styles.accNone}`}>
                                    {t.accuracy >= 0 ? `${t.accuracy}%` : "—"}
                                </span>
                            </div>
                            <div className={styles.topicBar}>
                                <div className={styles.topicBarFill} style={{ width: `${t.accuracy >= 0 ? t.accuracy : 0}%`, background: t.accuracy >= 80 ? "#22c55e" : t.accuracy >= 50 ? "#f59e0b" : "#ef4444" }} />
                            </div>
                            {t.accuracy >= 0 && t.accuracy < 70 && (
                                <Link href={`/exam/10?topicId=${t.id}&mode=practice`} className={styles.practiceBtn}>
                                    🔄 Ôn chủ đề này
                                </Link>
                            )}
                        </div>
                    ))}
                </div>
            </main>
        </div>
    );
}
