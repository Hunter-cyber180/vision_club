import Icon from "./Icon";
import SvgThumb, { tintFor } from "./SvgThumb";
import { GRADE_LABELS, MAJOR_LABELS, LESSON_LABELS, STATUS_LABELS } from "../constants/courseEnums";
import { formatToman } from "../utils/toFa";

// c: رکورد واقعی دوره از بکند (models/course.js) به همراه include های lessons/consultant
export default function CourseCard({ c, onOpen }) {
  const ongoing = c.status === "in-progress";
  const free = !c.price || c.price === 0;
  const teacher = c.consultant ? [c.consultant.name, c.consultant.lastname].filter(Boolean).join(" ") : "بدون مدرس مشخص";
  const lessonsCount = Array.isArray(c.lessons) ? c.lessons.length : 0;

  return (
    <div className="vcard" onClick={() => onOpen?.(c)}>
      <div className="thumb">
        {c.thumbnail_url ? (
          <img src={c.thumbnail_url} alt={c.title} style={{ width: "100%", height: "100%", objectFit: "cover" }} />
        ) : (
          <SvgThumb tint={tintFor(c.major)} seed={"c" + c.id} />
        )}
        <div className="play"><Icon name="play" /></div>
      </div>
      <div className="vbody">
        <div className="vbadge-row">
          <span className="vbadge-outline">{STATUS_LABELS[c.status] || c.status}</span>
          <span className={`vbadge-fill ${free ? "free" : "paid"}`}>{free ? "رایگان" : "ویژه"}</span>
        </div>
        <h3 className="vtitle">{c.title}</h3>
        <div className="vdesc">
          {teacher} · پایه {GRADE_LABELS[c.grade] || c.grade} · {MAJOR_LABELS[c.major] || c.major}
        </div>
        <div className="vstats-row">
          <span className="vstat-chip"><Icon name="play" /> {lessonsCount} جلسه</span>
          <span className="vstat-chip"><Icon name="book" /> {LESSON_LABELS[c.course_lesson_name] || c.course_lesson_name}</span>
        </div>
        <div className="vcta-bar">
          <span className="watch">مشاهده دوره <Icon name="chev" /></span>
          <span className={`price-tag ${free ? "free" : "paid"}`}>{formatToman(c.price)}</span>
        </div>
      </div>
    </div>
  );
}
