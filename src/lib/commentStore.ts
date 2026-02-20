/**
 * Comment Store — localStorage-based personal notes for questions
 * Allows students to add personal notes/comments to individual questions
 */

const STORAGE_KEY = "thayduy_comments_v1";

interface CommentsData {
    comments: Record<string, { text: string; updatedAt: number }>;
}

function getData(): CommentsData {
    if (typeof window === "undefined") return { comments: {} };
    try {
        const raw = localStorage.getItem(STORAGE_KEY);
        if (!raw) return { comments: {} };
        return JSON.parse(raw) as CommentsData;
    } catch {
        return { comments: {} };
    }
}

function setData(data: CommentsData) {
    if (typeof window === "undefined") return;
    try {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
    } catch {
        // localStorage full or unavailable
    }
}

/** Get comment for a specific question */
export function getComment(questionId: string): string {
    const data = getData();
    return data.comments[questionId]?.text || "";
}

/** Save comment for a specific question */
export function saveComment(questionId: string, text: string) {
    const data = getData();
    if (text.trim()) {
        data.comments[questionId] = { text: text.trim(), updatedAt: Date.now() };
    } else {
        delete data.comments[questionId];
    }
    setData(data);
}

/** Delete comment for a specific question */
export function deleteComment(questionId: string) {
    const data = getData();
    delete data.comments[questionId];
    setData(data);
}

/** Get all comments (for export/overview) */
export function getAllComments(): Record<string, { text: string; updatedAt: number }> {
    return getData().comments;
}

/** Get count of commented questions */
export function getCommentCount(): number {
    return Object.keys(getData().comments).length;
}
