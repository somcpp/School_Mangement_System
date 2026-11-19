# SchoolHub — Review Findings & Phased Work Plan

> Written 2026-11-19 after a full repo review. Read this together with [`AGENTS.md`](../AGENTS.md) (coding rules).
> **Phase 0 is due before the presentation (2026-11-20). Everything after Phase 0 is deliberately deferred.**

---

## 1. Where the project stands

### Architecture (short version)
- **Backend** (`backend/`): Express 4 + TypeScript + Prisma 7 (Postgres). Modular monolith, 17 modules under `src/modules/<name>/` (routes → controller → service → schema). Request pipeline: Helmet/CORS → `authenticateUser` (JWT HttpOnly cookies) → `requireTenant` (`schoolId`) → `requireRole` → Zod validation → service. Socket.IO in `src/socket/` for presence, chat relay and live notifications.
- **Frontend** (`frontend/`): React 19 + Vite + Tailwind v4 + Framer Motion + TanStack Query. Pages in `src/pages/`, domain components in `src/components/features/<domain>/`, API calls in `src/services/`, query hooks in `src/hooks/`, global state in `src/context/`.
- **Roles**: `SUPER_ADMIN`, `SCHOOL_ADMIN`, `TEACHER`, `STUDENT`, `PARENT`. Same `/dashboard` route renders a different view per role.

### ✅ Working end-to-end (real backend + real UI)
Auth & school self-registration · Students (list, admission, profile, avatar upload) · Teachers · Academics (classes, sections, subjects, CBSE starter pack) · Attendance (roll call, student & parent views) · Finance (fee structures, invoices, payments, ledgers, Razorpay) · Notice board with PDF attachments · Notifications (REST + Socket.IO) · Role dashboards · Super Admin school list · Exams (create, schedule, marks, report card).

### 🟡 Backend exists, UI still uses mock data
| Area | Problem | Where |
|---|---|---|
| Timetable | Hardcoded `initialSchedule`; never calls `timetableService`. Seed has **no** timetable rows. | `frontend/src/pages/TimetablePage.tsx` |
| Homework / subjects | Student subject pages read from mock `data/studentSubjectsData.ts` instead of the assignments API | `StudentSubjectsPage.tsx`, `SubjectClassroomPage.tsx` |
| Reports | CSV export is real; rest of the page is static | `OtherPages.tsx` (ReportsPage) |
| Super Admin | Falls back to fake data on API failure; creates a `mockCreated` school when the API fails | `SuperAdminPage.tsx` |
| Exams | API errors are hidden with `.catch(() => [])` → user sees empty screen, no error | `ExamsPage.tsx` |

### ❌ Not built (UI-only mock, no backend)
| Area | State |
|---|---|
| Library | In-memory `initialBooks` / `initialIssues`; no Prisma model |
| Messages | Socket relay works but **nothing is persisted** (no `Message` model); contacts hardcoded |
| Calendar | Hardcoded "April 2026", fixed 30-day grid, static events |
| Settings | Mostly local state; only theme toggle is real |
| SaaS billing, audit-log viewer, SMS/email alerts, parent–teacher linking UI | Models/plans exist, no flow |

### Code-health issues
- Six pages exceed the 1,000-line limit from `AGENTS.md`: `LandingPage` (1593), `SubjectClassroomPage` (1458), `OtherPages` (1284), `ExamsPage` (1211), `SuperAdminPage` (1127), `TimetablePage` (1108).
- Pages fetch with `useEffect` + services instead of React Query hooks (15 pages).
- Thin test coverage (~6 spec files total).

### The "bouncy" animation
Around 33 files use Framer Motion with `initial={{ opacity: 0, y: 20 }}` / `initial={{ scale: 0.95 }}` and **no `transition` prop**. Framer Motion's default for `x`/`y`/`scale` is a **spring**, which causes the overshoot/wobble everywhere. Also:
- explicit `type: 'spring'` on `StudentProfileDrawer.tsx` and `TeacherProfileDrawer.tsx`
- `whileHover={{ scale: 1.02, y: -2 }}` on timetable slots (`TimetablePage.tsx` ~line 791)
- infinite floating loops (`y: [0, -10, 0]`, `repeat: Infinity`) and a 25s spinning element on the landing hero (`LandingPage.tsx` ~lines 740–800)
- `animate-bounce` typing dots in Messages (`OtherPages.tsx` ~line 977)

---

## 2. Phase 0 — BEFORE THE PRESENTATION (do now)

Small, low-risk, high-visibility changes only. No schema migrations, no big refactors.

### ✅ P0.1 Smooth animations (highest priority)
> Done 2026-11-19 on `feat/phase-0-demo-polish` (commit `12d43c4`).

1. In `frontend/src/App.tsx`, wrap the tree in Framer Motion's `MotionConfig`:
   ```tsx
   <MotionConfig transition={{ duration: 0.22, ease: [0.22, 1, 0.36, 1] }} reducedMotion="user">
   ```
   This replaces every default spring with a smooth ease-out and respects OS reduced-motion.
2. Drawers (`StudentProfileDrawer`, `TeacherProfileDrawer`): replace the spring with `{ duration: 0.28, ease: [0.22, 1, 0.36, 1] }`.
3. Remove decorative motion: infinite float/spin loops on the landing hero, `whileHover` scale on timetable slots (keep a plain CSS shadow/border hover), `animate-bounce` typing dots → gentle opacity pulse.
4. Standardise entrances: fade + 6–8px rise (not 20px), modals scale from 0.98 (not 0.9/0.95). Cap list stagger delays (e.g. `Math.min(i, 8) * 0.03`).
5. Leave `animate-pulse` on loading skeletons as is.

### ✅ P0.2 Timetable on real data
> Done 2026-11-19 on `feat/phase-0-demo-polish` (commit `d3ebac2`).

1. Add timetable rows to `backend/prisma/seed.ts` for the demo class/section (Mon–Sat, ~6 periods, using seeded subjects/teachers). Keep the seed idempotent.
2. **Check first**: the backend uses a `DayOfWeek` enum while `frontend/src/services/timetable.service.ts` types `dayOfWeek` as a number — align the frontend type with what the API actually returns.
3. Replace `initialSchedule` in `TimetablePage.tsx` with a React Query hook (`useTimetable` in `src/hooks/`) over `timetableService`. Add loading skeleton + empty state. Keep the existing visual layout.

### ✅ P0.3 Calendar shows real, current dates
> Done 2026-11-19 on `feat/phase-0-demo-polish` (commit `d4b265c`).

1. Build the month grid from the real current month (correct day count, weekday offset, prev/next month buttons).
2. Populate events from existing APIs: exams (`examService`) and announcements (`announcementService`). No new backend work.

### ✅ P0.4 Stop faking success
> Done 2026-11-19 on `feat/phase-0-demo-polish` (commit `a0569ab`).

1. `SuperAdminPage.tsx`: remove the `mockCreated` fallback and fake fallback lists; show an error state/toast on failure.
2. `ExamsPage.tsx`: replace silent `.catch(() => [])` with a visible error state.

### ✅ P0.5 Label unfinished pages honestly
> Done 2026-11-19 on `feat/phase-0-demo-polish` (commit `8241643`).

Add a small "Preview" badge to the headers of **Library**, **Messages** and **Settings** so nobody presents mock data as live. Do not remove these pages.

### ✅ P0.6 Demo readiness check
> Done 2026-11-19 on `feat/phase-0-demo-polish` (commit `93db154`).

1. `cd backend && npx prisma db seed` — then log in as each seeded role (super admin, school admin, teacher, student, parent).
2. Click every sidebar link for each role; fix any crash or console error found.
3. Run `cd backend && npm test && npm run build` and `cd frontend && npm test && npm run build` — all must pass.
4. One commit per item above (P0.1 … P0.5), on a feature branch. **Do not push to `main` without the owner's OK.**

**P0.6 result (2026-11-19):** seed run; all 5 roles × every sidebar page checked in headless Chrome — no crashes, no console errors after fixes (only the expected `/auth/me` 401 on the login page). Backend 22/22 tests + build, frontend 13/13 tests + build pass. Fixed along the way: student Finance render loop, admin dashboard KPI shape mismatch (showed all zeros), Super Admin tenant counts shape mismatch, Exams date-sheet race, teacher Finance 403s, notifications polling while signed out, login not hydrating student/teacher profile.

**Still mock / known gaps (deferred, not Phase 0):** Students/Teachers/Notice pages fall back to hardcoded seed lists when the API list is empty (and briefly while loading); student dashboard tiles, student attendance "April 2026" history, admin dashboard fee chart and Class 9/8 attendance rows are static; Messages header claims "End-to-end secure".

---

## 3. Deferred — LATER (do NOT start before the presentation)

### ✅ Phase 1 — Real data everywhere
> Done 2026-11-19 on `feat/phase-1-real-data` (branched from `feat/phase-0-demo-polish`, not merged).

- [x] Student subject/homework pages → `assignmentService` (drop `data/studentSubjectsData.ts`). New `GET /academics/my-subjects`; real homework submission; Tests tab from date sheets + report cards. Chapter notes / syllabus progress removed (no backend model — see Phase 3).
- [x] Move the remaining pages from `useEffect` fetching to React Query hooks in `src/hooks/`, with proper error states (Exams, Super Admin, parent dashboard/attendance/fees, teacher dashboard, calendar). The real count was ~8 files, not 15.
- [x] Reports page: real charts from `/reports` endpoints (fees + attendance, CSV export, Super Admin school picker).
- [x] Also removed remaining mock data: Students/Teachers/Notice seed fallbacks, invented fields in the student/teacher mappers, student dashboard, student attendance, admin dashboard chart.

**Security fixes made along the way (also affect `main` / the demo branch — review before merging):**
- IDOR: `GET /students/:id`, `GET /exams/:id/report-card/:studentId`, `GET /attendance/student/:id`, `GET /assignments/:id` let any student/parent read other students' data; `GET /academics/classes/:id` exposed the roster to students. Now scoped via `students/student-access.ts`.
- Finance: `POST /finance/payments/collect` was open to students/parents (mark own invoice paid without paying) → admin only. `/payments/verify` trusted the client `amount` (pay ₹1, record ₹10,000) and allowed replay → now uses the Razorpay order amount, checks invoice/school, rejects reused payment ids. `GET /finance/invoices` returned all invoices to students/parents → scoped.
- Frontend no longer falls back to `/payments/collect` or marks invoices PAID locally when Razorpay fails.

**Known gaps left for later:**
- Duplicate "Term 1 Tuition & Lab Fee 2026" fee structure (₹0, 0 invoices) exists in the Neon DB from seed runs before the idempotency fix — delete it manually if unwanted.
- Library, Messages, Settings remain Preview (Phase 3). Leave requests have no backend (form removed).
- `collectPayment` reads the invoice outside its transaction (concurrent payments could over-collect) — wrap the read in the transaction.
- Super Admin dashboard, Profile and Settings still contain some hardcoded copy; Notifications provider still polls via `useEffect` (global context, deliberately left).

### Phase 2 — Cleanup & safety net
- Split the six 1,000+ line pages into `components/features/<domain>/` sub-components (start with `OtherPages.tsx` → `LibraryPage`, `MessagesPage`, `ReportsPage`, `SettingsPage` as separate files).
- Add service unit tests (Prisma mocked) for finance, attendance, exams, timetable.

### Phase 3 — New features
- Persistent chat: `Conversation` + `Message` Prisma models, API, wire to existing socket events.
- Library module: `Book` + `BookIssue` models, full module per `AGENTS.md` §7, replace mock UI.
- Calendar: dedicated `Event`/`Holiday` model so admins can create holidays & events.
- Audit-log viewer, SaaS billing (`PlatformInvoice`, renewals), SMS/email alerts via Resend, parent–teacher linking UI, real Settings persistence.

### Rough effort (Claude Code tokens)
| Phase | Est. tokens |
|---|---|
| Phase 0 | ~0.6–1M |
| Phase 1 | ~0.8–1.3M |
| Phase 2 | ~0.7–1.3M |
| Phase 3 | ~1–1.5M+ |
