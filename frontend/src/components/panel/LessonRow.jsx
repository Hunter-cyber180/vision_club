import { onlyDigits } from "../../utils/numeric";
import Icon from "../Icon";
import { REPORT_SUBJECTS, ACTIVITY_TYPES } from "../../constants/reportEnums";
import { toFa } from "../../utils/toFa";

// row: { subject, test_count, essay_count, study_minutes, activity_type }
export default function LessonRow({ index, row, onChange, onRemove, canRemove }) {
  const set = (k, v) => onChange({ ...row, [k]: v });
  return (
    <div className="lesson-card">
      <div className="l-top">
        <div className="l-num">{toFa(index + 1)}</div>
        <select className="l-subject" value={row.subject} onChange={(e) => set("subject", e.target.value)}>
          <option value="">انتخاب درس...</option>
          {REPORT_SUBJECTS.map((s) => <option key={s} value={s}>{s}</option>)}
        </select>
        {canRemove && (
          <div className="l-remove" title="حذف درس" onClick={onRemove}><Icon name="trash" /></div>
        )}
      </div>
      <div className="l-grid">
        <div className="mini"><label>تعداد تست</label><input type="text" inputMode="numeric" className="l-test" value={row.test_count} onChange={(e) => set("test_count", onlyDigits(e.target.value))} /></div>
        <div className="mini"><label>تعداد تشریحی</label><input type="text" inputMode="numeric" className="l-essay" value={row.essay_count} onChange={(e) => set("essay_count", onlyDigits(e.target.value))} /></div>
        <div className="mini"><label>مدت مطالعه (دقیقه)</label><input type="text" inputMode="numeric" className="l-min" value={row.study_minutes} onChange={(e) => set("study_minutes", onlyDigits(e.target.value))} /></div>
      </div>
      <div className="act-chip-row">
        {ACTIVITY_TYPES.map((a) => (
          <button
            type="button"
            key={a.value}
            className={`act-chip ${row.activity_type === a.value ? "sel" : ""}`}
            data-c={a.color}
            onClick={() => set("activity_type", a.value)}
          >
            <span className="d" />{a.label}
          </button>
        ))}
      </div>
    </div>
  );
}
