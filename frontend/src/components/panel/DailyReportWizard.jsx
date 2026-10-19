import { useState } from "react";
import Icon from "../Icon";
import Stepper from "../Stepper";
import LessonRow from "./LessonRow";
import { useToast } from "../../context/ToastContext";
import { createDailyReport } from "../../api/panel";
import { toFa } from "../../utils/toFa";

const STEPS = [{ title: "دروس امروز" }, { title: "زمان‌بندی روز" }, { title: "جمع‌بندی" }];
const emptyLesson = () => ({ subject: "", test_count: 0, essay_count: 0, study_minutes: 0, activity_type: "not_done" });
const today = () => new Date().toISOString().slice(0, 10);

export default function DailyReportWizard({ onSubmitted }) {
  const toast = useToast();
  const [step, setStep] = useState(0);
  const [reportDate, setReportDate] = useState(today());
  const [lessons, setLessons] = useState([emptyLesson()]);
  const [sleepTime, setSleepTime] = useState("");
  const [wakeTime, setWakeTime] = useState("");
  const [screenTime, setScreenTime] = useState("");
  const [weakPoints, setWeakPoints] = useState("");
  const [needHelp, setNeedHelp] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [shake, setShake] = useState(false);

  const totals = lessons.reduce((acc, l) => ({
    min: acc.min + (Number(l.study_minutes) || 0),
    test: acc.test + (Number(l.test_count) || 0),
    essay: acc.essay + (Number(l.essay_count) || 0),
  }), { min: 0, test: 0, essay: 0 });

  const doShake = () => { setShake(true); setTimeout(() => setShake(false), 400); };

  const updateLesson = (i, next) => setLessons((ls) => ls.map((l, idx) => (idx === i ? next : l)));
  const removeLesson = (i) => setLessons((ls) => ls.filter((_, idx) => idx !== i));
  const addLesson = () => setLessons((ls) => [...ls, emptyLesson()]);

  const validate = () => {
    if (step === 0 && !lessons.some((l) => l.subject !== "")) { doShake(); return false; }
    if (step === 1 && (!sleepTime || !wakeTime || !screenTime.trim())) { doShake(); return false; }
    if (step === 2 && (!weakPoints.trim() || !needHelp.trim())) { doShake(); return false; }
    return true;
  };

  const reset = () => {
    setStep(0); setReportDate(today()); setLessons([emptyLesson()]);
    setSleepTime(""); setWakeTime(""); setScreenTime(""); setWeakPoints(""); setNeedHelp("");
  };

  const next = async () => {
    if (!validate()) return;
    if (step < STEPS.length - 1) { setStep((s) => s + 1); return; }

    setSubmitting(true);
    try {
      await createDailyReport({
        report_date: reportDate,
        sleep_time: sleepTime,
        wake_time: wakeTime,
        screen_time: screenTime,
        weak_points: weakPoints,
        need_help: needHelp,
        lessons: lessons.filter((l) => l.subject !== ""),
      });
      toast("گزارش امروزت با موفقیت برای مشاور ارسال شد");
      reset();
      onSubmitted?.();
    } catch (err) {
      toast(err?.response?.data?.message || "ثبت گزارش با خطا مواجه شد", "error");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className={shake ? "shake" : ""}>
      <Stepper steps={STEPS} activeStep={step} />
      <div className="glass card wizard-card2">
        {step === 0 && (
          <div className="step-panel active">
            <div className="field"><label>روز و تاریخ <span style={{ color: "var(--coral)" }}>*</span></label>
              <input type="date" className="input" value={reportDate} onChange={(e) => setReportDate(e.target.value)} />
            </div>
            <div className="lessons-head"><h3><Icon name="book" /> دروسی که امروز کار کردی</h3></div>
            {lessons.map((l, i) => (
              <LessonRow key={i} index={i} row={l} onChange={(next) => updateLesson(i, next)} onRemove={() => removeLesson(i)} canRemove={lessons.length > 1} />
            ))}
            <div style={{ height: 10 }} />
            <div className="add-lesson-btn" onClick={addLesson}><Icon name="plus" /> افزودن درس</div>
            <div className="totals">
              <div className="t"><div className="num">{toFa(totals.min)}</div><div className="lbl">مجموع مطالعه</div></div>
              <div className="t"><div className="num">{toFa(totals.test)}</div><div className="lbl">مجموع تست</div></div>
              <div className="t"><div className="num">{toFa(totals.essay)}</div><div className="lbl">مجموع تشریحی</div></div>
            </div>
          </div>
        )}
        {step === 1 && (
          <div className="step-panel active">
            <div className="tip"><Icon name="spark" /> خواب کافی و مدیریت فضای مجازی، مستقیم روی کیفیت مطالعه‌ات تاثیر می‌ذاره. صادقانه پر کن تا مشاورت بتونه بهتر کمکت کنه.</div>
            <div className="field-row">
              <div className="field"><label>تایم خواب شب گذشته <span style={{ color: "var(--coral)" }}>*</span></label><input type="time" className="input" value={sleepTime} onChange={(e) => setSleepTime(e.target.value)} /></div>
              <div className="field"><label>تایم بیداری صبحگاهی <span style={{ color: "var(--coral)" }}>*</span></label><input type="time" className="input" value={wakeTime} onChange={(e) => setWakeTime(e.target.value)} /></div>
            </div>
            <div className="field"><label>میزان استفاده از موبایل و فضای مجازی <span style={{ color: "var(--coral)" }}>*</span></label><input type="text" className="input" placeholder="مثلاً ۲ ساعت" value={screenTime} onChange={(e) => setScreenTime(e.target.value)} /></div>
          </div>
        )}
        {step === 2 && (
          <div className="step-panel active">
            <div className="field"><label>مشکلات و نقاط ضعف امروزم <span style={{ color: "var(--coral)" }}>*</span></label><textarea className="input" placeholder="مثلاً در حل تست‌های فیزیک زمان زیادی صرف کردم..." value={weakPoints} onChange={(e) => setWeakPoints(e.target.value)} /></div>
            <div className="field"><label>مواردی که نیاز به کمک مشاور دارم <span style={{ color: "var(--coral)" }}>*</span></label><textarea className="input" placeholder="مثلاً برنامه‌ریزی هفته آینده برای جمع‌بندی زیست..." value={needHelp} onChange={(e) => setNeedHelp(e.target.value)} /></div>
          </div>
        )}
        <div className="wiz-nav">
          <button type="button" className="btn btn-ghost" style={{ visibility: step === 0 ? "hidden" : "visible" }} onClick={() => setStep((s) => Math.max(0, s - 1))}>
            <Icon name="chev" /> مرحله قبل
          </button>
          <div className="spacer" />
          <button type="button" className="btn btn-gold" disabled={submitting} onClick={next}>
            {submitting ? "در حال ارسال..." : step === STEPS.length - 1 ? <>ثبت و ارسال گزارش <Icon name="send" /></> : <>مرحله بعد <Icon name="chev" /></>}
          </button>
        </div>
      </div>
    </div>
  );
}
