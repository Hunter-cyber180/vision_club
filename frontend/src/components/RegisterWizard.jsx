import { useState } from "react";
import Icon from "./Icon";
import Stepper from "./Stepper";
import WizardField from "./WizardField";
import { useToast } from "../context/ToastContext";

// steps: از constants/registerSteps.js
// onSubmit(values) -> Promise ؛ باید خطا throw کنه تا ویزارد نگهش داره
// passwordFieldId / confirmFieldId: برای چک یکسان‌بودن رمز قبل از ارسال نهایی
export default function RegisterWizard({ steps, onSubmit, passwordFieldId, doneMessage }) {
  const toast = useToast();
  const [stepIndex, setStepIndex] = useState(0);
  const [values, setValues] = useState({});
  const [submitting, setSubmitting] = useState(false);
  const [done, setDone] = useState(false);

  const step = steps[stepIndex];

  const setField = (id, val) => setValues((v) => ({ ...v, [id]: val }));

  const validateStep = () => {
    for (const f of step.fields) {
      if (f.optional) continue;
      const val = values[f.id];
      if (f.type === "checkbox-group") {
        if (!Array.isArray(val) || val.length === 0) {
          toast(`لطفاً «${f.label}» رو انتخاب کن`, "error");
          return false;
        }
      } else if (val === undefined || val === null || String(val).trim() === "") {
        toast(`«${f.label}» الزامی است`, "error");
        return false;
      }
    }
    if (passwordFieldId && "confirmPassword" in Object.fromEntries(step.fields.map((f) => [f.id, true]))) {
      if (values[passwordFieldId] !== values.confirmPassword) {
        toast("رمز عبور و تکرار آن یکسان نیستند", "error");
        return false;
      }
    }
    return true;
  };

  const next = async () => {
    if (!validateStep()) return;
    if (stepIndex < steps.length - 1) {
      setStepIndex((i) => i + 1);
      window.scrollTo({ top: 0, behavior: "smooth" });
      return;
    }
    setSubmitting(true);
    try {
      await onSubmit(values);
      setDone(true);
    } catch (err) {
      const msg = err?.response?.data?.message || "ثبت اطلاعات با خطا مواجه شد. دوباره تلاش کن.";
      toast(msg, "error");
    } finally {
      setSubmitting(false);
    }
  };

  const back = () => setStepIndex((i) => Math.max(0, i - 1));

  if (done) {
    return (
      <div className="done-screen">
        <div className="check"><Icon name="check" /></div>
        <h2>عملیات با موفقیت انجام شد</h2>
        <p>{doneMessage}</p>
      </div>
    );
  }

  return (
    <>
      <Stepper steps={steps} activeStep={stepIndex} />
      <h2 className="step-title">{step.title}</h2>
      <p className="step-sub">{step.subtitle}</p>
      {step.fields.map((f) => (
        <div className="field" key={f.id}>
          <label>{f.label}{f.optional ? <span className="field-optional"> (اختیاری)</span> : null}</label>
          <WizardField f={f} value={values[f.id]} onChange={(val) => setField(f.id, val)} />
        </div>
      ))}
      <div className="wizard-actions">
        {stepIndex > 0 && <button type="button" className="btn btn-ghost" onClick={back}>بازگشت</button>}
        <button type="button" className="btn btn-gold" disabled={submitting} onClick={next}>
          {submitting ? "در حال ارسال..." : stepIndex === steps.length - 1 ? "ثبت‌نام" : "مرحله بعد"} <Icon name="chev" />
        </button>
      </div>
    </>
  );
}
