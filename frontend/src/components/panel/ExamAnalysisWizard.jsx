import { useState } from "react";
import Icon from "../Icon";
import Stepper from "../Stepper";
import ExamSubjectRow from "./ExamSubjectRow";
import { useToast } from "../../context/ToastContext";
import { createAnalysisExam } from "../../api/panel";

const STEPS = [{ title: "اطلاعات آزمون" }, { title: "دروس آزمون" }, { title: "جمع‌بندی" }];
const emptySubject = () => ({ subject: "", test_count: 0, correct_count: 0, wrong_minutes: 0 });
const today = () => new Date().toISOString().slice(0, 10);

export default function ExamAnalysisWizard({ onSubmitted }) {
  const toast = useToast();
  const [step, setStep] = useState(0);
  const [name, setName] = useState("");
  const [organizer, setOrganizer] = useState("");
  const [testDate, setTestDate] = useState(today());
  const [rank, setRank] = useState("");
  const [standardScore, setStandardScore] = useState("");
  const [subjects, setSubjects] = useState([emptySubject()]);
  const [weakPoints, setWeakPoints] = useState("");
  const [notes, setNotes] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [shake, setShake] = useState(false);

  const doShake = () => { setShake(true); setTimeout(() => setShake(false), 400); };
  const updateSubject = (i, next) => setSubjects((ss) => ss.map((s, idx) => (idx === i ? next : s)));
  const removeSubject = (i) => setSubjects((ss) => ss.filter((_, idx) => idx !== i));
  const addSubject = () => setSubjects((ss) => [...ss, emptySubject()]);

  const validate = () => {
    if (step === 0 && !(name.trim() && organizer.trim() && testDate)) { doShake(); return false; }
    if (step === 1 && !subjects.some((s) => s.subject !== "")) { doShake(); return false; }
    if (step === 2 && !weakPoints.trim()) { doShake(); return false; }
    return true;
  };

  const reset = () => {
    setStep(0); setName(""); setOrganizer(""); setTestDate(today());
    setRank(""); setStandardScore(""); setSubjects([emptySubject()]); setWeakPoints(""); setNotes("");
  };

  const next = async () => {
    if (!validate()) return;
    if (step < STEPS.length - 1) { setStep((s) => s + 1); return; }

    setSubmitting(true);
    try {
      await createAnalysisExam({
        name: name.trim(),
        organizer: organizer.trim(),
        test_date: testDate,
        rank: rank ? Number(rank) : null,
        standard_score: standardScore ? Number(standardScore) : null,
        weak_points: weakPoints.trim(),
        notes: notes.trim() || null,
        lessons: subjects.filter((s) => s.subject !== ""),
      });
      toast("تحلیل آزمونت با موفقیت برای مشاور ارسال شد");
      reset();
      onSubmitted?.();
    } catch (err) {
      toast(err?.response?.data?.message || "ثبت تحلیل آزمون با خطا مواجه شد", "error");
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
            <div className="field"><label>نام آزمون <span style={{ color: "var(--coral)" }}>*</span></label>
              <input type="text" className="input" placeholder="مثلاً آزمون جامع شماره ۶" value={name} onChange={(e) => setName(e.target.value)} />
            </div>
            <div className="field-row">
              <div className="field"><label>برگزار کننده <span style={{ color: "var(--coral)" }}>*</span></label><input type="text" className="input" placeholder="مثلاً قلم‌چی، گاج و..." value={organizer} onChange={(e) => setOrganizer(e.target.value)} /></div>
              <div className="field"><label>تاریخ آزمون <span style={{ color: "var(--coral)" }}>*</span></label><input type="date" className="input" value={testDate} onChange={(e) => setTestDate(e.target.value)} /></div>
            </div>
            <div className="field-row">
              <div className="field"><label>رتبه در آزمون</label><input type="number" min="0" className="input" placeholder="مثلاً ۱۲۴۰" value={rank} onChange={(e) => setRank(e.target.value)} /></div>
              <div className="field"><label>تراز کل آزمون</label><input type="number" min="0" className="input" placeholder="مثلاً ۶۹۰۰" value={standardScore} onChange={(e) => setStandardScore(e.target.value)} /></div>
            </div>
          </div>
        )}
        {step === 1 && (
          <div className="step-panel active">
            <div className="lessons-head"><h3><Icon name="book" /> دروس این آزمون</h3></div>
            {subjects.map((s, i) => (
              <ExamSubjectRow key={i} index={i} row={s} onChange={(next) => updateSubject(i, next)} onRemove={() => removeSubject(i)} canRemove={subjects.length > 1} />
            ))}
            <div style={{ height: 10 }} />
            <div className="add-lesson-btn" onClick={addSubject}><Icon name="plus" /> افزودن درس</div>
          </div>
        )}
        {step === 2 && (
          <div className="step-panel active">
            <div className="field"><label>مهم‌ترین ضعف در آزمون <span style={{ color: "var(--coral)" }}>*</span></label><textarea className="input" placeholder="مثلاً در تست‌های فیزیک زمان زیادی صرف کردم..." value={weakPoints} onChange={(e) => setWeakPoints(e.target.value)} /></div>
            <div className="field"><label>پیامی برای مشاور</label><textarea className="input" placeholder="مثلاً برای درس فیزیک نیاز به یه تکنیک تست‌زنی دارم..." value={notes} onChange={(e) => setNotes(e.target.value)} /></div>
          </div>
        )}
        <div className="wiz-nav">
          <button type="button" className="btn btn-ghost" style={{ visibility: step === 0 ? "hidden" : "visible" }} onClick={() => setStep((s) => Math.max(0, s - 1))}>
            <Icon name="chev" /> مرحله قبل
          </button>
          <div className="spacer" />
          <button type="button" className="btn btn-gold" disabled={submitting} onClick={next}>
            {submitting ? "در حال ارسال..." : step === STEPS.length - 1 ? <>ثبت و ارسال تحلیل <Icon name="send" /></> : <>مرحله بعد <Icon name="chev" /></>}
          </button>
        </div>
      </div>
    </div>
  );
}
