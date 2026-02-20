"use client";

import { useState, Fragment } from "react";
import Link from "next/link";
import styles from "./page.module.css";
import tipsData from "@/data/tips.json";

type Category = (typeof tipsData.categories)[number];
type Tip = (typeof tipsData.tips)[number];

/* ── Highlight keywords helper ── */
const HIGHLIGHT_RULES: Array<{ pattern: RegExp; className: string }> = [
    {
        pattern:
            /(TRƯỢT|trượt|ĐẠT|đạt|KHÔNG|không được|CẤM|cấm|PHẢI|phải|BẮT BUỘC|bắt buộc|LUÔN|luôn|điểm liệt|ngay lập tức|nghiêm cấm|tuyệt đối)/gi,
        className: "highlight-danger",
    },
    {
        pattern:
            /(\d+\s*(?:km\/h|m|cm|tấn|lít|%|điểm|câu|phút|giây|năm|tháng|ngày|mét))/gi,
        className: "highlight-number",
    },
    {
        pattern:
            /(tốc độ|nồng độ cồn|đèn đỏ|đèn vàng|đèn xanh|biển báo|vạch kẻ đường|làn đường|ngã tư|ngã ba|chất ma túy|giấy phép lái xe|GPLX)/gi,
        className: "highlight-key",
    },
];

function highlightLine(line: string): string {
    let result = line;
    for (const rule of HIGHLIGHT_RULES) {
        result = result.replace(
            rule.pattern,
            `<mark class="${rule.className}">$1</mark>`
        );
    }
    return result;
}

export default function MeoThiPage() {
    const [activeCategory, setActiveCategory] = useState<string>("all");
    const [expandedTip, setExpandedTip] = useState<string | null>(null);
    const [searchQuery, setSearchQuery] = useState("");

    const filteredTips = tipsData.tips.filter((tip: Tip) => {
        const matchCategory = activeCategory === "all" || tip.category === activeCategory;
        const matchSearch =
            !searchQuery ||
            tip.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
            tip.content.toLowerCase().includes(searchQuery.toLowerCase());
        return matchCategory && matchSearch;
    });

    const getCategoryInfo = (catId: string): Category | undefined =>
        tipsData.categories.find((c: Category) => c.id === catId);

    return (
        <div className={styles.page}>
            {/* Header */}
            <header className={styles.header}>
                <div className={styles.headerInner}>
                    <Link href="/" className={styles.backBtn}>← Trang chủ</Link>
                    <h1 className={styles.headerTitle}>💡 Mẹo thi</h1>
                    <div style={{ width: 80 }} />
                </div>
            </header>

            <main className={styles.main}>
                {/* Search */}
                <div className={styles.searchBox}>
                    <span className={styles.searchIcon}>🔍</span>
                    <input
                        type="text"
                        placeholder="Tìm mẹo thi..."
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        className={styles.searchInput}
                    />
                    {searchQuery && (
                        <button onClick={() => setSearchQuery("")} className={styles.clearBtn}>✕</button>
                    )}
                </div>

                {/* Category Tabs */}
                <div className={styles.categoryTabs}>
                    <button
                        className={`${styles.categoryTab} ${activeCategory === "all" ? styles.categoryTabActive : ""}`}
                        onClick={() => setActiveCategory("all")}
                    >
                        Tất cả
                    </button>
                    {tipsData.categories.map((cat: Category) => (
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

                {/* Tips Count */}
                <p className={styles.resultCount}>{filteredTips.length} mẹo</p>

                {/* Tips List */}
                <div className={styles.tipsList}>
                    {filteredTips.map((tip: Tip) => {
                        const cat = getCategoryInfo(tip.category);
                        const isExpanded = expandedTip === tip.id;

                        return (
                            <div
                                key={tip.id}
                                className={`${styles.tipCard} ${isExpanded ? styles.tipCardExpanded : ""}`}
                                onClick={() => setExpandedTip(isExpanded ? null : tip.id)}
                            >
                                <div className={styles.tipHeader}>
                                    <span
                                        className={styles.tipBadge}
                                        style={{ background: cat?.color || "#666" }}
                                    >
                                        {cat?.icon} {cat?.name}
                                    </span>
                                    <span className={styles.tipArrow}>{isExpanded ? "▲" : "▼"}</span>
                                </div>
                                <h3 className={styles.tipTitle}>{tip.title}</h3>
                                {isExpanded && (
                                    <div className={styles.tipContent}>
                                        {tip.content.split("\n").map((line: string, i: number) => (
                                            <p
                                                key={i}
                                                className={styles.tipLine}
                                                dangerouslySetInnerHTML={{
                                                    __html: highlightLine(line),
                                                }}
                                            />
                                        ))}
                                    </div>
                                )}
                            </div>
                        );
                    })}
                </div>

                {filteredTips.length === 0 && (
                    <div className={styles.emptyState}>
                        <span className={styles.emptyIcon}>🔍</span>
                        <p>Không tìm thấy mẹo nào</p>
                    </div>
                )}
            </main>
        </div>
    );
}
