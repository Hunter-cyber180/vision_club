import { useState } from "react";
import Icon from "../../components/Icon";
import Tabs from "../../components/panel/Tabs";
import { useAuth } from "../../context/AuthContext";
import { useToast } from "../../context/ToastContext";
import { updateMyAdminAccount } from "../../api/admin";

const SETTINGS_TABS = [
  { k: "profile", label: "پروفایل" },
  { k: "security", label: "امنیت" },
];

function ProfileTab() {
  const { profile, refreshProfile } = useAuth();
  const toast = useToast();
  const [username, setUsername] = useState(profile?.username || "");
  const [saving, setSaving] = useState(false);

  const save = async () => {
    if (!username.trim()) { toast("نام کاربری نمی‌تواند خالی باشد", "error"); return; }
    setSaving(true);
    try {
      await updateMyAdminAccount({ username: username.trim() });
      await refreshProfile();
      toast("پروفایل با موفقیت به‌روزرسانی شد");
    } catch (err) {
      toast(err?.response?.data?.message || "به‌روزرسانی پروفایل با خطا مواجه شد", "error");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="settings-card">
      <h2><Icon name="user" /> اطلاعات پروفایل</h2>
      <div className="sub">اطلاعات حساب مدیریتی‌ات.</div>
      <div className="avatar-row">
        <div className="avatar-big">{(username || "م")[0]}</div>
        <div className="avatar-hint">پروفایل به بقیه نمایش داده میشود</div>
      </div>
      <div className="field"><label>ایمیل</label><input className="input" value={profile?.email || ""} disabled /></div>
      <div className="field"><label>نام کاربری</label><input className="input" value={username} onChange={(e) => setUsername(e.target.value)} /></div>
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
      await updateMyAdminAccount({ password: newPassword });
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

export default function AdminSettings() {
  const { logout } = useAuth();
  const [tab, setTab] = useState("profile");

  return (
    <>
      <div className="panel-head fade-in"><h2><Icon name="settings" /> تنظیمات حساب</h2><p>اطلاعات و امنیت حساب مدیریتی‌ات رو مدیریت کن</p></div>
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
