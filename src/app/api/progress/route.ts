import { NextResponse } from "next/server";

/**
 * GET /api/progress
 * 
 * Returns the current user's learning progress from localStorage.
 * Since localStorage is client-side, this is a static endpoint that returns
 * the TOPIC structure — the actual data is populated client-side.
 * 
 * This API is called cross-origin from the CRM student portal.
 */

const TOPICS = [
    { id: "t-diem-liet", name: "Câu hỏi điểm liệt", total: 60 },
    { id: "t-khai-niem", name: "Khái niệm và quy tắc", total: 180 },
    { id: "t-van-hoa", name: "Văn hóa giao thông", total: 25 },
    { id: "t-ky-thuat", name: "Kỹ thuật lái xe", total: 58 },
    { id: "t-cau-tao", name: "Cấu tạo sửa chữa", total: 37 },
    { id: "t-bien-bao", name: "Biển báo đường bộ", total: 185 },
    { id: "t-tinh-huong", name: "Sa hình tình huống", total: 115 },
];

export async function GET() {
    // Return topic structure — actual progress data comes from client-side
    const res = NextResponse.json({
        total: 600,
        answered: 0,
        correct: 0,
        wrong: 0,
        streak: 0,
        topics: TOPICS.map((t) => ({
            id: t.id,
            name: t.name,
            total: t.total,
            answered: 0,
            correct: 0,
        })),
    });

    // Allow cross-origin requests from CRM
    res.headers.set("Access-Control-Allow-Origin", "*");
    res.headers.set("Access-Control-Allow-Methods", "GET, OPTIONS");
    return res;
}

export async function OPTIONS() {
    return new NextResponse(null, {
        status: 204,
        headers: {
            "Access-Control-Allow-Origin": "*",
            "Access-Control-Allow-Methods": "GET, OPTIONS",
            "Access-Control-Allow-Headers": "Content-Type",
        },
    });
}
