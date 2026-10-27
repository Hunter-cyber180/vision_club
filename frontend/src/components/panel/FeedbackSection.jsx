import { useState } from "react";
import Icon from "../Icon";
import { useAuth } from "../../context/AuthContext";
import { useToast } from "../../context/ToastContext";
import { createFeedback, updateFeedback, deleteFeedback } from "../../api/feedback";
import { toFa } from "../../utils/toFa";

const MAX_LEN = 3000;

// بخش بازخورد زیر هر گزارش کار / تحلیل آزمون.
//  - دانش‌آموز: فقط می‌بینه (canWrite=false)
//  - مشاور/ادمین: می‌تونن بازخورد بنویسن، و نویسنده‌ی هر بازخورد می‌تونه ویرایش/حذفش کنه (ادمین هر بازخوردی رو می‌تونه حذف کنه)
// props: targetType ("daily_report" | "analysis_exam"), targetId, initial (آرایه‌ی feedbacks از بک‌اند), canWrite
export default function FeedbackSection({ targetType, targetId, initial = [], canWrite = false, onCountChange }) {
  const { role, profile } = useAuth();
  const toast = useToast();
  const [items, setItems] = useState(initial);
  const [text, setText] = useState("");
  const [saving, setSaving] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [editText, setEditText] = useState("");

  const update = (next) => {
    setItems(next);
    onCountChange?.(next.length);
  };

  const isAuthor = (f) => f.author_role === role && f.author_id === profile?.id;

  const submit = async () => {
    if (!text.trim()) return;
    setSaving(true);
    try {
      const created = await createFeedback(targetType, targetId, text.trim());
      update([...items, created]);
      setText("");
      toast("بازخورد ثبت شد");
    } catch (err) {
      toast(err?.response?.data?.message || "ثبت بازخورد با خطا مواجه شد", "error");
    } finally {
      setSaving(false);
    }
  };

  const saveEdit = async (id) => {
    if (!editText.trim()) return;
    setSaving(true);
    try {
      const updated = await updateFeedback(id, editText.trim());
      update(items.map((f) => (f.id === id ? { ...f, ...updated } : f)));
      setEditingId(null);
      toast("بازخورد ویرایش شد");
    } catch (err) {
      toast(err?.response?.data?.message || "ویرایش بازخورد با خطا مواجه شد", "error");
    } finally {
      setSaving(false);
    }
  };

  const remove = async (id) => {
    if (!window.confirm("این بازخورد حذف بشه؟")) return;
    try {
      await deleteFeedback(id);
      update(items.filter((f) => f.id !== id));
      toast("بازخورد حذف شد");
    } catch (err) {
      toast(err?.response?.data?.message || "حذف بازخورد با خطا مواجه شد", "error");
    }
  };

  // دانش‌آموز وقتی بازخوردی نیست چیزی نمی‌بینه
  if (!canWrite && !items.length) return null;

  return (
    <div className="fb-section" onClick={(e) => e.stopPropagation()}>
      <div className="fb-title"><Icon name="chat" /> بازخورد مشاور</div>

      {items.map((f) => (
        <div className="fb-item" key={f.id}>
          <div className="fb-meta">
            <b>{f.author_name}</b>
            <span className={`badge ${f.author_role === "admin" ? "badge-violet" : "badge-teal"}`}>{f.author_role === "admin" ? "ادمین" : "مشاور"}</span>
            <span className="fb-date">{new Date(f.created_at).toLocaleDateString("fa-IR")}</span>
            {f.updated_at && f.updated_at !== f.created_at && <span className="fb-date">(ویرایش‌شده)</span>}
            {canWrite && (isAuthor(f) || role === "admin") && editingId !== f.id && (
              <span className="fb-actions">
                {isAuthor(f) && <button className="icon-btn" title="ویرایش" onClick={() => { setEditingId(f.id); setEditText(f.text); }}><Icon name="edit" /></button>}
                <button className="icon-btn" title="حذف" style={{ color: "var(--coral)" }} onClick={() => remove(f.id)}><Icon name="trashBin" /></button>
              </span>
            )}
          </div>
          {editingId === f.id ? (
            <>
              <textarea className="input" rows={3} maxLength={MAX_LEN} value={editText} onChange={(e) => setEditText(e.target.value)} />
              <div className="fb-form-actions">
                <button className="btn btn-ghost" onClick={() => setEditingId(null)}>انصراف</button>
                <button className="btn btn-gold" disabled={saving || !editText.trim()} onClick={() => saveEdit(f.id)}><Icon name="check" /> ذخیره</button>
              </div>
            </>
          ) : (
            <p className="fb-text">{f.text}</p>
          )}
        </div>
      ))}

      {canWrite && (
        <div className="fb-form">
          <textarea
            className="input"
            rows={3}
            maxLength={MAX_LEN}
            value={text}
            placeholder="نظر یا راهنمایی‌ت رو درباره‌ی این مورد بنویس..."
            onChange={(e) => setText(e.target.value)}
          />
          <div className="fb-form-actions">
            <span className="fb-count">{toFa(text.length)} / {toFa(MAX_LEN)}</span>
            <button className="btn btn-gold" disabled={saving || !text.trim()} onClick={submit}>
              <Icon name="send" /> {saving ? "در حال ارسال..." : "ثبت بازخورد"}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
