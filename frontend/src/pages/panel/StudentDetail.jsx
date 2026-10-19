import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import Icon from "../../components/Icon";
import Tabs from "../../components/panel/Tabs";
import ReportCard from "../../components/panel/ReportCard";
import ExamAnalysisCard from "../../components/panel/ExamAnalysisCard";
import FileUploadPicker from "../../components/FileUploadPicker";
import Modal from "../../components/Modal";
import WeeklyCharts from "../../components/panel/WeeklyCharts";
import { useToast } from "../../context/ToastContext";
import { useAuth } from "../../context/AuthContext";
import { setUserRole } from "../../api/admin";
import {
  fetchStudentInfo, fetchStudentReports, fetchStudentAnalyses,
  fetchStudentPayments, fetchStudentSchedules, sendWeeklySchedule,
  setStudentTuitionAmount, changeTuitionStatus, fetchStudentWeeklyStats,
} from "../../api/consultant";
import { startChatWithStudent, startConversationAsAdmin } from "../../api/chat";
import { toFa, jalaliMonthName, formatToman } from "../../utils/toFa";

const TABS = [
  { k: "overview", label: "نمای کلی" },
  { k: "reports", label: "گزارش‌های کار" },
  { k: "analyses", label: "تحلیل آزمون‌ها" },
  { k: "identity", label: "اطلاعات هویتی" },
  { k: "payment", label: "اطلاعات پرداخت" },
  { k: "programs", label: "برنامه‌های ارسالی" },
];

function OverviewTab({ userId }) {
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState(null);
  useEffect(() => {
    let alive = true;
    setLoading(true);
    fetchStudentWeeklyStats(userId)
      .then((s) => { if (alive) setStats(s); })
      .finally(() => { if (alive) setLoading(false); });
    return () => { alive = false; };
  }, [userId]);
  return <WeeklyCharts stats={stats} loading={loading} />;
}

function ReportsTab({ userId }) {
  const [loading, setLoading] = useState(true);
  const [items, setItems] = useState([]);
  useEffect(() => { fetchStudentReports(userId).then(setItems).finally(() => setLoading(false)); }, [userId]);
  if (loading) return <div className="empty-state">در حال بارگذاری...</div>;
  return items.length ? items.map((r) => <ReportCard key={r.id} r={r} />) : <div className="empty-state">هنوز گزارش کاری ارسال نشده.</div>;
}

function AnalysesTab({ userId }) {
  const [loading, setLoading] = useState(true);
  const [items, setItems] = useState([]);
  useEffect(() => { fetchStudentAnalyses(userId).then(setItems).finally(() => setLoading(false)); }, [userId]);
  if (loading) return <div className="empty-state">در حال بارگذاری...</div>;
  return items.length ? items.map((a) => <ExamAnalysisCard key={a.id} a={a} />) : <div className="empty-state">هنوز تحلیل آزمونی ارسال نشده.</div>;
}

function IdentityTab({ student }) {
  const rows = [
    ["نام و نام‌خانوادگی", `${student.name} ${student.lastname}`],
    ["ایمیل", student.email || "—"],
    ["شماره موبایل", student.student_number || "—"],
    ["شماره تلفن پدر", student.father_number || "—"],
    ["شماره تلفن مادر", student.mother_number || "—"],
    ["آیدی تلگرام", student.telegram_id || "—"],
    ["شهر", student.city || "—"],
    ["پایه/مدرک تحصیلی", student.degree || "—"],
    ["پشت‌کنکوری", student.is_retaker ? "بله" : "خیر"],
    ["تعداد دفعات شرکت در کنکور", toFa(student.entrance_exam_attempts ?? 0)],
    ["رتبه کنکور قبلی", student.prev_national_rank != null ? toFa(student.prev_national_rank) : "—"],
    ["رشته مورد علاقه", student.preferred_major || "—"],
    ["دانشگاه‌های مورد نظر", student.preferred_universities || "—"],
    ["نگرانی/نکات خاص", student.notes || "—"],
    ["تاریخ عضویت", student.created_at ? new Date(student.created_at).toLocaleDateString("fa-IR") : "—"],
  ];
  return (
    <div className="gcard">
      <div className="gcard-head"><h3>اطلاعات هویتی دانش‌آموز</h3></div>
      <div className="info-grid">
        {rows.map(([label, val]) => (
          <div className="info-item" key={label}><span>{label}</span><b>{val}</b></div>
        ))}
      </div>
    </div>
  );
}

function TuitionAmountBox({ student, onUpdated }) {
  const toast = useToast();
  const [value, setValue] = useState(student.tuition_amount ?? "");
  const [saving, setSaving] = useState(false);
  const [togglingStatus, setTogglingStatus] = useState(false);
  const isPaid = student.current_tuition_status === "paid";

  async function handleSave() {
    if (value === "" || isNaN(value) || Number(value) < 0) {
      toast("مبلغ نامعتبر است", "error");
      return;
    }
    setSaving(true);
    try {
      const updated = await setStudentTuitionAmount(student.id, Number(value));
      // این endpoint فقط User رو برمی‌گردونه، پس وضعیت شهریه‌ی ماه جاری رو
      // از قبل حفظ می‌کنیم تا بج بالای صفحه ناگهان خالی/غلط نشه.
      onUpdated({ ...student, ...updated, current_tuition_status: student.current_tuition_status || "unpaid" });
      toast("مبلغ شهریه ثبت شد.");
    } catch (err) {
      toast(err?.response?.data?.message || "خطا در ثبت مبلغ شهریه", "error");
    } finally {
      setSaving(false);
    }
  }

  async function handleToggleStatus() {
    setTogglingStatus(true);
    try {
      const nextStatus = isPaid ? "unpaid" : "paid";
      const payment = await changeTuitionStatus(student.id, nextStatus, {
        amount: nextStatus === "paid" ? student.tuition_amount : undefined,
      });
      onUpdated({ ...student, current_tuition_status: payment.status, current_tuition_payment: payment });
      toast(nextStatus === "paid" ? "شهریه‌ی این ماه پرداخت‌شده ثبت شد." : "شهریه‌ی این ماه پرداخت‌نشده ثبت شد.");
    } catch (err) {
      toast(err?.response?.data?.message || "خطا در تغییر وضعیت شهریه", "error");
    } finally {
      setTogglingStatus(false);
    }
  }

  return (
    <div className="gcard" style={{ marginBottom: 16 }}>
      <div className="gcard-head">
        <h3>مبلغ شهریه‌ی ماهانه</h3>
        <span className="hint">این مبلغ همون چیزیه که دانش‌آموز از کیف پولش کسر می‌کنه</span>
      </div>
      <div style={{ display: "flex", gap: 10, alignItems: "center", flexWrap: "wrap", padding: "0 4px 12px" }}>
        <input
          type="number"
          min="0"
          className="input"
          style={{ maxWidth: 220 }}
          placeholder="مبلغ به تومان"
          value={value}
          onChange={(e) => setValue(e.target.value)}
        />
        <button className="btn btn-gold" disabled={saving} onClick={handleSave}>
          {saving ? "در حال ثبت..." : "ثبت مبلغ"}
        </button>
        {student.tuition_amount != null && (
          <span className="pill">آخرین مبلغ ثبت‌شده: {formatToman(student.tuition_amount)}</span>
        )}
      </div>
      <div style={{ display: "flex", gap: 10, alignItems: "center", flexWrap: "wrap", padding: "0 4px" }}>
        <span className={`badge ${isPaid ? "badge-teal" : "badge-coral"}`}>
          وضعیت این ماه: {isPaid ? "پرداخت‌شده" : "پرداخت‌نشده"}
        </span>
        <button className="btn btn-ghost btn-sm" disabled={togglingStatus} onClick={handleToggleStatus}>
          {togglingStatus ? "در حال ثبت..." : isPaid ? "علامت‌گذاری به‌عنوان پرداخت‌نشده" : "علامت‌گذاری به‌عنوان پرداخت‌شده"}
        </button>
      </div>
    </div>
  );
}

function PaymentTab({ userId, student, onStudentUpdated }) {
  const [loading, setLoading] = useState(true);
  const [items, setItems] = useState([]);
  useEffect(() => { fetchStudentPayments(userId).then(setItems).finally(() => setLoading(false)); }, [userId]);

  return (
    <>
      <TuitionAmountBox student={student} onUpdated={onStudentUpdated} />
      <div className="gcard">
      <div className="gcard-head"><h3>اطلاعات پرداختی</h3><span className="hint">تاریخچه شهریه</span></div>
      {loading ? (
        <p style={{ fontSize: 12.5, color: "var(--ink-dim)" }}>در حال بارگذاری...</p>
      ) : items.length ? (
        <div style={{ overflowX: "auto" }}>
          <table className="pay-table">
            <tbody>
              <tr><th>ماه</th><th>مبلغ</th><th>وضعیت</th><th>تاریخ پرداخت</th></tr>
              {items.map((p) => (
                <tr key={p.id}>
                  <td>{jalaliMonthName(p.jalali_month)} {toFa(p.jalali_year)}</td>
                  <td>{p.amount ? formatToman(p.amount) : "—"}</td>
                  <td><span className={`badge ${p.status === "paid" ? "badge-teal" : "badge-coral"}`}>{p.status === "paid" ? "پرداخت‌شده" : "پرداخت‌نشده"}</span></td>
                  <td>{p.paid_at ? new Date(p.paid_at).toLocaleDateString("fa-IR") : "—"}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ) : <div className="empty-state">هنوز رکورد شهریه‌ای برای این دانش‌آموز ثبت نشده.</div>}
      </div>
    </>
  );
}

function ProgramsTab({ userId }) {
  const toast = useToast();
  const [loading, setLoading] = useState(true);
  const [items, setItems] = useState([]);
  const [title, setTitle] = useState("");
  const [date, setDate] = useState(new Date().toISOString().slice(0, 10));
  const [fileUrl, setFileUrl] = useState("");
  const [sending, setSending] = useState(false);

  const load = () => { setLoading(true); fetchStudentSchedules(userId).then(setItems).finally(() => setLoading(false)); };
  useEffect(load, [userId]); // eslint-disable-line react-hooks/exhaustive-deps

  const send = async () => {
    if (!title.trim() || !fileUrl) { toast("عنوان و فایل PDF رو مشخص کن", "error"); return; }
    setSending(true);
    try {
      await sendWeeklySchedule(userId, { title: title.trim(), date, file_url: fileUrl });
      toast("برنامه هفتگی برای دانش‌آموز ارسال شد");
      setTitle(""); setFileUrl("");
      load();
    } catch (err) {
      toast(err?.response?.data?.message || "ارسال برنامه هفتگی با خطا مواجه شد", "error");
    } finally {
      setSending(false);
    }
  };

  return (
    <>
      <div className="gcard">
        <div className="field"><label>عنوان برنامه</label><input className="input" placeholder="مثلاً برنامه هفته سوم مهر" value={title} onChange={(e) => setTitle(e.target.value)} /></div>
        <div className="field"><label>تاریخ</label><input type="date" className="input" value={date} onChange={(e) => setDate(e.target.value)} /></div>
        <FileUploadPicker category="document" label="فایل PDF برنامه" hint="فرمت مجاز: pdf — حداکثر ۲۵ مگابایت." accept=".pdf" value={fileUrl} onChange={setFileUrl} />
        <div className="settings-actions">
          <button className="btn btn-gold" disabled={sending} onClick={send}><Icon name="plus" /> {sending ? "در حال ارسال..." : "ارسال برنامه جدید"}</button>
        </div>
      </div>
      <div className="gcard">
        <div className="gcard-head"><h3>برنامه‌های ارسال‌شده</h3></div>
        {loading ? (
          <p style={{ fontSize: 12.5, color: "var(--ink-dim)" }}>در حال بارگذاری...</p>
        ) : items.length ? items.map((p) => (
          <div className="glass pdf-item fade-in" key={p.id}>
            <div className="pdf-ico"><Icon name="filePdf" /></div>
            <div className="pdf-body"><b>{p.title}</b><span>تاریخ ارسال: {new Date(p.date).toLocaleDateString("fa-IR")}</span></div>
            <a className="pdf-dl" href={p.file_url} download title="دانلود PDF"><Icon name="download" /></a>
          </div>
        )) : <div className="empty-state">هنوز برنامه‌ای ارسال نشده.</div>}
      </div>
    </>
  );
}

export default function StudentDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const toast = useToast();
  const [tab, setTab] = useState("overview");
  const [student, setStudent] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [startingChat, setStartingChat] = useState(false);
  const { panelRole } = useAuth();
  const isAdmin = panelRole === "admin";
  const [removeOpen, setRemoveOpen] = useState(false);
  const [removing, setRemoving] = useState(false);

  // فقط ادمین: قطع ارتباط دانش‌آموز با مشاور (تبدیل به «کاربر عادی»)
  const handleRemoveFromConsultant = async () => {
    setRemoving(true);
    try {
      await setUserRole(id, { role: "user" });
      toast("دانش‌آموز از لیست مشاور حذف شد");
      setRemoveOpen(false);
      navigate("/panel/students");
    } catch (err) {
      toast(err?.response?.data?.message || "حذف با خطا مواجه شد", "error");
    } finally {
      setRemoving(false);
    }
  };

  const handleChat = async () => {
    setStartingChat(true);
    try {
      const conv = isAdmin ? await startConversationAsAdmin("user", id) : await startChatWithStudent(id);
      navigate(`/panel/chat/${conv.id}`);
    } catch (err) {
      toast(err?.response?.data?.message || "شروع گفتگو با خطا مواجه شد", "error");
    } finally {
      setStartingChat(false);
    }
  };

  useEffect(() => {
    setLoading(true);
    fetchStudentInfo(id)
      .then(setStudent)
      .catch((err) => setError(err?.response?.data?.message || "دریافت اطلاعات دانش‌آموز با خطا مواجه شد."))
      .finally(() => setLoading(false));

    // وضعیت «گزارش/تحلیل ارسال‌شده» ممکنه در طول روز عوض بشه (دانش‌آموز هر
    // لحظه ممکنه گزارش بفرسته)؛ چون این صفحه معمولاً برای مدت طولانی باز
    // می‌مونه، هر نیم ساعت یک‌بار بی‌سروصدا دوباره چک می‌کنیم تا بج‌های
    // بالای صفحه خیلی قدیمی نمونن.
    const interval = setInterval(() => {
      fetchStudentInfo(id).then(setStudent).catch(() => {});
    }, 30 * 60 * 1000);
    return () => clearInterval(interval);
  }, [id]);

  if (loading) return <div className="wrap panel-wrap"><div className="empty-state">در حال بارگذاری...</div></div>;
  if (error || !student) return <div className="wrap panel-wrap"><div className="empty-state">{error || "دانش‌آموز پیدا نشد."}</div></div>;

  const displayName = `${student.name} ${student.lastname}`;

  return (
    <>
      <div className="detail-head fade-in">
        <button className="back-btn" onClick={() => navigate("/panel/students")}><Icon name="chev" /> بازگشت به فهرست دانش‌آموزان</button>
        <div className="glass dt-card">
          <div className="avatar">{student.name?.[0]}</div>
          <h3>{displayName}</h3>
          <p>{student.degree || "—"} · {student.city}</p>
          <div className="card-meta" style={{ justifyContent: "center", marginTop: 10, flexWrap: "wrap" }}>
            <span className={`badge ${student.reported_today ? "badge-teal" : "badge-coral"}`}>
              {student.reported_today ? "گزارش کار ارسالی" : "بدون گزارش کار"}
            </span>
            <span className={`badge ${student.analyzed_latest_exam ? "badge-teal" : "badge-coral"}`}>
              {student.analyzed_latest_exam ? "تحلیل آزمون ارسالی" : "بدون تحلیل آزمون"}
            </span>
          </div>
          <div className="dt-actions">
            <button className="btn btn-gold" disabled={startingChat} onClick={handleChat}>
              <Icon name="chat" /> {startingChat ? "در حال اتصال..." : "چت با دانش‌آموز"}
            </button>
            {isAdmin && (
              <button className="btn btn-ghost" style={{ color: "var(--coral)" }} onClick={() => setRemoveOpen(true)}>
                <Icon name="trashBin" /> حذف از لیست مشاور
              </button>
            )}
          </div>
        </div>
      </div>
      <Tabs tabs={TABS} active={tab} onChange={setTab} />
      <div className="wrap panel-wrap fade-in" style={{ paddingBottom: 48 }}>
        {tab === "overview" && <OverviewTab userId={id} />}
        {tab === "reports" && <ReportsTab userId={id} />}
        {tab === "analyses" && <AnalysesTab userId={id} />}
        {tab === "identity" && <IdentityTab student={student} />}
        {tab === "payment" && <PaymentTab userId={id} student={student} onStudentUpdated={setStudent} />}
        {tab === "programs" && <ProgramsTab userId={id} />}
      </div>

      <Modal
        open={removeOpen}
        onClose={() => setRemoveOpen(false)}
        title="حذف از لیست مشاور"
        footer={
          <>
            <button className="btn btn-ghost" onClick={() => setRemoveOpen(false)}>انصراف</button>
            <button className="btn btn-danger" disabled={removing} onClick={handleRemoveFromConsultant}>
              <Icon name="trashBin" /> {removing ? "در حال حذف..." : "بله، حذف کن"}
            </button>
          </>
        }
      >
        <p className="center">
          آیا از حذف <b>{displayName}</b> از لیست دانش‌آموزان مشاورش مطمئنی؟
          <br />
          این کار فقط ارتباطش با مشاور رو قطع می‌کنه و اون به یک «کاربر عادی» تبدیل می‌شه؛ اطلاعاتش از سایت پاک نمی‌شه.
        </p>
      </Modal>
    </>
  );
}
