import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import Icon from "../../components/Icon";
import Modal from "../../components/Modal";
import Pagination from "../../components/Pagination";
import { useToast } from "../../context/ToastContext";
import { fetchAllPeople, fetchUnpaidStudents, deleteAdminUser } from "../../api/admin";
import { startConversationAsAdmin } from "../../api/chat";
import { toFa } from "../../utils/toFa";

const FILTERS = [
  { key: "all", label: "همه" },
  { key: "noreport", label: "بدون گزارش" },
  { key: "noanalysis", label: "بدون تحلیل" },
  { key: "unpaid", label: "پرداخت‌نشده" },
  { key: "newusers", label: "کاربران عادی" },
];
const PER_PAGE = 4;

export default function AdminStudents() {
  const navigate = useNavigate();
  const toast = useToast();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [people, setPeople] = useState([]);
  const [unpaidIds, setUnpaidIds] = useState(new Set());
  const [search, setSearch] = useState("");
  const [filter, setFilter] = useState("all");
  const [page, setPage] = useState(1);

  const [deleteTarget, setDeleteTarget] = useState(null);
  const [startingChatId, setStartingChatId] = useState(null);

  const load = () => {
    setLoading(true);
    Promise.all([fetchAllPeople(), fetchUnpaidStudents()])
      .then(([list, unpaid]) => {
        setPeople(list);
        setUnpaidIds(new Set(unpaid.map((p) => p.user_id)));
      })
      .catch((err) => setError(err?.response?.data?.message || "دریافت لیست کاربران با خطا مواجه شد."))
      .finally(() => setLoading(false));
  };

  useEffect(load, []);

  const newUsersCount = people.filter((p) => p.role === "user").length;

  const filtered = people.filter((s) => {
    const fullName = `${s.name} ${s.lastname}`;
    if (search && !fullName.includes(search)) return false;
    if (filter === "noreport") return s.role === "student" && !s.reported_today;
    if (filter === "noanalysis") return s.role === "student" && s.analyzed_latest_exam === false;
    if (filter === "unpaid") return unpaidIds.has(s.id);
    if (filter === "newusers") return s.role === "user";
    return true;
  });
  const totalPages = Math.max(1, Math.ceil(filtered.length / PER_PAGE));
  const pageItems = filtered.slice((page - 1) * PER_PAGE, page * PER_PAGE);

  const handleChat = async (e, personId) => {
    e.stopPropagation();
    setStartingChatId(personId);
    try {
      const conv = await startConversationAsAdmin("user", personId);
      navigate(`/panel/chat/${conv.id}`);
    } catch (err) {
      toast(err?.response?.data?.message || "شروع گفتگو با خطا مواجه شد", "error");
    } finally {
      setStartingChatId(null);
    }
  };

  const handleDelete = async () => {
    try {
      await deleteAdminUser(deleteTarget.id);
      toast("کاربر حذف شد");
      load();
    } catch (err) {
      toast(err?.response?.data?.message || "حذف با خطا مواجه شد", "error");
    } finally {
      setDeleteTarget(null);
    }
  };

  return (
    <>
      <div className="panel-head fade-in"><h2><Icon name="users" /> کاربران</h2><p>فهرست دانش‌آموزها و کاربران عادی سایت؛ تخصیص به مشاور و وضعیت گزارش/تحلیل/پرداخت هرکدوم</p></div>
      <div className="wrap panel-wrap" style={{ paddingBottom: 48 }}>
        <div className="glass search-box fade-in" style={{ margin: "0 0 12px" }}>
          <Icon name="search" />
          <input value={search} placeholder="جستجوی نام کاربر..." onChange={(e) => { setSearch(e.target.value); setPage(1); }} />
        </div>
        <div className="quick-chip-row" style={{ padding: "0 0 6px" }}>
          {FILTERS.map((f) => (
            <button key={f.key} className={`qchip ${filter === f.key ? "active" : ""} ${f.key === "newusers" ? "chip-accent" : ""}`} onClick={() => { setFilter(f.key); setPage(1); }}>
              {f.label}{f.key === "newusers" && <span className="chip-count">{toFa(newUsersCount)}</span>}
            </button>
          ))}
        </div>

        {loading && <div className="empty-state">در حال بارگذاری...</div>}
        {!loading && error && <div className="empty-state">{error}</div>}
        {!loading && !error && (
          <>
            <div className="result-bar">{toFa(filtered.length)} کاربر پیدا شد</div>
            {pageItems.length ? pageItems.map((s) => (
              <div
                key={s.id}
                className="glass stu-card pp-card fade-in"
                onClick={() => navigate(s.role === "student" ? `/panel/students/${s.id}` : `/panel/users/${s.id}`)}
              >
                <div className="avatar">{s.name?.[0]}</div>
                <div className="pp-info">
                  <h3>{s.name} {s.lastname}</h3>
                  <p>{s.city}{s.degree ? " · " + s.degree : ""}</p>
                  {s.consultant && <p>مشاور: {s.consultant.name} {s.consultant.lastname}</p>}
                  {s.role === "user" && <div className="stu-badges"><span className="badge badge-violet">کاربر عادی</span></div>}
                </div>
                <div className="pp-actions" onClick={(e) => e.stopPropagation()}>
                  <button
                    className="icon-btn"
                    title="چت"
                    disabled={startingChatId === s.id}
                    onClick={(e) => handleChat(e, s.id)}
                  >
                    <Icon name="chat" />
                  </button>
                  <button className="icon-btn" title="حذف کاربر" style={{ color: "var(--coral)" }} onClick={() => setDeleteTarget(s)}><Icon name="trashBin" /></button>
                </div>
                <Icon name="chev" className="pp-chev" />
              </div>
            )) : <div className="empty-state">کاربری با این فیلتر پیدا نشد.</div>}
            <Pagination page={page} totalPages={totalPages} totalItems={filtered.length} itemWord="کاربر" onChange={setPage} />
          </>
        )}
      </div>

      <Modal
        open={!!deleteTarget}
        onClose={() => setDeleteTarget(null)}
        title="حذف کاربر"
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
            <p className="center">آیا از حذف <b>{deleteTarget.name} {deleteTarget.lastname}</b> مطمئنی؟<br />این عملیات غیرقابل بازگشته و تمام اطلاعات مرتبط حذف می‌شن.</p>
          </>
        )}
      </Modal>
    </>
  );
}
