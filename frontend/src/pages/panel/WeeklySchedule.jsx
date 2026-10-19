import { useEffect, useState } from "react";
import Icon from "../../components/Icon";
import Pagination from "../../components/Pagination";
import { fetchMyWeeklySchedules } from "../../api/panel";

const PER_PAGE = 4;

export default function WeeklySchedule() {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [items, setItems] = useState([]);
  const [page, setPage] = useState(1);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    fetchMyWeeklySchedules()
      .then((data) => !cancelled && setItems(data))
      .catch((err) => !cancelled && setError(err?.response?.data?.message || "دریافت برنامه‌های هفتگی با خطا مواجه شد."))
      .finally(() => !cancelled && setLoading(false));
    return () => { cancelled = true; };
  }, []);

  const totalPages = Math.max(1, Math.ceil(items.length / PER_PAGE));
  const pageItems = items.slice((page - 1) * PER_PAGE, page * PER_PAGE);

  return (
    <>
      <div className="panel-head fade-in"><h2><Icon name="calendar" /> برنامه‌های هفتگی</h2><p>فایل‌های PDF برنامه‌ای که مشاورت برایت طراحی کرده</p></div>
      <div className="wrap panel-wrap">
        {loading && <div className="empty-state">در حال بارگذاری...</div>}
        {!loading && error && <div className="empty-state">{error}</div>}
        {!loading && !error && (
          <>
            {pageItems.length ? pageItems.map((p) => (
              <div className="glass pdf-item fade-in" key={p.id}>
                <div className="pdf-ico"><Icon name="filePdf" /></div>
                <div className="pdf-body"><b>{p.title}</b><span>تاریخ ارسال: {new Date(p.date).toLocaleDateString("fa-IR")}</span></div>
                <a className="pdf-dl" href={p.file_url} download title="دانلود PDF"><Icon name="download" /></a>
              </div>
            )) : <div className="empty-state">هنوز برنامه‌ای برای تو ارسال نشده.</div>}
            <Pagination page={page} totalPages={totalPages} totalItems={items.length} itemWord="برنامه" onChange={setPage} />
          </>
        )}
      </div>
    </>
  );
}
