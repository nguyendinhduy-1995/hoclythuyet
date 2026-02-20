"use client";

import { useState } from "react";
import Link from "next/link";
import styles from "./page.module.css";
import sahinhData from "@/data/sahinh.json";

type Lesson = (typeof sahinhData.lessons)[number];

export default function SaHinhPage() {
    const [openLessons, setOpenLessons] = useState<Set<string>>(new Set());

    const toggleLesson = (id: string) => {
        setOpenLessons((prev) => {
            const next = new Set(prev);
            if (next.has(id)) next.delete(id);
            else next.add(id);
            return next;
        });
    };

    return (
        <div className={styles.page}>
            <header className={styles.header}>
                <div className={styles.headerInner}>
                    <Link href="/" className={styles.backBtn}>← Trang chủ</Link>
                    <h1 className={styles.headerTitle}>🏁 Sa hình</h1>
                    <div style={{ width: 80 }} />
                </div>
            </header>

            <main className={styles.main}>
                {/* Overview */}
                <div className={styles.overviewCard}>
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img
                        src="/images/sa-hinh/tip_practice_sahinh.jpg"
                        alt="Sa hình tổng quan"
                        style={{ width: 'calc(100% + 2.5rem)', margin: '-1.25rem -1.25rem 1rem -1.25rem', height: 180, objectFit: 'cover', display: 'block' }}
                    />
                    <h2 className={styles.overviewTitle}>{sahinhData.overview.title}</h2>
                    <p className={styles.overviewDesc}>{sahinhData.overview.description}</p>
                    <div className={styles.overviewStats}>
                        <div className={styles.overviewStat}>
                            <span className={styles.statNumber}>10</span>
                            <span className={styles.statLabel}>Bài thi</span>
                        </div>
                        <div className={styles.overviewStat}>
                            <span className={styles.statNumber}>~15</span>
                            <span className={styles.statLabel}>Phút</span>
                        </div>
                        <div className={styles.overviewStat}>
                            <span className={styles.statNumber}>80</span>
                            <span className={styles.statLabel}>Điểm đạt</span>
                        </div>
                    </div>
                </div>

                {/* Lesson List */}
                <h3 className={styles.sectionTitle}>10 bài thi sa hình</h3>
                <div className={styles.lessonList}>
                    {sahinhData.lessons.map((lesson: Lesson, idx: number) => {
                        const isOpen = openLessons.has(lesson.id);
                        return (
                            <div key={lesson.id} className={styles.lessonItem}>
                                <div
                                    className={`${styles.lessonHeader} ${isOpen ? styles.lessonHeaderOpen : ""}`}
                                    onClick={() => toggleLesson(lesson.id)}
                                    role="button"
                                    tabIndex={0}
                                    onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') toggleLesson(lesson.id); }}
                                >
                                    <div className={styles.lessonLeft}>
                                        <span className={styles.lessonNumber}>{idx + 1}</span>
                                        <div className={styles.lessonInfo}>
                                            <span className={styles.lessonName}>
                                                {lesson.title.replace(/Bài \d+: /, "")}
                                            </span>
                                            <span className={styles.lessonDesc}>{lesson.description}</span>
                                        </div>
                                    </div>
                                    <span className={`${styles.chevron} ${isOpen ? styles.chevronOpen : ""}`}>
                                        ▾
                                    </span>
                                </div>

                                {isOpen && (
                                    <div className={styles.lessonContent}>
                                        {/* Lesson Image */}
                                        {(() => {
                                            const imgMap: Record<number, string> = {
                                                0: 'tip_practice_bai1.jpg', 1: 'tip_practice_bai2.jpg',
                                                2: 'tip_practice_bai3.jpg', 3: 'tip_practice_bai4.jpg',
                                                4: 'tip_practice_bai5.jpg', 5: 'tip_practice_bai6.jpg',
                                                6: 'tip_practice_bai7.jpg', 8: 'tip_practice_bai9.jpg',
                                                9: 'tip_practice_bai10.jpg',
                                            };
                                            const imgFile = imgMap[idx];
                                            if (!imgFile) return null;
                                            return (
                                                <img
                                                    src={`/images/sa-hinh/${imgFile}`}
                                                    alt={lesson.title}
                                                    style={{ width: 'calc(100% + 2rem)', margin: '0.75rem -1rem 0.5rem', height: 200, objectFit: 'cover', borderRadius: 8 }}
                                                />
                                            );
                                        })()}

                                        {/* Steps */}
                                        <div className={styles.contentSection}>
                                            <h4 className={styles.contentTitle}>📋 Các bước thực hiện</h4>
                                            <ol className={styles.stepsList}>
                                                {lesson.steps.map((step: string, i: number) => (
                                                    <li key={i} className={styles.stepItem}>
                                                        <span className={styles.stepNumber}>{i + 1}</span>
                                                        <span className={styles.stepText}>{step}</span>
                                                    </li>
                                                ))}
                                            </ol>
                                        </div>

                                        {/* Tips */}
                                        {"tips" in lesson && (lesson as Lesson & { tips: string[] }).tips.length > 0 && (
                                            <div className={styles.contentSection}>
                                                <h4 className={`${styles.contentTitle} ${styles.tipTitle}`}>
                                                    💡 Mẹo hay
                                                </h4>
                                                <ul className={styles.tipsList}>
                                                    {(lesson as Lesson & { tips: string[] }).tips.map((tip: string, i: number) => (
                                                        <li key={i} className={styles.tipItem}>
                                                            <span className={styles.tipIcon}>✓</span>
                                                            <span>{tip}</span>
                                                        </li>
                                                    ))}
                                                </ul>
                                            </div>
                                        )}

                                        {/* Common Errors */}
                                        {"commonErrors" in lesson && (lesson as Lesson & { commonErrors: string[] }).commonErrors.length > 0 && (
                                            <div className={styles.contentSection}>
                                                <h4 className={`${styles.contentTitle} ${styles.errorTitle}`}>
                                                    ⚠️ Lỗi thường gặp
                                                </h4>
                                                <ul className={styles.errorsList}>
                                                    {(lesson as Lesson & { commonErrors: string[] }).commonErrors.map((err: string, i: number) => (
                                                        <li key={i} className={styles.errorItem}>
                                                            <span className={styles.errorIcon}>✗</span>
                                                            <span>{err}</span>
                                                        </li>
                                                    ))}
                                                </ul>
                                            </div>
                                        )}
                                    </div>
                                )}
                            </div>
                        );
                    })}
                </div>
            </main>
        </div>
    );
}
