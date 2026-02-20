"use client";

import { useState } from "react";
import Link from "next/link";
import styles from "./page.module.css";
import lawsData from "@/data/laws.json";

type Category = (typeof lawsData.categories)[number];
type Law = (typeof lawsData.laws)[number];

export default function LuatGTPage() {
    const [activeCategory, setActiveCategory] = useState<string>("all");
    const [expandedLaw, setExpandedLaw] = useState<string | null>(null);
    const [searchQuery, setSearchQuery] = useState("");

    const filteredLaws = lawsData.laws.filter((law: Law) => {
        const matchCategory = activeCategory === "all" || law.category === activeCategory;
        const matchSearch =
            !searchQuery ||
            law.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
            law.content.toLowerCase().includes(searchQuery.toLowerCase());
        return matchCategory && matchSearch;
    });

    const getCategoryInfo = (catId: string): Category | undefined =>
        lawsData.categories.find((c: Category) => c.id === catId);

    return (
        <div className={styles.page}>
            <header className={styles.header}>
                <div className={styles.headerInner}>
                    <Link href="/" className={styles.backBtn}>← Trang chủ</Link>
                    <h1 className={styles.headerTitle}>⚖️ Luật GT</h1>
                    <div style={{ width: 80 }} />
                </div>
            </header>

            <main className={styles.main}>
                <div className={styles.searchBox}>
                    <span className={styles.searchIcon}>🔍</span>
                    <input
                        type="text"
                        placeholder="Tìm luật giao thông..."
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        className={styles.searchInput}
                    />
                    {searchQuery && <button onClick={() => setSearchQuery("")} className={styles.clearBtn}>✕</button>}
                </div>

                <div className={styles.categoryTabs}>
                    <button
                        className={`${styles.categoryTab} ${activeCategory === "all" ? styles.categoryTabActive : ""}`}
                        onClick={() => setActiveCategory("all")}
                    >
                        Tất cả
                    </button>
                    {lawsData.categories.map((cat: Category) => (
                        <button
                            key={cat.id}
                            className={`${styles.categoryTab} ${activeCategory === cat.id ? styles.categoryTabActive : ""}`}
                            onClick={() => setActiveCategory(cat.id)}
                            style={activeCategory === cat.id ? { background: cat.color, borderColor: cat.color } : {}}
                        >
                            {cat.icon} {cat.name}
                        </button>
                    ))}
                </div>

                <p className={styles.resultCount}>{filteredLaws.length} điều luật</p>

                <div className={styles.lawsList}>
                    {filteredLaws.map((law: Law) => {
                        const cat = getCategoryInfo(law.category);
                        const isExpanded = expandedLaw === law.id;
                        return (
                            <div
                                key={law.id}
                                className={`${styles.lawCard} ${isExpanded ? styles.lawCardExpanded : ""}`}
                                onClick={() => setExpandedLaw(isExpanded ? null : law.id)}
                            >
                                <div className={styles.lawHeader}>
                                    <span className={styles.lawBadge} style={{ background: cat?.color || "#666" }}>
                                        {cat?.icon} {cat?.name}
                                    </span>
                                    <span className={styles.lawArrow}>{isExpanded ? "▲" : "▼"}</span>
                                </div>
                                <h3 className={styles.lawTitle}>{law.title}</h3>
                                {isExpanded && (
                                    <div className={styles.lawContent}>
                                        {law.content.split("\n").map((line: string, i: number) => (
                                            <p key={i} className={styles.lawLine}>{line}</p>
                                        ))}
                                    </div>
                                )}
                            </div>
                        );
                    })}
                </div>

                {filteredLaws.length === 0 && (
                    <div className={styles.emptyState}>
                        <span className={styles.emptyIcon}>⚖️</span>
                        <p>Không tìm thấy điều luật nào</p>
                    </div>
                )}
            </main>
        </div>
    );
}
