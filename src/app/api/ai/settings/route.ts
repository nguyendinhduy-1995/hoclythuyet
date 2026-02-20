/**
 * AI Settings API — Admin-only endpoint for managing OpenAI API key
 * GET: check if key is configured + masked preview
 * PUT: update key (stored in env / server-side config)
 */
import { NextRequest, NextResponse } from "next/server";
import { promises as fs } from "fs";
import path from "path";
import crypto from "crypto";

const CONFIG_PATH = path.join(process.cwd(), "data", "ai-config.json");
const MASTER_KEY = process.env.AI_MASTER_KEY || "default-master-key-change-me-in-production";
const ADMIN_PIN = process.env.ADMIN_PIN || "1234";

/* ── Encryption helpers ── */
function encrypt(text: string): string {
    const key = crypto.scryptSync(MASTER_KEY, "salt", 32);
    const iv = crypto.randomBytes(16);
    const cipher = crypto.createCipheriv("aes-256-gcm", key, iv);
    const encrypted = Buffer.concat([cipher.update(text, "utf8"), cipher.final()]);
    const authTag = cipher.getAuthTag();
    return JSON.stringify({
        iv: iv.toString("hex"),
        encrypted: encrypted.toString("hex"),
        authTag: authTag.toString("hex"),
    });
}

function decrypt(data: string): string {
    try {
        const { iv, encrypted, authTag } = JSON.parse(data);
        const key = crypto.scryptSync(MASTER_KEY, "salt", 32);
        const decipher = crypto.createDecipheriv("aes-256-gcm", key, Buffer.from(iv, "hex"));
        decipher.setAuthTag(Buffer.from(authTag, "hex"));
        return decipher.update(Buffer.from(encrypted, "hex")) + decipher.final("utf8");
    } catch {
        return "";
    }
}

/* ── Auth check ── */
function checkAdmin(req: NextRequest): boolean {
    const pin = req.headers.get("x-admin-pin") || "";
    return pin === ADMIN_PIN;
}

function maskKey(key: string): string {
    if (key.length < 8) return "****";
    return key.slice(0, 5) + "..." + key.slice(-4);
}

/* ── Read/write config ── */
async function readConfig(): Promise<{ encryptedKey?: string }> {
    try {
        const data = await fs.readFile(CONFIG_PATH, "utf8");
        return JSON.parse(data);
    } catch {
        return {};
    }
}

async function writeConfig(config: { encryptedKey?: string }) {
    const dir = path.dirname(CONFIG_PATH);
    await fs.mkdir(dir, { recursive: true });
    await fs.writeFile(CONFIG_PATH, JSON.stringify(config, null, 2));
}

/* ── API ── */
export async function GET(req: NextRequest) {
    if (!checkAdmin(req)) {
        return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Check env first
    const envKey = process.env.OPENAI_API_KEY;
    if (envKey) {
        return NextResponse.json({
            configured: true,
            source: "env",
            maskedKey: maskKey(envKey),
        });
    }

    // Check file config
    const config = await readConfig();
    if (config.encryptedKey) {
        const key = decrypt(config.encryptedKey);
        return NextResponse.json({
            configured: !!key,
            source: "file",
            maskedKey: key ? maskKey(key) : null,
        });
    }

    return NextResponse.json({ configured: false, source: null, maskedKey: null });
}

export async function PUT(req: NextRequest) {
    if (!checkAdmin(req)) {
        return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    try {
        const { apiKey } = await req.json();
        if (!apiKey || typeof apiKey !== "string" || !apiKey.startsWith("sk-")) {
            return NextResponse.json({ error: "Invalid API key format" }, { status: 400 });
        }

        // Encrypt and save to file
        const encrypted = encrypt(apiKey);
        await writeConfig({ encryptedKey: encrypted });

        // Also set in process.env for immediate use (runtime only)
        process.env.OPENAI_API_KEY = apiKey;

        return NextResponse.json({
            success: true,
            maskedKey: maskKey(apiKey),
        });
    } catch (error) {
        console.error("Save AI key error:", error);
        return NextResponse.json({ error: "Failed to save key" }, { status: 500 });
    }
}
