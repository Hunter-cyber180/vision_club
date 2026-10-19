import { useEffect, useState } from "react";
import Icon from "../../components/Icon";
import Tabs from "../../components/panel/Tabs";
import WizardField from "../../components/WizardField";
import { useAuth } from "../../context/AuthContext";
import { useToast } from "../../context/ToastContext";
import { updateMyAccount } from "../../api/panel";

const SETTINGS_TABS = [
  { k: "profile", label: "پروفایل" },
  { k: "security", label: "امنیت" },
];

// فیلدهای پروفایل، به چند بخش کوچیک‌تر تقسیم شده تا فرم طولانی نشه
// (دقیقاً منطبق با فیلدهای قابل‌ویرایش PUT /auth/me در بکند)
const PROFILE_SECTIONS = [
  {
    k: "identity",
    label: "هویتی و تماس",
    fields: [
      { id: "name", label: "نام", type: "text" },
      { id: "lastname", label: "نام‌خانوادگی", type: "text" },
      { id: "birthday", label: "تاریخ تولد", type: "date" },
      { id: "gender", label: "جنسیت", type: "select", options: [{ value: "male", label: "پسر" }, { value: "female", label: "دختر" }] },
      { id: "city", label: "شهر", type: "text" },
      { id: "student_number", label: "شماره موبایل خودت", type: "tel" },
      { id: "father_number", label: "شماره تلفن پدر", type: "tel" },
      { id: "mother_number", label: "شماره تلفن مادر", type: "tel", optional: true },
      { id: "telegram_id", label: "آیدی تلگرام", type: "text", optional: true },
    ],
  },
  {
    k: "education",
    label: "وضعیت تحصیلی",
    fields: [
      { id: "degree", label: "پایه/مدرک تحصیلی", type: "text", optional: true },
      { id: "grade_10_gpa", label: "معدل دهم", type: "number", optional: true },
      { id: "grade_11_gpa", label: "معدل یازدهم", type: "number", optional: true },
      { id: "grade_12_gpa", label: "معدل دوازدهم", type: "number", optional: true },
    ],
  },
  {
    k: "goals",
    label: "سوابق و اهداف کنکور",
    fields: [
      { id: "is_retaker", label: "پشت‌کنکوری هستی؟", type: "select", options: [{ value: "false", label: "خیر" }, { value: "true", label: "بله" }] },
      { id: "entrance_exam_attempts", label: "تعداد دفعات شرکت در کنکور", type: "number" },
      { id: "prev_national_rank", label: "رتبه کنکور قبلی", type: "number", optional: true },
      { id: "preferred_major", label: "رشته مورد علاقه", type: "text", optional: true },
      { id: "preferred_universities", label: "دانشگاه‌های مورد نظر", type: "text", optional: true },
      { id: "notes", label: "نگرانی یا نکات خاص", type: "textarea", optional: true },
    ],
  },
];

function ProfileTab() {
  const { profile } = useAuth();
  const toast = useToast();
  const [section, setSection] = useState("identity");
  const [values, setValues] = useState({});
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (!profile) return;
    setValues({
      ...profile,
      is_retaker: profile.is_retaker ? "true" : "false",
      birthday: profile.birthday ? String(profile.birthday).slice(0, 10) : "",
    });
  }, [profile]);

  const save = async () => {
    setSaving(true);
    try {
      const payload = { ...values, is_retaker: values.is_retaker === "true" };
      delete payload.email;
      delete payload.id;
      delete payload.role;
      delete payload.consultant_id;
      delete payload.charge_amount;
      delete payload.consultant;
      await updateMyAccount(payload);
      toast("پروفایل با موفقیت به‌روزرسانی شد");
    } catch (err) {
      toast(err?.response?.data?.message || "به‌روزرسانی پروفایل با خطا مواجه شد", "error");
    } finally {
      setSaving(false);
    }
  };

  const displayName = [profile?.name, profile?.lastname].filter(Boolean).join(" ");
  const activeSection = PROFILE_SECTIONS.find((s) => s.k === section) || PROFILE_SECTIONS[0];

  return (
    <div className="settings-card">
      <h2><Icon name="user" /> اطلاعات پروفایل</h2>
      {/* <div className="sub">این اطلاعات به مشاورت نمایش داده می‌شه.</div> */}
      <div className="avatar-row">
        <div className="avatar-big">{(displayName || "ک")[0]}</div>
        <div className="avatar-hint">اطلاعات به مشاور نمایش داده می‌شه.</div>
      </div>
      <div className="field-row2">
        <div className="field"><label>ایمیل</label><input className="input" value={profile?.email || ""} disabled /></div>
        <div className="field"><label>نقش حساب</label><input className="input" value={profile?.role === "student" ? "دانش‌آموز" : "کاربر عادی"} disabled /></div>
      </div>

      <div className="mode-switch" style={{ marginBottom: 18 }}>
        {PROFILE_SECTIONS.map((s) => (
          <button key={s.k} className={`mode-btn ${section === s.k ? "active" : ""}`} onClick={() => setSection(s.k)}>{s.label}</button>
        ))}
      </div>

      {activeSection.fields.map((f) => (
        <div className="field" key={f.id}>
          <label>{f.label}{f.optional ? <span className="field-optional"> (اختیاری)</span> : null}</label>
          <WizardField f={f} value={values[f.id]} onChange={(v) => setValues((s) => ({ ...s, [f.id]: v }))} />
        </div>
      ))}

      <div className="settings-actions">
        <button className="btn btn-gold" disabled={saving} onClick={save}>{saving ? "در حال ذخیره..." : "ذخیره‌ی تغییرات"}</button>
      </div>
    </div>
  );
}

function SecurityTab() {
  const toast = useToast();
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [saving, setSaving] = useState(false);

  const save = async () => {
    if (newPassword.length < 8) { toast("رمز عبور باید حداقل ۸ کاراکتر باشد", "error"); return; }
    if (newPassword !== confirmPassword) { toast("رمز عبور و تکرار آن یکسان نیستند", "error"); return; }
    setSaving(true);
    try {
      await updateMyAccount({ user_password: newPassword });
      toast("رمز عبور با موفقیت به‌روزرسانی شد");
      setNewPassword(""); setConfirmPassword("");
    } catch (err) {
      toast(err?.response?.data?.message || "به‌روزرسانی رمز عبور با خطا مواجه شد", "error");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="settings-card">
      <h2><Icon name="shield" /> تغییر رمز عبور</h2>
      <div className="sub">برای امنیت بیشتر، رمز عبور قوی و منحصربه‌فرد انتخاب کن.</div>
      <div className="field-row2">
        <div className="field">
          <label>رمز عبور جدید</label>
          <input className="input" type="password" placeholder="••••••••" value={newPassword} onChange={(e) => setNewPassword(e.target.value)} />
          <div className="field-hint">حداقل ۸ کاراکتر</div>
        </div>
        <div className="field">
          <label>تکرار رمز عبور جدید</label>
          <input className="input" type="password" placeholder="••••••••" value={confirmPassword} onChange={(e) => setConfirmPassword(e.target.value)} />
        </div>
      </div>
      <div className="settings-actions">
        <button className="btn btn-gold" disabled={saving} onClick={save}>{saving ? "در حال ذخیره..." : "به‌روزرسانی رمز عبور"}</button>
      </div>
    </div>
  );
}

export default function Settings() {
  const { panelRole, logout } = useAuth();
  const [tab, setTab] = useState("profile");
  const roleLabel = panelRole === "student" ? "دانش‌آموز" : panelRole === "consultant" ? "مشاور" : panelRole === "admin" ? "ادمین" : "کاربر عادی";

  return (
    <>
      <div className="panel-head fade-in"><h2><Icon name="settings" /> تنظیمات حساب</h2><p>اطلاعات و امنیت حسابت رو مدیریت کن — {roleLabel}</p></div>
      <Tabs tabs={SETTINGS_TABS} active={tab} onChange={setTab} />
      <div className="wrap panel-wrap fade-in">
        {tab === "profile" && <ProfileTab />}
        {tab === "security" && <SecurityTab />}
        <button className="btn btn-ghost btn-block" style={{ marginTop: 6, color: "var(--coral)" }} onClick={logout}>
          <Icon name="logout" /> خروج از حساب
        </button>
      </div>
    </>
  );
}
