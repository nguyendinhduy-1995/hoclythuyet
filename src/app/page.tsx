"use client";

import { useState, useEffect, useCallback } from "react";
import Link from "next/link";
import styles from "./page.module.css";
import {
  getOverallStats,
  getTopicStats,
  getWrongCount,
  getTopWrongIds,
  getWrongQuestionIds,
  resetProgress,
  getAccuracyRate,
  getLastStudyDate,
  type Stats,
} from "@/lib/progressStore";
import { getBookmarkCount, getBookmarkedIds } from "@/lib/bookmarkStore";
import { ActionStrip, AICoachCard } from "@/components/HomeWidgets";
import { initSyncEngine } from "@/lib/syncEngine";

/* ── Topic data with icons & colors ── */
const TOPICS = [
  { id: "t-diem-liet", name: "Câu hỏi điểm liệt", icon: "🔥", count: 60, color: "#F44336", bgColor: "#ffebee" },
  { id: "t-khai-niem", name: "Khái niệm và quy tắc", icon: "🚦", count: 180, color: "#f97316", bgColor: "#fff7ed" },
  { id: "t-van-hoa", name: "Văn hóa giao thông", icon: "🌐", count: 25, color: "#9C27B0", bgColor: "#f3e5f5" },
  { id: "t-ky-thuat", name: "Kỹ thuật lái xe", icon: "🔧", count: 58, color: "#FF9800", bgColor: "#fff3e0" },
  { id: "t-cau-tao", name: "Cấu tạo sửa chữa", icon: "⚙️", count: 37, color: "#607D8B", bgColor: "#eceff1" },
  { id: "t-bien-bao", name: "Biển báo đường bộ", icon: "🚧", count: 185, color: "#4CAF50", bgColor: "#e8f5e9" },
  { id: "t-tinh-huong", name: "Sa hình tình huống", icon: "⚠️", count: 115, color: "#FF5722", bgColor: "#fbe9e7" },
];

/* ── Exam types (Thông tư 05/2024 BGTVT) ── */
const EXAM_TYPES = [
  {
    id: "b",
    href: "/exam/30?type=B",
    icon: "🚗",
    gradient: "linear-gradient(135deg, #f97316, #ea580c)",
    badge: "Phổ biến",
    name: "Sát Hạch B",
    desc: "Ô tô con, xe ≤ 9 chỗ",
    questions: 30,
    time: 20,
    pass: 27,
  },
  {
    id: "c1",
    href: "/exam/35?type=C1",
    icon: "🚛",
    gradient: "linear-gradient(135deg, #4CAF50, #2E7D32)",
    name: "Sát Hạch C1",
    desc: "Xe tải > 3.5 tấn",
    questions: 35,
    time: 22,
    pass: 32,
  },
];

/* ── Upgrade paths (Thông tư 35/2024 BGTVT) ── */
const UPGRADE_PATHS = [
  { from: "B", to: "C1", questions: 35, time: 22, pass: 32, color: "#f97316" },
  { from: "B", to: "C", questions: 40, time: 24, pass: 36, color: "#4CAF50" },
  { from: "B", to: "D1", questions: 40, time: 24, pass: 36, color: "#9C27B0" },
  { from: "C1", to: "C", questions: 40, time: 24, pass: 36, color: "#4CAF50" },
  { from: "C", to: "D", questions: 40, time: 24, pass: 36, color: "#E91E63" },
];

export default function Home() {
  const [overall, setOverall] = useState<Stats>({ total: 600, answered: 0, correct: 0, wrong: 0 });
  const [topicStats, setTopicStats] = useState<Record<string, Stats>>({});
  const [wrongCount, setWrongCount] = useState(0);
  const [accuracy, setAccuracy] = useState(0);
  const [lastStudy, setLastStudy] = useState<number | null>(null);
  const [showResetConfirm, setShowResetConfirm] = useState(false);
  const [toast, setToast] = useState<string | null>(null);

  const showToast = (msg: string) => {
    setToast(msg);
    setTimeout(() => setToast(null), 2500);
  };

  const loadProgress = useCallback(() => {
    setOverall(getOverallStats());
    setWrongCount(getWrongCount());
    setAccuracy(getAccuracyRate());
    setLastStudy(getLastStudyDate());
    const ts: Record<string, Stats> = {};
    for (const t of TOPICS) {
      ts[t.id] = getTopicStats(t.id);
    }
    setTopicStats(ts);
  }, []);

  useEffect(() => {
    initSyncEngine(); // Initialize CRM sync outbox
    loadProgress();

    // Reload progress when returning to this page (e.g., from exam)
    const handleFocus = () => loadProgress();
    window.addEventListener("focus", handleFocus);
    window.addEventListener("progress-updated", handleFocus);
    return () => {
      window.removeEventListener("focus", handleFocus);
      window.removeEventListener("progress-updated", handleFocus);
    };
  }, [loadProgress]);

  const handleReset = () => {
    resetProgress();
    loadProgress();
    setShowResetConfirm(false);
  };

  // Build href for "Câu sai" — pass wrong IDs via URL
  const wrongIds = typeof window !== "undefined" ? getWrongQuestionIds() : [];
  const wrongHref =
    wrongIds.length > 0
      ? `/exam/${wrongIds.length}?mode=practice&filter=wrong`
      : "#";

  // Build href for "50 câu hay sai"
  const top50Ids = typeof window !== "undefined" ? getTopWrongIds(50) : [];
  const top50Href =
    top50Ids.length > 0
      ? `/exam/${top50Ids.length}?mode=practice&filter=top-wrong`
      : "#";

  const pctOverall =
    overall.total > 0 ? Math.round((overall.answered / overall.total) * 100) : 0;

  return (
    <div className={styles.page}>
      {/* ── Header ── */}
      <header className={styles.header}>
        <div className={styles.headerInner}>
          <a href="https://thayduydaotaolaixe.com" target="_blank" rel="noopener noreferrer" className={styles.logo} style={{ textDecoration: "none", fontSize: "0.82rem", letterSpacing: "0.02em" }}>
            📞 Đăng ký học: 0948 742 666
          </a>
          <div className={styles.headerActions}>
            <Link href="/tim-kiem" className={styles.headerIconBtn} title="Tìm kiếm">🔍</Link>
            <Link href="/exam/600?mode=practice" className={styles.headerBtn}>
              600 Câu
            </Link>
            <Link href="/cai-dat" className={styles.headerIconBtn} title="Cài đặt">⚙️</Link>
          </div>
        </div>
      </header>

      <main className={styles.main}>
        {/* ── Hero Card ── */}
        <div className={styles.heroCard}>
          <h1 className={styles.heroTitle}>Học Lý Thuyết Cùng Thầy Duy</h1>
          <p className={styles.heroSubtitle}>
            600 câu hỏi lý thuyết GPLX mới nhất 2026
          </p>
          <div className={styles.heroStats}>
            <div className={styles.heroStat}>
              <span className={styles.heroStatNum}>600</span>
              <span className={styles.heroStatLabel}>Câu hỏi</span>
            </div>
            <div className={styles.heroStat}>
              <span className={styles.heroStatNum}>60</span>
              <span className={styles.heroStatLabel}>Điểm liệt</span>
            </div>
            <div className={styles.heroStat}>
              <span className={styles.heroStatNum}>7</span>
              <span className={styles.heroStatLabel}>Chủ đề</span>
            </div>
          </div>
        </div>

        {/* ── Learning Stats ── */}
        {overall.answered > 0 && (
          <div className={styles.statsRow}>
            <div className={styles.statItem}>
              <span className={styles.statValue} style={{ color: accuracy >= 70 ? 'var(--success)' : accuracy >= 40 ? 'var(--warning)' : 'var(--error)' }}>
                {accuracy}%
              </span>
              <span className={styles.statLabel}>Độ chính xác</span>
            </div>
            <div className={styles.statDivider} />
            <div className={styles.statItem}>
              <span className={styles.statValue} style={{ color: 'var(--primary)' }}>
                {overall.answered}
              </span>
              <span className={styles.statLabel}>Đã trả lời</span>
            </div>
            <div className={styles.statDivider} />
            <div className={styles.statItem}>
              <span className={styles.statValue} style={{ color: 'var(--error)' }}>
                {wrongCount}
              </span>
              <span className={styles.statLabel}>Câu sai</span>
            </div>
            <div className={styles.statDivider} />
            <div className={styles.statItem}>
              <span className={styles.statValue} style={{ color: 'var(--muted)', fontSize: '0.875rem' }}>
                {lastStudy
                  ? new Date(lastStudy).toLocaleDateString('vi-VN', { day: '2-digit', month: '2-digit' })
                  : '--'
                }
              </span>
              <span className={styles.statLabel}>Học gần nhất</span>
            </div>
          </div>
        )}

        {/* ── Streak + Due Count + CTA ── */}
        <ActionStrip />

        {/* ── AI Coach Card ── */}
        <AICoachCard accuracy={accuracy} totalAnswered={overall.answered} />

        {/* ── Quick Actions (OTOMOTO style) ── */}
        <div className={styles.quickActions}>
          <Link href="/daily" className={styles.quickAction}>
            <div className={styles.quickActionIcon} style={{ background: "linear-gradient(135deg, #f97316, #ea580c)", color: "#fff" }}>
              ⚡
            </div>
            <span className={styles.quickActionLabel}>Học 5p</span>
          </Link>
          <Link href="/exam/35?type=B" className={styles.quickAction}>
            <div className={styles.quickActionIcon} style={{ background: "linear-gradient(135deg, #4CAF50, #2E7D32)", color: "#fff" }}>
              📝
            </div>
            <span className={styles.quickActionLabel}>Thi thử</span>
          </Link>
          <Link href="/meo-thi" className={styles.quickAction}>
            <div className={styles.quickActionIcon} style={{ background: "linear-gradient(135deg, #4CAF50, #2E7D32)", color: "#fff" }}>
              💡
            </div>
            <span className={styles.quickActionLabel}>Mẹo thi</span>
          </Link>
          <Link
            href={wrongHref}
            className={`${styles.quickAction} ${wrongIds.length === 0 ? styles.quickActionDisabled : ""}`}
            onClick={(e) => {
              if (wrongIds.length === 0) {
                e.preventDefault();
                showToast("💡 Hãy ôn tập trước để có dữ liệu câu sai!");
              }
            }}
          >
            <div className={styles.quickActionIcon} style={{ background: "linear-gradient(135deg, #F44336, #C62828)", color: "#fff", position: "relative" }}>
              ❌
              {wrongCount > 0 && (
                <span className={styles.quickActionBadge}>{wrongCount}</span>
              )}
            </div>
            <span className={styles.quickActionLabel}>Câu sai</span>
          </Link>
          <Link
            href={top50Href}
            className={`${styles.quickAction} ${top50Ids.length === 0 ? styles.quickActionDisabled : ""}`}
            onClick={(e) => {
              if (top50Ids.length === 0) {
                e.preventDefault();
                showToast("💡 Hãy làm bài thi thử trước để hệ thống ghi nhận!");
              }
            }}
          >
            <div className={styles.quickActionIcon} style={{ background: "linear-gradient(135deg, #FF9800, #E65100)", color: "#fff" }}>
              📚
            </div>
            <span className={styles.quickActionLabel}>50 câu hay sai</span>
          </Link>
          <Link
            href={(() => { const ids = getBookmarkedIds(); return ids.length > 0 ? `/exam/${ids.length}?mode=practice&filter=wrong` : '#'; })()}
            className={`${styles.quickAction} ${getBookmarkCount() === 0 ? styles.quickActionDisabled : ""}`}
            onClick={(e) => {
              if (getBookmarkCount() === 0) {
                e.preventDefault();
                showToast("⭐ Chưa có câu nào được đánh dấu. Hãy bấm ☆ khi ôn tập!");
              }
            }}
          >
            <div className={styles.quickActionIcon} style={{ background: "linear-gradient(135deg, #9C27B0, #6A1B9A)", color: "#fff" }}>
              ⭐
            </div>
            <span className={styles.quickActionLabel}>Đã đánh dấu</span>
          </Link>
        </div>

        {/* ── Ôn tập tất cả câu hỏi ── */}
        <section className={styles.section}>
          <Link href="/exam/600?mode=practice" className={styles.progressCard}>
            <div className={styles.progressCardHeader}>
              <div className={styles.progressCardIcon}>📖</div>
              <h3 className={styles.progressCardTitle}>Ôn tập tất cả câu hỏi</h3>
            </div>
            <div className={styles.progressBar}>
              <div className={styles.progressBarFill} style={{ width: `${pctOverall}%` }} />
            </div>
            <div className={styles.progressMeta}>
              <span>{overall.answered}/{overall.total} câu hỏi</span>
              <span>{overall.correct} câu đúng &nbsp; {overall.wrong} câu sai</span>
            </div>
          </Link>
        </section>

        {/* ── Ôn tập theo chủ đề ── */}
        <section className={styles.section}>
          <div className={styles.sectionHeader}>
            <h2 className={styles.sectionTitle}>Ôn tập theo chủ đề</h2>
          </div>
          {TOPICS.map((topic) => {
            const tStats = topicStats[topic.id] || { total: topic.count, answered: 0, correct: 0, wrong: 0 };
            const pct = tStats.total > 0 ? Math.round((tStats.answered / tStats.total) * 100) : 0;
            return (
              <Link
                key={topic.id}
                href={`/exam/600?mode=practice&topicId=${topic.id}`}
                className={styles.topicCard}
              >
                <div className={styles.topicIcon} style={{ background: topic.bgColor, color: topic.color }}>
                  {topic.icon}
                </div>
                <div className={styles.topicInfo}>
                  <h3 className={styles.topicName}>{topic.name}</h3>
                  <div className={styles.topicProgress}>
                    <div className={styles.topicProgressFill} style={{ width: `${pct}%`, background: topic.color }} />
                  </div>
                  <div className={styles.topicMeta}>
                    <span>{tStats.answered}/{tStats.total} câu hỏi</span>
                    {tStats.answered > 0 && (
                      <span className={styles.topicMetaRight}>
                        {tStats.correct} câu đúng &nbsp; {tStats.wrong} câu sai
                      </span>
                    )}
                  </div>
                </div>
                <span className={styles.topicArrow}>›</span>
              </Link>
            );
          })}
        </section>

        {/* ── Thi sát hạch ── */}
        <section className={styles.section}>
          <div className={styles.sectionHeader}>
            <h2 className={styles.sectionTitle}>📋 Thi sát hạch lý thuyết</h2>
          </div>
          <div className={styles.examGrid}>
            {EXAM_TYPES.map((exam) => (
              <Link key={exam.id} href={exam.href} className={styles.examCard}>
                <div className={styles.examCardTop} style={{ background: exam.gradient }}>
                  <div className={styles.examCardIcon}>{exam.icon}</div>
                  {exam.badge && <span className={styles.examCardBadge}>{exam.badge}</span>}
                </div>
                <div className={styles.examCardBody}>
                  <h3 className={styles.examCardTitle}>{exam.name}</h3>
                  <p className={styles.examCardDesc}>{exam.desc}</p>
                  <div className={styles.examCardMeta}>
                    <span>📝 {exam.questions} câu</span>
                    <span>⏱️ {exam.time}p</span>
                    <span>✅ {exam.pass}/{exam.questions}</span>
                  </div>
                </div>
              </Link>
            ))}
          </div>
        </section>

        {/* ── Nâng hạng ── */}
        <section className={styles.section}>
          <div className={styles.sectionHeader}>
            <h2 className={styles.sectionTitle}>🔄 Thi nâng hạng</h2>
          </div>
          <div className={styles.upgradeGrid}>
            {UPGRADE_PATHS.map((u) => (
              <Link
                key={`${u.from}-${u.to}`}
                href={`/exam/${u.questions}?type=${u.to}&upgrade=${u.from}-${u.to}`}
                className={styles.upgradeCard}
              >
                <div className={styles.upgradeBadge} style={{ background: u.color }}>
                  {u.from} → {u.to}
                </div>
                <div className={styles.upgradeInfo}>
                  <span className={styles.upgradeTitle}>{u.from} lên {u.to}</span>
                  <span className={styles.upgradeMeta}>
                    {u.questions} câu • {u.time} phút • Đạt {u.pass}/{u.questions}
                  </span>
                </div>
                <span className={styles.upgradeArrow}>›</span>
              </Link>
            ))}
          </div>
        </section>

        {/* ── Tiện ích ── */}
        <section className={styles.section}>
          <div className={styles.sectionHeader}>
            <h2 className={styles.sectionTitle}>🧰 Tiện ích</h2>
          </div>
          <div className={styles.utilityGrid} style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '0.625rem' }}>
            <Link href="/meo-thi" className={styles.utilityCard} style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '0.5rem', padding: '1rem 0.5rem', background: 'var(--card-bg)', border: '1.5px solid var(--border)', borderRadius: 'var(--radius-md)', textDecoration: 'none' }}>
              <span className={styles.utilityIcon} style={{ background: "#e8f5e9", color: "#4CAF50", width: 44, height: 44, borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '1.375rem' }}>💡</span>
              <span className={styles.utilityName} style={{ fontSize: '0.8125rem', fontWeight: 600, color: 'var(--heading)' }}>Mẹo thi</span>
            </Link>
            <Link href="/bien-bao" className={styles.utilityCard} style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '0.5rem', padding: '1rem 0.5rem', background: 'var(--card-bg)', border: '1.5px solid var(--border)', borderRadius: 'var(--radius-md)', textDecoration: 'none' }}>
              <span className={styles.utilityIcon} style={{ background: "#fff3e0", color: "#FF9800", width: 44, height: 44, borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '1.375rem' }}>🚦</span>
              <span className={styles.utilityName} style={{ fontSize: '0.8125rem', fontWeight: 600, color: 'var(--heading)' }}>Biển báo</span>
            </Link>
            <Link href="/luat-gt" className={styles.utilityCard} style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '0.5rem', padding: '1rem 0.5rem', background: 'var(--card-bg)', border: '1.5px solid var(--border)', borderRadius: 'var(--radius-md)', textDecoration: 'none' }}>
              <span className={styles.utilityIcon} style={{ background: "#f3e5f5", color: "#9C27B0", width: 44, height: 44, borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '1.375rem' }}>⚖️</span>
              <span className={styles.utilityName} style={{ fontSize: '0.8125rem', fontWeight: 600, color: 'var(--heading)' }}>Luật GT</span>
            </Link>
            <Link href="/sa-hinh" className={styles.utilityCard} style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '0.5rem', padding: '1rem 0.5rem', background: 'var(--card-bg)', border: '1.5px solid var(--border)', borderRadius: 'var(--radius-md)', textDecoration: 'none' }}>
              <span className={styles.utilityIcon} style={{ background: "#fff7ed", color: "#f97316", width: 44, height: 44, borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '1.375rem' }}>🏁</span>
              <span className={styles.utilityName} style={{ fontSize: '0.8125rem', fontWeight: 600, color: 'var(--heading)' }}>Sa hình</span>
            </Link>
            <Link href="/tim-kiem" className={styles.utilityCard} style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '0.5rem', padding: '1rem 0.5rem', background: 'var(--card-bg)', border: '1.5px solid var(--border)', borderRadius: 'var(--radius-md)', textDecoration: 'none' }}>
              <span className={styles.utilityIcon} style={{ background: "#ffebee", color: "#F44336", width: 44, height: 44, borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '1.375rem' }}>🔍</span>
              <span className={styles.utilityName} style={{ fontSize: '0.8125rem', fontWeight: 600, color: 'var(--heading)' }}>Tìm kiếm</span>
            </Link>
            <Link href="/cai-dat" className={styles.utilityCard} style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '0.5rem', padding: '1rem 0.5rem', background: 'var(--card-bg)', border: '1.5px solid var(--border)', borderRadius: 'var(--radius-md)', textDecoration: 'none' }}>
              <span className={styles.utilityIcon} style={{ background: "#eceff1", color: "#607D8B", width: 44, height: 44, borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '1.375rem' }}>⚙️</span>
              <span className={styles.utilityName} style={{ fontSize: '0.8125rem', fontWeight: 600, color: 'var(--heading)' }}>Cài đặt</span>
            </Link>
          </div>
        </section>

        {/* ── Lưu ý ── */}
        <div className={styles.noticeCard}>
          <h3>⚠️ Câu điểm liệt</h3>
          <p>
            Bộ 600 câu có <strong>60 câu điểm liệt</strong> về tình huống mất an toàn giao thông.
            Trả lời sai <strong>bất kỳ câu điểm liệt nào</strong> sẽ bị <strong>TRƯỢT</strong> ngay lập tức.
          </p>
        </div>
      </main>

      {/* ── Footer ── */}
      <footer className={styles.footer}>
        <p>© 2026 Học Lý Thuyết Cùng Thầy Duy — Theo NĐ 168/2024/NĐ-CP & Luật TTATGT 2024</p>
      </footer>

      {/* Toast notification */}
      {toast && (
        <div className={styles.toast}>
          {toast}
        </div>
      )}
    </div>
  );
}
