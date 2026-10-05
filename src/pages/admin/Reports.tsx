import { useEffect, useMemo, useState } from 'react';
import { Download, Printer } from 'lucide-react';
import { dataService } from '@/services/dataService';
import type { Student, Subject, Department, Course, AttendanceRecord, MarkRecord } from '@/types';
import Select from '@/components/ui/Select';
import Button from '@/components/ui/Button';
import DataTable, { type Column } from '@/components/ui/DataTable';
import { attendancePercentage, subjectPercentage, gradeForPercentage } from '@/utils/calculations';
import { exportToCsv } from '@/utils/exportCsv';

const REPORT_TYPES = [
  'Student Academic Report',
  'Attendance Report',
  'Subject Performance Report',
  'Semester Performance Report',
  'Department Performance Report',
] as const;

export default function AdminReports() {
  const [reportType, setReportType] = useState<typeof REPORT_TYPES[number]>('Student Academic Report');
  const [students, setStudents] = useState<Student[]>([]);
  const [subjects, setSubjects] = useState<Subject[]>([]);
  const [departments, setDepartments] = useState<Department[]>([]);
  const [courses, setCourses] = useState<Course[]>([]);
  const [attendance, setAttendance] = useState<AttendanceRecord[]>([]);
  const [marks, setMarks] = useState<MarkRecord[]>([]);
  const [deptFilter, setDeptFilter] = useState('all');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    (async () => {
      const [s, sub, d, c, att, m] = await Promise.all([
        dataService.getStudents(), dataService.getSubjects(), dataService.getDepartments(),
        dataService.getCourses(), dataService.getAttendance(), dataService.getMarks(),
      ]);
      setStudents(s); setSubjects(sub); setDepartments(d); setCourses(c); setAttendance(att); setMarks(m);
      setLoading(false);
    })();
  }, []);

  const filteredStudents = useMemo(() => students.filter((s) => deptFilter === 'all' || s.department_id === deptFilter), [students, deptFilter]);

  const reportRows = useMemo(() => {
    if (reportType === 'Student Academic Report') {
      return filteredStudents.map((s) => {
        const m = marks.filter((mk) => mk.student_id === s.id);
        const pct = subjectPercentage(m);
        return { 'Student ID': s.student_id, Name: s.full_name, Course: courses.find((c) => c.id === s.course_id)?.code || '', 'Overall %': pct, Grade: gradeForPercentage(pct).grade };
      });
    }
    if (reportType === 'Attendance Report') {
      return filteredStudents.map((s) => {
        const a = attendance.filter((att) => att.student_id === s.id);
        return { 'Student ID': s.student_id, Name: s.full_name, 'Total Classes': a.length, 'Attendance %': attendancePercentage(a) };
      });
    }
    if (reportType === 'Subject Performance Report') {
      return subjects.map((sub) => {
        const m = marks.filter((mk) => mk.subject_id === sub.id);
        return { Subject: sub.name, Code: sub.code, 'Avg %': subjectPercentage(m), 'Records': m.length };
      });
    }
    if (reportType === 'Semester Performance Report') {
      const bySem: Record<number, MarkRecord[]> = {};
      marks.forEach((m) => { (bySem[m.semester] ||= []).push(m); });
      return Object.entries(bySem).map(([sem, m]) => ({ Semester: sem, 'Avg %': subjectPercentage(m), Records: m.length }));
    }
    // Department Performance Report
    return departments.map((d) => {
      const studentIds = students.filter((s) => s.department_id === d.id).map((s) => s.id);
      const m = marks.filter((mk) => studentIds.includes(mk.student_id));
      const a = attendance.filter((att) => studentIds.includes(att.student_id));
      return { Department: d.name, 'Avg Performance %': subjectPercentage(m), 'Avg Attendance %': attendancePercentage(a), Students: studentIds.length };
    });
  }, [reportType, filteredStudents, marks, attendance, subjects, departments, students, courses]);

  const columns: Column<Record<string, string | number>>[] = reportRows.length
    ? Object.keys(reportRows[0]).map((k) => ({ key: k, header: k, render: (r) => String(r[k]) }))
    : [];

  return (
    <div className="space-y-4 print:space-y-2">
      <div className="flex flex-wrap items-center justify-between gap-3 print:hidden">
        <div>
          <h1 className="text-xl font-bold text-slate-900 dark:text-white">Reports</h1>
          <p className="text-sm text-slate-500 dark:text-slate-400">Generate and export academic and attendance reports.</p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" icon={<Printer className="h-4 w-4" />} onClick={() => window.print()}>Print</Button>
          <Button icon={<Download className="h-4 w-4" />} onClick={() => exportToCsv(reportType, reportRows)}>Export CSV</Button>
        </div>
      </div>

      <div className="flex flex-wrap gap-3 print:hidden">
        <Select value={reportType} onChange={(e) => setReportType(e.target.value as typeof reportType)} className="w-64">
          {REPORT_TYPES.map((t) => <option key={t} value={t}>{t}</option>)}
        </Select>
        <Select value={deptFilter} onChange={(e) => setDeptFilter(e.target.value)} className="w-56">
          <option value="all">All Departments</option>
          {departments.map((d) => <option key={d.id} value={d.id}>{d.name}</option>)}
        </Select>
      </div>

      <h2 className="hidden text-lg font-bold print:block">{reportType}</h2>
      <DataTable columns={columns} rows={reportRows} keyField={(r) => JSON.stringify(r)} loading={loading} pageSize={15} />
    </div>
  );
}
