"use client";

import { usePathname } from "next/navigation";
import Link from "next/link";
import styles from "./BottomNav.module.css";

const NAV_ITEMS = [
    { href: "/", icon: "🏠", label: "Trang chủ" },
    { href: "/exam/600?mode=practice", icon: "📝", label: "Ôn tập" },
    { href: "/meo-thi", icon: "💡", label: "Mẹo thi" },
    { href: "/tim-kiem", icon: "🔍", label: "Tìm kiếm" },
    { href: "/cai-dat", icon: "⚙️", label: "Cài đặt" },
];

// Don't show bottom nav on exam pages
const HIDDEN_ROUTES = ["/exam/"];

export default function BottomNav() {
    const pathname = usePathname();

    if (HIDDEN_ROUTES.some((r) => pathname.startsWith(r))) return null;

    return (
        <nav className={styles.bottomNav} style={{ display: 'flex' }}>
            {NAV_ITEMS.map((item) => {
                const isActive = item.href === "/"
                    ? pathname === "/"
                    : pathname.startsWith(item.href.split("?")[0]);
                return (
                    <Link
                        key={item.href}
                        href={item.href}
                        className={`${styles.navItem} ${isActive ? styles.navItemActive : ""}`}
                        style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', flex: 1, textDecoration: 'none' }}
                    >
                        <span className={styles.navIcon}>{item.icon}</span>
                        <span className={styles.navLabel}>{item.label}</span>
                    </Link>
                );
            })}
        </nav>
    );
}
