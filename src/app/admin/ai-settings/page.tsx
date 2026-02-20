"use client";

import React, { useState, useCallback } from "react";
import Link from "next/link";
import styles from "./page.module.css";
import { checkAISettings, saveAIKey } from "@/lib/aiClient";

export default function AdminAISettingsPage() {
    const [pin, setPin] = useState("");
    const [authenticated, setAuthenticated] = useState(false);
    const [loading, setLoading] = useState(false);
    const [apiKey, setApiKey] = useState("");
    const [status, setStatus] = useState<{ configured: boolean; maskedKey: string | null; source: string | null } | null>(null);
    const [message, setMessage] = useState<{ type: "success" | "error"; text: string } | null>(null);

    const handleAuth = useCallback(async () => {
        setLoading(true);
        const result = await checkAISettings(pin);
        if (result.error === "Unauthorized" || result.error) {
            setMessage({ type: "error", text: "PIN không đúng hoặc lỗi kết nối." });
        } else {
            setAuthenticated(true);
            setStatus({ configured: result.configured, maskedKey: result.maskedKey, source: result.source });
        }
        setLoading(false);
    }, [pin]);

    const handleSave = useCallback(async () => {
        if (!apiKey.startsWith("sk-")) {
            setMessage({ type: "error", text: 'API key phải bắt đầu bằng "sk-".' });
            return;
        }
        setLoading(true);
        const result = await saveAIKey(pin, apiKey);
        if (result.success) {
            setMessage({ type: "success", text: "Lưu thành công!" });
            setStatus({ configured: true, maskedKey: result.maskedKey || null, source: "file" });
            setApiKey("");
        } else {
            setMessage({ type: "error", text: result.error || "Lỗi lưu key." });
        }
        setLoading(false);
    }, [apiKey, pin]);

    return (
        <div className={styles.page}>
            <header className={styles.header}>
                <div className={styles.headerInner}>
                    <Link href="/cai-dat" className={styles.backBtn}>←</Link>
                    <h1 className={styles.headerTitle}>🤖 AI Settings</h1>
                    <div style={{ width: 32 }} />
                </div>
            </header>

            <main className={styles.main}>
                {!authenticated ? (
                    <div className={styles.authCard}>
                        <div className={styles.authIcon}>🔐</div>
                        <h2 className={styles.authTitle}>Admin Only</h2>
                        <p className={styles.authDesc}>Nhập PIN admin để truy cập cài đặt AI.</p>
                        <input
                            type="password"
                            value={pin}
                            onChange={e => setPin(e.target.value)}
                            placeholder="Nhập Admin PIN"
                            className={styles.pinInput}
                            onKeyDown={e => e.key === "Enter" && handleAuth()}
                        />
                        <button onClick={handleAuth} disabled={loading || !pin} className={styles.authBtn}>
                            {loading ? "⏳ Đang xác thực..." : "🔓 Xác thực"}
                        </button>
                    </div>
                ) : (
                    <div className={styles.settingsCard}>
                        <h2 className={styles.settingsTitle}>🔑 OpenAI API Key</h2>

                        {/* Status */}
                        <div className={`${styles.statusBanner} ${status?.configured ? styles.statusOk : styles.statusWarn}`}>
                            <span>{status?.configured ? "✅ Đã cấu hình" : "⚠️ Chưa cấu hình"}</span>
                            {status?.maskedKey && <span className={styles.maskedKey}>{status.maskedKey}</span>}
                            {status?.source && <span className={styles.source}>Nguồn: {status.source}</span>}
                        </div>

                        {/* Input */}
                        <div className={styles.inputGroup}>
                            <label className={styles.label}>API Key mới</label>
                            <input
                                type="password"
                                value={apiKey}
                                onChange={e => setApiKey(e.target.value)}
                                placeholder="sk-..."
                                className={styles.keyInput}
                            />
                            <p className={styles.hint}>Key sẽ được mã hóa AES-256-GCM và lưu server-side. Không bao giờ gửi về client.</p>
                        </div>

                        <button onClick={handleSave} disabled={loading || !apiKey} className={styles.saveBtn}>
                            {loading ? "⏳ Đang lưu..." : "💾 Lưu API Key"}
                        </button>

                        {/* Info */}
                        <div className={styles.infoBox}>
                            <h3>📝 Hướng dẫn</h3>
                            <ul>
                                <li>Tạo key tại <a href="https://platform.openai.com/api-keys" target="_blank">platform.openai.com</a></li>
                                <li>Model mặc định: <code>gpt-4o-mini</code></li>
                                <li>Có thể override bằng env var <code>AI_MODEL</code></li>
                                <li>Admin PIN cấu hình qua env var <code>ADMIN_PIN</code></li>
                            </ul>
                        </div>
                    </div>
                )}

                {message && (
                    <div className={`${styles.toast} ${message.type === "error" ? styles.toastError : styles.toastSuccess}`}>
                        {message.text}
                    </div>
                )}
            </main>
        </div>
    );
}
