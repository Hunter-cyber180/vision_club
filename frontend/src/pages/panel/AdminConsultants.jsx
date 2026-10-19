import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import Icon from "../../components/Icon";
import Modal from "../../components/Modal";
import { useToast } from "../../context/ToastContext";
import { fetchConsultants, createConsultant, deleteConsultant } from "../../api/admin";
import { toFa } from "../../utils/toFa";

const COUNSELING_FIELD_OPTIONS = ["انسانی", "ریاضی", "تجربی"];

function specialtyTags(arr) {
  return (arr || []).map((s) => <span className="tag" key={s}>{s}</span>);
}

function ConsultantForm({ onSave, onCancel }) {
  const toast = useToast();
  const [name, setName] = useState("");
  const [lastname, setLastname] = useState("");
  const [email, setEmail] = useState("");
  const [phoneNumber, setPhoneNumber] = useState("");
  const [password, setPassword] = useState("");
  const [education, setEducation] = useState("");
  const [consultationType, setConsultationType] = useState("individual");
  const [bio, setBio] = useState("");
  const [fields, setFields] = useState([]);
  const [saving, setSaving] = useState(false);

  const toggleField = (f) => setFields((arr) => (arr.includes(f) ? arr.filter((x) => x !== f) : [...arr, f]));

  const submit = async () => {
    if (!name.trim() || !lastname.trim()) { toast("لطفاً نام و نام‌خانوادگی رو وارد کن", "error"); return; }
    if (!email.trim()) { toast("لطفاً ایمیل رو وارد کن", "error"); return; }
    if (!phoneNumber.trim()) { toast("لطفاً شماره تلفن رو وارد کن", "error"); return; }
    if (!password || password.length < 8) { toast("رمز عبور باید حداقل ۸ کاراکتر باشد", "error"); return; }
    if (fields.length === 0) { toast("لطفاً حداقل یک رشته انتخاب کن", "error"); return; }
    setSaving(true);
    try {
      await onSave({
        name: name.trim(), lastname: lastname.trim(), email: email.trim(),
        phone_number: phoneNumber.trim(), consultant_password: password,
        education: education.trim(), consultation_type: consultationType,
        bio: bio.trim(), counseling_fields: fields,
      });
    } finally {
      setSaving(false);
    }
  };

  return (
    <>
      <div className="form-grid">
        <div className="field"><label>نام</label><input type="text" className="input" value={name} onChange={(e) => setName(e.target.value)} /></div>
        <div className="field"><label>نام‌خانوادگی</label><input type="text" className="input" value={lastname} onChange={(e) => setLastname(e.target.value)} /></div>
      </div>
      <div className="field"><label>ایمیل</label><input type="email" className="input" value={email} onChange={(e) => setEmail(e.target.value)} /></div>
      <div className="form-grid">
        <div className="field"><label>شماره تلفن</label><input type="text" className="input" value={phoneNumber} onChange={(e) => setPhoneNumber(e.target.value)} /></div>
        <div className="field"><label>رمز عبور</label><input type="password" className="input" value={password} onChange={(e) => setPassword(e.target.value)} /></div>
      </div>
      <div className="field"><label>تحصیلات</label><input type="text" className="input" value={education} onChange={(e) => setEducation(e.target.value)} /></div>
      <div className="field"><label>نوع مشاوره</label>
        <select className="input" value={consultationType} onChange={(e) => setConsultationType(e.target.value)}>
          <option value="individual">فردی</option>
          <option value="group">گروهی</option>
          <option value="both">فردی و گروهی</option>
        </select>
      </div>
      <div className="field">
        <label>رشته‌های تحت پوشش</label>
        <div className="chip-select-row">
          {COUNSELING_FIELD_OPTIONS.map((f) => (
            <button type="button" key={f} className={`chip-select ${fields.includes(f) ? "active" : ""}`} onClick={() => toggleField(f)}>{f}</button>
          ))}
        </div>
      </div>
      <div className="field"><label>بیوگرافی</label><textarea rows={3} className="input" value={bio} onChange={(e) => setBio(e.target.value)} /></div>
      <div className="modal-foot" style={{ padding: 0, marginTop: 14 }}>
        <button className="btn btn-ghost" onClick={onCancel}>انصراف</button>
        <button className="btn btn-gold" disabled={saving} onClick={submit}><Icon name="check" /> {saving ? "در حال ذخیره..." : "ذخیره مشاور"}</button>
      </div>
    </>
  );
}

const STATUS_FILTERS = [
  { key: "all", label: "همه" },
  { key: "active", label: "فعال" },
  { key: "inactive", label: "غیرفعال" },
];

export default function AdminConsultants() {
  const navigate = useNavigate();
  const toast = useToast();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [consultants, setConsultants] = useState([]);
  const [statusFilter, setStatusFilter] = useState("all");
  const [modalOpen, setModalOpen] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState(null);

  const load = () => {
    setLoading(true);
    fetchConsultants()
      .then(setConsultants)
      .catch((err) => setError(err?.response?.data?.message || "دریافت لیست مشاوران با خطا مواجه شد."))
      .finally(() => setLoading(false));
  };

  const filtered = consultants.filter((c) => {
    if (statusFilter === "active") return !!c.is_active;
    if (statusFilter === "inactive") return !c.is_active;
    return true;
  });

  useEffect(load, []);

  const saveConsultant = async (payload) => {
    try {
      await createConsultant(payload);
      toast("مشاور جدید اضافه شد");
      setModalOpen(false);
      load();
    } catch (err) {
      toast(err?.response?.data?.message || "ذخیره مشاور با خطا مواجه شد", "error");
    }
  };

  const handleDelete = async () => {
    try {
      await deleteConsultant(deleteTarget.id);
      toast("مشاور حذف شد");
      load();
    } catch (err) {
      toast(err?.response?.data?.message || "حذف مشاور با خطا مواجه شد", "error");
    } finally {
      setDeleteTarget(null);
    }
  };

  return (
    <>
      <div className="panel-head fade-in"><h2><Icon name="user" /> مشاوران مجموعه</h2><p>فهرست مشاوران فعال، رشته‌های تحت پوشش و تعداد دانش‌آموزان هرکدوم</p></div>
      <div className="wrap panel-wrap" style={{ paddingBottom: 48 }}>
        <div className="tools-row" style={{ padding: "0 0 12px" }}>
          <div className="result-bar" style={{ margin: 0 }}>{loading ? "..." : `${toFa(filtered.length)} مشاور`}</div>
          <button className="btn btn-gold" onClick={() => setModalOpen(true)}><Icon name="plus" /> افزودن مشاور جدید</button>
        </div>
        <div className="quick-chip-row" style={{ padding: "0 0 12px" }}>
          {STATUS_FILTERS.map((f) => (
            <button key={f.key} className={`qchip ${statusFilter === f.key ? "active" : ""}`} onClick={() => setStatusFilter(f.key)}>{f.label}</button>
          ))}
        </div>

        {loading && <div className="empty-state">در حال بارگذاری...</div>}
        {!loading && error && <div className="empty-state">{error}</div>}
        {!loading && !error && (
          filtered.length ? filtered.map((a) => (
            <div key={a.id} className="glass stu-card pp-card fade-in" onClick={() => navigate(`/panel/consultants/${a.id}`)}>
              <div className="avatar">{a.name?.[0]}</div>
              <div className="pp-info">
                <h3>{a.name} {a.lastname}</h3>
                <div className="stu-badges">
                  <span className={`badge ${a.is_active ? "badge-teal" : "badge-coral"}`}>{a.is_active ? "فعال" : "غیرفعال"}</span>
                  {specialtyTags(a.counseling_fields)}
                </div>
              </div>
              <div className="pp-actions" onClick={(e) => e.stopPropagation()}>
                <button className="icon-btn" title="حذف مشاور" style={{ color: "var(--coral)" }} onClick={() => setDeleteTarget(a)}><Icon name="trashBin" /></button>
              </div>
              <Icon name="chev" className="pp-chev" />
            </div>
          )) : <div className="empty-state">مشاوری با این فیلتر پیدا نشد.</div>
        )}
      </div>

      <Modal open={modalOpen} onClose={() => setModalOpen(false)} title="افزودن مشاور جدید">
        {modalOpen && <ConsultantForm onSave={saveConsultant} onCancel={() => setModalOpen(false)} />}
      </Modal>

      <Modal
        open={!!deleteTarget}
        onClose={() => setDeleteTarget(null)}
        title="حذف مشاور"
        footer={
          <>
            <button className="btn btn-ghost" onClick={() => setDeleteTarget(null)}>انصراف</button>
            <button className="btn btn-danger" onClick={handleDelete}><Icon name="trashBin" /> بله، حذف کن</button>
          </>
        }
      >
        {deleteTarget && (
          <>
            <div className="modal-warn-ico"><Icon name="alertTri" /></div>
            <p className="center">آیا از حذف <b>{deleteTarget.name} {deleteTarget.lastname}</b> مطمئنی؟<br />دانش‌آموزهای این مشاور بدون مشاور (کاربر عادی) می‌شن.</p>
          </>
        )}
      </Modal>
    </>
  );
}
