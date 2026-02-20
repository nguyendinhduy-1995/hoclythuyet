import { NextRequest, NextResponse } from "next/server";
import questionsData from "@/data/questions.json";

export async function GET(request: NextRequest) {
    const { searchParams } = request.nextUrl;
    const topicId = searchParams.get("topicId");
    const page = parseInt(searchParams.get("page") || "1", 10);
    const pageSize = parseInt(searchParams.get("pageSize") || "600", 10);
    const mode = searchParams.get("mode");
    const questionIds = searchParams.get("questionIds"); // comma-separated IDs

    let filtered = questionsData.questions;

    // Filter by specific question IDs (for "Câu sai" and "50 câu hay sai")
    if (questionIds) {
        const ids = new Set(questionIds.split(","));
        filtered = filtered.filter((q) => ids.has(q.id));
    }

    // Filter by topic
    if (topicId) {
        if (topicId === "t-diem-liet") {
            // Điểm liệt questions span multiple topics, identified by isCritical flag
            filtered = filtered.filter((q) => q.isCritical);
        } else {
            filtered = filtered.filter((q) => q.topicId === topicId);
        }
    }

    const total = filtered.length;

    // Shuffle for exam mode (non-practice)
    if (mode !== "practice") {
        filtered = [...filtered].sort(() => Math.random() - 0.5);
    }

    // Paginate
    const start = (page - 1) * pageSize;
    const items = filtered.slice(start, start + pageSize);

    return NextResponse.json({
        questions: items,
        pagination: {
            total,
            page,
            pageSize,
            totalPages: Math.ceil(total / pageSize),
        },
    });
}
