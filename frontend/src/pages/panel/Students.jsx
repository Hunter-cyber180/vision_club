import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import Icon from "../../components/Icon";
import Modal from "../../components/Modal";
import Pagination from "../../components/Pagination";
import AddStudentBox from "../../components/panel/AddStudentBox";
import { fetchMyStudents, fetchUnpaidTuitions, removeStudent } from "../../api/consultant";
import { startChatWithStudent } from "../../api/chat";
import { useToast } from "../../context/ToastContext";

const FILTERS = [
  { key: "all", label: "همه" },
  { key: "noreport", label: "بدون گزارش" },
  { key: "noanalysis", label: "بدون تحلیل" },
  { key: "unpaid", label: "پرداخت‌نشده" },
];
const PER_PAGE = 4;

export default function Students() {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [students, setStudents] = useState([]);
  const [unpaidIds, setUnpaidIds] = useState(new Set());
  const [search, setSearch] = useState("");
  const [filter, setFilter] = useState("all");
  const [page, setPage] = useState(1);
  const [startingChatId, setStartingChatId] = useState(null);
  const [removeTarget, setRemoveTarget] = useState(null);
  const [removing, setRemoving] = useState(false);
  const toast = useToast();

  const handleRemove = async () => {
    if (!removeTarget) return;
    setRemoving(true);
    try {
      await removeStudent(removeTarget.id);
      toast(`${removeTarget.name} ${removeTarget.lastname} از لیست شما حذف شد`);
      setRemoveTarget(null);
      load();
    } catch (err) {
      toast(err?.response?.data?.message || "حذف با خطا مواجه شد", "error");
    } finally {
      setRemoving(false);
    }
  };

  const handleChat = async (e, studentId) => {
    e.stopPropagation();
    setStartingChatId(studentId);
    try {
      const conv = await startChatWithStudent(studentId);
      navigate(`/panel/chat/${conv.id}`);
    } catch (err) {
      toast(err?.response?.data?.message || "شروع گفتگو با خطا مواجه شد", "error");
    } finally {
      setStartingChatId(null);
    }
  };

  const load = () => {
    setLoading(true);
    Promise.all([fetchMyStudents(), fetchUnpaidTuitions()])
      .then(([list, unpaid]) => {
        setStudents(list);
        setUnpaidIds(new Set(unpaid.map((p) => p.user_id)));
      })
      .catch((err) => setError(err?.response?.data?.message || "دریافت دانش‌آموزان با خطا مواجه شد."))
      .finally(() => setLoading(false));
  };

  useEffect(load, []);

  const filtered = students.filter((s) => {
    const fullName = `${s.name} ${s.lastname}`;
    if (search && !fullName.includes(search)) return false;
    if (filter === "noreport") return !s.reported_today;
    if (filter === "noanalysis") return s.analyzed_latest_exam === false;
    if (filter === "unpaid") return unpaidIds.has(s.id);
    return true;
  });
  const totalPages = Math.max(1, Math.ceil(filtered.length / PER_PAGE));
  const pageItems = filtered.slice((page - 1) * PER_PAGE, page * PER_PAGE);

  return (
    <>
      <div className="panel-head fade-in"><h2><Icon name="users" /> دانش‌آموزان</h2><p>فهرست دانش‌آموزهای تحت مشاوره؛ وضعیت گزارش، تحلیل و پرداخت هرکدوم رو اینجا می‌بینی</p></div>
      <div className="wrap panel-wrap">
        <AddStudentBox onAdded={load} />
        <div className="glass search-box fade-in" style={{ margin: "0 0 12px" }}>
          <Icon name="search" />
          <input value={search} placeholder="جستجوی نام دانش‌آموز..." onChange={(e) => { setSearch(e.target.value); setPage(1); }} />
        </div>
        <div className="quick-chip-row" style={{ padding: "0 0 6px" }}>
          {FILTERS.map((f) => (
            <button key={f.key} className={`qchip ${filter === f.key ? "active" : ""}`} onClick={() => { setFilter(f.key); setPage(1); }}>{f.label}</button>
          ))}
        </div>

        {loading && <div className="empty-state">در حال بارگذاری...</div>}
        {!loading && error && <div className="empty-state">{error}</div>}
        {!loading && !error && (
          <>
            <div className="result-bar">{filtered.length} دانش‌آموز پیدا شد</div>
            {pageItems.length ? pageItems.map((s) => (
              <div key={s.id} className="glass stu-card pp-card fade-in" onClick={() => navigate(`/panel/students/${s.id}`)}>
                <div className="avatar">{s.name?.[0]}</div>
                <div className="pp-info">
                  <h3>{s.name} {s.lastname}</h3>
                  <p>{s.city}{s.degree ? " · " + s.degree : ""}</p>
                </div>
                <div className="pp-actions">
                  <button
                    className="icon-btn"
                    title="چت"
                    disabled={startingChatId === s.id}
                    onClick={(e) => handleChat(e, s.id)}
                  >
                    <Icon name="chat" />
                  </button>
                  <button
                    className="icon-btn"
                    title="حذف از لیست"
                    style={{ color: "var(--coral)" }}
                    onClick={(e) => { e.stopPropagation(); setRemoveTarget(s); }}
                  >
                    <Icon name="trashBin" />
                  </button>
                </div>
                <Icon name="chev" className="pp-chev" />
              </div>
            )) : <div className="empty-state">دانش‌آموزی با این فیلتر پیدا نشد.</div>}
            <Pagination page={page} totalPages={totalPages} totalItems={filtered.length} itemWord="دانش‌آموز" onChange={setPage} />
          </>
        )}
      </div>

      <Modal
        open={!!removeTarget}
        onClose={() => setRemoveTarget(null)}
        title="حذف از لیست دانش‌آموزان"
        footer={
          <>
            <button className="btn btn-ghost" onClick={() => setRemoveTarget(null)}>انصراف</button>
            <button className="btn btn-danger" disabled={removing} onClick={handleRemove}>
              <Icon name="trashBin" /> {removing ? "در حال حذف..." : "بله، حذف کن"}
            </button>
          </>
        }
      >
        {removeTarget && (
          <p className="center">
            آیا از حذف <b>{removeTarget.name} {removeTarget.lastname}</b> از لیست دانش‌آموزهای خودت مطمئنی؟
            <br />
            این کار فقط ارتباط این دانش‌آموز با تو رو قطع می‌کنه و اون به یک «کاربر عادی» تبدیل می‌شه؛ خودش و اطلاعاتش
            (گزارش‌ها، تحلیل‌ها، دوره‌ها و...) از سایت پاک نمی‌شن.
          </p>
        )}
      </Modal>
    </>
  );
}
