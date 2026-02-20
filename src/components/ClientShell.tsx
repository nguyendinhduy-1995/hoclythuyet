"use client";

import { useEffect } from "react";
import dynamic from "next/dynamic";
import { applyTheme } from "@/lib/settingsStore";

const BottomNav = dynamic(() => import("./BottomNav"), { ssr: false });

export default function ClientShell({ children }: { children: React.ReactNode }) {
    useEffect(() => {
        applyTheme();
    }, []);

    return (
        <>
            {children}
            <BottomNav />
        </>
    );
}
