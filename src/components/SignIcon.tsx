"use client";

import React from "react";

interface SignIconProps {
    signId: string;
    category: string;
    size?: number;
    className?: string;
}

// Category-based fallback styling with gradients
const CATEGORY_STYLES: Record<string, { bg: string; bgEnd: string; border: string; text: string; shadow: string }> = {
    cam: { bg: "#fff5f5", bgEnd: "#fee2e2", border: "#ef4444", text: "#b91c1c", shadow: "rgba(239,68,68,0.2)" },
    "nguy-hiem": { bg: "#fffbeb", bgEnd: "#fef3c7", border: "#f59e0b", text: "#92400e", shadow: "rgba(245,158,11,0.2)" },
    "hieu-lenh": { bg: "#eff6ff", bgEnd: "#dbeafe", border: "#3b82f6", text: "#1d4ed8", shadow: "rgba(59,130,246,0.2)" },
    "chi-dan": { bg: "#f0fdf4", bgEnd: "#dcfce7", border: "#22c55e", text: "#166534", shadow: "rgba(34,197,94,0.2)" },
    phu: { bg: "#f8fafc", bgEnd: "#f1f5f9", border: "#94a3b8", text: "#475569", shadow: "rgba(148,163,184,0.2)" },
};

const CATEGORY_SHAPES: Record<string, string> = {
    cam: "circle",
    "nguy-hiem": "triangle",
    "hieu-lenh": "circle",
    "chi-dan": "rect",
    phu: "rect",
};

// Sign names for the 6 that might miss images — show abbreviated name instead of just ID
const SIGN_SHORT_NAMES: Record<string, string> = {
    P124: "Cấm quay\nđầu xe",
    W225: "Người đi bộ\ncắt ngang",
    R305: "Nơi đỗ xe",
    I403: "Bắt đầu\nđường cao tốc",
    I404: "Hết đường\ncao tốc",
    I411: "Hướng đi\ntới",
};

export default function SignIcon({ signId, category, size = 64, className }: SignIconProps) {
    const [imgError, setImgError] = React.useState(false);
    const style = CATEGORY_STYLES[category] || CATEGORY_STYLES.phu;
    const shape = CATEGORY_SHAPES[category] || "rect";

    // Try real image first
    if (!imgError) {
        return (
            <img
                src={`/images/signs/${signId}.png`}
                alt={signId}
                width={size}
                height={size}
                className={className}
                onError={() => setImgError(true)}
                style={{
                    objectFit: "contain",
                    borderRadius: shape === "circle" ? "50%" : shape === "rect" ? 4 : 0,
                }}
            />
        );
    }

    // Enhanced fallback: gradient SVG shape with sign ID and optional short name
    const half = size / 2;
    const gradId = `grad-${signId}`;
    const shadowId = `shadow-${signId}`;
    const shortName = SIGN_SHORT_NAMES[signId];
    const lines = shortName ? shortName.split("\n") : [];

    return (
        <svg
            width={size}
            height={size}
            viewBox={`0 0 ${size} ${size}`}
            className={className}
            style={{ flexShrink: 0 }}
        >
            <defs>
                <linearGradient id={gradId} x1="0%" y1="0%" x2="100%" y2="100%">
                    <stop offset="0%" stopColor={style.bg} />
                    <stop offset="100%" stopColor={style.bgEnd} />
                </linearGradient>
                <filter id={shadowId}>
                    <feDropShadow dx="0" dy="1" stdDeviation="2" floodColor={style.shadow} floodOpacity="0.6" />
                </filter>
            </defs>

            {shape === "circle" && (
                <>
                    <circle cx={half} cy={half} r={half - 3} fill={`url(#${gradId})`} stroke={style.border} strokeWidth={Math.max(2, size * 0.04)} filter={`url(#${shadowId})`} />
                    {lines.length > 0 ? (
                        <>
                            <text x={half} y={half - size * 0.08} textAnchor="middle" dominantBaseline="middle" fontSize={size * 0.12} fontWeight="800" fill={style.border} letterSpacing="0.5">{signId}</text>
                            {lines.map((line, i) => (
                                <text key={i} x={half} y={half + size * 0.06 + i * size * 0.13} textAnchor="middle" dominantBaseline="middle" fontSize={size * 0.1} fontWeight="600" fill={style.text}>{line}</text>
                            ))}
                        </>
                    ) : (
                        <text x={half} y={half + 1} textAnchor="middle" dominantBaseline="middle" fontSize={size * 0.22} fontWeight="800" fill={style.text} letterSpacing="0.5">{signId}</text>
                    )}
                </>
            )}
            {shape === "triangle" && (
                <>
                    <polygon
                        points={`${half},5 ${size - 5},${size - 5} 5,${size - 5}`}
                        fill={`url(#${gradId})`}
                        stroke={style.border}
                        strokeWidth={Math.max(2, size * 0.04)}
                        strokeLinejoin="round"
                        filter={`url(#${shadowId})`}
                    />
                    {lines.length > 0 ? (
                        <>
                            <text x={half} y={half + size * 0.02} textAnchor="middle" dominantBaseline="middle" fontSize={size * 0.11} fontWeight="800" fill={style.border}>{signId}</text>
                            {lines.map((line, i) => (
                                <text key={i} x={half} y={half + size * 0.15 + i * size * 0.12} textAnchor="middle" dominantBaseline="middle" fontSize={size * 0.09} fontWeight="600" fill={style.text}>{line}</text>
                            ))}
                        </>
                    ) : (
                        <text x={half} y={half + size * 0.12} textAnchor="middle" dominantBaseline="middle" fontSize={size * 0.18} fontWeight="800" fill={style.text}>{signId}</text>
                    )}
                </>
            )}
            {shape === "rect" && (
                <>
                    <rect x={3} y={3} width={size - 6} height={size - 6} rx={6} fill={`url(#${gradId})`} stroke={style.border} strokeWidth={Math.max(2, size * 0.03)} filter={`url(#${shadowId})`} />
                    {lines.length > 0 ? (
                        <>
                            <text x={half} y={half - size * 0.08} textAnchor="middle" dominantBaseline="middle" fontSize={size * 0.12} fontWeight="800" fill={style.border}>{signId}</text>
                            {lines.map((line, i) => (
                                <text key={i} x={half} y={half + size * 0.06 + i * size * 0.13} textAnchor="middle" dominantBaseline="middle" fontSize={size * 0.1} fontWeight="600" fill={style.text}>{line}</text>
                            ))}
                        </>
                    ) : (
                        <text x={half} y={half + 1} textAnchor="middle" dominantBaseline="middle" fontSize={size * 0.2} fontWeight="800" fill={style.text}>{signId}</text>
                    )}
                </>
            )}
        </svg>
    );
}
