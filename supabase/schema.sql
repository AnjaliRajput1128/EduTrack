-- ============================================================
-- Student Academic Performance & Attendance Management System
-- Schema: run this first in the Supabase SQL editor.
-- ============================================================

create extension if not exists "uuid-ossp";
create extension if not exists pgcrypto;

-- ---------- Reference / user tables ----------

create table if not exists public.users (
  id uuid primary key references auth.users(id) on delete cascade,
  email text unique not null,
  role text not null check (role in ('admin', 'faculty', 'student')),
  created_at timestamptz not null default now()
);

create table if not exists public.departments (
  id uuid primary key default uuid_generate_v4(),
  name text not null,
  code text unique not null
);

create table if not exists public.courses (
  id uuid primary key default uuid_generate_v4(),
  name text not null,
  code text unique not null,
  department_id uuid not null references public.departments(id) on delete cascade,
  duration int not null default 3
);

-- ---------- People ----------

create table if not exists public.students (
  id uuid primary key default uuid_generate_v4(),
  user_id uuid unique not null references public.users(id) on delete cascade,
  student_id text unique not null,
  full_name text not null,
  email text not null,
  phone text,
  date_of_birth date,
  gender text check (gender in ('Male', 'Female', 'Other')),
  department_id uuid references public.departments(id),
  course_id uuid references public.courses(id),
  semester int not null default 1,
  admission_year int not null default extract(year from now())::int,
  profile_image text,
  status text not null default 'active' check (status in ('active', 'inactive')),
  created_at timestamptz not null default now()
);
create index if not exists idx_students_user_id on public.students(user_id);
create index if not exists idx_students_department on public.students(department_id);
create index if not exists idx_students_course on public.students(course_id);

create table if not exists public.faculty (
  id uuid primary key default uuid_generate_v4(),
  user_id uuid unique not null references public.users(id) on delete cascade,
  employee_id text unique not null,
  full_name text not null,
  email text not null,
  phone text,
  department_id uuid references public.departments(id),
  designation text check (designation in ('Professor', 'Associate Professor', 'Assistant Professor', 'Lecturer')),
  status text not null default 'active' check (status in ('active', 'inactive')),
  created_at timestamptz not null default now()
);
create index if not exists idx_faculty_user_id on public.faculty(user_id);
create index if not exists idx_faculty_department on public.faculty(department_id);

-- ---------- Academic structure ----------

create table if not exists public.subjects (
  id uuid primary key default uuid_generate_v4(),
  name text not null,
  code text unique not null,
  course_id uuid not null references public.courses(id) on delete cascade,
  semester int not null,
  credits int not null default 3,
  faculty_id uuid references public.faculty(id) on delete set null
);
create index if not exists idx_subjects_course on public.subjects(course_id);
create index if not exists idx_subjects_faculty on public.subjects(faculty_id);

create table if not exists public.classes (
  id uuid primary key default uuid_generate_v4(),
  subject_id uuid not null references public.subjects(id) on delete cascade,
  faculty_id uuid not null references public.faculty(id) on delete cascade,
  semester int not null,
  section text not null default 'A',
  academic_year text not null default '2025-2026'
);

create table if not exists public.enrollments (
  id uuid primary key default uuid_generate_v4(),
  student_id uuid not null references public.students(id) on delete cascade,
  subject_id uuid not null references public.subjects(id) on delete cascade,
  academic_year text not null default '2025-2026',
  semester int not null,
  unique (student_id, subject_id, academic_year)
);
create index if not exists idx_enrollments_student on public.enrollments(student_id);
create index if not exists idx_enrollments_subject on public.enrollments(subject_id);

-- ---------- Attendance ----------

create table if not exists public.attendance (
  id uuid primary key default uuid_generate_v4(),
  student_id uuid not null references public.students(id) on delete cascade,
  subject_id uuid not null references public.subjects(id) on delete cascade,
  faculty_id uuid references public.faculty(id) on delete set null,
  date date not null,
  status text not null check (status in ('Present', 'Absent', 'Late', 'Excused')),
  remarks text,
  unique (student_id, subject_id, date)
);
create index if not exists idx_attendance_student on public.attendance(student_id);
create index if not exists idx_attendance_subject on public.attendance(subject_id);
create index if not exists idx_attendance_date on public.attendance(date);

-- ---------- Marks ----------

create table if not exists public.marks (
  id uuid primary key default uuid_generate_v4(),
  student_id uuid not null references public.students(id) on delete cascade,
  subject_id uuid not null references public.subjects(id) on delete cascade,
  exam_type text not null check (exam_type in ('Assignment', 'Internal', 'Midterm', 'Practical', 'Final')),
  marks_obtained numeric not null,
  max_marks numeric not null,
  semester int not null,
  academic_year text not null default '2025-2026',
  unique (student_id, subject_id, exam_type, academic_year)
);
create index if not exists idx_marks_student on public.marks(student_id);
create index if not exists idx_marks_subject on public.marks(subject_id);

-- ---------- Announcements & timetable ----------

create table if not exists public.announcements (
  id uuid primary key default uuid_generate_v4(),
  title text not null,
  content text not null,
  created_by uuid references public.users(id) on delete set null,
  created_by_name text not null default '',
  target_role text not null default 'all' check (target_role in ('all', 'admin', 'faculty', 'student')),
  priority text not null default 'normal' check (priority in ('normal', 'important')),
  subject_id uuid references public.subjects(id) on delete set null,
  created_at timestamptz not null default now()
);

create table if not exists public.timetable (
  id uuid primary key default uuid_generate_v4(),
  subject_id uuid not null references public.subjects(id) on delete cascade,
  faculty_id uuid not null references public.faculty(id) on delete cascade,
  day text not null check (day in ('Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat')),
  start_time time not null,
  end_time time not null,
  room text
);
create index if not exists idx_timetable_subject on public.timetable(subject_id);
create index if not exists idx_timetable_faculty on public.timetable(faculty_id);

-- ---------- Helper: Auto-enroll student into current semester subjects ----------

create or replace function public.enroll_student_in_course_subjects(p_student_id uuid)
returns void as $$
declare
  s_record record;
  sub_record record;
begin
  select * into s_record from public.students where id = p_student_id;
  if not found or s_record.course_id is null then
    return;
  end if;

  for sub_record in
    select id, semester from public.subjects
    where course_id = s_record.course_id and semester = s_record.semester
  loop
    insert into public.enrollments (student_id, subject_id, academic_year, semester)
    values (s_record.id, sub_record.id, '2025-2026', sub_record.semester)
    on conflict (student_id, subject_id, academic_year) do nothing;
  end loop;
end;
$$ language plpgsql security definer set search_path = public;

-- ---------- Helper: keep public.users & role profiles in sync with auth.users ----------
-- Whenever a user signs up or is created in Supabase Auth:
-- 1. Copies the exact Auth UUID into public.users.
-- 2. Automatically provisions the role-specific profile (students / faculty).
-- 3. If student, auto-enrolls into current semester subjects so dashboards work immediately.

create or replace function public.handle_new_auth_user()
returns trigger as $$
declare
  user_role text;
  user_name text;
  v_dept_id uuid;
  v_crs_id uuid;
  v_student_id uuid;
  v_semester int;
begin
  user_role := lower(coalesce(new.raw_user_meta_data->>'role', 'student'));
  user_name := coalesce(new.raw_user_meta_data->>'full_name', split_part(new.email, '@', 1));

  -- 1. Ensure public.users row exists with matching UUID
  insert into public.users (id, email, role, created_at)
  values (new.id, new.email, user_role, now())
  on conflict (id) do update set
    email = excluded.email,
    role = coalesce(excluded.role, public.users.role);

  -- 2. Create role-specific record
  if user_role = 'student' then
    v_semester := coalesce((new.raw_user_meta_data->>'semester')::int, 3);

    -- Resolve department
    if new.raw_user_meta_data->>'department_id' is not null then
      v_dept_id := (new.raw_user_meta_data->>'department_id')::uuid;
    else
      select id into v_dept_id from public.departments order by code limit 1;
    end if;

    -- Resolve course
    if new.raw_user_meta_data->>'course_id' is not null then
      v_crs_id := (new.raw_user_meta_data->>'course_id')::uuid;
    else
      select id into v_crs_id from public.courses where department_id = v_dept_id limit 1;
      if v_crs_id is null then
        select id into v_crs_id from public.courses order by code limit 1;
      end if;
    end if;

    insert into public.students (
      user_id,
      student_id,
      full_name,
      email,
      phone,
      department_id,
      course_id,
      semester,
      admission_year,
      status
    ) values (
      new.id,
      coalesce(new.raw_user_meta_data->>'student_id', 'STU' || upper(substr(replace(new.id::text, '-', ''), 1, 6))),
      user_name,
      new.email,
      new.raw_user_meta_data->>'phone',
      v_dept_id,
      v_crs_id,
      v_semester,
      coalesce((new.raw_user_meta_data->>'admission_year')::int, extract(year from now())::int),
      'active'
    )
    on conflict (user_id) do update set
      full_name = coalesce(excluded.full_name, public.students.full_name),
      email = excluded.email
    returning id into v_student_id;

    -- Auto-enroll student into subjects for their course and semester
    if v_student_id is not null then
      perform public.enroll_student_in_course_subjects(v_student_id);
    end if;

  elsif user_role = 'faculty' then
    if new.raw_user_meta_data->>'department_id' is not null then
      v_dept_id := (new.raw_user_meta_data->>'department_id')::uuid;
    else
      select id into v_dept_id from public.departments order by code limit 1;
    end if;

    insert into public.faculty (
      user_id,
      employee_id,
      full_name,
      email,
      phone,
      department_id,
      designation,
      status
    ) values (
      new.id,
      coalesce(new.raw_user_meta_data->>'employee_id', 'EMP' || upper(substr(replace(new.id::text, '-', ''), 1, 6))),
      user_name,
      new.email,
      new.raw_user_meta_data->>'phone',
      v_dept_id,
      coalesce(new.raw_user_meta_data->>'designation', 'Assistant Professor'),
      'active'
    )
    on conflict (user_id) do update set
      full_name = coalesce(excluded.full_name, public.faculty.full_name),
      email = excluded.email;
  end if;

  return new;
end;
$$ language plpgsql security definer set search_path = public;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure public.handle_new_auth_user();
