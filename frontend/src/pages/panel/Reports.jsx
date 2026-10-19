import { useEffect, useState } from "react";
import Icon from "../../components/Icon";
import Tabs from "../../components/panel/Tabs";
import DailyReportWizard from "../../components/panel/DailyReportWizard";
import ExamAnalysisWizard from "../../components/panel/ExamAnalysisWizard";
import ReportCard from "../../components/panel/ReportCard";
import ExamAnalysisCard from "../../components/panel/ExamAnalysisCard";
import Pagination from "../../components/Pagination";
import { fetchMyDailyReports, fetchMyAnalysisExams } from "../../api/panel";

const TABS = [
  { k: "new", label: "ارسال گزارش جدید" },
  { k: "examAnalysis", label: "ارسال تحلیل آزمون" },
  { k: "reports", label: "گزارش‌های ارسالی" },
  { k: "analyses", label: "تحلیل آزمون‌های من" },
];
const PER_PAGE = 3;

function ReportsListTab() {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [items, setItems] = useState([]);
  const [page, setPage] = useState(1);
  const [reloadKey, setReloadKey] = useState(0);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    fetchMyDailyReports()
      .then((data) => !cancelled && setItems(data))
      .catch((err) => !cancelled && setError(err?.response?.data?.message || "دریافت گزارش‌ها با خطا مواجه شد."))
      .finally(() => !cancelled && setLoading(false));
    return () => { cancelled = true; };
  }, [reloadKey]);

  const totalPages = Math.max(1, Math.ceil(items.length / PER_PAGE));
  const pageItems = items.slice((page - 1) * PER_PAGE, page * PER_PAGE);

  if (loading) return <div className="empty-state">در حال بارگذاری...</div>;
  if (error) return <div className="empty-state">{error}</div>;
  return (
    <>
      {pageItems.length ? pageItems.map((r) => <ReportCard key={r.id} r={r} />) : <div className="empty-state">هنوز گزارش کاری ارسال نشده.</div>}
      <Pagination page={page} totalPages={totalPages} totalItems={items.length} itemWord="گزارش" onChange={setPage} />
    </>
  );
}

function AnalysesListTab() {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [items, setItems] = useState([]);
  const [page, setPage] = useState(1);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    fetchMyAnalysisExams()
      .then((data) => !cancelled && setItems(data))
      .catch((err) => !cancelled && setError(err?.response?.data?.message || "دریافت تحلیل‌های آزمون با خطا مواجه شد."))
      .finally(() => !cancelled && setLoading(false));
    return () => { cancelled = true; };
  }, []);

  const totalPages = Math.max(1, Math.ceil(items.length / PER_PAGE));
  const pageItems = items.slice((page - 1) * PER_PAGE, page * PER_PAGE);

  if (loading) return <div className="empty-state">در حال بارگذاری...</div>;
  if (error) return <div className="empty-state">{error}</div>;
  return (
    <>
      {pageItems.length ? pageItems.map((a) => <ExamAnalysisCard key={a.id} a={a} />) : <div className="empty-state">هنوز تحلیل آزمونی ارسال نشده.</div>}
      <Pagination page={page} totalPages={totalPages} totalItems={items.length} itemWord="تحلیل" onChange={setPage} />
    </>
  );
}

export default function Reports() {
  const [tab, setTab] = useState("new");

  return (
    <>
      <div className="panel-head fade-in"><h2><Icon name="report" /> گزارش کار و تحلیل آزمون</h2><p>گزارش روزانه‌ت رو بفرست یا تحلیل آزمونی که دادی رو برای مشاورت ارسال کن</p></div>
      <Tabs tabs={TABS} active={tab} onChange={setTab} />
      <div className="wrap panel-wrap fade-in">
        {tab === "new" && <DailyReportWizard onSubmitted={() => setTab("reports")} />}
        {tab === "examAnalysis" && <ExamAnalysisWizard onSubmitted={() => setTab("analyses")} />}
        {tab === "reports" && <ReportsListTab />}
        {tab === "analyses" && <AnalysesListTab />}
      </div>
    </>
  );
}
