import { useEffect, useState } from "react";
import Icon from "../../components/Icon";
import Modal from "../../components/Modal";
import Pagination from "../../components/Pagination";
import FileUploadPicker from "../../components/FileUploadPicker";
import { useAuth } from "../../context/AuthContext";
import { useToast } from "../../context/ToastContext";
import { fetchWorkshops, createWorkshop, updateWorkshop, deleteWorkshop, changeWorkshopApproval } from "../../api/workshops";
import { fetchCategories, createCategory } from "../../api/categories";
import { toFa, formatToman } from "../../utils/toFa";

const PER_PAGE = 5;

// وضعیت تایید — دقیقاً مثل STATUS_FILTERS در AdminClasses.jsx برای کلاس‌ها
const APPROVAL_FILTERS = [
  { key: "all", label: "همه" },
  { key: "approved", label: "تایید شده" },
  { key: "pending", label: "در حال بررسی" },
  { key: "rejected", label: "رد شده" },
];

const ACTIVE_FILTERS = [
  { key: "all", label: "همه" },
  { key: "active", label: "فعال" },
  { key: "inactive", label: "غیرفعال" },
];

const APPROVAL_BADGE = {
  pending: { cls: "badge-gold", label: "در حال بررسی" },
  rejected: { cls: "badge-coral", label: "رد شده" },
  approved: { cls: "badge-teal", label: "تایید شده" },
};

function WorkshopForm({ initial, categories, onSave, onCancel, onCategoryAdded, showApprovalHint }) {
  const toast = useToast();
  const [title, setTitle] = useState(initial?.title || "");
  const [instructorName, setInstructorName] = useState(initial?.instructor_name || "");
  const [durationMinutes, setDurationMinutes] = useState(initial?.duration_minutes || "");
  const [categoryId, setCategoryId] = useState(initial?.category_id || categories[0]?.id || "");
  const [price, setPrice] = useState(initial?.price ?? 0);
  const [description, setDescription] = useState(initial?.description || "");
  const [videoUrl, setVideoUrl] = useState(initial?.video_url || "");
  const [videoThumbnail, setVideoThumbnail] = useState(initial?.video_thumbnail || "");
  const [isActive, setIsActive] = useState(initial?.is_active ?? true);
  const [saving, setSaving] = useState(false);

  const [showNewCat, setShowNewCat] = useState(false);
  const [newCatName, setNewCatName] = useState("");
  const [addingCat, setAddingCat] = useState(false);

  async function addCategory() {
    if (!newCatName.trim()) return;
    setAddingCat(true);
    try {
      const cat = await createCategory({ name: newCatName.trim() });
      onCategoryAdded(cat);
      setCategoryId(cat.id);
      setNewCatName("");
      setShowNewCat(false);
    } catch (err) {
      toast(err?.response?.data?.message || "افزودن دسته‌بندی با خطا مواجه شد", "error");
    } finally {
      setAddingCat(false);
    }
  }

  async function submit() {
    if (!title.trim()) { toast("لطفاً عنوان کارگاه رو وارد کن", "error"); return; }
    if (!instructorName.trim()) { toast("لطفاً نام مدرس رو وارد کن", "error"); return; }
    if (!durationMinutes || Number(durationMinutes) <= 0) { toast("لطفاً مدت زمان معتبر وارد کن", "error"); return; }
    if (!categoryId) { toast("لطفاً یک دسته‌بندی انتخاب کن", "error"); return; }
    if (!description.trim() || description.trim().length < 10) { toast("توضیحات باید حداقل ۱۰ کاراکتر باشد", "error"); return; }
    if (!videoUrl) { toast("لطفاً ویدیوی کارگاه رو آپلود کن", "error"); return; }

    setSaving(true);
    try {
      await onSave({
        title: title.trim(),
        instructor_name: instructorName.trim(),
        duration_minutes: Number(durationMinutes),
        category_id: Number(categoryId),
        price: Number(price) || 0,
        description: description.trim(),
        video_url: videoUrl,
        video_thumbnail: videoThumbnail || null,
        is_active: isActive,
      });
    } finally {
      setSaving(false);
    }
  }

  return (
    <>
      <div className="field"><label>عنوان کارگاه</label><input type="text" className="input" placeholder="مثلاً کارگاه برنامه‌ریزی کنکور" value={title} onChange={(e) => setTitle(e.target.value)} /></div>
      <div className="field"><label>مدرس / برگزارکننده</label><input type="text" className="input" placeholder="نام مدرس" value={instructorName} onChange={(e) => setInstructorName(e.target.value)} /></div>
      <div className="form-grid">
        <div className="field"><label>مدت زمان (دقیقه)</label><input type="number" className="input" placeholder="مثلاً ۴۵" min="1" value={durationMinutes} onChange={(e) => setDurationMinutes(e.target.value)} /></div>
        <div className="field"><label>قیمت (تومان) — ۰ برای رایگان</label><input type="number" min="0" className="input" placeholder="مثلاً ۴۵۰۰۰۰" value={price} onChange={(e) => setPrice(e.target.value)} /></div>
      </div>
      <div className="field">
        <label>دسته‌بندی</label>
        <div style={{ display: "flex", gap: 6, alignItems: "center" }}>
          <select className="input" style={{ flex: 1, minWidth: 0 }} value={categoryId} onChange={(e) => setCategoryId(e.target.value)}>
            {categories.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
          </select>
          <button type="button" className="btn btn-ghost btn-sm" style={{ flex: "0 0 auto" }} onClick={() => setShowNewCat((v) => !v)}><Icon name="plus" /></button>
        </div>
        {showNewCat && (
          <div style={{ display: "flex", gap: 6, marginTop: 8, minWidth: 0 }}>
            <input type="text" className="input" style={{ minWidth: 0 }} placeholder="نام دسته‌بندی جدید" value={newCatName} onChange={(e) => setNewCatName(e.target.value)} />
            <button type="button" className="btn btn-gold btn-sm" disabled={addingCat} onClick={addCategory}>افزودن</button>
          </div>
        )}
      </div>
      <div className="field"><label>توضیحات</label><textarea rows={3} className="input" placeholder="توضیح کوتاه درباره کارگاه..." value={description} onChange={(e) => setDescription(e.target.value)} /></div>
      <FileUploadPicker
        category="video"
        label="ویدیوی کارگاه"
        hint="فرمت‌های مجاز: mp4، webm، mov، mkv — حداکثر ۱ گیگابایت."
        accept="video/mp4,video/webm,video/quicktime,video/x-matroska"
        value={videoUrl}
        onChange={setVideoUrl}
      />
      <FileUploadPicker
        category="image"
        label="تصویر بندانگشتی (اختیاری)"
        accept="image/*"
        value={videoThumbnail}
        onChange={setVideoThumbnail}
      />
      <div className="toggle-row">
        <div className="toggle-txt"><b>فعال</b><span>کارگاه‌های غیرفعال در سایت عمومی نمایش داده نمی‌شن</span></div>
        <div className={`toggle ${isActive ? "on" : ""}`} onClick={() => setIsActive((v) => !v)}><i /></div>
      </div>
      {showApprovalHint && (
        <div className="field-hint">این کارگاه بعد از ذخیره برای بررسی و تایید برای ادمین ارسال می‌شه و تا اون موقع فقط برای خودت و پنل ادمین قابل مشاهده‌ست.</div>
      )}
      <div className="modal-foot ws-form-foot" style={{ padding: 0, marginTop: 14 }}>
        <button className="btn btn-ghost" onClick={onCancel}>انصراف</button>
        <button className="btn btn-gold" disabled={saving} onClick={submit}><Icon name="check" /> {saving ? "در حال ذخیره..." : "ذخیره کارگاه"}</button>
      </div>
    </>
  );
}

function WorkshopRow({ w, onEdit, onDelete, onApprove, onReject, showConsultant }) {
  const badge = APPROVAL_BADGE[w.approval_status] || APPROVAL_BADGE.pending;
  const canDecide = onApprove && onReject && w.approval_status === "pending";
  return (
    <div className="glass ws-card fade-in">
      <div className="ws-main">
        <div className="ent-ico" style={{ background: "color-mix(in srgb, var(--violet) 16%, transparent)", color: "var(--violet)" }}><Icon name="workshop" /></div>
        <div className="ws-info">
          <b className="ws-title">{w.title}</b>
          <div className="ws-meta">
            <span>{w.instructor_name || "—"}</span>
            <span>{toFa(w.duration_minutes)} دقیقه</span>
            {w.price ? <span>{formatToman(w.price)}</span> : null}
          </div>
          {showConsultant && w.consultant && (
            <div className="ws-meta"><span className="ws-wrap">مشاور: {w.consultant.name} {w.consultant.lastname}</span></div>
          )}
        </div>
      </div>
      <div className="ws-badges">
        <span className="tag">{w.category?.name || "—"}</span>
        <span className={`badge ${w.price ? "badge-gold" : "badge-teal"}`}>{w.price ? "ویژه" : "رایگان"}</span>
        <span className={`badge ${badge.cls}`}>{badge.label}</span>
        {!w.is_active && <span className="badge badge-coral">غیرفعال</span>}
      </div>
      <div className="ws-actions">
        {canDecide && (
          <div className="ws-decide">
            <button className="btn btn-gold btn-sm" onClick={() => onApprove(w)}>تایید</button>
            <button className="btn btn-ghost btn-sm" onClick={() => onReject(w)}>رد</button>
          </div>
        )}
        <div className="ws-icons">
          <div className="act-btn" title="ویرایش کارگاه" onClick={() => onEdit(w)}><Icon name="edit" /></div>
          <div className="act-btn danger" title="حذف کارگاه" onClick={() => onDelete(w)}><Icon name="trashBin" /></div>
        </div>
      </div>
    </div>
  );
}

export default function AdminWorkshops() {
  const { profile, panelRole } = useAuth();
  const isConsultant = panelRole === "consultant";
  const toast = useToast();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [workshops, setWorkshops] = useState([]);
  const [pagination, setPagination] = useState(null);
  const [categories, setCategories] = useState([]);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("all"); // فعال/غیرفعال
  const [approvalFilter, setApprovalFilter] = useState("all"); // تایید/بررسی/رد
  const [page, setPage] = useState(1);

  const [modal, setModal] = useState(null); // null | { editing }
  const [deleteModal, setDeleteModal] = useState(null);

  const isActiveParam = statusFilter === "active" ? "true" : statusFilter === "inactive" ? "false" : "all";

  const load = () => {
    // مشاور فقط کارگاه‌های خودش رو می‌بینه (با هر وضعیتی)؛ ادمین همه‌ی کارگاه‌ها رو
    if (isConsultant && !profile?.id) return;
    setLoading(true);
    fetchWorkshops({
      page, limit: PER_PAGE, search, is_active: isActiveParam, approval_status: approvalFilter, sort: "newest",
      ...(isConsultant ? { consultant_id: profile.id } : {}),
    })
      .then(({ workshops, pagination }) => {
        setWorkshops(workshops);
        setPagination(pagination);
      })
      .catch((err) => setError(err?.response?.data?.message || "دریافت کارگاه‌ها با خطا مواجه شد."))
      .finally(() => setLoading(false));
  };

  // با تغییر صفحه، عبارت جستجو یا فیلترهای وضعیت (با یه تاخیر کوچیک برای جستجو) دوباره از بکند می‌گیره
  useEffect(() => {
    const t = setTimeout(load, 300);
    return () => clearTimeout(t);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [page, search, statusFilter, approvalFilter, profile?.id]);

  useEffect(() => { fetchCategories().then(setCategories); }, []);

  const handleSearchChange = (value) => { setSearch(value); setPage(1); };
  const handleStatusChange = (key) => { setStatusFilter(key); setPage(1); };
  const handleApprovalChange = (key) => { setApprovalFilter(key); setPage(1); };

  const saveWorkshop = async (payload) => {
    try {
      if (modal.editing) {
        await updateWorkshop(modal.editing.id, payload);
        toast(isConsultant ? "کارگاه ویرایش شد و دوباره برای بررسی ادمین ارسال شد" : "کارگاه با موفقیت ویرایش شد");
      } else {
        await createWorkshop(payload);
        toast(isConsultant ? "کارگاه ثبت شد و برای بررسی و تایید برای ادمین ارسال شد" : "کارگاه جدید ذخیره شد");
      }
      setModal(null);
      load();
    } catch (err) {
      toast(err?.response?.data?.message || "ذخیره کارگاه با خطا مواجه شد", "error");
    }
  };

  const approveWorkshop = async (w) => {
    try {
      await changeWorkshopApproval(w.id, "approved");
      toast("کارگاه تایید شد");
      load();
    } catch (err) {
      toast(err?.response?.data?.message || "تایید کارگاه با خطا مواجه شد", "error");
    }
  };

  const rejectWorkshop = async (w) => {
    try {
      await changeWorkshopApproval(w.id, "rejected");
      toast("کارگاه رد شد");
      load();
    } catch (err) {
      toast(err?.response?.data?.message || "رد کارگاه با خطا مواجه شد", "error");
    }
  };

  const confirmDelete = async () => {
    try {
      await deleteWorkshop(deleteModal.id);
      toast("کارگاه حذف شد");
      load();
    } catch (err) {
      toast(err?.response?.data?.message || "حذف کارگاه با خطا مواجه شد", "error");
    } finally {
      setDeleteModal(null);
    }
  };

  return (
    <>
      <div className="panel-head fade-in">
        <h2><Icon name="workshop" /> {isConsultant ? "کارگاه‌های من" : "کارگاه‌های جامع مجموعه"}</h2>
        <p>{isConsultant ? "کارگاه‌های خودت؛ بعد از تایید ادمین بدون نیاز به ثبت‌نام مستقیم قابل مشاهده‌ست" : "مدیریت کارگاه‌های آموزشی؛ تایید/رد کارگاه‌های مشاوران، افزودن، ویرایش و حذف"}</p>
      </div>
      <div className="wrap panel-wrap" style={{ paddingBottom: 48 }}>
        <div className="tools-row" style={{ padding: "0 0 12px" }}>
          <div className="glass search-box" style={{ margin: 0 }}>
            <Icon name="search" />
            <input value={search} placeholder="جستجوی نام کارگاه..." onChange={(e) => handleSearchChange(e.target.value)} />
          </div>
          <button className="btn btn-gold" onClick={() => setModal({ editing: null })}><Icon name="plus" /> افزودن کارگاه جدید</button>
        </div>
        <div className="quick-chip-row" style={{ padding: "0 0 6px" }}>
          {APPROVAL_FILTERS.map((f) => (
            <button key={f.key} className={`qchip ${approvalFilter === f.key ? "active" : ""}`} onClick={() => handleApprovalChange(f.key)}>{f.label}</button>
          ))}
        </div>
        <div className="quick-chip-row" style={{ padding: "0 0 12px" }}>
          {ACTIVE_FILTERS.map((f) => (
            <button key={f.key} className={`qchip ${statusFilter === f.key ? "active" : ""}`} onClick={() => handleStatusChange(f.key)}>{f.label}</button>
          ))}
        </div>

        {loading && <div className="empty-state">در حال بارگذاری...</div>}
        {!loading && error && <div className="empty-state">{error}</div>}
        {!loading && !error && (
          <>
            <div className="result-bar">{toFa(pagination?.totalItems || 0)} کارگاه</div>
            {workshops.length ? workshops.map((w) => (
              <WorkshopRow
                key={w.id}
                w={w}
                onEdit={(w) => setModal({ editing: w })}
                onDelete={(w) => setDeleteModal(w)}
                showConsultant={!isConsultant}
                onApprove={!isConsultant ? approveWorkshop : null}
                onReject={!isConsultant ? rejectWorkshop : null}
              />
            )) : <div className="empty-state">کارگاهی با این شرایط پیدا نشد.</div>}
            {pagination && (
              <Pagination page={pagination.currentPage} totalPages={pagination.totalPages} totalItems={pagination.totalItems} itemWord="کارگاه" onChange={setPage} />
            )}
          </>
        )}
      </div>

      <Modal open={!!modal} onClose={() => setModal(null)} title={modal?.editing ? "ویرایش کارگاه" : "افزودن کارگاه جدید"}>
        {modal && (
          <WorkshopForm
            initial={modal.editing}
            categories={categories}
            onSave={saveWorkshop}
            onCancel={() => setModal(null)}
            onCategoryAdded={(cat) => setCategories((cs) => [...cs, cat])}
            showApprovalHint={isConsultant}
          />
        )}
      </Modal>

      <Modal
        open={!!deleteModal}
        onClose={() => setDeleteModal(null)}
        title="حذف کارگاه"
        footer={
          <>
            <button className="btn btn-ghost" onClick={() => setDeleteModal(null)}>انصراف</button>
            <button className="btn btn-danger" onClick={confirmDelete}><Icon name="trashBin" /> بله، حذف کن</button>
          </>
        }
      >
        {deleteModal && (
          <>
            <div className="modal-warn-ico"><Icon name="alertTri" /></div>
            <p className="center">آیا از حذف کارگاه <b>{deleteModal.title}</b> مطمئنی؟<br />این عملیات غیرقابل بازگشته.</p>
          </>
        )}
      </Modal>
    </>
  );
}
