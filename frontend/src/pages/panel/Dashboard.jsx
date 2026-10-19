import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import Icon from "../../components/Icon";
import StatCard from "../../components/panel/StatCard";
import GCard from "../../components/panel/GCard";
import CourseCard from "../../components/CourseCard";
import WeeklyCharts from "../../components/panel/WeeklyCharts";
import { useAuth } from "../../context/AuthContext";
import { fetchMyCourses, fetchMyWorkshops, fetchMyDailyReports, fetchMyAnalysisExams, fetchMyWeeklySchedules, fetchMyWeeklyStats } from "../../api/panel";
import { formatToman } from "../../utils/toFa";

export default function Dashboard() {
  const { profile, panelRole } = useAuth();
  const isStudent = panelRole === "student";
  const [loading, setLoading] = useState(true);
  const [myCourses, setMyCourses] = useState([]);
  const [myWorkshopsCount, setMyWorkshopsCount] = useState(0);
  const [reportsCount, setReportsCount] = useState(0);
  const [analysesCount, setAnalysesCount] = useState(0);
  const [latestSchedule, setLatestSchedule] = useState(null);
  const [weeklyStats, setWeeklyStats] = useState(null);
  const [statsLoading, setStatsLoading] = useState(true);

  useEffect(() => {
    if (!profile?.id) return;
    let cancelled = false;
    setLoading(true);

    const tasks = [
      fetchMyCourses(profile.id),
      fetchMyWorkshops(profile.id),
    ];
    if (isStudent) {
      tasks.push(fetchMyDailyReports());
      tasks.push(fetchMyAnalysisExams());
      tasks.push(fetchMyWeeklySchedules());
    }

    Promise.all(tasks)
      .then(([courses, workshops, reports, analyses, schedules]) => {
        if (cancelled) return;
        setMyCourses(courses);
        setMyWorkshopsCount(workshops.length);
        if (isStudent) {
          setReportsCount((reports || []).length);
          setAnalysesCount((analyses || []).length);
          setLatestSchedule((schedules || [])[0] || null);
        }
      })
      .finally(() => !cancelled && setLoading(false));

    return () => { cancelled = true; };
  }, [profile?.id, isStudent]);

  // نمودارهای هفتگی فقط برای دانش‌آموز — کاربر عادی چنین آماری نداره
  useEffect(() => {
    if (!isStudent) { setStatsLoading(false); return; }
    let cancelled = false;
    setStatsLoading(true);
    fetchMyWeeklyStats()
      .then((s) => { if (!cancelled) setWeeklyStats(s); })
      .finally(() => { if (!cancelled) setStatsLoading(false); });
    return () => { cancelled = true; };
  }, [isStudent]);

  const inProgressCount = myCourses.filter((c) => c.status === "in-progress").length;
  const completedCount = myCourses.filter((c) => c.status === "completed").length;

  const stats = isStudent
    ? [
        { icon: "report", tint: "gold", val: reportsCount, label: "گزارش کار ارسالی" },
        { icon: "exam", tint: "teal", val: analysesCount, label: "تحلیل آزمون ارسالی" },
        { icon: "book", tint: "violet", val: inProgressCount, label: "دوره در حال یادگیری" },
        { icon: "wallet", tint: "blue", val: formatToman(profile?.charge_amount), label: "موجودی کیف پول" },
      ]
    : [
        { icon: "book", tint: "gold", val: inProgressCount, label: "دوره در حال یادگیری" },
        { icon: "tool", tint: "violet", val: myWorkshopsCount, label: "کارگاه ثبت‌نامی" },
        { icon: "trendUp", tint: "teal", val: completedCount, label: "دوره تکمیل‌شده" },
        { icon: "wallet", tint: "blue", val: formatToman(profile?.charge_amount), label: "موجودی کیف پول" },
      ];

  const displayName = [profile?.name, profile?.lastname].filter(Boolean).join(" ");

  return (
    <>
      <div className="panel-head fade-in">
        <h2 style={{ display: "flex", alignItems: "center", gap: 8, justifyContent: "center" }}>
          سلام {displayName} <span style={{ color: "var(--gold-bright)", display: "inline-flex" }}><Icon name="wave" /></span>
        </h2>
        <p>{isStudent ? "داشبورد دانش‌آموز" : "داشبورد کاربر"} — خلاصه‌ی وضعیت شما</p>
      </div>

      <div className="wrap panel-wrap">
        <div className="stat-row-cards">
          {stats.map((s) => <StatCard key={s.label} {...s} />)}
        </div>

        <GCard icon="book" title="ادامه دوره‌ها" hint="از همون‌جا که رها کردی">
          {loading ? (
            <p style={{ fontSize: 12.5, color: "var(--ink-dim)" }}>در حال بارگذاری...</p>
          ) : myCourses.length ? (
            <div className="vgrid grid-2-md vgrid-md">
              {myCourses.slice(0, 2).map((uc) => <CourseCard key={uc.id} c={uc.course} />)}
            </div>
          ) : (
            <p style={{ fontSize: 12.5, color: "var(--ink-dim)" }}>
              هنوز در دوره‌ای ثبت‌نام نکردی. <Link to="/courses" style={{ color: "var(--gold-bright)" }}>مشاهده دوره‌ها</Link>
            </p>
          )}
        </GCard>

        {isStudent && <WeeklyCharts stats={weeklyStats} loading={statsLoading} />}

        {isStudent && (
          <GCard icon="calendar" title="آخرین برنامه هفتگی" hint="از طرف مشاورت">
            {loading ? (
              <p style={{ fontSize: 12.5, color: "var(--ink-dim)" }}>در حال بارگذاری...</p>
            ) : latestSchedule ? (
              <div className="glass pdf-item fade-in">
                <div className="pdf-ico"><Icon name="filePdf" /></div>
                <div className="pdf-body"><b>{latestSchedule.title}</b><span>تاریخ ارسال: {new Date(latestSchedule.date).toLocaleDateString("fa-IR")}</span></div>
                <a className="pdf-dl" href={latestSchedule.file_url} download title="دانلود PDF"><Icon name="download" /></a>
              </div>
            ) : (
              <p style={{ fontSize: 12.5, color: "var(--ink-dim)" }}>هنوز برنامه‌ای برای تو ارسال نشده.</p>
            )}
          </GCard>
        )}
      </div>
    </>
  );
}
