import { useState } from "react";
import { toFa } from "../../utils/toFa";

const CHART_W = 320;
const CHART_H = 140;
const PAD_L = 8;
const PAD_R = 8;
const PAD_T = 10;
const PAD_B = 22;

function scaleX(i, count) {
  const usable = CHART_W - PAD_L - PAD_R;
  if (count <= 1) return PAD_L + usable / 2;
  return PAD_L + (usable * i) / (count - 1);
}

function shortLabel(day) {
  // "شنبه" -> فقط دو حرف اول برای جا شدن زیر نمودار
  return day.weekday.slice(0, 2);
}

/* نمودار خطی روند «تراز» آزمون‌ها در هفته‌ی اخیر */
export function ExamTrendChart({ examTrend }) {
  const [active, setActive] = useState(null);
  if (!examTrend || examTrend.length === 0) {
    return <div className="empty-state" style={{ padding: 20 }}>این هفته آزمونی برای تحلیل ثبت نشده.</div>;
  }

  const scores = examTrend.map((e) => e.standard_score || 0);
  const maxScore = Math.max(...scores, 1);
  const minScore = Math.min(...scores, 0);
  const range = Math.max(maxScore - minScore, 1);
  const usableH = CHART_H - PAD_T - PAD_B;

  const points = examTrend.map((e, i) => ({
    x: scaleX(i, examTrend.length),
    y: PAD_T + usableH - ((e.standard_score - minScore) / range) * usableH,
    ...e,
  }));
  const path = points.map((p, i) => `${i === 0 ? "M" : "L"}${p.x},${p.y}`).join(" ");
  const sel = active != null ? points[active] : null;

  return (
    <div className="wk-chart">
      <svg viewBox={`0 0 ${CHART_W} ${CHART_H}`} width="100%" height={CHART_H} preserveAspectRatio="none">
        <line x1={PAD_L} y1={CHART_H - PAD_B} x2={CHART_W - PAD_R} y2={CHART_H - PAD_B} stroke="var(--surface-b)" strokeWidth="1" />
        <path d={path} fill="none" stroke="var(--gold-bright)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
        {points.map((p, i) => (
          <g key={i} onClick={() => setActive(active === i ? null : i)} style={{ cursor: "pointer" }}>
            <circle cx={p.x} cy={p.y} r="10" fill="transparent" />
            <circle cx={p.x} cy={p.y} r={active === i ? 5 : 4} fill="var(--gold-bright)" stroke="var(--bg2)" strokeWidth="1.5" />
            <text x={p.x} y={CHART_H - 6} textAnchor="middle" fontSize="8" fill="var(--ink-faint)">{p.jalali.slice(5)}</text>
          </g>
        ))}
      </svg>
      <div className="wk-chart-detail">
        {sel ? (
          <span><b>{sel.name}</b> — {sel.jalali}: تراز {toFa(sel.standard_score ?? "—")}{sel.rank ? ` · رتبه ${toFa(sel.rank)}` : ""}</span>
        ) : (
          <span className="hint">روی نقطه‌ها بزن برای جزئیات دقیق</span>
        )}
      </div>
    </div>
  );
}

/* نمودار میله‌ای حجم تست/تشریحی روزانه (۲ سری) */
export function TestVolumeChart({ days }) {
  const [active, setActive] = useState(null);
  const max = Math.max(...days.map((d) => d.test_count + d.essay_count), 1);
  const usableH = CHART_H - PAD_T - PAD_B;
  const groupW = (CHART_W - PAD_L - PAD_R) / days.length;
  const barW = Math.min(14, groupW / 3);

  return (
    <div className="wk-chart">
      <div className="wk-legend">
        <span><i style={{ background: "var(--teal)" }} /> تست</span>
        <span><i style={{ background: "var(--violet)" }} /> تشریحی</span>
      </div>
      <svg viewBox={`0 0 ${CHART_W} ${CHART_H}`} width="100%" height={CHART_H} preserveAspectRatio="none">
        <line x1={PAD_L} y1={CHART_H - PAD_B} x2={CHART_W - PAD_R} y2={CHART_H - PAD_B} stroke="var(--surface-b)" strokeWidth="1" />
        {days.map((d, i) => {
          const cx = PAD_L + groupW * i + groupW / 2;
          const hTest = (d.test_count / max) * usableH;
          const hEssay = (d.essay_count / max) * usableH;
          return (
            <g key={i} onClick={() => setActive(active === i ? null : i)} style={{ cursor: "pointer" }}>
              <rect x={cx - barW - 1} y={CHART_H - PAD_B - hTest} width={barW} height={Math.max(hTest, 1)} rx="3" fill="var(--teal)" opacity={active === null || active === i ? 1 : 0.35} />
              <rect x={cx + 1} y={CHART_H - PAD_B - hEssay} width={barW} height={Math.max(hEssay, 1)} rx="3" fill="var(--violet)" opacity={active === null || active === i ? 1 : 0.35} />
              <text x={cx} y={CHART_H - 6} textAnchor="middle" fontSize="8" fill="var(--ink-faint)">{shortLabel(d)}</text>
            </g>
          );
        })}
      </svg>
      <div className="wk-chart-detail">
        {active != null ? (
          <span><b>{days[active].weekday}</b> ({days[active].jalali}): {toFa(days[active].test_count)} تست، {toFa(days[active].essay_count)} تشریحی</span>
        ) : (
          <span className="hint">روی هر روز بزن برای جزئیات دقیق</span>
        )}
      </div>
    </div>
  );
}

/* نمودار میله‌ای حجم مطالعه‌ی روزانه به دقیقه */
export function StudyMinutesChart({ days }) {
  const [active, setActive] = useState(null);
  const max = Math.max(...days.map((d) => d.study_minutes), 1);
  const usableH = CHART_H - PAD_T - PAD_B;
  const groupW = (CHART_W - PAD_L - PAD_R) / days.length;
  const barW = Math.min(22, groupW * 0.55);

  return (
    <div className="wk-chart">
      <svg viewBox={`0 0 ${CHART_W} ${CHART_H}`} width="100%" height={CHART_H} preserveAspectRatio="none">
        <line x1={PAD_L} y1={CHART_H - PAD_B} x2={CHART_W - PAD_R} y2={CHART_H - PAD_B} stroke="var(--surface-b)" strokeWidth="1" />
        {days.map((d, i) => {
          const cx = PAD_L + groupW * i + groupW / 2;
          const h = (d.study_minutes / max) * usableH;
          return (
            <g key={i} onClick={() => setActive(active === i ? null : i)} style={{ cursor: "pointer" }}>
              <rect x={cx - barW / 2} y={CHART_H - PAD_B - h} width={barW} height={Math.max(h, 1)} rx="4" fill="var(--blue)" opacity={active === null || active === i ? 1 : 0.35} />
              <text x={cx} y={CHART_H - 6} textAnchor="middle" fontSize="8" fill="var(--ink-faint)">{shortLabel(d)}</text>
            </g>
          );
        })}
      </svg>
      <div className="wk-chart-detail">
        {active != null ? (
          <span><b>{days[active].weekday}</b> ({days[active].jalali}): {toFa(days[active].study_minutes)} دقیقه مطالعه</span>
        ) : (
          <span className="hint">روی هر روز بزن برای جزئیات دقیق</span>
        )}
      </div>
    </div>
  );
}

/* هر سه نمودار هفتگی، آماده برای جای‌گذاری در تب نمای‌کلی یا داشبورد */
export default function WeeklyCharts({ stats, loading }) {
  if (loading) return <div className="empty-state">در حال بارگذاری نمودارها...</div>;
  if (!stats) return null;
  return (
    <div className="wk-charts-grid">
      <div className="gcard">
        <div className="gcard-head"><h3>روند تراز آزمون‌ها</h3><span className="hint">۷ روز اخیر</span></div>
        <ExamTrendChart examTrend={stats.examTrend} />
      </div>
      <div className="gcard">
        <div className="gcard-head"><h3>حجم تست و تشریحی</h3><span className="hint">۷ روز اخیر</span></div>
        <TestVolumeChart days={stats.days} />
      </div>
      <div className="gcard">
        <div className="gcard-head"><h3>حجم مطالعه (دقیقه)</h3><span className="hint">۷ روز اخیر</span></div>
        <StudyMinutesChart days={stats.days} />
      </div>
    </div>
  );
}
