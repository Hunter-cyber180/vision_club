import { useEffect, useState } from "react";
import Icon from "../../components/Icon";
import Modal from "../../components/Modal";
import Pagination from "../../components/Pagination";
import FileUploadPicker from "../../components/FileUploadPicker";
import CourseManageCard from "../../components/panel/CourseManageCard";
import { useToast } from "../../context/ToastContext";
import { fetchAllClasses, createCourse, updateCourse, deleteCourse, changeCourseApproval } from "../../api/courses";
import { createLesson, updateLesson, deleteLesson } from "../../api/lessons";
import { createCourseNote, deleteCourseNote } from "../../api/courseNotes";
import { fetchConsultants } from "../../api/admin";
import { GRADE_OPTIONS, MAJOR_OPTIONS, LESSON_OPTIONS } from "../../constants/courseEnums";
import { toFa } from "../../utils/toFa";

const STATUS_FILTERS = [
  { key: "all", label: "همه" },
  { key: "approved", label: "تایید شده" },
  { key: "pending", label: "در حال بررسی" },
  { key: "rejected", label: "رد شده" },
];
const PER_PAGE = 4;

function CourseForm({ initial, consultants, onSave, onCancel }) {
  const [title, setTitle] = useState(initial?.title || "");
  const [lessonName, setLessonName] = useState(initial?.course_lesson_name || LESSON_OPTIONS[0].value);
  const [price, setPrice] = useState(initial?.price || 0);
  const [grade, setGrade] = useState(initial?.grade || GRADE_OPTIONS[0].value);
  const [major, setMajor] = useState(initial?.major || MAJOR_OPTIONS[0].value);
  const [consultantId, setConsultantId] = useState(initial?.consultant_id || consultants[0]?.id || "");
  const [saving, setSaving] = useState(false);
  const toast = useToast();

  const submit = async () => {
    if (!title.trim()) { toast("لطفاً عنوان کلاس رو وارد کن", "error"); return; }
    if (!consultantId) { toast("لطفاً یک مشاور برای این کلاس انتخاب کن", "error"); return; }
    setSaving(true);
    try {
      await onSave({ title: title.trim(), course_lesson_name: lessonName, price: Number(price) || 0, grade, major, consultant_id: Number(consultantId) });
    } finally {
      setSaving(false);
    }
  };

  return (
    <>
      <div className="field"><label>عنوان کلاس</label><input type="text" className="input" placeholder="مثلاً کلاس فیزیک کنکور" value={title} onChange={(e) => setTitle(e.target.value)} /></div>
      <div className="field"><label>مشاور صاحب این کلاس</label>
        <select className="input" value={consultantId} onChange={(e) => setConsultantId(e.target.value)}>
          {consultants.map((c) => <option key={c.id} value={c.id}>{c.name} {c.lastname}</option>)}
        </select>
      </div>
      <div className="form-grid">
        <div className="field"><label>درس / موضوع</label>
          <select className="input" value={lessonName} onChange={(e) => setLessonName(e.target.value)}>
            {LESSON_OPTIONS.map((o) => <option key={o.value} value={o.value}>{o.label}</option>)}
          </select>
        </div>
        <div className="field"><label>قیمت (تومان) — ۰ برای رایگان</label><input type="number" min="0" className="input" placeholder="مثلاً ۱۵۰۰۰۰" value={price} onChange={(e) => setPrice(e.target.value)} /></div>
      </div>
      <div className="form-grid">
        <div className="field"><label>پایه تحصیلی</label>
          <select className="input" value={grade} onChange={(e) => setGrade(e.target.value)}>
            {GRADE_OPTIONS.map((o) => <option key={o.value} value={o.value}>{o.label}</option>)}
          </select>
        </div>
        <div className="field"><label>رشته</label>
          <select className="input" value={major} onChange={(e) => setMajor(e.target.value)}>
            {MAJOR_OPTIONS.map((o) => <option key={o.value} value={o.value}>{o.label}</option>)}
          </select>
        </div>
      </div>
      <div className="field-hint">کلاسی که ادمین می‌سازه مستقیم تایید‌شده ثبت می‌شه. اپیزودها و جزوات، بعد از ذخیره از داخل کارت کلاس اضافه می‌شن.</div>
      <div className="modal-foot" style={{ padding: 0, marginTop: 14 }}>
        <button className="btn btn-ghost" onClick={onCancel}>انصراف</button>
        <button className="btn btn-gold" disabled={saving} onClick={submit}><Icon name="check" /> {saving ? "در حال ذخیره..." : "ذخیره کلاس"}</button>
      </div>
    </>
  );
}

function EpisodeForm({ initial, onSave, onCancel }) {
  const [title, setTitle] = useState(initial?.title || "");
  const [duration, setDuration] = useState(initial ? Math.round((initial.duration_seconds || 0) / 60) : "");
  const [videoUrl, setVideoUrl] = useState(initial?.video_url || "");
  const [saving, setSaving] = useState(false);
  const toast = useToast();

  const submit = async () => {
    if (!title.trim()) { toast("لطفاً عنوان اپیزود رو وارد کن", "error"); return; }
    if (!videoUrl) { toast("لطفاً ویدیوی اپیزود رو آپلود کن", "error"); return; }
    setSaving(true);
    try {
      await onSave({ title: title.trim(), duration_seconds: Number(duration || 0) * 60, video_url: videoUrl });
    } finally {
      setSaving(false);
    }
  };

  return (
    <>
      <div className="field"><label>عنوان اپیزود</label><input type="text" className="input" placeholder="مثلاً جلسه ۱ - دینامیک" value={title} onChange={(e) => setTitle(e.target.value)} /></div>
      <div className="field"><label>مدت زمان (دقیقه)</label><input type="number" min="0" className="input" placeholder="مثلاً ۴۵" value={duration} onChange={(e) => setDuration(e.target.value)} /></div>
      <FileUploadPicker
        category="video"
        label="ویدیوی درس"
        hint="فرمت‌های مجاز: mp4، webm، mov، mkv — حداکثر ۵۰۰ مگابایت."
        accept="video/mp4,video/webm,video/quicktime,video/x-matroska"
        value={videoUrl}
        onChange={setVideoUrl}
      />
      <div className="modal-foot" style={{ padding: 0, marginTop: 14 }}>
        <button className="btn btn-ghost" onClick={onCancel}>انصراف</button>
        <button className="btn btn-gold" disabled={saving} onClick={submit}><Icon name="check" /> {saving ? "در حال ذخیره..." : "ذخیره اپیزود"}</button>
      </div>
    </>
  );
}

function NoteForm({ onSave, onCancel }) {
  const [title, setTitle] = useState("");
  const [fileUrl, setFileUrl] = useState("");
  const [saving, setSaving] = useState(false);
  const toast = useToast();

  const submit = async () => {
    if (!title.trim()) { toast("لطفاً عنوان جزوه رو وارد کن", "error"); return; }
    if (!fileUrl) { toast("لطفاً فایل جزوه رو آپلود کن", "error"); return; }
    setSaving(true);
    try {
      await onSave({ title: title.trim(), file_url: fileUrl });
    } finally {
      setSaving(false);
    }
  };

  return (
    <>
      <div className="field"><label>عنوان جزوه</label><input type="text" className="input" placeholder="مثلاً جزوه جمع‌بندی دینامیک" value={title} onChange={(e) => setTitle(e.target.value)} /></div>
      <FileUploadPicker
        category="document"
        label="فایل جزوه"
        hint="فرمت‌های مجاز: pdf، doc(x)، ppt(x)، xls(x) — حداکثر ۲۵ مگابایت."
        accept=".pdf,.doc,.docx,.ppt,.pptx,.xls,.xlsx"
        value={fileUrl}
        onChange={setFileUrl}
      />
      <div className="modal-foot" style={{ padding: 0, marginTop: 14 }}>
        <button className="btn btn-ghost" onClick={onCancel}>انصراف</button>
        <button className="btn btn-gold" disabled={saving} onClick={submit}><Icon name="check" /> {saving ? "در حال ذخیره..." : "ذخیره جزوه"}</button>
      </div>
    </>
  );
}

export default function AdminClasses() {
  const toast = useToast();

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [courses, setCourses] = useState([]);
  const [consultants, setConsultants] = useState([]);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [page, setPage] = useState(1);

  const [courseModal, setCourseModal] = useState(null);
  const [episodeModal, setEpisodeModal] = useState(null);
  const [noteModal, setNoteModal] = useState(null);
  const [deleteModal, setDeleteModal] = useState(null);

  const load = () => {
    setLoading(true);
    fetchAllClasses()
      .then(setCourses)
      .catch((err) => setError(err?.response?.data?.message || "دریافت کلاس‌ها با خطا مواجه شد."))
      .finally(() => setLoading(false));
  };

  useEffect(load, []);
  useEffect(() => { fetchConsultants().then(setConsultants); }, []);

  const filtered = courses.filter((c) => {
    if (search && !c.title.includes(search)) return false;
    if (statusFilter !== "all" && c.approval_status !== statusFilter) return false;
    return true;
  });
  const totalPages = Math.max(1, Math.ceil(filtered.length / PER_PAGE));
  const pageItems = filtered.slice((page - 1) * PER_PAGE, page * PER_PAGE);

  const saveCourse = async (payload) => {
    try {
      if (courseModal.editing) {
        await updateCourse(courseModal.editing.id, payload);
        toast("کلاس با موفقیت ویرایش شد");
      } else {
        await createCourse(payload);
        toast("کلاس جدید ذخیره شد");
      }
      setCourseModal(null);
      load();
    } catch (err) {
      toast(err?.response?.data?.message || "ذخیره کلاس با خطا مواجه شد", "error");
    }
  };

  const saveEpisode = async (payload) => {
    try {
      if (episodeModal.editing) {
        await updateLesson(episodeModal.editing.id, payload);
        toast("اپیزود ویرایش شد");
      } else {
        await createLesson({ ...payload, course_id: episodeModal.course.id, order_index: (episodeModal.course.lessons?.length || 0) + 1 });
        toast("اپیزود اضافه شد");
      }
      setEpisodeModal(null);
      load();
    } catch (err) {
      toast(err?.response?.data?.message || "ذخیره اپیزود با خطا مواجه شد", "error");
    }
  };

  const saveNote = async (payload) => {
    try {
      await createCourseNote(noteModal.course.id, payload);
      toast("جزوه اضافه شد");
      setNoteModal(null);
      load();
    } catch (err) {
      toast(err?.response?.data?.message || "ذخیره جزوه با خطا مواجه شد", "error");
    }
  };

  const confirmDelete = async () => {
    try {
      await deleteModal.run();
      toast(deleteModal.successMsg);
    } catch (err) {
      toast(err?.response?.data?.message || "حذف با خطا مواجه شد", "error");
    } finally {
      setDeleteModal(null);
    }
  };

  const handleApprove = async (c) => {
    try {
      await changeCourseApproval(c.id, "approved");
      toast("کلاس تایید شد");
      load();
    } catch (err) {
      toast(err?.response?.data?.message || "تایید کلاس با خطا مواجه شد", "error");
    }
  };

  const handleReject = async (c) => {
    try {
      await changeCourseApproval(c.id, "rejected");
      toast("کلاس رد شد");
      load();
    } catch (err) {
      toast(err?.response?.data?.message || "رد کردن کلاس با خطا مواجه شد", "error");
    }
  };

  return (
    <>
      <div className="panel-head fade-in"><h2><Icon name="book" /> کلاس‌ها و جزوات</h2><p>هر کلاس شامل چند اپیزوده که ممکنه فایل پیوست داشته باشه؛ جزوات هر درس هم کنار همون کلاس نگه‌داری می‌شه.</p></div>
      <div className="wrap panel-wrap" style={{ paddingBottom: 48 }}>
        <div className="tools-row" style={{ padding: "0 0 12px" }}>
          <div className="glass search-box" style={{ margin: 0 }}>
            <Icon name="search" />
            <input value={search} placeholder="جستجوی نام کلاس..." onChange={(e) => { setSearch(e.target.value); setPage(1); }} />
          </div>
          <button className="btn btn-gold" onClick={() => setCourseModal({ editing: null })}><Icon name="plus" /> افزودن کلاس جدید</button>
        </div>
        <div className="quick-chip-row" style={{ padding: "0 0 6px" }}>
          {STATUS_FILTERS.map((f) => (
            <button key={f.key} className={`qchip ${statusFilter === f.key ? "active" : ""}`} onClick={() => { setStatusFilter(f.key); setPage(1); }}>{f.label}</button>
          ))}
        </div>

        {loading && <div className="empty-state">در حال بارگذاری...</div>}
        {!loading && error && <div className="empty-state">{error}</div>}
        {!loading && !error && (
          <>
            <div className="result-bar">{toFa(filtered.length)} کلاس</div>
            {pageItems.length ? pageItems.map((c) => (
              <CourseManageCard
                key={c.id}
                c={c}
                showConsultant
                onApprove={handleApprove}
                onReject={handleReject}
                onEditCourse={(course) => setCourseModal({ editing: course })}
                onDeleteCourse={(course) => setDeleteModal({
                  type: "course", label: "این کلاس", successMsg: "کلاس حذف شد",
                  run: async () => { await deleteCourse(course.id); load(); },
                })}
                onAddEpisode={(course) => setEpisodeModal({ course, editing: null })}
                onEditEpisode={(course, ep) => setEpisodeModal({ course, editing: ep })}
                onDeleteEpisode={(course, ep) => setDeleteModal({
                  type: "episode", label: "این اپیزود", successMsg: "اپیزود حذف شد",
                  run: async () => { await deleteLesson(ep.id); load(); },
                })}
                onAddNote={(course) => setNoteModal({ course })}
                onDeleteNote={(course, note, onLocalRemove) => setDeleteModal({
                  type: "note", label: "این جزوه", successMsg: "جزوه حذف شد",
                  run: async () => { await deleteCourseNote(note.id); onLocalRemove(); },
                })}
              />
            )) : <div className="empty-state">کلاسی با این شرایط پیدا نشد.</div>}
            <Pagination page={page} totalPages={totalPages} totalItems={filtered.length} itemWord="کلاس" onChange={setPage} />
          </>
        )}
      </div>

      <Modal
        open={!!courseModal}
        onClose={() => setCourseModal(null)}
        title={courseModal?.editing ? "ویرایش کلاس" : "افزودن کلاس جدید"}
      >
        {courseModal && <CourseForm initial={courseModal.editing} consultants={consultants} onSave={saveCourse} onCancel={() => setCourseModal(null)} />}
      </Modal>

      <Modal
        open={!!episodeModal}
        onClose={() => setEpisodeModal(null)}
        title={episodeModal?.editing ? "ویرایش اپیزود" : "افزودن اپیزود"}
      >
        {episodeModal && <EpisodeForm initial={episodeModal.editing} onSave={saveEpisode} onCancel={() => setEpisodeModal(null)} />}
      </Modal>

      <Modal open={!!noteModal} onClose={() => setNoteModal(null)} title="افزودن جزوه">
        {noteModal && <NoteForm onSave={saveNote} onCancel={() => setNoteModal(null)} />}
      </Modal>

      <Modal
        open={!!deleteModal}
        onClose={() => setDeleteModal(null)}
        title="حذف مورد"
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
            <p className="center">آیا از حذف <b>{deleteModal.label}</b> مطمئنی؟<br />این عملیات غیرقابل بازگشته و تمام اطلاعات مرتبط حذف می‌شن.</p>
          </>
        )}
      </Modal>
    </>
  );
}
