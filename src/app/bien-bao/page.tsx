"use client";

import { useState } from "react";
import Link from "next/link";
import styles from "./page.module.css";
import signsData from "@/data/signs.json";
import SignIcon from "@/components/SignIcon";

type Category = (typeof signsData.categories)[number];
type Sign = (typeof signsData.signs)[number];

export default function BienBaoPage() {
    const [activeCategory, setActiveCategory] = useState<string>("all");
    const [searchQuery, setSearchQuery] = useState("");
    const [selectedSign, setSelectedSign] = useState<string | null>(null);

    const filteredSigns = signsData.signs.filter((sign: Sign) => {
        const matchCategory = activeCategory === "all" || sign.category === activeCategory;
        const matchSearch =
            !searchQuery ||
            sign.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
            sign.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
            sign.id.toLowerCase().includes(searchQuery.toLowerCase());
        return matchCategory && matchSearch;
    });

    const getCategoryInfo = (catId: string): Category | undefined =>
        signsData.categories.find((c: Category) => c.id === catId);

    const activeSign = signsData.signs.find((s: Sign) => s.id === selectedSign);

    return (
        <div className={styles.page}>
            <header className={styles.header}>
                <div className={styles.headerInner}>
                    <Link href="/" className={styles.backBtn}>←</Link>
                    <h1 className={styles.headerTitle}>Biển báo giao thông</h1>
                    <div style={{ width: 32 }} />
                </div>
            </header>

            {/* Category Tabs — sticky under header */}
            <div className={styles.categoryBar}>
                <div className={styles.categoryTabs}>
                    {signsData.categories.map((cat: Category) => {
                        const count = signsData.signs.filter((s: Sign) => s.category === cat.id).length;
                        return (
                            <button
                                key={cat.id}
                                className={`${styles.categoryTab} ${activeCategory === cat.id ? styles.categoryTabActive : ""}`}
                                onClick={() => setActiveCategory(cat.id)}
                            >
                                {cat.name.toUpperCase()} ({count})
                            </button>
                        );
                    })}
                </div>
            </div>

            <main className={styles.main}>
                {/* Search */}
                <div className={styles.searchBox}>
                    <span className={styles.searchIcon}>🔍</span>
                    <input
                        type="text"
                        placeholder="Tìm biển báo (tên hoặc mã)..."
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        className={styles.searchInput}
                    />
                    {searchQuery && (
                        <button onClick={() => setSearchQuery("")} className={styles.clearBtn}>✕</button>
                    )}
                </div>

                {/* Signs List */}
                <div className={styles.signsList}>
                    {filteredSigns.map((sign: Sign, idx: number) => (
                        <div
                            key={sign.id}
                            className={styles.signRow}
                            onClick={() => setSelectedSign(sign.id)}
                            role="button"
                            tabIndex={0}
                            onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') setSelectedSign(sign.id); }}
                            style={{ animationDelay: `${Math.min(idx * 20, 400)}ms` }}
                        >
                            <div className={styles.signRowIcon}>
                                <SignIcon signId={sign.id} category={sign.category} size={64} />
                            </div>
                            <div className={styles.signRowInfo}>
                                <span className={styles.signRowId}>{sign.id}</span>
                                <span className={styles.signRowName}>{sign.name}</span>
                                <span className={styles.signRowDesc}>{sign.description}</span>
                            </div>
                        </div>
                    ))}
                </div>

                {/* Modal Overlay */}
                {activeSign && (
                    <>
                        <div className={styles.modalOverlay} onClick={() => setSelectedSign(null)} />
                        <div className={styles.modalCard}>
                            <div className={styles.modalSignWrap}>
                                <SignIcon signId={activeSign.id} category={activeSign.category} size={140} />
                            </div>
                            <span className={styles.detailBadge} style={{ background: getCategoryInfo(activeSign.category)?.color }}>
                                {getCategoryInfo(activeSign.category)?.name}
                            </span>
                            <h3 className={styles.detailTitle}>{activeSign.name}</h3>
                            <span className={styles.detailId}>{activeSign.id}</span>
                            <p className={styles.detailDesc}>{activeSign.description}</p>
                            <button className={styles.modalCloseBtn} onClick={() => setSelectedSign(null)}>
                                Đóng
                            </button>
                        </div>
                    </>
                )}

                {filteredSigns.length === 0 && (
                    <div className={styles.emptyState}>
                        <span className={styles.emptyIcon}>🚧</span>
                        <p>Không tìm thấy biển báo nào</p>
                    </div>
                )}
            </main>
        </div>
    );
}
