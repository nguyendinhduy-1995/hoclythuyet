# CRM ↔ App Integration

## Architecture

```
CRM (source of truth: student identity)
  ├─ Student, Lead, Course, Branch
  ├─ StudentAccount (phone + password + JWT)
  └─ Endpoints:
       GET  /api/student/me         → student profile
       POST /api/student-progress/* → receive learning data

App (source of truth: learning mechanics)
  ├─ localStorage stores (progress, streak, review, etc.)
  ├─ Sync Engine (outbox pattern)
  └─ Proxy:
       POST /api/sync/push          → forwards to CRM
```

## Data Flow

```
Student completes Daily/Mock in App
  → dailyStore / mockStore fires sync
  → pushToOutbox() queues in localStorage
  → flushOutbox() POSTs to /api/sync/push (app server)
  → /api/sync/push signs with HMAC + service token
  → CRM /api/student-progress/* upserts data
  → CRM Student Detail page shows widget
```

## Endpoints

### CRM receives (App → CRM)

| Method | Path | Purpose | Auth |
|--------|------|---------|------|
| POST | `/api/student-progress/daily` | Upsert daily snapshot | `x-service-token` + HMAC |
| POST | `/api/student-progress/attempt` | Create attempt summary | `x-service-token` + HMAC |
| POST | `/api/student-progress/ai-summary` | Upsert AI coach summary | `x-service-token` + HMAC |
| POST | `/api/student-progress/events` | Append event log | `x-service-token` + HMAC |

### CRM serves (CRM → App/Admin)

| Method | Path | Purpose | Auth |
|--------|------|---------|------|
| GET | `/api/student/me` | Student profile | Student JWT cookie |
| GET | `/api/students/:id/app-progress` | Admin progress view | CRM RBAC (students.VIEW) |

## Payloads

### POST /api/student-progress/daily
```json
{
  "studentId": "stu_123",
  "dateKey": "2026-02-19",
  "minutes": 12,
  "questionsAnswered": 32,
  "correct": 25,
  "accuracy": 78,
  "streakCurrent": 6,
  "streakLongest": 11,
  "dueCount": 14,
  "topWeakTopics": [{"topicId":"t-khai-niem","accuracy":52}],
  "lastActiveAt": "2026-02-19T13:21:00+07:00"
}
```

### POST /api/student-progress/attempt
```json
{
  "studentId": "stu_123",
  "attemptId": "att_999",
  "mode": "MOCK",
  "startedAt": "2026-02-19T13:00:00+07:00",
  "finishedAt": "2026-02-19T13:20:00+07:00",
  "score": 28,
  "total": 35,
  "accuracy": 80,
  "topicBreakdown": [{"topicId":"t-bien-bao","total":8,"correct":7,"accuracy":88}]
}
```

### POST /api/student-progress/ai-summary
```json
{
  "studentId": "stu_123",
  "passProbability": 82,
  "strengths": ["Biển báo nhận nhanh"],
  "weaknesses": ["Ưu tiên", "Giao nhau"],
  "todayPlan": ["Ôn 10 câu đến hạn", "Thi thử 10 câu tốc độ"],
  "generatedAt": "2026-02-19T13:22:00+07:00"
}
```

### POST /api/student-progress/events
```json
{
  "eventId": "evt_abc123",
  "studentId": "stu_123",
  "type": "DAILY_COMPLETED",
  "occurredAt": "2026-02-19T13:10:00+07:00",
  "payload": {"questions":10,"correct":8}
}
```

## Auth Headers

```
x-service-token: <SERVICE_TOKEN from .env>
x-timestamp: <unix ms>
x-signature: HMAC-SHA256(body, CRM_HMAC_SECRET)
```

- Replay window: 5 minutes
- Idempotency: `attemptId` (attempts), `eventId` (events), `studentId+dateKey` (daily)

## Setup

### App side (.env.local)
```
CRM_API_URL=https://crm.thayduydaotaolaixe.com
CRM_SERVICE_TOKEN=<same as CRM SERVICE_TOKEN>
CRM_HMAC_SECRET=<same as CRM CRM_HMAC_SECRET>
```

### CRM side (.env)
```
SERVICE_TOKEN=<service token>
CRM_HMAC_SECRET=<hmac secret>
```

### Prisma migration
```bash
cd thayduy-crm && npx prisma migrate dev --name add-app-progress
```

## Test Checklist

1. [ ] `prisma migrate dev` passes on CRM
2. [ ] `npm run build` passes on both repos
3. [ ] Login as student in CRM → get JWT cookie
4. [ ] Open App with cookie → initSyncEngine() runs
5. [ ] Complete Daily → check outbox flushes → CRM has daily snapshot
6. [ ] Complete Mock → check CRM has attempt summary
7. [ ] Visit CRM `/students/:id` → see progress widget
8. [ ] Go offline → answer questions → go online → outbox flushes
