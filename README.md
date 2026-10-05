# EduTrack ERP — Student Academic Performance & Attendance Management System

A full-stack college ERP for managing students, attendance, academic performance,
subjects, exams, faculty and reports, with role-based dashboards for **Admin**,
**Faculty**, and **Student**.

## Current state: Supabase-wired, runs standalone until you connect a project

`src/services/dataService.ts` and `src/contexts/AuthContext.tsx` now contain **two
full implementations** behind one interface each:

- A real one, built on `supabase.from(...)` (data) and `supabase.auth.*` (auth).
- The original mock one, backed by `localStorage` with seeded demo data.

Which one runs is decided automatically by `isSupabaseConfigured` in
`src/lib/supabase.ts` — true the moment `VITE_SUPABASE_URL` and
`VITE_SUPABASE_ANON_KEY` are set to a real project, false otherwise. No page ever
imports either implementation directly, so nothing else in the app changes when
you switch. This means the project is fully usable right now with zero setup,
and fully wired for a real backend the moment you connect one.

### To go live

1. Create a Supabase project.
2. In the SQL editor, run the three files in `/supabase`, **in this order**:
   `schema.sql` → `rls_policies.sql` → `seed.sql`.
3. Copy `.env.example` to `.env.local` and fill in your project URL + anon key.
4. Restart the dev server. The app now talks to Supabase for every page —
   auth, CRUD, attendance, marks, reports, announcements.
5. Create your first real accounts: Authentication → Users → Add user in the
   Supabase dashboard (or use the app's own Register page), setting
   `role` in user metadata to `admin`, `faculty`, or `student`. The
   `on_auth_user_created` trigger (in `schema.sql`) automatically creates the
   matching `public.users` row. For faculty/student accounts, an admin then
   needs to insert a matching row in `public.faculty` / `public.students` with
   that user's `id` as `user_id` — see the template in `supabase/seed.sql`.

### What's real vs. still a stub once connected

| Area | Status once Supabase is connected |
|---|---|
| Students / Faculty / Departments / Courses / Subjects CRUD | Real `supabase.from(...)` calls |
| Attendance marking (bulk upsert) | Real, relies on the `unique(student_id, subject_id, date)` constraint |
| Marks entry (upsert by exam type) | Real, relies on the `unique(student_id, subject_id, exam_type, academic_year)` constraint |
| Announcements | Real |
| Login / Register / Logout | Real `supabase.auth.*` calls, with a live session listener |
| Forgot password | Real `supabase.auth.resetPasswordForEmail` — sends an actual email if your project has SMTP/email configured |
| Reset password | Real `supabase.auth.updateUser`, using the recovery session Supabase establishes when the person opens the emailed link |
| Row Level Security | Policies are written and included, but **not executed or tested against a live database from this environment** — verify them in a staging project |
| "Reset Demo Data" button (Admin → Settings) | Intentionally a no-op against a real project (it only makes sense for the mock layer); reset via the Supabase dashboard or by re-running `seed.sql` instead |

## Tech stack

- React 18 + TypeScript + Vite
- Tailwind CSS
- Lucide React icons
- Recharts
- React Router v6
- Supabase (`@supabase/supabase-js` — wired but optional until you connect a project)

## Getting started

```bash
npm install
npm run dev       # http://localhost:5173
```

```bash
npm run build      # production build (tsc -b && vite build)
npm run preview    # preview the production build locally
```

> **Note on this delivery:** this project was generated in a sandboxed environment
> without outbound network access, so `npm install` / `npm run build` could not be
> executed or verified here. The code was syntax-checked file-by-file with the
> TypeScript compiler and all internal imports were verified to resolve, but you
> should run `npm install && npm run build` yourself as the first step and report
> back if anything surfaces — dependency-resolution issues (version mismatches
> between packages) are the most likely class of problem, not logic errors.

## Demo login credentials

| Role    | Email                              | Password      |
|---------|-------------------------------------|---------------|
| Admin   | admin@edutrack.edu                  | Admin@123     |
| Faculty | r.mehta@edutrack.edu                | Faculty@123   |
| Student | (first seeded student's email — shown on the login screen with a "use" link) | Student@123 |

All three are also listed directly on the login page with one-click autofill.
You can also register a brand-new account from the Register page (it starts with
an empty academic record since it isn't linked to seeded demo data).

## Environment variables

```
VITE_SUPABASE_URL=https://your-project-ref.supabase.co
VITE_SUPABASE_ANON_KEY=your-anon-key-here
```

Optional until you connect a real Supabase backend — the app works without them.

## Folder structure

```
src/
 ├── components/ui/     Reusable UI kit (Button, Modal, DataTable, StatCard, etc.)
 ├── pages/
 │    ├── auth/          Login, Register, Forgot/Reset Password
 │    ├── admin/         Admin dashboard + all management pages
 │    ├── faculty/       Faculty dashboard + attendance/marks entry
 │    └── student/       Student dashboard + attendance/performance views
 ├── layouts/            Sidebar, Navbar, DashboardLayout (route guarding)
 ├── contexts/           AuthContext, ThemeContext (dark mode)
 ├── services/           dataService.ts (mock/Supabase-shaped API), seedData.ts
 ├── lib/                supabase.ts (real client), config.ts (thresholds/grading)
 ├── types/               Shared TypeScript types (mirrors the SQL schema)
 └── utils/               calculations.ts (GPA/attendance %), format.ts, exportCsv.ts

supabase/
 ├── schema.sql           Full PostgreSQL schema
 ├── rls_policies.sql     Row Level Security policies (role-based access)
 └── seed.sql             Reference data + template for linking auth users
```

## Major features

- **Role-based auth & routing** — Login/Register/Forgot/Reset, redirect by role,
  every dashboard route guarded so a student can't reach `/admin/*` etc.
- **Admin**: full CRUD for students, faculty, departments, courses, subjects;
  attendance & performance overviews; 5 report types with CSV export and print;
  announcements; **Settings** page for configurable attendance thresholds and
  grading bands (not hard-coded — one change here updates every badge/report).
- **Faculty**: mark attendance (select-all-present / mark-all-absent, per-student
  status buttons, edits existing records for the same date), enter marks by exam
  type, subject performance analytics, post announcements, export subject reports.
- **Student**: dashboard with SGPA/CGPA, attendance %, 4 charts (marks, attendance
  by subject, performance trend, radar), attendance/performance detail pages,
  timetable, announcements, printable transcript. An **Academic Risk** section
  flags subjects below the configured attendance or passing thresholds using
  only those two measurable indicators — it does not diagnose or predict.
- **Dark mode**, responsive sidebar (collapsible on mobile/tablet), loading
  skeletons, empty states, confirm dialogs, toast-style save confirmations.
## Faculty → Student data visibility

Everything a faculty member records now reaches the student's login immediately, and in full:

- **Marks**: the faculty "Enter Marks" page shows a completion strip (`x/y` students per exam
  type) and a per-row "Visible to student" / "Pending" status, so it's obvious what has and
  hasn't been formally entered. A student's "My Subjects", "My Performance" and "Reports" pages
  list every enrolled subject — assessments not yet entered show as **Pending**, not a silent
  `0` or an `F`, and GPA is computed only from subjects that actually have marks.
- **Attendance**: faculty can add a per-student remark when marking a class, and the Attendance
  page shows the list of class dates already recorded for the subject so faculty can review or
  correct a prior entry instead of re-entering blind. Students see the same remarks, plus a
  subject-wise attendance summary, on "My Attendance".
- **Announcements**: faculty can optionally target an announcement to just the students enrolled
  in one of their subjects (`subject_id` on the announcement); students only see subject-targeted
  notices for subjects they're enrolled in.
- **Faculty → "View as student"**: the Students page has a "View student's record" action that
  renders the exact same subject card component the student portal uses, so faculty can verify
  what a given student currently sees for their subjects without logging in as them.

The shared `src/components/SubjectRecordCard.tsx` component is used by both the student's
"My Subjects" page and the faculty's "View student's record" modal, so the two views can never
drift apart.

- **Attendance % and grading** are centrally configurable in
  `src/lib/config.ts` (also editable live from Admin → Settings for the
  threshold numbers).

## Known limitations

- **The Supabase code path has not been executed against a live project** —
  it was written in a sandboxed environment with no outbound network access,
  so it's syntactically verified (see below) but not integration-tested. Run
  through login, one CRUD action, attendance marking, and marks entry against
  your real project early on to catch anything environment-specific.
- **Build not verified in this environment** — no outbound network access was
  available to run `npm install`/`npm run build` here; please run it locally.
- Until you connect a project, all data lives in the browser's `localStorage`
  (mock mode); clearing site data resets it, or use Admin → Settings → Reset
  Demo Data.
- New accounts created via Register aren't linked to a `students`/`faculty` row,
  so their dashboards will show empty states until an admin links them (in the
  Supabase version, this would be an admin action that sets `user_id` on the
  matching profile row).
- PDF export isn't implemented (CSV export + browser print/"Save as PDF" are).
- Single academic year/semester of demo data — SGPA-over-semesters and
  CGPA are currently the same figure since there's only one semester's data to
  aggregate; the calculation functions (`calculateSGPA`/`calculateCGPA` in
  `src/utils/calculations.ts`) are written generically and will correctly
  differentiate once multiple semesters of marks exist.
- RLS policies in `rls_policies.sql` are written for the schema in `schema.sql`
  but, like the build, could not be executed against a live database from this
  environment — test them in a staging Supabase project before relying on them
  in production.
