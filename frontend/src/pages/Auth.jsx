import { useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import Icon from "../components/Icon";
import RegisterWizard from "../components/RegisterWizard";
import { USER_REGISTER_STEPS, CONSULTANT_REGISTER_STEPS } from "../constants/registerSteps";
import { useAuth } from "../context/AuthContext";
import { useToast } from "../context/ToastContext";

const ROLES = [
  { k: "user", label: "کاربر" },
  { k: "consultant", label: "مشاور" },
  { k: "admin", label: "ادمین" },
];

function LoginForm({ role }) {
  const { login } = useAuth();
  const toast = useToast();
  const navigate = useNavigate();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPass, setShowPass] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  const submit = async () => {
    if (!email.trim() || !password.trim()) {
      toast("ایمیل و رمز عبور رو وارد کن", "error");
      return;
    }
    setSubmitting(true);
    try {
      const auth = await login(role, { email: email.trim(), password });
      toast("خوش آمدی، " + ([auth.profile?.name, auth.profile?.lastname].filter(Boolean).join(" ") || "کاربر عزیز"));
      navigate("/panel/dashboard");
    } catch (err) {
      toast(err?.response?.data?.message || "ایمیل یا رمز عبور اشتباه است", "error");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <>
      <h2 className="step-title">ورود به ویژن کلاب</h2>
      <p className="step-sub">با ایمیل و رمز عبورت وارد شو</p>
      <div className="field">
        <label>ایمیل</label>
        <input className="input" type="email" placeholder="you@example.com" value={email} onChange={(e) => setEmail(e.target.value)} />
      </div>
      <div className="field">
        <label>رمز عبور</label>
        <div className="password-field">
          <input className="input" type={showPass ? "text" : "password"} placeholder="رمز عبورت رو وارد کن" value={password} onChange={(e) => setPassword(e.target.value)} />
          <button type="button" className="password-toggle" onClick={() => setShowPass((v) => !v)}>
            <Icon name={showPass ? "eyeoff" : "eye"} />
          </button>
        </div>
      </div>
      <div className="wizard-actions">
        <button type="button" className="btn btn-gold btn-block" disabled={submitting} onClick={submit}>
          {submitting ? "در حال ورود..." : "ورود"} <Icon name="chev" />
        </button>
      </div>
    </>
  );
}

export default function Auth() {
  const location = useLocation();
  const [authRole, setAuthRole] = useState("user");
  // اگه از منوی «ثبت‌نام» اومده باشیم (state.mode === "register")، مستقیم
  // تب ثبت‌نام باز بشه، نه ورود.
  const [authMode, setAuthMode] = useState(location.state?.mode === "register" ? "register" : "login");
  const { registerUser, registerConsultant } = useAuth();
  const navigate = useNavigate();

  const setRole = (r) => { setAuthRole(r); setAuthMode("login"); };

  const submitUserRegister = async (values) => {
    const payload = {
      name: values.name,
      lastname: values.lastname,
      email: values.email,
      user_password: values.user_password,
      confirmPassword: values.confirmPassword,
      birthday: values.birthday,
      gender: values.gender,
      city: values.city,
      student_number: values.student_number,
      father_number: values.father_number,
      mother_number: values.mother_number || null,
      telegram_id: values.telegram_id || null,
      degree: values.degree,
      grade_10_gpa: values.grade_10_gpa ? Number(values.grade_10_gpa) : null,
      grade_11_gpa: values.grade_11_gpa ? Number(values.grade_11_gpa) : null,
      grade_12_gpa: values.grade_12_gpa ? Number(values.grade_12_gpa) : null,
      is_retaker: values.is_retaker === "true",
      entrance_exam_attempts: Number(values.entrance_exam_attempts || 0),
      prev_national_rank: values.prev_national_rank ? Number(values.prev_national_rank) : null,
      preferred_major: values.preferred_major,
      preferred_universities: values.preferred_universities || null,
      notes: values.notes || null,
    };
    const auth = await registerUser(payload);
    setTimeout(() => navigate("/panel/dashboard"), 1200);
    return auth;
  };

  const submitConsultantRegister = async (values) => {
    const payload = {
      name: values.name,
      lastname: values.lastname,
      email: values.email,
      consultant_password: values.consultant_password,
      confirmPassword: values.confirmPassword,
      phone_number: values.phone_number,
      telegram_id: values.telegram_id || null,
      counseling_fields: values.counseling_fields || [],
      consultation_type: values.consultation_type,
      experience_years: Number(values.experience_years || 0),
      education: values.education || null,
      skills: values.skills || null,
      bio: values.bio || null,
    };
    return registerConsultant(payload);
  };

  let body;
  if (authRole === "admin") {
    body = (
      <>
        <LoginForm role="admin" />
        <p style={{ textAlign: "center", fontSize: 12.5, color: "var(--ink-dim)", marginTop: 16 }}>
          حساب‌های ادمین فقط توسط تیم فنی ویژن کلاب ساخته می‌شن.
        </p>
      </>
    );
  } else if (authMode === "login") {
    body = <LoginForm role={authRole} />;
  } else if (authRole === "consultant") {
    body = (
      <RegisterWizard
        steps={CONSULTANT_REGISTER_STEPS}
        onSubmit={submitConsultantRegister}
        passwordFieldId="consultant_password"
        doneMessage="درخواست همکاری‌ات ثبت شد؛ بعد از بررسی و تایید توسط تیم ما، می‌تونی با همین ایمیل و رمز وارد پنل مشاور بشی."
      />
    );
  } else {
    body = (
      <RegisterWizard
        steps={USER_REGISTER_STEPS}
        onSubmit={submitUserRegister}
        passwordFieldId="user_password"
        doneMessage="ثبت‌نامت با موفقیت انجام شد. داریم وارد پنلت می‌کنیم..."
      />
    );
  }

  return (
    <div className="auth-shell fade-in">
      <div className="auth-grid">
        <div className="auth-hero">
          <div className="eyebrow"><span className="dot" /> عضویت در ویژن کلاب</div>
          <h1 style={{ fontSize: 26, fontWeight: 800, lineHeight: 1.55, marginBottom: 14 }}>
            مسیر موفقیت<br />از همین‌جا شروع می‌شه
          </h1>
          <p style={{ color: "var(--ink-dim)", fontSize: 14, lineHeight: 2, maxWidth: "34em", marginBottom: 24 }}>
            سامانه مدیریت مشاوره تحصیلی ویژن کلاب — یک پلتفرم حرفه‌ای برای دانش‌آموزانی که هدف دارند.
          </p>
          <div className="grid grid-2">
            <div className="hero-chip"><div className="t">نمودار عملکرد</div><div className="s">مشاهده پیشرفت</div></div>
            <div className="hero-chip"><div className="t">تحلیل آزمون</div><div className="s">بررسی نقاط ضعف</div></div>
            <div className="hero-chip"><div className="t">ثبت گزارش روزانه</div><div className="s">پیگیری دقیق مطالعه</div></div>
            <div className="hero-chip"><div className="t">۲۴/۷</div><div className="s">پشتیبانی چت</div></div>
          </div>
        </div>

        <div className="auth-wrap">
          <div className="glass card" style={{ padding: "24px 20px" }}>
            <div className="eyebrow"><span className="dot" /> ویژن کلاب</div>
            <p style={{ color: "var(--ink-dim)", fontSize: 13, marginBottom: 14 }}>
              {authMode === "login" ? "با چه نقشی وارد می‌شوی؟" : "می‌خوای به‌عنوان چه نقشی ثبت‌نام کنی؟"}
            </p>

            <div className="role-tabs">
              {ROLES.map((r) => (
                <button key={r.k} className={`role-tab ${authRole === r.k ? "active" : ""}`} onClick={() => setRole(r.k)}>
                  {r.label}
                </button>
              ))}
            </div>

            {authRole !== "admin" && (
              <div className="mode-switch">
                <button className={`mode-btn ${authMode === "login" ? "active" : ""}`} onClick={() => setAuthMode("login")}>ورود</button>
                <button className={`mode-btn ${authMode === "register" ? "active" : ""}`} onClick={() => setAuthMode("register")}>ثبت‌نام</button>
              </div>
            )}

            {body}

            {authRole !== "admin" && (
              <p style={{ textAlign: "center", fontSize: 12.5, color: "var(--ink-dim)", marginTop: 16 }}>
                {authMode === "login" ? "حساب نداری؟" : "قبلاً ثبت‌نام کردی؟"}
                <a href="javascript:void(0)" style={{ color: "var(--gold-bright)", fontWeight: 700 }} onClick={() => setAuthMode(authMode === "login" ? "register" : "login")}>
                  {authMode === "login" ? " بساز" : " وارد شو"}
                </a>
              </p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
