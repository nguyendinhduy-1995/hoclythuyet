"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import styles from "./page.module.css";
import {
    getLicenseType,
    setLicenseType,
    LICENSE_INFO,
    type LicenseType,
    getTheme,
    setTheme,
    type ThemeMode,
} from "@/lib/settingsStore";
import { resetProgress, getOverallStats } from "@/lib/progressStore";
import { getCrmLink, loginToCrm, unlinkCrm, isLinkedToCrm } from "@/lib/crmAuth";
import { flushOutbox, syncDailySnapshot } from "@/lib/syncEngine";

export default function CaiDatPage() {
    const [license, setLicense] = useState<LicenseType>("B");
    const [showResetConfirm, setShowResetConfirm] = useState(false);
    const [answered, setAnswered] = useState(0);
    const [theme, setThemeState] = useState<ThemeMode>("auto");

    // CRM link state
    const [crmLinked, setCrmLinked] = useState(false);
    const [crmName, setCrmName] = useState<string | null>(null);
    const [crmPhone, setCrmPhone] = useState("");
    const [crmPassword, setCrmPassword] = useState("");
    const [crmLoading, setCrmLoading] = useState(false);
    const [crmError, setCrmError] = useState("");
    const [crmSuccess, setCrmSuccess] = useState("");

    useEffect(() => {
        setLicense(getLicenseType());
        setAnswered(getOverallStats().answered);
        setThemeState(getTheme());

        // Check CRM link status
        const link = getCrmLink();
        if (link) {
            setCrmLinked(true);
            setCrmName(link.studentName);
        }
    }, []);

    const handleThemeChange = (mode: ThemeMode) => {
        setThemeState(mode);
        setTheme(mode);
    };

    const handleLicenseChange = (type: LicenseType) => {
        setLicense(type);
        setLicenseType(type);
    };

    const handleReset = () => {
        resetProgress();
        setShowResetConfirm(false);
        setAnswered(0);
    };

    const handleCrmLogin = async () => {
        if (!crmPhone.trim() || !crmPassword.trim()) {
            setCrmError("Vui lòng nhập SĐT và mật khẩu");
            return;
        }
        setCrmLoading(true);
        setCrmError("");
        setCrmSuccess("");

        const crmUrl = typeof window !== "undefined" && window.location.hostname === "localhost"
            ? "http://localhost:3001"
            : "https://crm.thayduydaotaolaixe.com";

        const result = await loginToCrm(crmUrl, crmPhone.trim(), crmPassword);

        if (result.ok) {
            setCrmLinked(true);
            setCrmName(result.studentName);
            setCrmSuccess(`✅ Đã liên kết với tài khoản: ${result.studentName}`);
            setCrmPhone("");
            setCrmPassword("");

            // Sync current progress immediately
            const stats = getOverallStats();
            if (stats.answered > 0) {
                syncDailySnapshot({
                    minutes: 0,
                    questionsAnswered: stats.answered,
                    correct: stats.correct,
                    accuracy: stats.answered > 0 ? Math.round((stats.correct / stats.answered) * 100) : 0,
                    streakCurrent: 0,
                    streakLongest: 0,
                    dueCount: stats.wrong,
                });
                flushOutbox();
            }
        } else {
            setCrmError(result.error);
        }
        setCrmLoading(false);
    };

    const handleCrmUnlink = () => {
        unlinkCrm();
        setCrmLinked(false);
        setCrmName(null);
        setCrmSuccess("");
        setCrmError("");
    };

    const licenseTypes = Object.entries(LICENSE_INFO) as [LicenseType, typeof LICENSE_INFO[LicenseType]][];

    return (
        <div className={styles.page}>
            <header className={styles.header}>
                <div className={styles.headerInner}>
                    <Link href="/" className={styles.backBtn}>← Trang chủ</Link>
                    <h1 className={styles.headerTitle}>⚙️ Cài đặt</h1>
                    <div style={{ width: 80 }} />
                </div>
            </header>

            <main className={styles.main}>
                {/* CRM Account Link */}
                <section className={styles.section}>
                    <h2 className={styles.sectionTitle}>🔗 Liên kết tài khoản CRM</h2>
                    <p className={styles.sectionDesc}>
                        Liên kết để đồng bộ tiến độ học lý thuyết lên hệ thống quản lý
                    </p>

                    {crmLinked ? (
                        <div style={{
                            background: 'linear-gradient(135deg, #f0fdf4, #dcfce7)',
                            border: '1.5px solid #86efac',
                            borderRadius: 'var(--radius-md)',
                            padding: '1rem',
                            display: 'flex',
                            flexDirection: 'column',
                            gap: '0.75rem',
                        }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                                <span style={{ fontSize: '1.25rem' }}>✅</span>
                                <div>
                                    <p style={{ fontWeight: 700, color: '#166534', fontSize: '0.875rem' }}>
                                        Đã liên kết
                                    </p>
                                    <p style={{ color: '#15803d', fontSize: '0.8rem' }}>
                                        {crmName || "Học viên"}
                                    </p>
                                </div>
                            </div>
                            <p style={{ fontSize: '0.75rem', color: '#166534', lineHeight: 1.5 }}>
                                Dữ liệu học lý thuyết sẽ tự động đồng bộ lên CRM mỗi khi bạn trả lời câu hỏi.
                            </p>
                            <button
                                onClick={handleCrmUnlink}
                                style={{
                                    background: 'white',
                                    border: '1px solid #fca5a5',
                                    borderRadius: '0.5rem',
                                    padding: '0.5rem 1rem',
                                    color: '#dc2626',
                                    fontWeight: 600,
                                    fontSize: '0.8rem',
                                    cursor: 'pointer',
                                    alignSelf: 'flex-start',
                                }}
                            >
                                Hủy liên kết
                            </button>
                        </div>
                    ) : (
                        <div style={{
                            background: 'var(--card-bg)',
                            border: '1.5px solid var(--border)',
                            borderRadius: 'var(--radius-md)',
                            padding: '1rem',
                            display: 'flex',
                            flexDirection: 'column',
                            gap: '0.75rem',
                        }}>
                            <p style={{ fontSize: '0.8rem', color: 'var(--muted)', lineHeight: 1.5 }}>
                                Nhập SĐT và mật khẩu đã đăng ký trên CRM để liên kết.
                            </p>
                            <input
                                type="tel"
                                placeholder="Số điện thoại"
                                value={crmPhone}
                                onChange={(e) => { setCrmPhone(e.target.value); setCrmError(""); }}
                                inputMode="tel"
                                style={{
                                    padding: '0.625rem 0.75rem',
                                    border: '1.5px solid var(--border)',
                                    borderRadius: '0.5rem',
                                    fontSize: '0.875rem',
                                    background: 'var(--bg)',
                                    color: 'var(--heading)',
                                    outline: 'none',
                                }}
                            />
                            <input
                                type="password"
                                placeholder="Mật khẩu"
                                value={crmPassword}
                                onChange={(e) => { setCrmPassword(e.target.value); setCrmError(""); }}
                                style={{
                                    padding: '0.625rem 0.75rem',
                                    border: '1.5px solid var(--border)',
                                    borderRadius: '0.5rem',
                                    fontSize: '0.875rem',
                                    background: 'var(--bg)',
                                    color: 'var(--heading)',
                                    outline: 'none',
                                }}
                            />
                            {crmError && (
                                <p style={{ fontSize: '0.8rem', color: '#dc2626', fontWeight: 500 }}>
                                    ❌ {crmError}
                                </p>
                            )}
                            {crmSuccess && (
                                <p style={{ fontSize: '0.8rem', color: '#16a34a', fontWeight: 500 }}>
                                    {crmSuccess}
                                </p>
                            )}
                            <button
                                onClick={handleCrmLogin}
                                disabled={crmLoading}
                                style={{
                                    background: crmLoading ? '#94a3b8' : 'linear-gradient(135deg, #f97316, #ea580c)',
                                    border: 'none',
                                    borderRadius: '0.5rem',
                                    padding: '0.625rem 1rem',
                                    color: 'white',
                                    fontWeight: 700,
                                    fontSize: '0.875rem',
                                    cursor: crmLoading ? 'not-allowed' : 'pointer',
                                    boxShadow: '0 2px 8px rgba(249,115,22,0.3)',
                                }}
                            >
                                {crmLoading ? "Đang kết nối..." : "🔗 Liên kết tài khoản"}
                            </button>
                        </div>
                    )}
                </section>

                {/* License Type Selection */}
                <section className={styles.section}>
                    <h2 className={styles.sectionTitle}>🚗 Chọn hạng bằng lái</h2>
                    <p className={styles.sectionDesc}>Chọn hạng bằng lái phù hợp với nhu cầu thi của bạn</p>

                    <div className={styles.licenseGrid}>
                        {licenseTypes.map(([type, info]) => (
                            <button
                                key={type}
                                className={`${styles.licenseCard} ${license === type ? styles.licenseCardActive : ""}`}
                                onClick={() => handleLicenseChange(type)}
                            >
                                <span className={styles.licenseIcon}>{info.icon}</span>
                                <span className={styles.licenseName}>{info.name}</span>
                                <span className={styles.licenseDesc}>{info.desc}</span>
                                {license === type && <span className={styles.checkMark}>✓</span>}
                            </button>
                        ))}
                    </div>
                </section>

                {/* Theme Selection */}
                <section className={styles.section}>
                    <h2 className={styles.sectionTitle}>🎨 Giao diện</h2>
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '0.625rem' }}>
                        <button
                            className={`${styles.licenseCard} ${theme === "auto" ? styles.licenseCardActive : ""}`}
                            onClick={() => handleThemeChange("auto")}
                            style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '0.375rem', padding: '1rem 0.5rem', background: 'var(--card-bg)', border: '1.5px solid var(--border)', borderRadius: 'var(--radius-md)', cursor: 'pointer' }}
                        >
                            <span style={{ fontSize: '1.5rem' }}>🔄</span>
                            <span style={{ fontSize: '0.875rem', fontWeight: 600, color: 'var(--heading)' }}>Tự động</span>
                            {theme === "auto" && <span className={styles.checkMark}>✓</span>}
                        </button>
                        <button
                            className={`${styles.licenseCard} ${theme === "light" ? styles.licenseCardActive : ""}`}
                            onClick={() => handleThemeChange("light")}
                            style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '0.375rem', padding: '1rem 0.5rem', background: 'var(--card-bg)', border: '1.5px solid var(--border)', borderRadius: 'var(--radius-md)', cursor: 'pointer' }}
                        >
                            <span style={{ fontSize: '1.5rem' }}>☀️</span>
                            <span style={{ fontSize: '0.875rem', fontWeight: 600, color: 'var(--heading)' }}>Sáng</span>
                            {theme === "light" && <span className={styles.checkMark}>✓</span>}
                        </button>
                        <button
                            className={`${styles.licenseCard} ${theme === "dark" ? styles.licenseCardActive : ""}`}
                            onClick={() => handleThemeChange("dark")}
                            style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '0.375rem', padding: '1rem 0.5rem', background: 'var(--card-bg)', border: '1.5px solid var(--border)', borderRadius: 'var(--radius-md)', cursor: 'pointer' }}
                        >
                            <span style={{ fontSize: '1.5rem' }}>🌙</span>
                            <span style={{ fontSize: '0.875rem', fontWeight: 600, color: 'var(--heading)' }}>Tối</span>
                            {theme === "dark" && <span className={styles.checkMark}>✓</span>}
                        </button>
                    </div>
                </section>

                {/* Reset Progress */}
                <section className={styles.section}>
                    <h2 className={styles.sectionTitle}>🔄 Tiến trình học</h2>
                    <div className={styles.progressInfo}>
                        <p>Đã làm: <strong>{answered}/600</strong> câu hỏi</p>
                    </div>

                    {!showResetConfirm ? (
                        <button
                            className={styles.resetBtn}
                            onClick={() => setShowResetConfirm(true)}
                        >
                            🗑️ Xóa toàn bộ tiến trình
                        </button>
                    ) : (
                        <div className={styles.resetConfirm}>
                            <p className={styles.resetWarning}>⚠️ Xóa hết tiến trình? Không thể hoàn tác!</p>
                            <div className={styles.resetActions}>
                                <button className={styles.resetConfirmBtn} onClick={handleReset}>
                                    Xác nhận xóa
                                </button>
                                <button className={styles.resetCancelBtn} onClick={() => setShowResetConfirm(false)}>
                                    Hủy
                                </button>
                            </div>
                        </div>
                    )}
                </section>

                {/* About */}
                <section className={styles.section}>
                    <h2 className={styles.sectionTitle}>ℹ️ Thông tin</h2>
                    <div className={styles.aboutCard}>
                        <p className={styles.aboutTitle}>Học Lý Thuyết Cùng Thầy Duy</p>
                        <p className={styles.aboutDesc}>Ôn thi lý thuyết GPLX 600 câu mới nhất</p>
                        <p className={styles.aboutVersion}>Phiên bản 1.0.0</p>
                    </div>
                </section>
            </main>
            <div style={{ height: 'var(--bottom-nav-height)' }} />
        </div>
    );
}
