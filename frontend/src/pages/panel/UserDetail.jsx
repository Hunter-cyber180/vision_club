import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import Icon from "../../components/Icon";
import Modal from "../../components/Modal";
import AssignConsultantModal from "../../components/panel/AssignConsultantModal";
import { fetchStudentInfo } from "../../api/consultant";
import { fetchConsultants } from "../../api/admin";
import { useToast } from "../../context/ToastContext";
import { toFa } from "../../utils/toFa";

// جزئیات یک کاربر عادی (role=user) در پنل ادمین — برخلاف دانش‌آموز، کاربر
// عادی هیچ گزارش/تحلیل/پرداخت/برنامه‌ای نداره، پس فقط تب اطلاعات هویتی
// نشون داده می‌شه (endpoint اطلاعات هم دقیقاً همونیه که برای دانش‌آموزها
// استفاده می‌شه، چون هیچ فیلتری روی role نداره).
export default function UserDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const toast = useToast();
  const [consultants, setConsultants] = useState([]);
  const [assignOpen, setAssignOpen] = useState(false);
  const [loadingConsultants, setLoadingConsultants] = useState(false);

  // برای تخصیص فقط مشاورهای فعال قابل انتخابن — یه مشاور غیرفعال نباید دانش‌آموز جدید بگیره
  const openAssign = async () => {
    setLoadingConsultants(true);
    try {
      const list = await fetchConsultants({ is_active: "true" });
      if (!list.length) { toast("هنوز مشاور فعالی برای تخصیص وجود نداره", "error"); return; }
      setConsultants(list);
      setAssignOpen(true);
    } catch (err) {
      toast(err?.response?.data?.message || "دریافت لیست مشاورها با خطا مواجه شد", "error");
    } finally {
      setLoadingConsultants(false);
    }
  };

  useEffect(() => {
    setLoading(true);
    fetchStudentInfo(id)
      .then(setUser)
      .catch((err) => setError(err?.response?.data?.message || "دریافت اطلاعات کاربر با خطا مواجه شد."))
      .finally(() => setLoading(false));
  }, [id]);

  if (loading) return <div className="wrap panel-wrap"><div className="empty-state">در حال بارگذاری...</div></div>;
  if (error || !user) return <div className="wrap panel-wrap"><div className="empty-state">{error || "کاربر پیدا نشد."}</div></div>;

  const displayName = `${user.name} ${user.lastname}`;
  const rows = [
    ["نام و نام‌خانوادگی", displayName],
    ["ایمیل", user.email || "—"],
    ["شماره موبایل", user.student_number || "—"],
    ["شماره تلفن پدر", user.father_number || "—"],
    ["شماره تلفن مادر", user.mother_number || "—"],
    ["آیدی تلگرام", user.telegram_id || "—"],
    ["شهر", user.city || "—"],
    ["پایه/مدرک تحصیلی", user.degree || "—"],
    ["پشت‌کنکوری", user.is_retaker ? "بله" : "خیر"],
    ["تعداد دفعات شرکت در کنکور", toFa(user.entrance_exam_attempts ?? 0)],
    ["رتبه کنکور قبلی", user.prev_national_rank != null ? toFa(user.prev_national_rank) : "—"],
    ["رشته مورد علاقه", user.preferred_major || "—"],
    ["دانشگاه‌های مورد نظر", user.preferred_universities || "—"],
    ["تاریخ عضویت", user.created_at ? new Date(user.created_at).toLocaleDateString("fa-IR") : "—"],
  ];

  return (
    <>
      <div className="detail-head fade-in">
        <button className="back-btn" onClick={() => navigate("/panel/students")}><Icon name="chev" /> بازگشت به فهرست کاربران</button>
        <div className="glass dt-card">
          <div className="avatar">{user.name?.[0]}</div>
          <h3>{displayName}</h3>
          <p>کاربر عادی · {user.city || "—"}</p>
          <div className="dt-actions">
            <button className="btn btn-gold" disabled={loadingConsultants} onClick={openAssign}>
              <Icon name="users" /> {loadingConsultants ? "در حال بارگذاری..." : "تخصیص به مشاور"}
            </button>
          </div>
        </div>
      </div>
      <div className="wrap panel-wrap fade-in" style={{ paddingBottom: 48 }}>
        <div className="gcard">
          <div className="gcard-head"><h3>اطلاعات هویتی کاربر</h3></div>
          <div className="info-grid">
            {rows.map(([label, val]) => (
              <div className="info-item" key={label}><span>{label}</span><b>{val}</b></div>
            ))}
          </div>
        </div>
      </div>
      <Modal open={assignOpen} onClose={() => setAssignOpen(false)} title="تخصیص به مشاور">
        {assignOpen && (
          <AssignConsultantModal
            student={user}
            consultants={consultants}
            onClose={() => setAssignOpen(false)}
            onAssigned={() => { setAssignOpen(false); navigate(`/panel/students/${user.id ?? id}`, { replace: true }); }}
          />
        )}
      </Modal>
    </>
  );
}
