/**
 * CRM Auth integration — read student JWT from CRM cookie OR localStorage
 * Supports both same-origin (cookie) and cross-origin (localStorage) scenarios.
 */

const CRM_COOKIE_NAME = "student_access_token";
const CRM_LINK_KEY = "thayduy_crm_link";

export type CrmStudentPayload = {
    sub: string;
    role: "student";
    phone: string;
    studentId: string;
    exp?: number;
};

interface CrmLink {
    token: string;
    crmUrl: string;
    studentName: string;
    phone: string;
    studentId: string;
    linkedAt: string;
}

/* ── Token helpers ── */

function decodeJwtPayload(token: string): CrmStudentPayload | null {
    try {
        const parts = token.split(".");
        if (parts.length < 2) return null;
        const b64 = parts[1].replace(/-/g, "+").replace(/_/g, "/");
        const padded = b64 + "=".repeat((4 - (b64.length % 4)) % 4);
        const payload: CrmStudentPayload = JSON.parse(atob(padded));
        if (payload.exp && payload.exp * 1000 < Date.now()) return null;
        return payload;
    } catch {
        return null;
    }
}

function getTokenFromCookie(): string | null {
    if (typeof window === "undefined") return null;
    const match = document.cookie.match(new RegExp(`(?:^|;\\s*)${CRM_COOKIE_NAME}=([^;]*)`));
    return match?.[1] ? decodeURIComponent(match[1]) : null;
}

function getTokenFromLocalStorage(): string | null {
    if (typeof window === "undefined") return null;
    try {
        const raw = localStorage.getItem(CRM_LINK_KEY);
        if (!raw) return null;
        const link: CrmLink = JSON.parse(raw);
        return link.token;
    } catch {
        return null;
    }
}

/* ── Public API ── */

/** Get CRM token (cookie first, then localStorage) */
export function getCrmToken(): string | null {
    return getTokenFromCookie() || getTokenFromLocalStorage();
}

/** Read CRM student ID from cookie or localStorage */
export function getCrmStudentId(): string | null {
    const token = getCrmToken();
    if (!token) return null;
    return decodeJwtPayload(token)?.studentId || null;
}

/** Get stored CRM link info */
export function getCrmLink(): CrmLink | null {
    if (typeof window === "undefined") return null;
    try {
        const raw = localStorage.getItem(CRM_LINK_KEY);
        if (!raw) return null;
        const link: CrmLink = JSON.parse(raw);
        // Verify token not expired
        const payload = decodeJwtPayload(link.token);
        if (!payload) {
            localStorage.removeItem(CRM_LINK_KEY);
            return null;
        }
        return link;
    } catch {
        return null;
    }
}

/** Get CRM base URL */
export function getCrmUrl(): string {
    const link = getCrmLink();
    if (link?.crmUrl) return link.crmUrl;
    return process.env.NEXT_PUBLIC_CRM_URL || "";
}

/** Login to CRM via local proxy and store token */
export async function loginToCrm(
    crmUrl: string,
    phone: string,
    password: string
): Promise<{ ok: true; studentName: string } | { ok: false; error: string }> {
    try {
        // Use local proxy to avoid CORS issues
        const res = await fetch("/api/crm/login", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ phone, password }),
        });

        const body = await res.json().catch(() => null);
        if (!res.ok || !body?.accessToken) {
            return { ok: false, error: body?.error || "Đăng nhập thất bại" };
        }

        const payload = decodeJwtPayload(body.accessToken);
        const studentName = body.student?.fullName || "Học viên";

        const link: CrmLink = {
            token: body.accessToken,
            crmUrl,
            studentName,
            phone: body.student?.phone || phone,
            studentId: payload?.studentId || "",
            linkedAt: new Date().toISOString(),
        };
        localStorage.setItem(CRM_LINK_KEY, JSON.stringify(link));

        return { ok: true, studentName };
    } catch {
        return { ok: false, error: "Không thể kết nối đến CRM" };
    }
}

/** Unlink CRM account */
export function unlinkCrm() {
    if (typeof window === "undefined") return;
    localStorage.removeItem(CRM_LINK_KEY);
}

/** Check if linked to CRM */
export function isLinkedToCrm(): boolean {
    return getCrmLink() !== null;
}

/** Get CRM student name */
export function getCrmStudentName(): string | null {
    const link = getCrmLink();
    if (link) return link.studentName;

    const token = getTokenFromCookie();
    if (!token) return null;
    const payload = decodeJwtPayload(token);
    return payload?.phone || payload?.studentId || null;
}

/**
 * Get CRM student profile (server-side usage or client-side fetch).
 */
export async function getCrmProfile(): Promise<{
    student: { id: string; fullName: string | null; phone: string | null; studyStatus: string };
} | null> {
    try {
        const crmUrl = getCrmUrl();
        if (!crmUrl) return null;

        const token = getCrmToken();
        const headers: Record<string, string> = {};
        if (token) headers["Authorization"] = `Bearer ${token}`;

        const res = await fetch(`${crmUrl}/api/student/me`, {
            credentials: "include",
            headers,
        });
        if (!res.ok) return null;
        return res.json();
    } catch {
        return null;
    }
}
