import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import Icon from "../../components/Icon";
import Modal from "../../components/Modal";
import Pagination from "../../components/Pagination";
import StatCard from "../../components/panel/StatCard";
import GCard from "../../components/panel/GCard";
import { useToast } from "../../context/ToastContext";
import { fetchConsultantById, fetchConsultantStudents, updateConsultant, deleteConsultant } from "../../api/admin";
import { toFa } from "../../utils/toFa";

const CONSULTATION_TYPE_LABELS = { individual: "فردی", group: "گروهی", both: "فردی و گروهی" };
const PER_PAGE = 4;

function EditConsultantForm({ consultant, onSave, onCancel }) {
  const toast = useToast();
  const [name, setName] = useState(consultant.name);
  const [lastname, setLastname] = useState(consultant.lastname);
  const [phoneNumber, setPhoneNumber] = useState(consultant.phone_number || "");
  const [education, setEducation] = useState(consultant.education || "");
  const [bio, setBio] = useState(consultant.bio || "");
  const [isActive, setIsActive] = useState(!!consultant.is_active);
  const [saving, setSaving] = useState(false);

  const submit = async () => {
    if (!name.trim() || !lastname.trim()) { toast("نام و نام‌خانوادگی نمی‌تواند خالی باشد", "error"); return; }
    setSaving(true);
    try {
      await onSave({ name: name.trim(), lastname: lastname.trim(), phone_number: phoneNumber.trim(), education: education.trim(), bio: bio.trim(), is_active: isActive });
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
      <div className="field"><label>شماره تلفن</label><input type="text" className="input" value={phoneNumber} onChange={(e) => setPhoneNumber(e.target.value)} /></div>
      <div className="field"><label>تحصیلات</label><input type="text" className="input" value={education} onChange={(e) => setEducation(e.target.value)} /></div>
      <div className="field"><label>بیوگرافی</label><textarea rows={3} className="input" value={bio} onChange={(e) => setBio(e.target.value)} /></div>
      <div className="toggle-row">
        <div className="toggle-txt"><b>فعال</b><span>مشاورهای غیرفعال نمی‌تونن وارد پنل خودشون بشن</span></div>
        <div className={`toggle ${isActive ? "on" : ""}`} onClick={() => setIsActive((v) => !v)}><i /></div>
      </div>
      <div className="modal-foot" style={{ padding: 0, marginTop: 14 }}>
        <button className="btn btn-ghost" onClick={onCancel}>انصراف</button>
        <button className="btn btn-gold" disabled={saving} onClick={submit}><Icon name="check" /> {saving ? "در حال ذخیره..." : "ذخیره"}</button>
      </div>
    </>
  );
}

export default function AdminConsultantDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const toast = useToast();

  const [consultant, setConsultant] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const [students, setStudents] = useState([]);
  const [studentsPagination, setStudentsPagination] = useState(null);
  const [studentsLoading, setStudentsLoading] = useState(true);
  const [page, setPage] = useState(1);

  const [editOpen, setEditOpen] = useState(false);
  const [deleteOpen, setDeleteOpen] = useState(false);
  const [toggling, setToggling] = useState(false);
  const [studentsReload, setStudentsReload] = useState(0);

  const loadConsultant = () => {
    setLoading(true);
    fetchConsultantById(id)
      .then(setConsultant)
      .catch((err) => setError(err?.response?.data?.message || "دریافت اطلاعات مشاور با خطا مواجه شد."))
      .finally(() => setLoading(false));
  };

  useEffect(loadConsultant, [id]);

  useEffect(() => {
    setStudentsLoading(true);
    fetchConsultantStudents(id, { page, limit: PER_PAGE })
      .then(({ students, pagination }) => {
        setStudents(students);
        setStudentsPagination(pagination);
      })
      .finally(() => setStudentsLoading(false));
  }, [id, page, studentsReload]);

  const saveEdit = async (payload) => {
    try {
      const updated = await updateConsultant(id, payload);
      setConsultant((c) => ({ ...c, ...updated }));
      toast("اطلاعات مشاور ویرایش شد");
      setEditOpen(false);
    } catch (err) {
      toast(err?.response?.data?.message || "ویرایش با خطا مواجه شد", "error");
    }
  };

  // غیرفعال‌شدن مشاور دانش‌آموزهاش رو به کاربر عادی تبدیل می‌کنه، پس تعداد و لیست دانش‌آموزها رو هم دوباره می‌گیریم
  const toggleActive = async () => {
    setToggling(true);
    try {
      const wasActive = !!consultant.is_active;
      await updateConsultant(id, { is_active: !wasActive });
      toast(wasActive
        ? "مشاور غیرفعال شد؛ دانش‌آموزهاش به کاربر عادی تبدیل شدن."
        : "مشاور فعال شد.");
      const fresh = await fetchConsultantById(id);
      setConsultant(fresh);
      setPage(1);
      setStudentsReload((n) => n + 1);
    } catch (err) {
      toast(err?.response?.data?.message || "تغییر وضعیت مشاور با خطا مواجه شد", "error");
    } finally {
      setToggling(false);
    }
  };

  const handleDelete = async () => {
    try {
      await deleteConsultant(id);
      toast("مشاور حذف شد");
      navigate("/panel/consultants");
    } catch (err) {
      toast(err?.response?.data?.message || "حذف با خطا مواجه شد", "error");
      setDeleteOpen(false);
    }
  };

  if (loading) return <div className="wrap panel-wrap"><div className="empty-state">در حال بارگذاری...</div></div>;
  if (error || !consultant) return <div className="wrap panel-wrap"><div className="empty-state">{error || "مشاور پیدا نشد."}</div></div>;

  return (
    <>
      <div className="detail-head fade-in">
        <button className="back-btn" onClick={() => navigate("/panel/consultants")}><Icon name="chev" /> بازگشت به فهرست مشاوران</button>
        <div className="glass dt-card">
          <div className="avatar">{consultant.name?.[0]}</div>
          <h3>{consultant.name} {consultant.lastname}</h3>
          <p>{consultant.education || "—"}</p>
          <div className="card-meta" style={{ justifyContent: "center", marginTop: 10 }}>
            {(consultant.counseling_fields || []).map((f) => <span className="tag" key={f}>{f}</span>)}
            <span className={`badge ${consultant.is_active ? "badge-teal" : "badge-coral"}`}>{consultant.is_active ? "فعال" : "غیرفعال"}</span>
          </div>
          <div className="dt-actions">
            <button
              className={`btn ${consultant.is_active ? "btn-ghost" : "btn-gold"}`}
              style={consultant.is_active ? { color: "var(--coral)" } : undefined}
              disabled={toggling}
              onClick={toggleActive}
            >
              {toggling ? "..." : consultant.is_active ? "غیرفعال کردن" : "فعال کردن"}
            </button>
            <button className="btn btn-ghost" onClick={() => setEditOpen(true)}><Icon name="edit" /> ویرایش</button>
            <button className="btn btn-ghost" style={{ color: "var(--coral)" }} onClick={() => setDeleteOpen(true)}><Icon name="trashBin" /> حذف مشاور</button>
          </div>
        </div>
      </div>

      <div className="wrap panel-wrap fade-in" style={{ paddingBottom: 48 }}>
        <div className="stat-row-cards">
          <StatCard icon="users" tint="blue" val={toFa(consultant.studentsCount ?? 0)} label="دانش‌آموز فعلی" />
          <StatCard icon="book" tint="gold" val={CONSULTATION_TYPE_LABELS[consultant.consultation_type] || "—"} label="نوع مشاوره" />
        </div>

        <GCard title="اطلاعات تماس">
          <div className="info-grid">
            <div className="info-item"><span>ایمیل</span><b>{consultant.email}</b></div>
            <div className="info-item"><span>شماره تلفن</span><b>{consultant.phone_number || "—"}</b></div>
            <div className="info-item"><span>تحصیلات</span><b>{consultant.education || "—"}</b></div>
            <div className="info-item"><span>رشته‌های تحت پوشش</span><b>{(consultant.counseling_fields || []).join("، ") || "—"}</b></div>
          </div>
        </GCard>

        <GCard title="بیوگرافی">
          <p style={{ fontSize: 13, color: "var(--ink-dim)", lineHeight: 1.9 }}>{consultant.bio || "بیوگرافی ثبت نشده."}</p>
        </GCard>

        <GCard title="دانش‌آموزان این مشاور" hint={studentsPagination ? `${toFa(studentsPagination.totalItems)} دانش‌آموز` : ""}>
          {studentsLoading ? (
            <p style={{ fontSize: 12.5, color: "var(--ink-dim)" }}>در حال بارگذاری...</p>
          ) : students.length ? students.map((s) => (
            <div className="pending-item" key={s.id} style={{ cursor: "pointer" }} onClick={() => navigate(`/panel/students/${s.id}`)}>
              <div className="avatar" style={{ width: 32, height: 32, fontSize: 12 }}>{s.name?.[0]}</div>
              <div className="txt"><b>{s.name} {s.lastname}</b></div>
              {!s.reported_today && <span className="badge badge-coral">بدون گزارش</span>}
              {s.unpaid && <span className="badge badge-coral">پرداخت‌نشده</span>}
            </div>
          )) : <p style={{ fontSize: 12.5, color: "var(--ink-dim)" }}>هنوز دانش‌آموزی به این مشاور تخصیص نیافته.</p>}
          {studentsPagination && (
            <Pagination page={studentsPagination.currentPage} totalPages={studentsPagination.totalPages} totalItems={studentsPagination.totalItems} itemWord="دانش‌آموز" onChange={setPage} />
          )}
        </GCard>
      </div>

      <Modal open={editOpen} onClose={() => setEditOpen(false)} title="ویرایش مشاور">
        {editOpen && <EditConsultantForm consultant={consultant} onSave={saveEdit} onCancel={() => setEditOpen(false)} />}
      </Modal>

      <Modal
        open={deleteOpen}
        onClose={() => setDeleteOpen(false)}
        title="حذف مشاور"
        footer={
          <>
            <button className="btn btn-ghost" onClick={() => setDeleteOpen(false)}>انصراف</button>
            <button className="btn btn-danger" onClick={handleDelete}><Icon name="trashBin" /> بله، حذف کن</button>
          </>
        }
      >
        <div className="modal-warn-ico"><Icon name="alertTri" /></div>
        <p className="center">آیا از حذف <b>{consultant.name} {consultant.lastname}</b> مطمئنی؟<br />دانش‌آموزهای این مشاور بدون مشاور (کاربر عادی) می‌شن.</p>
      </Modal>
    </>
  );
}
