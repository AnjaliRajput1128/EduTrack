import type { AttendanceThresholds, GradingConfig } from '@/types';

/**
 * Central place for the "business rules" the spec asked to be configurable
 * rather than hard-coded throughout the app. Change these two objects and
 * every dashboard, badge and report recalculates consistently.
 */

export const ATTENDANCE_THRESHOLDS: AttendanceThresholds = {
  safe: 75,
  warning: 60,
};

export const GRADING_CONFIG: GradingConfig = {
  passingPercentage: 40,
  bands: [
    { min: 90, max: 100, grade: 'A+', gpa: 10 },
    { min: 80, max: 89.99, grade: 'A', gpa: 9 },
    { min: 70, max: 79.99, grade: 'B+', gpa: 8 },
    { min: 60, max: 69.99, grade: 'B', gpa: 7 },
    { min: 50, max: 59.99, grade: 'C', gpa: 6 },
    { min: 40, max: 49.99, grade: 'D', gpa: 5 },
    { min: 0, max: 39.99, grade: 'F', gpa: 0 },
  ],
};

export const APP_NAME = 'EduTrack ERP';

export const EXAM_TYPES = ['Assignment', 'Internal', 'Midterm', 'Practical', 'Final'] as const;
export const EXAM_WEIGHTS: Record<string, number> = {
  Assignment: 0.1,
  Internal: 0.15,
  Midterm: 0.2,
  Practical: 0.15,
  Final: 0.4,
};
