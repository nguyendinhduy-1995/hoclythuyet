/**
 * analytics-tracker.js — Học Lý Thuyết Tracker (taplai)
 * Tracks: page views, clicks, scroll, session + app-specific:
 * - topic_view, question_answer, exam_start, exam_finish, daily_practice,
 *   search_query, wrong_review, settings_change
 */
(function () {
    'use strict';

    var API_URL = 'https://thayduydaotaolaixe.com/api/public/analytics';
    var SITE = 'taplai';
    var BATCH_INTERVAL = 10000;
    var queue = [];
    var sessionId = '';
    var pageEnteredAt = Date.now();
    var currentPage = '/';
    var lastTrackedPath = '';

    function getSessionId() {
        var sid = sessionStorage.getItem('_td_sid');
        if (!sid) {
            sid = 'sid_' + Date.now().toString(36) + '_' + Math.random().toString(36).slice(2, 8);
            sessionStorage.setItem('_td_sid', sid);
        }
        return sid;
    }

    function buildEvent(eventType, extra) {
        var evt = {
            site: SITE,
            sessionId: sessionId,
            eventType: eventType,
            page: currentPage,
            referrer: document.referrer || null,
            userAgent: navigator.userAgent,
            screenWidth: window.screen ? window.screen.width : null,
            ts: new Date().toISOString()
        };
        if (extra) evt.payload = extra;
        return evt;
    }

    function pushEvent(eventType, extra) {
        queue.push(buildEvent(eventType, extra));
    }

    function doFetch(body) {
        try {
            fetch(API_URL, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: body,
                keepalive: true,
                credentials: 'omit',
                mode: 'cors'
            }).catch(function () { });
        } catch (e) { }
    }

    function flush() {
        if (queue.length === 0) return;
        var batch = queue.splice(0, queue.length);
        var body = JSON.stringify({ events: batch });
        if (navigator.sendBeacon) {
            var sent = navigator.sendBeacon(API_URL, new Blob([body], { type: 'application/json' }));
            if (!sent) doFetch(body);
        } else {
            doFetch(body);
        }
    }

    function trackPageView(pageName) {
        var now = Date.now();
        var durationSec = Math.round((now - pageEnteredAt) / 1000);
        if (durationSec > 0 && currentPage) {
            pushEvent('page_duration', { page: currentPage, duration: durationSec });
        }
        currentPage = pageName || '/';
        pageEnteredAt = now;
        pushEvent('page_view');

        // Detect page type from path and send specific events
        if (pageName.match(/^\/exam/)) {
            pushEvent('exam_start', { path: pageName });
        }
        if (pageName.match(/^\/daily/)) {
            pushEvent('daily_practice', { path: pageName });
        }
        if (pageName.match(/^\/bien-bao/)) {
            pushEvent('topic_view', { topic: 'bien-bao', path: pageName });
        }
        if (pageName.match(/^\/luat-gt/)) {
            pushEvent('topic_view', { topic: 'luat-gt', path: pageName });
        }
        if (pageName.match(/^\/sa-hinh/)) {
            pushEvent('topic_view', { topic: 'sa-hinh', path: pageName });
        }
        if (pageName.match(/^\/meo-thi/)) {
            pushEvent('topic_view', { topic: 'meo-thi', path: pageName });
        }
        if (pageName.match(/^\/so-tay-sai/)) {
            pushEvent('wrong_review', { path: pageName });
        }
        if (pageName.match(/^\/diem-yeu/)) {
            pushEvent('weak_topic_view', { path: pageName });
        }
        if (pageName.match(/^\/tim-kiem/)) {
            pushEvent('search_query', { path: pageName });
        }
    }

    function pollNavigation() {
        var path = window.location.pathname;
        if (path !== lastTrackedPath) {
            lastTrackedPath = path;
            trackPageView(path);
        }
    }

    // Track answer selections (detect radio/checkbox clicks in question forms)
    function hookAnswers() {
        document.addEventListener('change', function (e) {
            var target = e.target;
            if (target && (target.type === 'radio' || target.type === 'checkbox')) {
                var questionEl = target.closest('[data-question-id], .question-card, .question-item');
                var qId = questionEl ? (questionEl.dataset.questionId || questionEl.id || '') : '';
                pushEvent('question_answer', { questionId: qId, value: (target.value || '').slice(0, 20) });
            }
        }, true);
    }

    // Track clicks
    function hookClicks() {
        document.addEventListener('click', function (e) {
            var target = e.target;
            for (var i = 0; i < 5 && target && target !== document.body; i++) {
                var tagName = target.tagName ? target.tagName.toLowerCase() : '';
                if (tagName === 'button' || tagName === 'a' || target.getAttribute('onclick')) {
                    var label = target.textContent ? target.textContent.trim().slice(0, 50) : '';
                    var id = target.id || '';
                    pushEvent('click', { tag: tagName, id: id, label: label });
                    break;
                }
                target = target.parentElement;
            }
        }, true);
    }

    // Track scroll depth
    function hookScroll() {
        var reported = {};
        window.addEventListener('scroll', function () {
            var scrollHeight = Math.max(document.body.scrollHeight, document.documentElement.scrollHeight);
            var scrollTop = window.pageYOffset || document.documentElement.scrollTop;
            var pct = Math.round((scrollTop + window.innerHeight) / scrollHeight * 100);
            [25, 50, 75, 100].forEach(function (m) {
                if (pct >= m && !reported[m]) { reported[m] = true; pushEvent('scroll', { depth: m }); }
            });
        }, { passive: true });
    }

    function trackSessionEnd() {
        var totalDuration = Math.round((Date.now() - parseInt(sessionStorage.getItem('_td_start') || Date.now())) / 1000);
        pushEvent('session_end', { totalDuration: totalDuration });
        flush();
    }

    function init() {
        sessionId = getSessionId();
        if (!sessionStorage.getItem('_td_start')) sessionStorage.setItem('_td_start', String(Date.now()));
        lastTrackedPath = window.location.pathname;
        trackPageView(lastTrackedPath);
        hookClicks();
        hookAnswers();
        hookScroll();
        setInterval(pollNavigation, 500);
        setInterval(flush, BATCH_INTERVAL);
        document.addEventListener('visibilitychange', function () { if (document.visibilityState === 'hidden') trackSessionEnd(); });
        window.addEventListener('beforeunload', function () { trackSessionEnd(); });
    }

    if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', init);
    else init();
})();
