"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import Link from "next/link";
import styles from "./page.module.css";
import { saveAnswer, saveAnswersBatch } from "@/lib/progressStore";
import { getComment, saveComment } from "@/lib/commentStore";
import { isBookmarked as checkBookmarked, toggleBookmark } from "@/lib/bookmarkStore";

interface Answer {
    id: string;
    content: string;
    isCorrect: boolean;
}

interface Question {
    id: string;
    content: string;
    answers: Answer[];
    explanation?: string;
    topicId: string;
    imageUrl?: string | null;
    isCritical?: boolean;
}

interface ExamConfig {
    id: string;
    questionCount: number;
    isPractice: boolean;
    topicId: string | null;
    timeLimit: number; // seconds, 0 = unlimited
    passThreshold: number;
    examLabel: string;
}

interface Props {
    initialQuestions: Question[];
    config: ExamConfig;
}

export default function ExamClient({ initialQuestions, config }: Props) {
    const [currentIndex, setCurrentIndex] = useState(0);
    const [answers, setAnswers] = useState<Record<string, string>>({});
    const [revealed, setRevealed] = useState<Record<string, boolean>>({});
    const [timeLeft, setTimeLeft] = useState(config.timeLimit);
    const [submitted, setSubmitted] = useState(false);
    const [showResult, setShowResult] = useState(false);
    const mobileGridRef = useRef<HTMLDivElement>(null);
    const savedRef = useRef<Set<string>>(new Set()); // Track already-saved question IDs
    const [noteText, setNoteText] = useState("");
    const [showNote, setShowNote] = useState(false);
    const [slideDirection, setSlideDirection] = useState<'none' | 'left' | 'right'>('none');
    const touchStartRef = useRef<{ x: number; y: number } | null>(null);

    const [bookmarked, setBookmarked] = useState<Record<string, boolean>>({});

    const questions = initialQuestions;
    const currentQ = questions[currentIndex];

    // Load bookmark status for current question
    useEffect(() => {
        if (currentQ && bookmarked[currentQ.id] === undefined) {
            setBookmarked(prev => ({ ...prev, [currentQ.id]: checkBookmarked(currentQ.id) }));
        }
    }, [currentQ, bookmarked]);

    // Timer
    useEffect(() => {
        if (config.isPractice || config.timeLimit === 0 || submitted) return;
        const interval = setInterval(() => {
            setTimeLeft((prev) => {
                if (prev <= 1) {
                    clearInterval(interval);
                    setSubmitted(true);
                    setShowResult(true);
                    return 0;
                }
                return prev - 1;
            });
        }, 1000);
        return () => clearInterval(interval);
    }, [config.isPractice, config.timeLimit, submitted]);

    // Save all answers when exam is submitted (exam mode)
    useEffect(() => {
        if (!submitted || config.isPractice) return;

        const results = questions.map((q) => {
            const userAnswer = answers[q.id];
            const correctAnswer = q.answers.find((a) => a.isCorrect);
            const isCorrect = !!(correctAnswer && userAnswer === correctAnswer.id);
            return {
                questionId: q.id,
                topicId: q.topicId,
                isCorrect,
            };
        });

        // Only save answered questions
        const answeredResults = results.filter((r) => answers[r.questionId]);
        saveAnswersBatch(answeredResults);
    }, [submitted, config.isPractice, questions, answers]);

    // Scroll mobile grid to active item
    useEffect(() => {
        if (mobileGridRef.current) {
            const activeItem = mobileGridRef.current.children[currentIndex] as HTMLElement;
            if (activeItem) {
                activeItem.scrollIntoView({ behavior: "smooth", block: "nearest", inline: "center" });
            }
        }
    }, [currentIndex]);



    // Swipe gesture handlers
    const handleTouchStart = useCallback((e: React.TouchEvent) => {
        touchStartRef.current = { x: e.touches[0].clientX, y: e.touches[0].clientY };
    }, []);

    const handleTouchEnd = useCallback((e: React.TouchEvent) => {
        if (!touchStartRef.current) return;
        const dx = e.changedTouches[0].clientX - touchStartRef.current.x;
        const dy = e.changedTouches[0].clientY - touchStartRef.current.y;
        touchStartRef.current = null;

        // Only trigger if horizontal swipe > 60px and mostly horizontal
        if (Math.abs(dx) < 60 || Math.abs(dy) > Math.abs(dx) * 0.7) return;

        if (dx < 0 && currentIndex < questions.length - 1) {
            // Swipe left → next
            setSlideDirection('left');
            setTimeout(() => {
                setCurrentIndex(i => Math.min(i + 1, questions.length - 1));
                setSlideDirection('none');
            }, 150);
        } else if (dx > 0 && currentIndex > 0) {
            // Swipe right → previous
            setSlideDirection('right');
            setTimeout(() => {
                setCurrentIndex(i => Math.max(i - 1, 0));
                setSlideDirection('none');
            }, 150);
        }
    }, [currentIndex, questions.length]);

    const formatTime = (seconds: number) => {
        const m = Math.floor(seconds / 60);
        const s = seconds % 60;
        return `${m.toString().padStart(2, "0")}:${s.toString().padStart(2, "0")}`;
    };

    const handleAnswer = useCallback((questionId: string, answerId: string) => {
        if (submitted) return;
        if (!config.isPractice && answers[questionId]) return; // No change in exam mode

        // Haptic feedback
        if (typeof navigator !== 'undefined' && navigator.vibrate) {
            navigator.vibrate(30);
        }

        setAnswers((prev) => ({ ...prev, [questionId]: answerId }));

        if (config.isPractice) {
            setRevealed((prev) => ({ ...prev, [questionId]: true }));

            // Save to localStorage immediately in practice mode
            if (!savedRef.current.has(questionId)) {
                const question = questions.find((q) => q.id === questionId);
                if (question) {
                    const correctAnswer = question.answers.find((a) => a.isCorrect);
                    const isCorrect = !!(correctAnswer && answerId === correctAnswer.id);
                    saveAnswer(questionId, question.topicId, isCorrect);
                    savedRef.current.add(questionId);
                }
            }
        }
    }, [submitted, config.isPractice, answers, questions]);

    const handleSubmit = useCallback(() => {
        setSubmitted(true);
        setShowResult(true);
    }, []);

    const goTo = useCallback((idx: number) => {
        if (idx >= 0 && idx < questions.length) {
            setCurrentIndex(idx);
        }
    }, [questions.length]);

    // Results calculation
    const getResults = () => {
        let correct = 0;
        let wrong = 0;
        let criticalFail = false;

        questions.forEach((q) => {
            const userAnswer = answers[q.id];
            if (!userAnswer) return;
            const correctAnswer = q.answers.find((a) => a.isCorrect);
            if (correctAnswer && userAnswer === correctAnswer.id) {
                correct++;
            } else {
                wrong++;
                if (q.isCritical) criticalFail = true;
            }
        });

        const passed = !criticalFail && correct >= config.passThreshold;
        return { correct, wrong, unanswered: questions.length - correct - wrong, passed, criticalFail };
    };

    const isRevealed = config.isPractice ? revealed[currentQ?.id] : submitted;

    const getAnswerClass = (answer: Answer, questionId: string) => {
        const isSelected = answers[questionId] === answer.id;
        const shouldReveal = config.isPractice ? revealed[questionId] : submitted;

        if (!shouldReveal) {
            return `${styles.answerOption} ${isSelected ? styles.selected : ""}`;
        }

        if (answer.isCorrect) {
            return `${styles.answerOption} ${styles.correct} ${styles.disabled}`;
        }

        if (isSelected && !answer.isCorrect) {
            return `${styles.answerOption} ${styles.wrong} ${styles.disabled}`;
        }

        return `${styles.answerOption} ${styles.disabled}`;
    };

    const getGridItemClass = (idx: number) => {
        const q = questions[idx];
        const isActive = idx === currentIndex;
        const userAnswer = answers[q.id];
        const shouldReveal = config.isPractice ? revealed[q.id] : submitted;

        if (isActive) return `${styles.gridItem} ${styles.gridItemActive}`;

        if (shouldReveal && userAnswer) {
            const correctAnswer = q.answers.find((a) => a.isCorrect);
            if (correctAnswer && userAnswer === correctAnswer.id) {
                return `${styles.gridItem} ${styles.gridItemCorrect}`;
            }
            return `${styles.gridItem} ${styles.gridItemWrong}`;
        }

        if (userAnswer) return `${styles.gridItem} ${styles.gridItemAnswered}`;

        return styles.gridItem;
    };

    if (!currentQ) {
        return (
            <div className={styles.examPage}>
                <div style={{ display: "flex", alignItems: "center", justifyContent: "center", flex: 1, color: "#64748b", flexDirection: "column", gap: "1rem" }}>
                    <p>Không có câu hỏi nào.</p>
                    <Link href="/" style={{ color: "#f97316", fontWeight: 600 }}>← Về trang chủ</Link>
                </div>
            </div>
        );
    }

    const results = getResults();

    return (
        <div className={styles.examPage}>
            {/* Header */}
            <header className={styles.examHeader}>
                <div className={styles.examHeaderInner}>
                    <Link href="/" className={styles.backBtn}>←</Link>
                    <div className={styles.examInfo}>
                        <div className={styles.examLabel}>{config.examLabel}</div>
                        <div className={styles.examProgress}>
                            Câu {currentIndex + 1}/{questions.length}
                            {!config.isPractice && ` • Đã trả lời ${Object.keys(answers).length}/${questions.length}`}
                        </div>
                    </div>
                    {!config.isPractice && config.timeLimit > 0 && (
                        <div className={`${styles.timer} ${timeLeft < 60 ? styles.timerDanger : ""}`}>
                            ⏱ {formatTime(timeLeft)}
                        </div>
                    )}
                </div>
            </header>

            {/* Body */}
            <div
                className={styles.examBody}
                onTouchStart={handleTouchStart}
                onTouchEnd={handleTouchEnd}
            >
                {/* Question Panel */}
                <div className={`${styles.questionPanel} ${slideDirection === 'left' ? styles.slideOutLeft : slideDirection === 'right' ? styles.slideOutRight : ''}`}>
                    <div className={styles.questionCard}>
                        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1rem' }}>
                            <div className={`${styles.questionNumber} ${currentQ.isCritical ? styles.criticalBadge : ""}`}>
                                {currentQ.isCritical && "🔥 "}
                                Câu {currentIndex + 1}
                                {currentQ.isCritical && " — Điểm liệt"}
                            </div>
                            <button
                                className={styles.bookmarkBtn}
                                onClick={() => {
                                    const result = toggleBookmark(currentQ.id);
                                    setBookmarked(prev => ({ ...prev, [currentQ.id]: result }));
                                }}
                                title={bookmarked[currentQ.id] ? 'Bỏ đánh dấu' : 'Đánh dấu câu hỏi'}
                            >
                                {bookmarked[currentQ.id] ? '⭐' : '☆'}
                            </button>
                        </div>

                        <p className={styles.questionText}>{currentQ.content}</p>

                        {currentQ.imageUrl && (
                            <img src={currentQ.imageUrl} alt="" className={styles.questionImage} />
                        )}

                        <div className={styles.answerList}>
                            {currentQ.answers.map((answer) => (
                                <div
                                    key={answer.id}
                                    className={getAnswerClass(answer, currentQ.id)}
                                    onClick={() => handleAnswer(currentQ.id, answer.id)}
                                >
                                    <div className={styles.answerRadio} />
                                    <span className={styles.answerText}>{answer.content}</span>
                                </div>
                            ))}
                        </div>

                        {isRevealed && currentQ.explanation && (
                            <div className={styles.explanation}>
                                💡 {currentQ.explanation}
                            </div>
                        )}

                        {/* Personal Note */}
                        {config.isPractice && (
                            <div className={styles.noteSection}>
                                <button
                                    className={styles.noteToggle}
                                    onClick={() => {
                                        if (!showNote) {
                                            setNoteText(getComment(currentQ.id));
                                        }
                                        setShowNote(!showNote);
                                    }}
                                >
                                    📝 {showNote ? "Ẩn ghi chú" : "Ghi chú"}
                                    {!showNote && getComment(currentQ.id) && " ✅"}
                                </button>
                                {showNote && (
                                    <div className={styles.noteEditor}>
                                        <textarea
                                            className={styles.noteTextarea}
                                            placeholder="Ghi chú cá nhân cho câu hỏi này..."
                                            value={noteText}
                                            onChange={(e) => setNoteText(e.target.value)}
                                            rows={3}
                                        />
                                        <button
                                            className={styles.noteSaveBtn}
                                            onClick={() => {
                                                saveComment(currentQ.id, noteText);
                                                setShowNote(false);
                                            }}
                                        >
                                            💾 Lưu ghi chú
                                        </button>
                                    </div>
                                )}
                            </div>
                        )}
                    </div>

                    {/* Navigation */}
                    <div className={styles.navBar}>
                        <button
                            className={`${styles.navBtn} ${styles.navBtnPrev} ${currentIndex === 0 ? styles.navBtnDisabled : ""}`}
                            onClick={() => goTo(currentIndex - 1)}
                            disabled={currentIndex === 0}
                        >
                            ← Trước
                        </button>

                        {currentIndex < questions.length - 1 ? (
                            <button
                                className={`${styles.navBtn} ${styles.navBtnNext}`}
                                onClick={() => goTo(currentIndex + 1)}
                            >
                                Tiếp →
                            </button>
                        ) : !config.isPractice && !submitted ? (
                            <button
                                className={`${styles.navBtn} ${styles.navBtnSubmit}`}
                                onClick={handleSubmit}
                            >
                                Nộp bài ✓
                            </button>
                        ) : (
                            <button
                                className={`${styles.navBtn} ${styles.navBtnNext} ${styles.navBtnDisabled}`}
                                disabled
                            >
                                Hết câu
                            </button>
                        )}
                    </div>
                </div>

                {/* Side Panel — Question Grid */}
                <div className={styles.sidePanel}>
                    <div className={styles.questionGrid}>
                        <div className={styles.gridTitle}>Bảng câu hỏi</div>
                        <div className={styles.gridItems}>
                            {questions.map((_, idx) => (
                                <div
                                    key={idx}
                                    className={getGridItemClass(idx)}
                                    onClick={() => goTo(idx)}
                                >
                                    {idx + 1}
                                </div>
                            ))}
                        </div>
                    </div>
                </div>
            </div>

            {/* Mobile Question Grid */}
            <div className={styles.mobileGrid}>
                <div className={styles.mobileGridItems} ref={mobileGridRef}>
                    {questions.map((_, idx) => (
                        <div
                            key={idx}
                            className={`${styles.mobileGridItem} ${getGridItemClass(idx).replace(styles.gridItem, "").trim()}`}
                            onClick={() => goTo(idx)}
                        >
                            {idx + 1}
                        </div>
                    ))}
                </div>
            </div>

            {/* Result Overlay */}
            {showResult && (
                <div className={styles.resultOverlay}>
                    {results.passed && (
                        <div className={styles.confettiContainer}>
                            {Array.from({ length: 30 }).map((_, i) => (
                                <div
                                    key={i}
                                    className={styles.confetti}
                                    style={{
                                        left: `${Math.random() * 100}%`,
                                        animationDelay: `${Math.random() * 2}s`,
                                        animationDuration: `${2 + Math.random() * 2}s`,
                                        background: ['#f97316', '#4CAF50', '#FF9800', '#E91E63', '#9C27B0', '#00BCD4'][i % 6],
                                    }}
                                />
                            ))}
                        </div>
                    )}
                    <div className={styles.resultCard}>
                        <div className={styles.resultIcon}>
                            {results.passed ? "🎉" : "😔"}
                        </div>
                        <h2 className={`${styles.resultTitle} ${results.passed ? styles.resultPass : styles.resultFail}`}>
                            {results.passed ? "CHÚC MỪNG — ĐẠT!" : "CHƯA ĐẠT"}
                        </h2>
                        {results.criticalFail && (
                            <p style={{ color: "#F44336", fontSize: "0.8125rem", marginTop: "0.5rem" }}>
                                ⚠️ Trả lời sai câu điểm liệt
                            </p>
                        )}
                        <div className={styles.resultScore}>
                            {results.correct}/{questions.length}
                        </div>
                        <div className={styles.resultDetails}>
                            <span>✅ Đúng: {results.correct}</span>
                            <span>❌ Sai: {results.wrong}</span>
                            <span>⬜ Bỏ: {results.unanswered}</span>
                        </div>
                        <div className={styles.resultActions}>
                            <Link href="/" className={`${styles.resultBtn} ${styles.resultBtnSecondary}`}>
                                Trang chủ
                            </Link>
                            <button
                                className={`${styles.resultBtn} ${styles.resultBtnPrimary}`}
                                onClick={() => setShowResult(false)}
                            >
                                Xem lại
                            </button>
                        </div>
                        <button
                            className={styles.shareBtn}
                            onClick={async () => {
                                const text = `📋 Kết quả thi sát hạch\n✅ Đúng: ${results.correct}/${questions.length}\n❌ Sai: ${results.wrong}\n${results.passed ? '🎉 KẾT QUẢ: ĐẠT!' : '😔 KẾT QUẢ: CHƯA ĐẠT'}\n\n🚗 Học Lý Thuyết Cùng Thầy Duy`;
                                try {
                                    if (navigator.share) {
                                        await navigator.share({ title: 'Kết quả thi sát hạch', text });
                                    } else {
                                        await navigator.clipboard.writeText(text);
                                        alert('Đã sao chép kết quả!');
                                    }
                                } catch {
                                    // User cancelled sharing
                                }
                            }}
                        >
                            📤 Chia sẻ kết quả
                        </button>
                    </div>
                </div>
            )}
        </div>
    );
}
