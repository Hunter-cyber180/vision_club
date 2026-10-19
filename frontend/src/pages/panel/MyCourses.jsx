import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import Icon from "../../components/Icon";
import CourseCard from "../../components/CourseCard";
import Pagination from "../../components/Pagination";
import { useAuth } from "../../context/AuthContext";
import { fetchMyCourses } from "../../api/panel";

const PER_PAGE = 3;

export default function MyCourses() {
  const navigate = useNavigate();
  const { profile } = useAuth();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [items, setItems] = useState([]);
  const [page, setPage] = useState(1);

  useEffect(() => {
    if (!profile?.id) return;
    let cancelled = false;
    setLoading(true);
    fetchMyCourses(profile.id)
      .then((data) => !cancelled && setItems(data))
      .catch((err) => !cancelled && setError(err?.response?.data?.message || "دریافت دوره‌های تو با خطا مواجه شد."))
      .finally(() => !cancelled && setLoading(false));
    return () => { cancelled = true; };
  }, [profile?.id]);

  const totalPages = Math.max(1, Math.ceil(items.length / PER_PAGE));
  const pageItems = items.slice((page - 1) * PER_PAGE, page * PER_PAGE);

  return (
    <>
      <div className="panel-head fade-in"><h2><Icon name="book" /> دوره‌های من</h2><p>ادامه یادگیری از همان‌جایی که رها کردی</p></div>
      <div className="wrap panel-wrap">
        {loading && <div className="empty-state">در حال بارگذاری...</div>}
        {!loading && error && <div className="empty-state">{error}</div>}
        {!loading && !error && (
          <>
            <div className="vgrid grid-2-md vgrid-md">
              {pageItems.length
                ? pageItems.map((uc) => <CourseCard key={uc.id} c={uc.course} onOpen={(c) => navigate(`/courses/${c.id}`)} />)
                : <div className="empty-state">هنوز در هیچ دوره‌ای ثبت‌نام نکرده‌ای.</div>}
            </div>
            <Pagination page={page} totalPages={totalPages} totalItems={items.length} itemWord="دوره" onChange={setPage} />
          </>
        )}
      </div>
    </>
  );
}
