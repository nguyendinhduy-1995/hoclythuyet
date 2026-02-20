import { NextResponse } from "next/server";

/**
 * POST /api/crm/sync-progress
 * Proxy for pushing theory progress to CRM using the student's JWT token.
 * The client sends { token, progress } and this proxy forwards to CRM.
 */
export async function POST(req: Request) {
    try {
        const body = await req.json().catch(() => null);
        if (!body?.token || !body?.progress) {
            return NextResponse.json({ ok: false, error: "Missing token or progress" }, { status: 400 });
        }

        const crmUrl = process.env.CRM_API_URL
            || (process.env.NODE_ENV === "development" ? "http://localhost:3001" : "https://crm.thayduydaotaolaixe.com");

        const crmRes = await fetch(`${crmUrl}/api/student/me/theory-progress`, {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
                Authorization: `Bearer ${body.token}`,
            },
            body: JSON.stringify(body.progress),
        });

        const crmData = await crmRes.json().catch(() => null);

        if (!crmRes.ok) {
            return NextResponse.json(
                { ok: false, error: crmData?.error?.message || "Sync failed", status: crmRes.status },
                { status: crmRes.status >= 500 ? 502 : crmRes.status }
            );
        }

        return NextResponse.json({ ok: true, ...crmData });
    } catch (err) {
        console.error("[api/crm/sync-progress]", err);
        return NextResponse.json({ ok: false, error: "Sync proxy error" }, { status: 502 });
    }
}
