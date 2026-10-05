import { ATTENDANCE_THRESHOLDS, GRADING_CONFIG, EXAM_TYPES } from '@/lib/config';
import type { AttendanceRecord, MarkRecord, ExamType } from '@/types';

export function attendancePercentage(records: AttendanceRecord[]): number {
  if (records.length === 0) return 0;
  // "Present" and "Late" both count as attended; only "Absent" (and typically
  // "Excused" is neutral) counts against the student. Excused classes are
  // still counted as held but not penalised the way an unexplained absence is.
  const attended = records.filter((r) => r.status === 'Present' || r.status === 'Late').length;
  return Math.round((attended / records.length) * 1000) / 10;
}

export function attendanceStatusLabel(pct: number): 'Safe' | 'Warning' | 'Critical' {
  if (pct >= ATTENDANCE_THRESHOLDS.safe) return 'Safe';
  if (pct >= ATTENDANCE_THRESHOLDS.warning) return 'Warning';
  return 'Critical';
}

export function gradeForPercentage(pct: number): { grade: string; gpa: number } {
  const band = GRADING_CONFIG.bands.find((b) => pct >= b.min && pct <= b.max);
  return band ? { grade: band.grade, gpa: band.gpa } : { grade: 'N/A', gpa: 0 };
}

export function isPassing(pct: number): boolean {
  return pct >= GRADING_CONFIG.passingPercentage;
}

/** Aggregate all exam-type marks for one student+subject into a weighted percentage. */
export function subjectPercentage(marks: MarkRecord[]): number {
  if (marks.length === 0) return 0;
  const totalObtained = marks.reduce((s, m) => s + m.marks_obtained, 0);
  const totalMax = marks.reduce((s, m) => s + m.max_marks, 0);
  if (totalMax === 0) return 0;
  return Math.round((totalObtained / totalMax) * 1000) / 10;
}

/** SGPA for a semester = credit-weighted average GPA across that semester's subjects. */
export function calculateSGPA(subjectResults: { credits: number; percentage: number }[]): number {
  const totalCredits = subjectResults.reduce((s, r) => s + r.credits, 0);
  if (totalCredits === 0) return 0;
  const weighted = subjectResults.reduce((s, r) => s + gradeForPercentage(r.percentage).gpa * r.credits, 0);
  return Math.round((weighted / totalCredits) * 100) / 100;
}

/** CGPA = credit-weighted average of all semesters' SGPA (here approximated across all subjects to date). */
export function calculateCGPA(allResults: { credits: number; percentage: number }[]): number {
  return calculateSGPA(allResults);
}

/** Which of the standard assessments the faculty has entered so far for one student+subject. */
export function examCompletion(marks: MarkRecord[]): { entered: number; total: number; missing: ExamType[]; complete: boolean } {
  const done = new Set(marks.map((m) => m.exam_type));
  const missing = EXAM_TYPES.filter((t) => !done.has(t)) as ExamType[];
  return { entered: EXAM_TYPES.length - missing.length, total: EXAM_TYPES.length, missing, complete: missing.length === 0 };
}

/** Counts per status for a set of attendance records (faculty-entered). */
export function attendanceCounts(records: AttendanceRecord[]) {
  const c = { Present: 0, Absent: 0, Late: 0, Excused: 0, total: records.length };
  records.forEach((r) => { c[r.status]++; });
  return c;
}

/** Grade label that does not punish a subject for marks that simply have not been entered yet. */
export function gradeLabel(marks: MarkRecord[]): string {
  return marks.length === 0 ? '—' : gradeForPercentage(subjectPercentage(marks)).grade;
}
