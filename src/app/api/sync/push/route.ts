import { NextResponse } from "next/server";
import crypto from "crypto";

/**
 * Proxy endpoint: receives sync items from client,
 * forwards to CRM with service-to-service auth headers.
 * CRM tokens are NEVER exposed to the client.
 */

const ENDPOINT_MAP: Record<string, string> = {
    daily: "/api/student-progress/daily",
    attempt: "/api/student-progress/attempt",
    "ai-summary": "/api/student-progress/ai-summary",
    events: "/api/student-progress/events",
};

export async function POST(req: Request) {
    try {
        const body = await req.json();
        const { type, payload } = body as { type: string; payload: Record<string, unknown> };

        if (!type || !payload) {
            return NextResponse.json({ error: "Missing type or payload" }, { status: 400 });
        }

        const crmPath = ENDPOINT_MAP[type];
        if (!crmPath) {
            return NextResponse.json({ error: `Unknown sync type: ${type}` }, { status: 400 });
        }

        const crmUrl = process.env.CRM_API_URL;
        const serviceToken = process.env.CRM_SERVICE_TOKEN;
        const hmacSecret = process.env.CRM_HMAC_SECRET || serviceToken;

        if (!crmUrl || !serviceToken) {
            return NextResponse.json({ error: "CRM integration not configured" }, { status: 503 });
        }

        const rawBody = JSON.stringify(payload);
        const timestamp = Date.now().toString();
        const signature = crypto
            .createHmac("sha256", hmacSecret!)
            .update(rawBody)
            .digest("hex");

        const crmRes = await fetch(`${crmUrl}${crmPath}`, {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
                "x-service-token": serviceToken,
                "x-timestamp": timestamp,
                "x-signature": signature,
            },
            body: rawBody,
        });

        const crmData = await crmRes.json().catch(() => ({}));

        if (!crmRes.ok) {
            console.error(`[sync/push] CRM error ${crmRes.status}:`, crmData);
            return NextResponse.json(
                { error: "CRM sync failed", status: crmRes.status, detail: crmData },
                { status: crmRes.status >= 500 ? 502 : crmRes.status }
            );
        }

        return NextResponse.json({ ok: true, ...crmData });
    } catch (err) {
        console.error("[sync/push]", err);
        return NextResponse.json({ error: "Internal sync error" }, { status: 500 });
    }
}
