"use client";

const STORAGE_KEY = "thayduy_bookmarks_v1";

function getBookmarks(): string[] {
    if (typeof window === "undefined") return [];
    try {
        const raw = localStorage.getItem(STORAGE_KEY);
        if (!raw) return [];
        return JSON.parse(raw) as string[];
    } catch {
        return [];
    }
}

function saveBookmarks(ids: string[]): void {
    if (typeof window === "undefined") return;
    localStorage.setItem(STORAGE_KEY, JSON.stringify(ids));
}

export function isBookmarked(questionId: string): boolean {
    return getBookmarks().includes(questionId);
}

export function toggleBookmark(questionId: string): boolean {
    const bookmarks = getBookmarks();
    const idx = bookmarks.indexOf(questionId);
    if (idx === -1) {
        bookmarks.push(questionId);
        saveBookmarks(bookmarks);
        return true; // now bookmarked
    } else {
        bookmarks.splice(idx, 1);
        saveBookmarks(bookmarks);
        return false; // now unbookmarked
    }
}

export function getBookmarkedIds(): string[] {
    return getBookmarks();
}

export function getBookmarkCount(): number {
    return getBookmarks().length;
}
