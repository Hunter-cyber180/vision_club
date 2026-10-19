import { useEffect, useState } from "react";
import Icon from "../Icon";
import { useToast } from "../../context/ToastContext";
import { searchCandidates, addStudent } from "../../api/consultant";

export default function AddStudentBox({ onAdded }) {
  const toast = useToast();
  const [open, setOpen] = useState(false);
  const [q, setQ] = useState("");
  const [results, setResults] = useState([]);
  const [searching, setSearching] = useState(false);
  const [addingId, setAddingId] = useState(null);

  useEffect(() => {
    if (!open || q.trim().length < 2) { setResults([]); return; }
    let cancelled = false;
    setSearching(true);
    const t = setTimeout(() => {
      searchCandidates(q.trim())
        .then((data) => !cancelled && setResults(data))
        .finally(() => !cancelled && setSearching(false));
    }, 350);
    return () => { cancelled = true; clearTimeout(t); };
  }, [q, open]);

  const handleAdd = async (candidate) => {
    setAddingId(candidate.id);
    try {
      await addStudent(candidate.id);
      toast(`${candidate.name} ${candidate.lastname} به لیست دانش‌آموزانت اضافه شد`);
      setResults((r) => r.filter((c) => c.id !== candidate.id));
      onAdded?.();
    } catch (err) {
      toast(err?.response?.data?.message || "افزودن دانش‌آموز با خطا مواجه شد", "error");
    } finally {
      setAddingId(null);
    }
  };

  return (
    <div className="glass" style={{ padding: 14, marginBottom: 14 }}>
      <button className="btn btn-gold btn-sm" onClick={() => setOpen((v) => !v)}>
        <Icon name="plus" /> افزودن دانش‌آموز جدید
      </button>
      {open && (
        <div style={{ marginTop: 12 }}>
          <div className="glass search-box" style={{ margin: "0 0 8px" }}>
            <Icon name="search" />
            <input autoFocus value={q} placeholder="جستجوی نام، ایمیل یا شماره موبایل..." onChange={(e) => setQ(e.target.value)} />
          </div>
          {searching && <p style={{ fontSize: 12, color: "var(--ink-dim)" }}>در حال جستجو...</p>}
          {!searching && q.trim().length >= 2 && results.length === 0 && (
            <p style={{ fontSize: 12, color: "var(--ink-dim)" }}>کاربری با این مشخصات پیدا نشد (یا قبلاً مشاور دارد).</p>
          )}
          {results.map((c) => (
            <div key={c.id} className="pending-item">
              <div className="avatar" style={{ width: 32, height: 32, fontSize: 12 }}>{c.name?.[0]}</div>
              <div className="txt"><b>{c.name} {c.lastname}</b></div>
              <button className="btn btn-ghost btn-sm" disabled={addingId === c.id} onClick={() => handleAdd(c)}>
                {addingId === c.id ? "..." : "افزودن"}
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
