import { useEffect, useState } from "react";
import Icon from "../../components/Icon";
import Tabs from "../../components/panel/Tabs";
import WizardField from "../../components/WizardField";
import { useAuth } from "../../context/AuthContext";
import { useToast } from "../../context/ToastContext";
import { updateMyConsultantAccount } from "../../api/consultant";

const SETTINGS_TABS = [
  { k: "profile", label: "پروفایل" },
  { k: "security", label: "امنیت" },
];

const PROFILE_SECTIONS = [
  {
    k: "identity",
    label: "هویت و تماس",
    fields: [
      { id: "name", label: "نام", type: "text" },
      { id: "lastname", label: "نام‌خانوادگی", type: "text" },
      { id: "phone_number", label: "شماره تلفن", type: "tel" },
      { id: "telegram_id", label: "آیدی تلگرام", type: "text", optional: true },
    ],
  },
  {
    k: "expertise",
    label: "تخصص مشاوره",
    fields: [
      { id: "counseling_fields", label: "رشته‌های تحت مشاوره", type: "checkbox-group", options: ["انسانی", "ریاضی", "تجربی"] },
      { id: "consultation_type", label: "نوع مشاوره", type: "select", options: [{ value: "individual", label: "فردی" }, { value: "group", label: "گروهی" }, { value: "both", label: "هردو" }] },
      { id: "experience_years", label: "سابقه مشاوره (سال)", type: "number" },
      { id: "education", label: "تحصیلات", type: "text", optional: true },
    ],
  },
  {
    k: "bio",
    label: "بیوگرافی و مهارت‌ها",
    fields: [
      { id: "skills", label: "مهارت‌ها", type: "textarea", optional: true },
      { id: "bio", label: "بیوگرافی", type: "textarea", optional: true },
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
    setValues({ ...profile });
  }, [profile]);

  const save = async () => {
    setSaving(true);
    try {
      const payload = { ...values };
      delete payload.email;
      delete payload.id;
      delete payload.is_active;
      delete payload.profile_image;
      await updateMyConsultantAccount(payload);
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
      <div className="sub">این اطلاعات به دانش‌آموزهات نمایش داده می‌شه.</div>
      <div className="avatar-row">
        <div className="avatar-big">{(displayName || "م")[0]}</div>
        <div className="avatar-hint">پروفایل به بقیه نمایش داده میشود</div>
      </div>
      <div className="field-row2">
        <div className="field"><label>ایمیل</label><input className="input" value={profile?.email || ""} disabled /></div>
        <div className="field"><label>وضعیت حساب</label><input className="input" value={profile?.is_active ? "فعال" : "در انتظار تایید ادمین"} disabled /></div>
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
      await updateMyConsultantAccount({ consultant_password: newPassword });
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

export default function ConsultantSettings() {
  const { logout } = useAuth();
  const [tab, setTab] = useState("profile");

  return (
    <>
      <div className="panel-head fade-in"><h2><Icon name="settings" /> تنظیمات حساب</h2><p>اطلاعات و امنیت حسابت رو مدیریت کن — مشاور</p></div>
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
