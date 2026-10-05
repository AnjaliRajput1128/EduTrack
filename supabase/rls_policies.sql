-- ============================================================
-- Row Level Security policies
-- Run this after schema.sql. Enforces access control at the
-- database level so the frontend role is never trusted alone.
-- ============================================================

alter table public.users enable row level security;
alter table public.departments enable row level security;
alter table public.courses enable row level security;
alter table public.students enable row level security;
alter table public.faculty enable row level security;
alter table public.subjects enable row level security;
alter table public.classes enable row level security;
alter table public.enrollments enable row level security;
alter table public.attendance enable row level security;
alter table public.marks enable row level security;
alter table public.announcements enable row level security;
alter table public.timetable enable row level security;

-- ---------- Helper functions (PL/pgSQL security definer prevents RLS recursion) ----------

create or replace function public.current_role()
returns text as $$
declare
  r text;
begin
  select role into r from public.users where id = auth.uid();
  return coalesce(r, '');
end;
$$ language plpgsql stable security definer set search_path = public;

create or replace function public.current_faculty_id()
returns uuid as $$
declare
  fid uuid;
begin
  select id into fid from public.faculty where user_id = auth.uid();
  return fid;
end;
$$ language plpgsql stable security definer set search_path = public;

create or replace function public.current_student_id()
returns uuid as $$
declare
  sid uuid;
begin
  select id into sid from public.students where user_id = auth.uid();
  return sid;
end;
$$ language plpgsql stable security definer set search_path = public;

-- ---------- users ----------
drop policy if exists "users_select_self_or_admin" on public.users;
create policy "users_select_self_or_admin" on public.users
  for select using (id = auth.uid() or public.current_role() = 'admin');

drop policy if exists "users_insert_self" on public.users;
create policy "users_insert_self" on public.users
  for insert with check (id = auth.uid() or public.current_role() = 'admin');

drop policy if exists "users_update_self" on public.users;
create policy "users_update_self" on public.users
  for update using (id = auth.uid() or public.current_role() = 'admin');

drop policy if exists "users_delete_admin" on public.users;
create policy "users_delete_admin" on public.users
  for delete using (id = auth.uid() or public.current_role() = 'admin');

-- ---------- departments / courses / subjects / classes / timetable ----------
drop policy if exists "reference_read_all" on public.departments;
create policy "reference_read_all" on public.departments for select using (auth.role() = 'authenticated');
drop policy if exists "reference_write_admin" on public.departments;
create policy "reference_write_admin" on public.departments for all using (public.current_role() = 'admin');

drop policy if exists "courses_read_all" on public.courses;
create policy "courses_read_all" on public.courses for select using (auth.role() = 'authenticated');
drop policy if exists "courses_write_admin" on public.courses;
create policy "courses_write_admin" on public.courses for all using (public.current_role() = 'admin');

drop policy if exists "subjects_read_all" on public.subjects;
create policy "subjects_read_all" on public.subjects for select using (auth.role() = 'authenticated');
drop policy if exists "subjects_write_admin" on public.subjects;
create policy "subjects_write_admin" on public.subjects for all using (public.current_role() = 'admin');
drop policy if exists "subjects_update_own_faculty" on public.subjects;
create policy "subjects_update_own_faculty" on public.subjects for update
  using (faculty_id = public.current_faculty_id() or public.current_role() = 'admin');

drop policy if exists "classes_read_all" on public.classes;
create policy "classes_read_all" on public.classes for select using (auth.role() = 'authenticated');
drop policy if exists "classes_write_admin" on public.classes;
create policy "classes_write_admin" on public.classes for all using (public.current_role() = 'admin');

drop policy if exists "timetable_read_all" on public.timetable;
create policy "timetable_read_all" on public.timetable for select using (auth.role() = 'authenticated');
drop policy if exists "timetable_write_admin" on public.timetable;
create policy "timetable_write_admin" on public.timetable for all using (public.current_role() = 'admin');
drop policy if exists "timetable_faculty_manage" on public.timetable;
create policy "timetable_faculty_manage" on public.timetable for all
  using (faculty_id = public.current_faculty_id() or public.current_role() = 'admin');

-- ---------- students ----------
drop policy if exists "students_admin_all" on public.students;
create policy "students_admin_all" on public.students for all using (public.current_role() = 'admin');

drop policy if exists "students_self_read" on public.students;
create policy "students_self_read" on public.students for select
  using (user_id = auth.uid());

drop policy if exists "students_self_insert" on public.students;
create policy "students_self_insert" on public.students for insert
  with check (user_id = auth.uid() or public.current_role() = 'admin');

drop policy if exists "students_self_update" on public.students;
create policy "students_self_update" on public.students for update
  using (user_id = auth.uid() or public.current_role() = 'admin');

drop policy if exists "students_faculty_read" on public.students;
create policy "students_faculty_read" on public.students for select
  using (
    public.current_role() = 'faculty' and exists (
      select 1 from public.enrollments e
      join public.subjects s on s.id = e.subject_id
      where e.student_id = students.id and s.faculty_id = public.current_faculty_id()
    )
  );

-- ---------- faculty ----------
drop policy if exists "faculty_admin_all" on public.faculty;
create policy "faculty_admin_all" on public.faculty for all using (public.current_role() = 'admin');

drop policy if exists "faculty_self_read" on public.faculty;
create policy "faculty_self_read" on public.faculty for select using (user_id = auth.uid());

drop policy if exists "faculty_self_insert" on public.faculty;
create policy "faculty_self_insert" on public.faculty for insert
  with check (user_id = auth.uid() or public.current_role() = 'admin');

drop policy if exists "faculty_self_update" on public.faculty;
create policy "faculty_self_update" on public.faculty for update using (user_id = auth.uid() or public.current_role() = 'admin');

drop policy if exists "faculty_public_read" on public.faculty;
create policy "faculty_public_read" on public.faculty for select using (auth.role() = 'authenticated');

-- ---------- enrollments ----------
drop policy if exists "enrollments_admin_all" on public.enrollments;
create policy "enrollments_admin_all" on public.enrollments for all using (public.current_role() = 'admin');

drop policy if exists "enrollments_student_read" on public.enrollments;
create policy "enrollments_student_read" on public.enrollments for select
  using (student_id = public.current_student_id());

drop policy if exists "enrollments_student_insert" on public.enrollments;
create policy "enrollments_student_insert" on public.enrollments for insert
  with check (student_id = public.current_student_id() or public.current_role() = 'admin');

drop policy if exists "enrollments_faculty_read" on public.enrollments;
create policy "enrollments_faculty_read" on public.enrollments for select
  using (exists (select 1 from public.subjects s where s.id = enrollments.subject_id and s.faculty_id = public.current_faculty_id()));

-- ---------- attendance ----------
drop policy if exists "attendance_admin_all" on public.attendance;
create policy "attendance_admin_all" on public.attendance for all using (public.current_role() = 'admin');

drop policy if exists "attendance_student_read" on public.attendance;
create policy "attendance_student_read" on public.attendance for select
  using (student_id = public.current_student_id());

drop policy if exists "attendance_faculty_read" on public.attendance;
create policy "attendance_faculty_read" on public.attendance for select
  using (faculty_id = public.current_faculty_id());

drop policy if exists "attendance_faculty_write" on public.attendance;
create policy "attendance_faculty_write" on public.attendance for insert
  with check (faculty_id = public.current_faculty_id() or public.current_role() = 'admin');

drop policy if exists "attendance_faculty_update" on public.attendance;
create policy "attendance_faculty_update" on public.attendance for update
  using (faculty_id = public.current_faculty_id() or public.current_role() = 'admin')
  with check (faculty_id = public.current_faculty_id() or public.current_role() = 'admin');

-- ---------- marks ----------
drop policy if exists "marks_admin_all" on public.marks;
create policy "marks_admin_all" on public.marks for all using (public.current_role() = 'admin');

drop policy if exists "marks_student_read" on public.marks;
create policy "marks_student_read" on public.marks for select
  using (student_id = public.current_student_id());

drop policy if exists "marks_faculty_read" on public.marks;
create policy "marks_faculty_read" on public.marks for select
  using (exists (select 1 from public.subjects s where s.id = marks.subject_id and s.faculty_id = public.current_faculty_id()));

drop policy if exists "marks_faculty_write" on public.marks;
create policy "marks_faculty_write" on public.marks for insert
  with check (
    public.current_role() = 'admin' or
    exists (select 1 from public.subjects s where s.id = marks.subject_id and s.faculty_id = public.current_faculty_id())
  );

drop policy if exists "marks_faculty_update" on public.marks;
create policy "marks_faculty_update" on public.marks for update
  using (
    public.current_role() = 'admin' or
    exists (select 1 from public.subjects s where s.id = marks.subject_id and s.faculty_id = public.current_faculty_id())
  )
  with check (
    public.current_role() = 'admin' or
    exists (select 1 from public.subjects s where s.id = marks.subject_id and s.faculty_id = public.current_faculty_id())
  );

-- ---------- announcements ----------
drop policy if exists "announcements_read_targeted" on public.announcements;
create policy "announcements_read_targeted" on public.announcements for select
  using (
    target_role = 'all'
    or target_role = public.current_role()
    or created_by = auth.uid()
    or public.current_role() = 'admin'
  );

drop policy if exists "announcements_write_admin_faculty" on public.announcements;
create policy "announcements_write_admin_faculty" on public.announcements for insert
  with check (public.current_role() in ('admin', 'faculty'));

drop policy if exists "announcements_delete_own_or_admin" on public.announcements;
create policy "announcements_delete_own_or_admin" on public.announcements for delete
  using (created_by = auth.uid() or public.current_role() = 'admin');
