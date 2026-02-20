/**
 * AI Explain API — explains why an answer is wrong
 * Server-side only — OpenAI key never exposed to client
 */
import { NextRequest, NextResponse } from "next/server";

function getApiKey(): string | null {
    // Priority: env var → encrypted file (future)
    return process.env.OPENAI_API_KEY || null;
}

export async function POST(req: NextRequest) {
    try {
        const apiKey = getApiKey();
        if (!apiKey) {
            return NextResponse.json(
                { error: "AI chưa được cấu hình. Admin cần nhập API key." },
                { status: 503 }
            );
        }

        const body = await req.json();
        const { question, userAnswer, correctAnswer, explanation } = body;

        if (!question || !correctAnswer) {
            return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
        }

        const systemPrompt = `Bạn là trợ lý dạy lý thuyết lái xe Việt Nam. Trả lời ngắn gọn bằng tiếng Việt.
Format JSON: {"explanation":"...","tip":"...","trap":"..."}
- explanation: giải thích tại sao đáp án đúng (2-3 câu, dựa trên luật giao thông)
- tip: mẹo nhớ dễ hiểu (1 câu)
- trap: bẫy hay gặp trong câu này (1 câu)`;

        const userPrompt = `Câu hỏi: ${question}
Đáp án đúng: ${correctAnswer}
Học viên chọn sai: ${userAnswer || "Không trả lời"}
${explanation ? `Giải thích gốc: ${explanation}` : ""}

Giải thích tại sao sai và cách nhớ:`;

        const response = await fetch("https://api.openai.com/v1/chat/completions", {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
                Authorization: `Bearer ${apiKey}`,
            },
            body: JSON.stringify({
                model: process.env.AI_MODEL || "gpt-4o-mini",
                messages: [
                    { role: "system", content: systemPrompt },
                    { role: "user", content: userPrompt },
                ],
                max_tokens: 300,
                temperature: 0.7,
                response_format: { type: "json_object" },
            }),
        });

        if (!response.ok) {
            const err = await response.text();
            console.error("OpenAI error:", err);
            return NextResponse.json({ error: "AI service error" }, { status: 502 });
        }

        const data = await response.json();
        const content = data.choices?.[0]?.message?.content;

        try {
            const parsed = JSON.parse(content);
            return NextResponse.json(parsed);
        } catch {
            return NextResponse.json({
                explanation: content || "Không thể phân tích phản hồi AI.",
                tip: "",
                trap: "",
            });
        }
    } catch (error) {
        console.error("AI explain error:", error);
        return NextResponse.json({ error: "Internal server error" }, { status: 500 });
    }
}
