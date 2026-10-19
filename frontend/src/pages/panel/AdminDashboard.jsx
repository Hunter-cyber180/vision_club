import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import Icon from "../../components/Icon";
import StatCard from "../../components/panel/StatCard";
import GCard from "../../components/panel/GCard";
import { useAuth } from "../../context/AuthContext";
import { fetchFinanceSummary, fetchFinanceTransactions, fetchUnpaidStudents } from "../../api/admin";
import { toFa, formatToman, jalaliMonthName } from "../../utils/toFa";

export default function AdminDashboard() {
  const { profile } = useAuth();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [summary, setSummary] = useState(null);
  const [transactions, setTransactions] = useState([]);
  const [unpaid, setUnpaid] = useState([]);

  useEffect(() => {
    setLoading(true);
    Promise.all([
      fetchFinanceSummary(),
      fetchFinanceTransactions({ page: 1, limit: 3 }),
      fetchUnpaidStudents({ limit: 5 }),
    ])
      .then(([s, tx, u]) => {
        setSummary(s);
        setTransactions(tx.transactions);
        setUnpaid(u);
      })
      .finally(() => setLoading(false));
  }, []);

  const stats = [
    { icon: "trendUp", tint: "teal", val: loading ? "…" : formatToman(summary?.revenueThisMonth || 0), label: "درآمد این ماه" },
    { icon: "users", tint: "blue", val: loading ? "…" : toFa(summary?.totalStudents || 0), label: "کل دانش‌آموزان" },
    { icon: "user", tint: "violet", val: loading ? "…" : toFa(summary?.totalConsultants || 0), label: "کل مشاوران" },
    { icon: "alertTri", tint: "coral", val: loading ? "…" : toFa(summary?.unpaidTuitionCount || 0), label: "پرداخت‌های معوق" },
  ];

  return (
    <>
      <div className="panel-head fade-in"><h2>داشبورد مدیریت</h2><p>سلام {profile?.username || "مدیر سیستم"} — نمای کلی از وضعیت مالی، دانش‌آموزان، مشاوران و محتوای کل مجموعه</p></div>
      <div className="wrap panel-wrap">
        <div className="stat-row-cards">
          {stats.map((s) => <StatCard key={s.label} {...s} />)}
        </div>

        <GCard title="آخرین تراکنش‌های مالی" hint={<span style={{ cursor: "pointer", color: "var(--gold-bright)" }} onClick={() => navigate("/panel/finance")}>مشاهده کامل در «امور مالی»</span>}>
          {loading ? (
            <p style={{ fontSize: 12.5, color: "var(--ink-dim)" }}>در حال بارگذاری...</p>
          ) : transactions.length ? transactions.map((t) => (
            <div className="feed-item" key={t.id}>
              <div className="dot" />
              <div className="txt"><b>{t.userName}</b> — {t.title}</div>
              <time>{new Date(t.date).toLocaleDateString("fa-IR")}</time>
            </div>
          )) : <p style={{ fontSize: 12.5, color: "var(--ink-dim)" }}>هنوز تراکنشی ثبت نشده.</p>}
        </GCard>

        <GCard title="نیازمند پیگیری" hint="پرداخت معوق دانش‌آموزان">
          {loading ? (
            <p style={{ fontSize: 12.5, color: "var(--ink-dim)" }}>در حال بارگذاری...</p>
          ) : unpaid.length ? unpaid.map((p) => (
            <div className="pending-item" key={p.id} style={{ cursor: "pointer" }} onClick={() => navigate(`/panel/students/${p.user_id}`)}>
              <div className="avatar" style={{ width: 32, height: 32, fontSize: 12 }}>{p.user?.name?.[0]}</div>
              <div className="txt"><b>{p.user ? `${p.user.name} ${p.user.lastname}` : "کاربر حذف‌شده"}</b><span style={{ fontSize: 11, color: "var(--ink-dim)" }}> · {jalaliMonthName(p.jalali_month)} {toFa(p.jalali_year)}</span></div>
              <span className="badge badge-coral">شهریه پرداخت‌نشده</span>
            </div>
          )) : (
            <p style={{ fontSize: 12.5, color: "var(--teal)", display: "flex", alignItems: "center", gap: 6 }}>
              <Icon name="check" /> موردی برای پیگیری نیست
            </p>
          )}
        </GCard>
      </div>
    </>
  );
}
