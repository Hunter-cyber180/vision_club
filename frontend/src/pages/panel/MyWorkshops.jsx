import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import Icon from "../../components/Icon";
import WorkshopCard from "../../components/WorkshopCard";
import Pagination from "../../components/Pagination";
import { useAuth } from "../../context/AuthContext";
import { fetchMyWorkshops } from "../../api/panel";

const PER_PAGE = 3;

export default function MyWorkshops() {
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
    fetchMyWorkshops(profile.id)
      .then((data) => !cancelled && setItems(data))
      .catch((err) => !cancelled && setError(err?.response?.data?.message || "دریافت کارگاه‌های تو با خطا مواجه شد."))
      .finally(() => !cancelled && setLoading(false));
    return () => { cancelled = true; };
  }, [profile?.id]);

  const totalPages = Math.max(1, Math.ceil(items.length / PER_PAGE));
  const pageItems = items.slice((page - 1) * PER_PAGE, page * PER_PAGE);

  return (
    <>
      <div className="panel-head fade-in"><h2><Icon name="workshop" /> کارگاه‌های من</h2><p>کارگاه‌هایی که ثبت‌نام کرده‌ای</p></div>
      <div className="wrap panel-wrap">
        {loading && <div className="empty-state">در حال بارگذاری...</div>}
        {!loading && error && <div className="empty-state">{error}</div>}
        {!loading && !error && (
          <>
            <div className="vgrid grid-2-md vgrid-md">
              {pageItems.length
                ? pageItems.map((uw) => <WorkshopCard key={uw.id} w={uw.workshop} onOpen={(w) => navigate(`/workshops/${w.id}`)} />)
                : <div className="empty-state">هنوز در هیچ کارگاهی ثبت‌نام نکرده‌ای.</div>}
            </div>
            <Pagination page={page} totalPages={totalPages} totalItems={items.length} itemWord="کارگاه" onChange={setPage} />
          </>
        )}
      </div>
    </>
  );
}
