import { useState } from "react";
import Icon from "../Icon";
import { ACTIVITY_BADGE, activityLabel } from "../../constants/reportEnums";
import { toFa } from "../../utils/toFa";

// r: رکورد واقعی DailyReport از بکند (به همراه include لیست lessons)
export default function ReportCard({ r }) {
  const [open, setOpen] = useState(false);
  const lessons = r.lessons || [];
  const totalMin = lessons.reduce((s, l) => s + (l.study_minutes || 0), 0);
  const totalTest = lessons.reduce((s, l) => s + (l.test_count || 0), 0);
  const totalEssay = lessons.reduce((s, l) => s + (l.essay_count || 0), 0);
  const subjNames = lessons.map((l) => l.subject).join("، ");
  const dateStr = new Date(r.report_date).toLocaleDateString("fa-IR");

  return (
    <div className={`glass rep-card fade-in ${open ? "open" : ""}`}>
      <div className="rep-card-head" onClick={() => setOpen((v) => !v)}>
        <div className="rht">
          <div className="rep-date"><Icon name="calendar" /> {dateStr}</div>
          <h3 style={{ marginBottom: 0 }}>گزارش کار روزانه</h3>
          <div className="rep-summary">{subjNames || "—"}</div>
        </div>
        <span className="chev-ico"><Icon name="chev" /></span>
      </div>
      <div className="rep-details"><div className="rep-details-inner">
        <div className="rep-lessons">
          {lessons.map((l) => (
            <div className="rep-lesson-row" key={l.id}>
              <span className="l-name">{l.subject}</span>
              <span className="tag">{toFa(l.test_count)} تست</span>
              <span className="tag">{toFa(l.essay_count)} تشریحی</span>
              <span className="tag">{toFa(l.study_minutes)} دقیقه</span>
              <span className={`badge ${ACTIVITY_BADGE[l.activity_type] || "badge-gray"}`}>{activityLabel(l.activity_type)}</span>
            </div>
          ))}
        </div>
        <div className="card-meta">
          <span className="pill">مجموع مطالعه: {toFa(totalMin)} دقیقه</span>
          <span className="pill">مجموع تست: {toFa(totalTest)}</span>
          <span className="pill">مجموع تشریحی: {toFa(totalEssay)}</span>
        </div>
        <div className="rep-meta-row">
          {r.sleep_time && <span className="tag"><Icon name="clock2" /> خواب: {r.sleep_time}</span>}
          {r.wake_time && <span className="tag"><Icon name="clock2" /> بیداری: {r.wake_time}</span>}
          {r.screen_time && <span className="tag"><Icon name="device" /> موبایل: {r.screen_time}</span>}
        </div>
        <div className="rep-note"><b>نقاط ضعف:</b> {r.weak_points || "—"}</div>
        {r.need_help && <div className="rep-note"><b>نیاز به کمک مشاور:</b> {r.need_help}</div>}
      </div></div>
    </div>
  );
}
