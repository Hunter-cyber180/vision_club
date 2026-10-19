import { useEffect, useState } from "react";
import Icon from "../Icon";
import { toFa } from "../../utils/toFa";
import { GRADE_LABELS, MAJOR_LABELS, LESSON_LABELS } from "../../constants/courseEnums";
import { fetchCourseNotes } from "../../api/courseNotes";

const APPROVAL_BADGE = {
  pending: { cls: "badge-gold", label: "در حال بررسی" },
  rejected: { cls: "badge-coral", label: "رد شده" },
  approved: { cls: "badge-teal", label: "تایید شده" },
};

// c: رکورد واقعی Course از بکند (به همراه include lessons)
export default function CourseManageCard({ c, onEditCourse, onDeleteCourse, onAddEpisode, onEditEpisode, onDeleteEpisode, onAddNote, onDeleteNote, onApprove, onReject, showConsultant }) {
  const [open, setOpen] = useState(false);
  const [notes, setNotes] = useState(null); // null = هنوز لود نشده

  useEffect(() => {
    if (open && notes === null) {
      fetchCourseNotes(c.id).then(setNotes).catch(() => setNotes([]));
    }
  }, [open, notes, c.id]);

  const badge = APPROVAL_BADGE[c.approval_status] || APPROVAL_BADGE.pending;
  const lessons = c.lessons || [];

  return (
    <div className={`course-card ${open ? "open" : ""}`} data-course={c.id}>
      <div className="course-head cm-head" onClick={() => setOpen((v) => !v)}>
        <div className="cm-top">
          <div className="ent-ico cm-ico"><Icon name="book" /></div>
          <b className="cm-title">{c.title}</b>
          <div className="course-toggle cm-toggle"><Icon name="chevDown" /></div>
        </div>
        <div className="cm-badges">
          <span className="tag">{LESSON_LABELS[c.course_lesson_name] || c.course_lesson_name}</span>
          <span className={`badge ${badge.cls}`}>{badge.label}</span>
        </div>
        <div className="cm-meta">
          <span>{GRADE_LABELS[c.grade] || c.grade} {MAJOR_LABELS[c.major] || c.major}</span>
          <span>{toFa(lessons.length)} اپیزود</span>
          <span>{toFa(notes ? notes.length : c.notesCount || 0)} جزوه</span>
          {showConsultant && c.consultant && <span className="cm-wrap">مشاور: {c.consultant.name} {c.consultant.lastname}</span>}
        </div>
        <div className="cm-actions" onClick={(e) => e.stopPropagation()}>
          {onApprove && onReject && c.approval_status === "pending" && (
            <div className="cm-decide">
              <button className="btn btn-gold btn-sm" onClick={() => onApprove(c)}>تایید</button>
              <button className="btn btn-ghost btn-sm" onClick={() => onReject(c)}>رد</button>
            </div>
          )}
          <div className="cm-icons">
            <div className="act-btn" title="ویرایش کلاس" onClick={() => onEditCourse(c)}><Icon name="edit" /></div>
            <div className="act-btn danger" title="حذف کلاس" onClick={() => onDeleteCourse(c)}><Icon name="trashBin" /></div>
          </div>
        </div>
      </div>
      <div className="course-body"><div className="course-body-inner">
        <div className="course-sec">
          <div className="course-sec-head">
            <h4>اپیزودها</h4>
            <div className="add-inline-btn" onClick={(e) => { e.stopPropagation(); onAddEpisode(c); }}><Icon name="plus" /> افزودن اپیزود</div>
          </div>
          {lessons.length ? lessons.map((ep, idx) => (
            <div className="ep-row" key={ep.id}>
              <div className="ep-num">{toFa(idx + 1)}</div>
              <div className="ep-main"><b>{ep.title}</b><div className="meta">{ep.duration_seconds ? `${toFa(Math.round(ep.duration_seconds / 60))} دقیقه` : "—"}{ep.video_url ? " · ویدیو موجود" : " · بدون ویدیو"}</div></div>
              <div className="row-actions-sm">
                <div className="act-btn-sm" title="ویرایش اپیزود" onClick={() => onEditEpisode(c, ep)}><Icon name="edit" /></div>
                <div className="act-btn-sm danger" title="حذف اپیزود" onClick={() => onDeleteEpisode(c, ep)}><Icon name="trashBin" /></div>
              </div>
            </div>
          )) : <div className="q-list-empty">اپیزودی اضافه نشده.</div>}
        </div>
        <div className="course-sec">
          <div className="course-sec-head">
            <h4>جزوات</h4>
            <div className="add-inline-btn" onClick={(e) => { e.stopPropagation(); onAddNote(c); }}><Icon name="plus" /> افزودن جزوه</div>
          </div>
          {notes === null ? (
            <div className="q-list-empty">در حال بارگذاری...</div>
          ) : notes.length ? notes.map((n) => (
            <div className="note-row" key={n.id}>
              <div className="ep-num"><Icon name="filePdf" /></div>
              <div className="note-main"><b>{n.title}</b><div className="meta">{new Date(n.created_at).toLocaleDateString("fa-IR")}</div></div>
              <div className="row-actions-sm">
                <div className="act-btn-sm danger" title="حذف جزوه" onClick={() => onDeleteNote(c, n, () => setNotes((ns) => ns.filter((x) => x.id !== n.id)))}><Icon name="trashBin" /></div>
              </div>
            </div>
          )) : <div className="q-list-empty">جزوه‌ای اضافه نشده.</div>}
        </div>
      </div></div>
    </div>
  );
}
