import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import Icon from "../components/Icon";
import SvgThumb, { tintFor } from "../components/SvgThumb";
import { useAuth } from "../context/AuthContext";
import { useToast } from "../context/ToastContext";
import { fetchCourseById, purchaseCourse } from "../api/courses";
import { fetchCourseNotes } from "../api/courseNotes";
import { fetchMyCourses } from "../api/panel";
import { addToCart, fetchMyCart } from "../api/cart";
import { GRADE_LABELS, MAJOR_LABELS, LESSON_LABELS, STATUS_LABELS } from "../constants/courseEnums";
import { toFa, formatToman } from "../utils/toFa";

export default function CourseDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { isAuthenticated, role, panelRole, profile } = useAuth();
  const toast = useToast();

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [course, setCourse] = useState(null);
  const [notes, setNotes] = useState([]);
  const [activeIdx, setActiveIdx] = useState(0);
  const [enrolled, setEnrolled] = useState(false);
  const [busy, setBusy] = useState(false);
  const [inCart, setInCart] = useState(false);

  const isBuyerAccount = isAuthenticated && role === "user"; // user/student هر دو با اکانت "user" وارد می‌شن
  const isStudent = panelRole === "student";
  const isAdminAccount = role === "admin";

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    Promise.all([
      fetchCourseById(id),
      fetchCourseNotes(id).catch(() => []),
      isBuyerAccount && profile?.id ? fetchMyCourses(profile.id).catch(() => []) : Promise.resolve([]),
      isBuyerAccount ? fetchMyCart().catch(() => ({ items: [] })) : Promise.resolve({ items: [] }),
    ])
      .then(([c, n, myCourses, cart]) => {
        if (cancelled) return;
        setCourse(c);
        setNotes(n);
        setEnrolled(myCourses.some((uc) => uc.course_id === Number(id) || uc.course?.id === Number(id)));
        // اگه از قبل توی سبد خریده (مثلاً یه بار قبلاً اضافه کرده و برگشته این صفحه)،
        // دکمه باید همون لحظه‌ی اول هم وضعیت درست رو نشون بده، نه فقط بعد از کلیک.
        setInCart((cart.items || []).some((i) => i.item_type === "course" && i.item_id === Number(id)));
      })
      .catch((err) => !cancelled && setError(err?.response?.data?.message || "دریافت اطلاعات دوره با خطا مواجه شد."))
      .finally(() => !cancelled && setLoading(false));
    return () => { cancelled = true; };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id]);

  if (loading) return <div className="wrap panel-wrap"><div className="empty-state">در حال بارگذاری...</div></div>;
  if (error || !course) return <div className="wrap panel-wrap"><div className="empty-state">{error || "دوره پیدا نشد."}</div></div>;

  const ongoing = course.status === "in-progress";
  const lessons = course.lessons || [];
  const activeLesson = lessons[activeIdx] || lessons[0];
  // توجه: «دانش‌آموز بودن» به‌تنهایی دیگه باعث دسترسی آزاد نمی‌شه — دانش‌آموز هم
  // باید مثل کاربر عادی دکمه‌ی «ثبت‌نام» (که براش رایگان و آنیه) رو بزنه؛ فقط
  // قیمت نمایشی روی برچسب صفر حساب می‌شه.
  const isFree = !course.price || course.price === 0;
  const isOwnerConsultant = role === "consultant" && profile?.id === course.consultant_id;
  const teacher = course.consultant ? [course.consultant.name, course.consultant.lastname].filter(Boolean).join(" ") : "بدون مدرس مشخص";

  // مشاورِ سازنده‌ی دوره و ادمین همیشه مستقیم دسترسی دارن (نیازی به ثبت‌نام نیست)؛
  // برای کاربر عادی/دانش‌آموز فقط با ثبت‌نام واقعی (enrolled) دسترسی باز می‌شه.
  const canWatch = enrolled || isOwnerConsultant || isAdminAccount;

  const handleEnrollFree = async () => {
    setBusy(true);
    try {
      await purchaseCourse(course.id);
      toast("با موفقیت به دوره‌هات اضافه شد");
      setEnrolled(true);
      // بعد از ثبت‌نام، جزوات (که قبلش قفل بودن) رو دوباره می‌گیریم تا بدون
      // نیاز به رفرش صفحه ظاهر بشن.
      fetchCourseNotes(course.id).then(setNotes).catch(() => {});
    } catch (err) {
      toast(err?.response?.data?.message || "ثبت‌نام با خطا مواجه شد", "error");
    } finally {
      setBusy(false);
    }
  };

  const handleAddToCart = async () => {
    setBusy(true);
    try {
      await addToCart("course", course.id);
      toast("به سبد خرید اضافه شد");
      setInCart(true);
    } catch (err) {
      toast(err?.response?.data?.message || "افزودن به سبد خرید با خطا مواجه شد", "error");
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="wrap detail-view-inner fade-in">
      <button className="back-btn" onClick={() => navigate(-1)}><Icon name="chev" /> بازگشت به دوره‌ها</button>
      <div className="course-layout">
        <div className="course-main">
          <div className="player-mock">
            {canWatch && activeLesson?.video_url ? (
              <video key={activeLesson.id} src={activeLesson.video_url} controls style={{ width: "100%", height: "100%", objectFit: "cover" }} />
            ) : (
              <>
                <SvgThumb tint={tintFor(course.major)} seed={"c" + course.id} />
                {canWatch ? (
                  <div className="big-play" onClick={() => toast("این دوره هنوز درسی نداره")}><Icon name="play" /></div>
                ) : (
                  <div className="big-play" onClick={() => toast("برای تماشا ابتدا باید در دوره ثبت‌نام کنی")}><Icon name="lock" /></div>
                )}
              </>
            )}
          </div>
          <div className="glass course-info">
            <div className="course-info-head">
              <h1 className="course-title">{course.title}</h1>
              <div className="course-badges2">
                <span className={`badge ${ongoing ? "badge-teal" : "badge-violet"}`}>{STATUS_LABELS[course.status] || course.status}</span>
                <span className={`badge ${isFree ? "badge-teal" : "badge-gold"}`}>{isFree ? (isStudent && course.price > 0 ? "رایگان برای اعضای ویژه" : "رایگان") : formatToman(course.price)}</span>
              </div>
            </div>
            <div className="course-meta2">
              <span className="meta-item2"><Icon name="user" /> {teacher}</span>
              <span className="meta-item2"><Icon name="book" /> {LESSON_LABELS[course.course_lesson_name] || course.course_lesson_name}</span>
              <span className="meta-item2"><Icon name="exam" /> پایه {GRADE_LABELS[course.grade] || course.grade}</span>
              <span className="meta-item2"><Icon name="tool" /> رشته {MAJOR_LABELS[course.major] || course.major}</span>
            </div>
            <p className="course-desc2">دوره‌ی «{course.title}» با تدریس {teacher}، مباحث درس {LESSON_LABELS[course.course_lesson_name] || course.course_lesson_name} ویژه‌ی پایه‌ی {GRADE_LABELS[course.grade] || course.grade} رشته‌ی {MAJOR_LABELS[course.major] || course.major} رو پوشش می‌ده و شامل {toFa(lessons.length)} جلسه‌ی آموزشیه.</p>

            {isBuyerAccount && (
              <div className="settings-actions" style={{ marginTop: 16 }}>
                {enrolled ? (
                  <span className="badge badge-teal" style={{ padding: "10px 16px", fontSize: 13 }}><Icon name="checkCircle" /> قبلاً به این دوره اضافه شده</span>
                ) : isFree ? (
                  <button className="btn btn-gold btn-block" disabled={busy} onClick={handleEnrollFree}>
                    <Icon name="plus" /> {busy ? "در حال افزودن..." : "افزودن به دوره‌ها"}
                  </button>
                ) : inCart ? (
                  <button className="btn btn-ghost btn-block" onClick={() => navigate("/cart")}><Icon name="wallet" /> در سبد خریدته — برو به سبد خرید</button>
                ) : (
                  <button className="btn btn-gold btn-block" disabled={busy} onClick={handleAddToCart}>
                    <Icon name="cash" /> {busy ? "در حال افزودن..." : `خرید (${formatToman(course.price)})`}
                  </button>
                )}
              </div>
            )}
            {!isAuthenticated && (
              <div className="settings-actions" style={{ marginTop: 16 }}>
                <button className="btn btn-gold btn-block" onClick={() => navigate("/auth")}>برای ثبت‌نام در دوره وارد شو</button>
              </div>
            )}
          </div>
        </div>

        <aside className="course-side">
          <div className="glass episodes-panel2">
            <div className="episodes-head2"><h3>سرفصل دوره</h3><span className="ep-count2">{toFa(lessons.length)} قسمت</span></div>
            <div className="episodes-list2">
              {lessons.length ? lessons.map((ep, i) => (
                <div className={`ep-item2 ${i === activeIdx ? "active" : ""}`} key={ep.id} onClick={() => (canWatch ? setActiveIdx(i) : toast("برای تماشا ابتدا باید در دوره ثبت‌نام کنی"))}>
                  <div className="ep-main2">
                    <span className="ep-index2">{toFa(String(i + 1).padStart(2, "0"))}</span>
                    <span className="ep-play-ico2"><Icon name={canWatch ? "play" : "lock"} /></span>
                    <span className="ep-texts2">
                      <span className="ep-title2">{ep.title}</span>
                      <span className="ep-duration2">{ep.duration_seconds ? `${toFa(Math.round(ep.duration_seconds / 60))} دقیقه` : ""}</span>
                    </span>
                  </div>
                </div>
              )) : <div className="empty-state" style={{ padding: 16 }}>این دوره هنوز جلسه‌ای نداره.</div>}
            </div>
          </div>
          {notes.length > 0 && (
            <div className="glass episodes-panel2" style={{ marginTop: 14 }}>
              <div className="episodes-head2"><h3>جزوات</h3><span className="ep-count2">{toFa(notes.length)} فایل</span></div>
              <div className="episodes-list2">
                {notes.map((n) => n.locked ? (
                  <div
                    className="ep-item2 note-item2 locked"
                    key={n.id}
                    onClick={() => toast("برای دانلود جزوات، ابتدا باید در این دوره ثبت‌نام کنی")}
                    style={{ cursor: "pointer", opacity: 0.65 }}
                  >
                    <div className="ep-main2">
                      <span className="ep-play-ico2 note-ico2"><Icon name="lock" /></span>
                      <span className="ep-texts2"><span className="ep-title2">{n.title}</span></span>
                    </div>
                  </div>
                ) : (
                  <a className="ep-item2 note-item2" key={n.id} href={n.file_url} target="_blank" rel="noreferrer">
                    <div className="ep-main2">
                      <span className="ep-play-ico2 note-ico2"><Icon name="filePdf" /></span>
                      <span className="ep-texts2"><span className="ep-title2">{n.title}</span></span>
                      <span className="note-dl2"><Icon name="download" /></span>
                    </div>
                  </a>
                ))}
              </div>
            </div>
          )}
        </aside>
      </div>
    </div>
  );
}
