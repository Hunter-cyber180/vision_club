import { useState } from "react";
import Icon from "../Icon";
import { toFa } from "../../utils/toFa";

// a: رکورد واقعی AnalysisExam از بکند (به همراه include لیست lessons)
export default function ExamAnalysisCard({ a }) {
  const [open, setOpen] = useState(false);
  const subjects = a.lessons || [];
  const totalQ = subjects.reduce((s, x) => s + (x.test_count || 0), 0);
  const totalC = subjects.reduce((s, x) => s + (x.correct_count || 0), 0);
  const totalW = subjects.reduce((s, x) => s + (x.wrong_minutes || 0), 0);
  const subjNames = subjects.map((s) => s.subject).join("، ");
  const dateStr = new Date(a.test_date).toLocaleDateString("fa-IR");

  return (
    <div className={`glass rep-card fade-in ${open ? "open" : ""}`}>
      <div className="rep-card-head" onClick={() => setOpen((v) => !v)}>
        <div className="rht">
          <div className="rep-date"><Icon name="calendar" /> {dateStr} · {a.organizer}</div>
          <h3 style={{ marginBottom: 0 }}>{a.name}</h3>
          <div className="rep-summary">{subjNames || "—"}</div>
        </div>
        <span className="chev-ico"><Icon name="chev" /></span>
      </div>
      <div className="rep-details"><div className="rep-details-inner">
        <div className="rep-lessons">
          {subjects.map((s) => {
            const percent = s.test_count > 0 ? Math.round((s.correct_count / s.test_count) * 100) : 0;
            const tint = percent >= 70 ? "badge-teal" : percent >= 50 ? "badge-gold" : "badge-coral";
            return (
              <div className="rep-lesson-row" key={s.id}>
                <span className="l-name">{s.subject}</span>
                <span className="tag">{toFa(s.test_count)} سوال</span>
                <span className="tag">{toFa(s.correct_count)} صحیح</span>
                <span className="tag">{toFa(s.wrong_minutes)} غلط</span>
                <span className={`badge ${tint}`}>{toFa(percent)}٪</span>
              </div>
            );
          })}
        </div>
        <div className="card-meta">
          {a.rank != null && <span className="pill">رتبه: {toFa(a.rank)}</span>}
          {a.standard_score != null && <span className="pill">تراز کل: {toFa(a.standard_score)}</span>}
          <span className="pill">مجموع سوال: {toFa(totalQ)}</span>
          <span className="pill">صحیح: {toFa(totalC)}</span>
          <span className="pill">غلط: {toFa(totalW)}</span>
        </div>
        <div className="rep-note"><b>مهم‌ترین ضعف:</b> {a.weak_points || "—"}</div>
        {a.notes && <div className="rep-note"><b>پیام برای مشاور:</b> {a.notes}</div>}
      </div></div>
    </div>
  );
}
