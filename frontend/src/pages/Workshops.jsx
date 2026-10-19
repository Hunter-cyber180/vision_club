import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import Icon from "../components/Icon";
import ChipGroup from "../components/ChipGroup";
import SortList from "../components/SortList";
import Pagination from "../components/Pagination";
import WorkshopCard from "../components/WorkshopCard";
import { fetchWorkshops } from "../api/workshops";
import { fetchCategories } from "../api/categories";
import { WORKSHOP_SORTS } from "../constants/courseEnums";

const PER_PAGE = 6;

export default function Workshops() {
  const navigate = useNavigate();
  const [page, setPage] = useState(1);
  const [sort, setSort] = useState(null);
  const [categoryId, setCategoryId] = useState(null);
  const [priceType, setPriceType] = useState(null);
  const [search, setSearch] = useState("");
  const [filtersOpen, setFiltersOpen] = useState(false);

  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [workshops, setWorkshops] = useState([]);
  const [pagination, setPagination] = useState(null);

  useEffect(() => {
    fetchCategories().then(setCategories).catch(() => setCategories([]));
  }, []);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    setError(null);

    const params = {
      page,
      limit: PER_PAGE,
      sort: sort || "newest",
      search,
    };
    if (categoryId) params.category_id = categoryId;
    if (priceType) params.price_type = priceType;

    fetchWorkshops(params)
      .then(({ workshops, pagination }) => {
        if (cancelled) return;
        setWorkshops(workshops || []);
        setPagination(pagination || null);
      })
      .catch((err) => {
        if (cancelled) return;
        setError(err?.response?.data?.message || "دریافت کارگاه‌ها از سرور با خطا مواجه شد.");
      })
      .finally(() => !cancelled && setLoading(false));

    return () => { cancelled = true; };
  }, [page, sort, categoryId, priceType, search]);

  const categoryGroup = {
    key: "category",
    label: "موضوع",
    options: categories.map((c) => ({ value: c.id, label: c.name })),
  };

  const clearFilters = () => { setCategoryId(null); setPriceType(null); setSort(null); setPage(1); };

  return (
    <>
      <div className="panel-head fade-in"><h2><Icon name="workshop" /> کارگاه‌ها</h2><p>کارگاه‌های تخصصی برنامه‌ریزی و مهارت‌های تحصیلی</p></div>

      <div className="glass search-box fade-in">
        <Icon name="search" />
        <input
          value={search}
          placeholder="جستجو در کارگاه‌ها..."
          onChange={(e) => { setSearch(e.target.value); setPage(1); }}
        />
      </div>

      <div className="quick-chip-row">
        <button className={`qchip ${priceType === "free" ? "active" : ""}`} onClick={() => { setPriceType(priceType === "free" ? null : "free"); setPage(1); }}>
          <Icon name="spark" /> فقط رایگان‌ها
        </button>
        <button className={`qchip ${priceType === "paid" ? "active" : ""}`} onClick={() => { setPriceType(priceType === "paid" ? null : "paid"); setPage(1); }}>
          کارگاه‌های پولی
        </button>
      </div>

      <button className={`glass filter-toggle ${filtersOpen ? "open" : ""}`} onClick={() => setFiltersOpen((v) => !v)}>
        <span>دسته‌بندی و مرتب‌سازی</span><Icon name="chev" />
      </button>
      <div className={`filter-body ${filtersOpen ? "open" : ""}`}>
        <div className="filter-body-inner">
          <div className="glass filter-panel" style={{ marginBottom: 10 }}>
            <SortList sorts={WORKSHOP_SORTS} activeKey={sort} onSelect={(k) => { setSort(sort === k ? null : k); setPage(1); }} />
          </div>
          <div className="glass filter-panel">
            {categories.length > 0 && (
              <ChipGroup group={categoryGroup} selectedVal={categoryId} onSelect={(_k, v) => { setCategoryId(v); setPage(1); }} />
            )}
            <button className="btn btn-ghost btn-sm btn-block" style={{ marginTop: 6 }} onClick={clearFilters}>پاک کردن فیلترها</button>
          </div>
        </div>
      </div>

      <div className="wrap">
        {loading && <div className="empty-state">در حال دریافت کارگاه‌ها...</div>}
        {!loading && error && <div className="empty-state">{error}</div>}
        {!loading && !error && (
          <div className="vgrid grid-2-md vgrid-md">
            {workshops.length ? workshops.map((w) => <WorkshopCard key={w.id} w={w} onOpen={(wk) => navigate(`/workshops/${wk.id}`)} />) : <div className="empty-state">هیچ کارگاهی با این فیلترها پیدا نشد.</div>}
          </div>
        )}
        {!loading && !error && pagination && (
          <Pagination
            page={pagination.currentPage}
            totalPages={pagination.totalPages}
            totalItems={pagination.totalItems}
            itemWord="کارگاه"
            onChange={setPage}
          />
        )}
      </div>
    </>
  );
}
