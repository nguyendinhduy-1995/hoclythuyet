// Học Lý Thuyết Cùng Thầy Duy — Service Worker v1.0
const CACHE_NAME = "thayduy-v1";

// App shell files to pre-cache
const APP_SHELL = [
    "/",
    "/manifest.json",
    "/icon-192.png",
    "/icon-512.png",
];

// Install — pre-cache app shell
self.addEventListener("install", (event) => {
    event.waitUntil(
        caches.open(CACHE_NAME).then((cache) => cache.addAll(APP_SHELL))
    );
    self.skipWaiting();
});

// Activate — clean up old caches
self.addEventListener("activate", (event) => {
    event.waitUntil(
        caches.keys().then((keys) =>
            Promise.all(
                keys
                    .filter((key) => key !== CACHE_NAME)
                    .map((key) => caches.delete(key))
            )
        )
    );
    self.clients.claim();
});

// Fetch — network-first for navigations & API, cache-first for static assets
self.addEventListener("fetch", (event) => {
    const { request } = event;
    const url = new URL(request.url);

    // Skip non-GET and cross-origin
    if (request.method !== "GET" || url.origin !== self.location.origin) return;

    // API calls — network only (don't cache dynamic data)
    if (url.pathname.startsWith("/api/")) return;

    // Navigation requests — network first, fallback to cache
    if (request.mode === "navigate") {
        event.respondWith(
            fetch(request)
                .then((response) => {
                    const clone = response.clone();
                    caches.open(CACHE_NAME).then((cache) => cache.put(request, clone));
                    return response;
                })
                .catch(() => caches.match(request).then((r) => r || caches.match("/")))
        );
        return;
    }

    // Static assets — cache first, then network
    event.respondWith(
        caches.match(request).then(
            (cached) =>
                cached ||
                fetch(request).then((response) => {
                    // Cache successful responses for static assets
                    if (response.ok && (
                        url.pathname.match(/\.(js|css|png|jpg|jpeg|svg|webp|ico|woff2?)$/) ||
                        url.pathname.startsWith("/_next/static/")
                    )) {
                        const clone = response.clone();
                        caches.open(CACHE_NAME).then((cache) => cache.put(request, clone));
                    }
                    return response;
                })
        )
    );
});
