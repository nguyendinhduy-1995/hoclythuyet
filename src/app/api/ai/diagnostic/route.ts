/**
 * AI Diagnostic API — generates personalized study plan
 * Used for AI Coach typing effect on home page
 */
import { NextRequest, NextResponse } from "next/server";

function getApiKey(): string | null {
    return process.env.OPENAI_API_KEY || null;
}

export async function POST(req: NextRequest) {
    try {
        const apiKey = getApiKey();
        if (!apiKey) {
            return NextResponse.json(
                { error: "AI chưa được cấu hình." },
                { status: 503 }
            );
        }

        const body = await req.json();
        const { accuracy, dueCount, streak, weakTopics, recentMockScore, totalAnswered } = body;

        const systemPrompt = `Bạn là AI Coach giúp học viên thi lý thuyết GPLX Việt Nam. Trả lời ngắn gọn bằng tiếng Việt.
Format JSON strict:
{
  "passRate": number (0-100, ước tính tỉ lệ đậu),
  "strengths": ["điểm mạnh 1", "điểm mạnh 2"],
  "weaknesses": ["điểm yếu 1", "điểm yếu 2"],
  "todayPlan": "kế hoạch học 5-10 phút cho hôm nay (2-3 câu ngắn)"
}`;

        const userPrompt = `Dữ liệu học viên:
- Độ chính xác gần đây: ${accuracy}%
- Tổng câu đã trả lời: ${totalAnswered || 0}
- Câu cần ôn hôm nay (due): ${dueCount}
- Streak: ${streak} ngày liên tiếp
- Chủ đề yếu: ${weakTopics?.join(", ") || "chưa xác định"}
- Kết quả thi thử gần nhất: ${recentMockScore != null ? `${recentMockScore}%` : "chưa thi"}

Phân tích và đưa kế hoạch:`;

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
                max_tokens: 400,
                temperature: 0.8,
                response_format: { type: "json_object" },
            }),
        });

        if (!response.ok) {
            console.error("OpenAI error:", await response.text());
            return NextResponse.json({ error: "AI service error" }, { status: 502 });
        }

        const data = await response.json();
        const content = data.choices?.[0]?.message?.content;

        try {
            return NextResponse.json(JSON.parse(content));
        } catch {
            return NextResponse.json({
                passRate: accuracy || 0,
                strengths: ["Đang thu thập dữ liệu"],
                weaknesses: ["Cần làm thêm bài"],
                todayPlan: "Hãy làm thêm 10 câu hôm nay để AI phân tích tốt hơn.",
            });
        }
    } catch (error) {
        console.error("AI diagnostic error:", error);
        return NextResponse.json({ error: "Internal server error" }, { status: 500 });
    }
}
