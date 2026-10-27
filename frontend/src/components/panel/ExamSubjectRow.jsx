import { onlyDigits } from "../../utils/numeric";
import Icon from "../Icon";
import { REPORT_SUBJECTS } from "../../constants/reportEnums";
import { toFa } from "../../utils/toFa";

// row: { subject, test_count, correct_count, wrong_minutes }
export default function ExamSubjectRow({ index, row, onChange, onRemove, canRemove }) {
  const set = (k, v) => onChange({ ...row, [k]: v });
  const total = Number(row.test_count) || 0;
  const correct = Number(row.correct_count) || 0;
  const percent = total > 0 ? Math.round((correct / total) * 100) : 0;

  return (
    <div className="lesson-card">
      <div className="l-top">
        <div className="l-num">{toFa(index + 1)}</div>
        <select className="sj-subject" value={row.subject} onChange={(e) => set("subject", e.target.value)}>
          <option value="">انتخاب درس...</option>
          {REPORT_SUBJECTS.map((s) => <option key={s} value={s}>{s}</option>)}
        </select>
        {canRemove && (
          <div className="l-remove" title="حذف درس" onClick={onRemove}><Icon name="trash" /></div>
        )}
      </div>
      <div className="l-grid-4">
        <div className="mini"><label>تعداد کل</label><input type="text" inputMode="numeric" className="sj-total" value={row.test_count} onChange={(e) => set("test_count", onlyDigits(e.target.value))} /></div>
        <div className="mini"><label>صحیح</label><input type="text" inputMode="numeric" className="sj-correct" value={row.correct_count} onChange={(e) => set("correct_count", onlyDigits(e.target.value))} /></div>
        <div className="mini"><label>غلط</label><input type="text" inputMode="numeric" className="sj-wrong" value={row.wrong_minutes} onChange={(e) => set("wrong_minutes", onlyDigits(e.target.value))} /></div>
        <div className="mini"><label>درصد</label><input type="text" className="sj-percent" value={`${toFa(percent)}درصد`} disabled /></div>
      </div>
    </div>
  );
}
