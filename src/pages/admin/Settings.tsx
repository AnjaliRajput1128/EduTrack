import { useState } from 'react';
import { Save, Info } from 'lucide-react';
import { ATTENDANCE_THRESHOLDS, GRADING_CONFIG } from '@/lib/config';
import Input from '@/components/ui/Input';
import Button from '@/components/ui/Button';
import { dataService } from '@/services/dataService';
import { CheckCircle2, RotateCcw } from 'lucide-react';

export default function AdminSettings() {
  const [safe, setSafe] = useState(ATTENDANCE_THRESHOLDS.safe);
  const [warning, setWarning] = useState(ATTENDANCE_THRESHOLDS.warning);
  const [passing, setPassing] = useState(GRADING_CONFIG.passingPercentage);
  const [saved, setSaved] = useState(false);
  const [resetting, setResetting] = useState(false);

  const save = () => {
    // Mutating the shared config objects directly keeps every page (which
    // imports the same singletons) in sync immediately for this demo.
    ATTENDANCE_THRESHOLDS.safe = safe;
    ATTENDANCE_THRESHOLDS.warning = warning;
    GRADING_CONFIG.passingPercentage = passing;
    setSaved(true);
    setTimeout(() => setSaved(false), 2500);
  };

  const resetDemoData = () => {
    setResetting(true);
    dataService.resetToSeed();
    setTimeout(() => { setResetting(false); window.location.reload(); }, 300);
  };

  return (
    <div className="mx-auto max-w-2xl space-y-6">
      <div>
        <h1 className="text-xl font-bold text-slate-900 dark:text-white">Settings</h1>
        <p className="text-sm text-slate-500 dark:text-slate-400">Configure the business rules used across dashboards and reports.</p>
      </div>

      <div className="rounded-xl border border-slate-200 bg-white p-6 shadow-card dark:border-slate-800 dark:bg-slate-900">
        <h2 className="font-semibold text-slate-900 dark:text-white">Attendance Thresholds</h2>
        <div className="mt-1 flex items-start gap-2 rounded-lg bg-blue-50 p-2 text-xs text-blue-700 dark:bg-blue-900/20 dark:text-blue-300">
          <Info className="mt-0.5 h-3.5 w-3.5 shrink-0" /> These percentages drive the Safe / Warning / Critical badges shown everywhere in the app.
        </div>
        <div className="mt-4 grid grid-cols-2 gap-4">
          <Input label="Safe threshold (≥ %)" type="number" value={safe} onChange={(e) => setSafe(Number(e.target.value))} />
          <Input label="Warning threshold (≥ %)" type="number" value={warning} onChange={(e) => setWarning(Number(e.target.value))} />
        </div>
      </div>

      <div className="rounded-xl border border-slate-200 bg-white p-6 shadow-card dark:border-slate-800 dark:bg-slate-900">
        <h2 className="font-semibold text-slate-900 dark:text-white">Grading Rules</h2>
        <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">Grade bands (edit src/lib/config.ts to change the full table; passing percentage is editable here).</p>
        <table className="mt-3 w-full text-sm">
          <thead><tr className="text-left text-xs uppercase text-slate-400"><th className="py-1">Range</th><th>Grade</th><th>GPA</th></tr></thead>
          <tbody>
            {GRADING_CONFIG.bands.map((b) => (
              <tr key={b.grade} className="border-t border-slate-100 dark:border-slate-800">
                <td className="py-1.5">{b.min}–{b.max}</td><td>{b.grade}</td><td>{b.gpa}</td>
              </tr>
            ))}
          </tbody>
        </table>
        <div className="mt-4 max-w-xs">
          <Input label="Passing percentage" type="number" value={passing} onChange={(e) => setPassing(Number(e.target.value))} />
        </div>
      </div>

      <div className="flex items-center gap-3">
        <Button icon={<Save className="h-4 w-4" />} onClick={save}>Save Settings</Button>
        {saved && <span className="flex items-center gap-1 text-sm text-emerald-600"><CheckCircle2 className="h-4 w-4" /> Saved</span>}
      </div>

      <div className="rounded-xl border border-dashed border-slate-300 p-4 dark:border-slate-700">
        <h3 className="text-sm font-semibold text-slate-700 dark:text-slate-300">Demo Data Controls</h3>
        <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">Manage sample data when running in local demo mode.</p>
        <div className="mt-3 flex flex-wrap gap-3">
          <Button variant="outline" icon={<RotateCcw className="h-4 w-4" />} onClick={resetDemoData} loading={resetting}>Reset to Initial Demo Data</Button>
          <Button variant="outline" className="border-red-300 text-red-600 hover:bg-red-50 dark:border-red-800 dark:text-red-400 dark:hover:bg-red-950/20" onClick={() => { dataService.clearDemoData(); window.location.reload(); }}>Clear Demo Students & Faculty</Button>
        </div>
      </div>
    </div>
  );
}
