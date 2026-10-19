import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import Icon from "../components/Icon";
import ChipGroup from "../components/ChipGroup";
import SortList from "../components/SortList";
import Pagination from "../components/Pagination";
import CourseCard from "../components/CourseCard";
import { fetchCourses } from "../api/courses";
import { GRADE_OPTIONS, MAJOR_OPTIONS, LESSON_OPTIONS, STATUS_OPTIONS, COURSE_SORTS } from "../constants/courseEnums";

const COURSE_GROUPS = [
  { key: "grade", label: "پایه تحصیلی", options: GRADE_OPTIONS },
  { key: "major", label: "رشته", options: MAJOR_OPTIONS },
  { key: "course_lesson_name", label: "درس", options: LESSON_OPTIONS },
  { key: "status", label: "وضعیت دوره", options: STATUS_OPTIONS },
];

const PER_PAGE = 6;

export default function Courses() {
  const navigate = useNavigate();
  const [page, setPage] = useState(1);
  const [sort, setSort] = useState(null);
  const [filters, setFilters] = useState({ grade: null, major: null, course_lesson_name: null, status: null });
  const [priceType, setPriceType] = useState(null); // null | 'free' | 'paid'
  const [quick, setQuick] = useState(null); // 'newest' | 'free' | 'ongoing'
  const [search, setSearch] = useState("");
  const [filtersOpen, setFiltersOpen] = useState(false);

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [courses, setCourses] = useState([]);
  const [pagination, setPagination] = useState(null);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    setError(null);

    const effectiveSort = quick === "newest" ? "newest" : sort || "newest";
    const effectivePriceType = quick === "free" ? "free" : priceType || "all";
    const effectiveStatus = quick === "ongoing" ? "in-progress" : filters.status || "all";

    const params = {
      page,
      limit: PER_PAGE,
      sort: effectiveSort,
      grade: filters.grade || "all",
      major: filters.major || "all",
      course_lesson_name: filters.course_lesson_name || "all",
      price_type: effectivePriceType,
      status: effectiveStatus,
      search,
    };

    fetchCourses(params)
      .then((data) => {
        if (cancelled) return;
        setCourses(data.courses || []);
        setPagination(data.pagination || null);
      })
      .catch((err) => {
        if (cancelled) return;
        setError(err?.response?.data?.message || "دریافت دوره‌ها از سرور با خطا مواجه شد.");
      })
      .finally(() => !cancelled && setLoading(false));

    return () => { cancelled = true; };
  }, [page, sort, filters, priceType, quick, search]);

  const setFilter = (key, val) => { setFilters((f) => ({ ...f, [key]: val })); setPage(1); };
  const clearFilters = () => {
    setFilters({ grade: null, major: null, course_lesson_name: null, status: null });
    setPriceType(null); setQuick(null); setSort(null); setPage(1);
  };

  return (
    <>
      <div className="panel-head fade-in"><h2><Icon name="book" /> دوره‌ها</h2><p>دوره‌های آماده برای پایه دهم تا کنکور</p></div>

      <div className="glass search-box fade-in">
        <Icon name="search" />
        <input
          value={search}
          placeholder="جستجوی دوره، استاد یا مبحث..."
          onChange={(e) => { setSearch(e.target.value); setPage(1); }}
        />
      </div>

      <div className="quick-chip-row">
        <button className={`qchip ${quick === "newest" ? "active" : ""}`} onClick={() => { setQuick(quick === "newest" ? null : "newest"); setPage(1); }}>
          <Icon name="spark" /> جدیدترین‌ها
        </button>
        <button className={`qchip ${quick === "free" ? "active" : ""}`} onClick={() => { setQuick(quick === "free" ? null : "free"); setPage(1); }}>
          رایگان‌ها
        </button>
        <button className={`qchip ${quick === "ongoing" ? "active" : ""}`} onClick={() => { setQuick(quick === "ongoing" ? null : "ongoing"); setPage(1); }}>
          در حال برگزاری
        </button>
      </div>

      <button className={`glass filter-toggle ${filtersOpen ? "open" : ""}`} onClick={() => setFiltersOpen((v) => !v)}>
        <span>دسته‌بندی و مرتب‌سازی</span><Icon name="chev" />
      </button>
      <div className={`filter-body ${filtersOpen ? "open" : ""}`}>
        <div className="filter-body-inner">
          <div className="glass filter-panel" style={{ marginBottom: 10 }}>
            <SortList sorts={COURSE_SORTS} activeKey={sort} onSelect={(k) => { setSort(sort === k ? null : k); setPage(1); }} />
          </div>
          <div className="glass filter-panel">
            {COURSE_GROUPS.map((g) => (
              <ChipGroup key={g.key} group={g} selectedVal={filters[g.key]} onSelect={setFilter} />
            ))}
            <ChipGroup
              group={{ key: "price", label: "نوع دوره", options: [{ value: "free", label: "رایگان" }, { value: "paid", label: "پولی" }] }}
              selectedVal={priceType}
              onSelect={(_key, val) => { setPriceType(val); setPage(1); }}
            />
            <button className="btn btn-ghost btn-sm btn-block" style={{ marginTop: 6 }} onClick={clearFilters}>پاک کردن فیلترها</button>
          </div>
        </div>
      </div>

      <div className="wrap">
        {loading && <div className="empty-state">در حال دریافت دوره‌ها...</div>}
        {!loading && error && <div className="empty-state">{error}</div>}
        {!loading && !error && (
          <div className="vgrid grid-2-md vgrid-md">
            {courses.length ? courses.map((c) => <CourseCard key={c.id} c={c} onOpen={(course) => navigate(`/courses/${course.id}`)} />) : <div className="empty-state">دوره‌ای با این فیلترها پیدا نشد.</div>}
          </div>
        )}
        {!loading && !error && pagination && (
          <Pagination
            page={pagination.currentPage}
            totalPages={pagination.totalPages}
            totalItems={pagination.totalItems}
            itemWord="دوره"
            onChange={setPage}
          />
        )}
      </div>
    </>
  );
}
