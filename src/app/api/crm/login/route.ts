import { NextResponse } from "next/server";

/**
 * POST /api/crm/login
 * Proxy for CRM student login — avoids CORS issues.
 * Forwards login request to CRM server-side.
 */
export async function POST(req: Request) {
    try {
        const body = await req.json().catch(() => null);
        if (!body?.phone || !body?.password) {
            return NextResponse.json({ ok: false, error: "Thiếu SĐT hoặc mật khẩu" }, { status: 400 });
        }

        const crmUrl = process.env.CRM_API_URL
            || (process.env.NODE_ENV === "development" ? "http://localhost:3001" : "https://crm.thayduydaotaolaixe.com");

        const crmRes = await fetch(`${crmUrl}/api/student/auth/login`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ identifier: body.phone, password: body.password }),
        });

        const crmData = await crmRes.json().catch(() => null);

        if (!crmRes.ok || !crmData?.accessToken) {
            return NextResponse.json(
                { ok: false, error: crmData?.error?.message || "Đăng nhập thất bại" },
                { status: crmRes.status }
            );
        }

        return NextResponse.json({
            ok: true,
            accessToken: crmData.accessToken,
            student: crmData.student,
        });
    } catch (err) {
        console.error("[api/crm/login]", err);
        return NextResponse.json({ ok: false, error: "Không thể kết nối đến CRM" }, { status: 502 });
    }
}
