"use client";

import { useState, useMemo } from "react";
import Link from "next/link";
import styles from "./page.module.css";
import questionsData from "@/data/questions.json";

interface Answer {
    id: string;
    content: string;
    isCorrect: boolean;
}

interface Question {
    id: string;
    content: string;
    explanation: string;
    imageUrl: string | null;
    topicId: string;
    isCritical: boolean;
    answers: Answer[];
}

const TOPICS: Record<string, string> = {
    "t-diem-liet": "Điểm liệt",
    "t-khai-niem": "Khái niệm",
    "t-van-hoa": "Văn hóa GT",
    "t-ky-thuat": "Kỹ thuật",
    "t-cau-tao": "Cấu tạo",
    "t-bien-bao": "Biển báo",
    "t-tinh-huong": "Tình huống",
};

export default function TimKiemPage() {
    const [query, setQuery] = useState("");
    const [showAnswer, setShowAnswer] = useState<string | null>(null);

    const results = useMemo(() => {
        if (query.length < 2) return [];
        const q = query.toLowerCase();
        return (questionsData.questions as Question[])
            .filter((question) =>
                question.content.toLowerCase().includes(q) ||
                question.explanation.toLowerCase().includes(q) ||
                question.id.toLowerCase().includes(q)
            )
            .slice(0, 50);
    }, [query]);

    const highlightMatch = (text: string) => {
        if (!query || query.length < 2) return text;
        const regex = new RegExp(`(${query.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")})`, "gi");
        const parts = text.split(regex);
        return parts.map((part, i) =>
            regex.test(part) ? <mark key={i} className={styles.highlight}>{part}</mark> : part
        );
    };

    return (
        <div className={styles.page}>
            <header className={styles.header}>
                <div className={styles.headerInner}>
                    <Link href="/" className={styles.backBtn}>← Trang chủ</Link>
                    <h1 className={styles.headerTitle}>🔍 Tìm kiếm</h1>
                    <div style={{ width: 80 }} />
                </div>
            </header>

            <main className={styles.main}>
                <div className={styles.searchBox}>
                    <span className={styles.searchIcon}>🔍</span>
                    <input
                        type="text"
                        placeholder="Nhập từ khóa (tối thiểu 2 ký tự)..."
                        value={query}
                        onChange={(e) => setQuery(e.target.value)}
                        className={styles.searchInput}
                        autoFocus
                    />
                    {query && <button onClick={() => setQuery("")} className={styles.clearBtn}>✕</button>}
                </div>

                {query.length >= 2 && (
                    <p className={styles.resultCount}>
                        {results.length === 50 ? "50+" : results.length} kết quả
                        {results.length === 50 ? " (hiển thị 50 đầu tiên)" : ""}
                    </p>
                )}

                <div className={styles.resultsList}>
                    {results.map((q) => {
                        const isOpen = showAnswer === q.id;
                        const correctAnswer = q.answers.find((a) => a.isCorrect);
                        return (
                            <div
                                key={q.id}
                                className={`${styles.resultCard} ${isOpen ? styles.resultCardOpen : ""}`}
                                onClick={() => setShowAnswer(isOpen ? null : q.id)}
                            >
                                <div className={styles.resultMeta}>
                                    <span className={styles.resultId}>{q.id.toUpperCase()}</span>
                                    <span className={styles.resultTopic}>{TOPICS[q.topicId] || q.topicId}</span>
                                    {q.isCritical && <span className={styles.criticalBadge}>⚡ Điểm liệt</span>}
                                </div>
                                <p className={styles.resultContent}>{highlightMatch(q.content)}</p>

                                {isOpen && (
                                    <div className={styles.answerSection}>
                                        <div className={styles.correctAnswer}>
                                            <span className={styles.answerLabel}>✅ Đáp án đúng:</span>
                                            <p>{correctAnswer?.content}</p>
                                        </div>
                                        <div className={styles.explanation}>
                                            <span className={styles.answerLabel}>💡 Giải thích:</span>
                                            <p>{q.explanation}</p>
                                        </div>
                                        <Link
                                            href={`/exam/1?mode=practice&topicId=${q.topicId}`}
                                            className={styles.practiceLink}
                                            onClick={(e) => e.stopPropagation()}
                                        >
                                            📝 Ôn tập chủ đề này
                                        </Link>
                                    </div>
                                )}
                            </div>
                        );
                    })}
                </div>

                {query.length >= 2 && results.length === 0 && (
                    <div className={styles.emptyState}>
                        <span className={styles.emptyIcon}>🔍</span>
                        <p>Không tìm thấy câu hỏi nào phù hợp</p>
                    </div>
                )}

                {query.length < 2 && (
                    <div className={styles.emptyState}>
                        <span className={styles.emptyIcon}>💡</span>
                        <p>Nhập từ khóa để tìm câu hỏi</p>
                        <p className={styles.hintText}>VD: &quot;nồng độ cồn&quot;, &quot;tốc độ&quot;, &quot;biển cấm&quot;...</p>
                    </div>
                )}
            </main>
        </div>
    );
}
