import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import Icon from "../../components/Icon";
import StatCard from "../../components/panel/StatCard";
import GCard from "../../components/panel/GCard";
import { useAuth } from "../../context/AuthContext";
import { fetchMyStudents, fetchUnpaidTuitions } from "../../api/consultant";
import { toFa } from "../../utils/toFa";

function PendingItem({ student, badge, onClick }) {
  return (
    <div className="pending-item" onClick={onClick} style={{ cursor: onClick ? "pointer" : "default" }}>
      <div className="avatar" style={{ width: 32, height: 32, fontSize: 12 }}>{student.name?.[0]}</div>
      <div className="txt"><b>{student.name} {student.lastname}</b></div>
      {badge}
    </div>
  );
}

export default function ConsultantDashboard() {
  const { profile } = useAuth();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [students, setStudents] = useState([]);
  const [unpaid, setUnpaid] = useState([]);

  useEffect(() => {
    setLoading(true);
    Promise.all([fetchMyStudents(), fetchUnpaidTuitions()])
      .then(([s, u]) => { setStudents(s); setUnpaid(u); })
      .finally(() => setLoading(false));
  }, []);

  const noReport = students.filter((s) => !s.reported_today);
  const noAnalysis = students.filter((s) => s.analyzed_latest_exam === false);
  const unpaidStudentIds = [...new Set(unpaid.map((p) => p.user_id))];
  const unpaidStudents = unpaidStudentIds
    .map((id) => students.find((s) => s.id === id))
    .filter(Boolean);

  const stats = [
    { icon: "users", tint: "blue", val: loading ? "…" : toFa(students.length), label: "کل دانش‌آموزان" },
    { icon: "report", tint: "coral", val: loading ? "…" : toFa(noReport.length), label: "بدون گزارش کار امروز" },
    { icon: "exam", tint: "violet", val: loading ? "…" : toFa(noAnalysis.length), label: "بدون تحلیل آزمون اخیر" },
    { icon: "cash", tint: "coral", val: loading ? "…" : toFa(unpaidStudents.length), label: "شهریه پرداخت‌نشده" },
  ];

  const displayName = [profile?.name, profile?.lastname].filter(Boolean).join(" ");

  return (
    <>
      <div className="panel-head fade-in"><h2>داشبورد مشاور</h2><p>سلام {displayName} — نمای کلی از وضعیت دانش‌آموزها، گزارش‌ها و پرداخت‌های اخیر</p></div>
      <div className="wrap panel-wrap">
        <div className="stat-row-cards">
          {stats.map((s) => <StatCard key={s.label} {...s} />)}
        </div>

        <GCard icon="cash" title="نیاز به پیگیری" hint="پرداخت انجام‌نشده">
          {loading ? (
            <p style={{ fontSize: 12.5, color: "var(--ink-dim)" }}>در حال بارگذاری...</p>
          ) : unpaidStudents.length ? (
            unpaidStudents.map((s) => (
              <PendingItem key={s.id} student={s} badge={<span className="badge badge-coral">پرداخت‌نشده</span>} onClick={() => navigate(`/panel/students/${s.id}`)} />
            ))
          ) : (
            <p style={{ fontSize: 12.5, color: "var(--teal)", display: "flex", alignItems: "center", gap: 6 }}>
              <Icon name="check" /> موردی برای پیگیری نیست
            </p>
          )}
        </GCard>

        <GCard icon="report" title="پیگیری‌های خودکار سیستم" hint="دانش‌آموزهایی که جا موندن">
          {loading ? (
            <p style={{ fontSize: 12.5, color: "var(--ink-dim)" }}>در حال بارگذاری...</p>
          ) : (
            <div className="missed-grid">
              <div>
                <div className="missed-subhead">گزارش کار نفرستاده‌ن <span className="chip-count">{toFa(noReport.length)}</span></div>
                {noReport.length ? noReport.map((s) => (
                  <PendingItem key={s.id} student={s} onClick={() => navigate(`/panel/students/${s.id}`)} />
                )) : <p style={{ fontSize: 12, color: "var(--ink-dim)" }}>—</p>}
              </div>
              <div>
                <div className="missed-subhead">تحلیل آزمون نفرستاده‌ن <span className="chip-count">{toFa(noAnalysis.length)}</span></div>
                {noAnalysis.length ? noAnalysis.map((s) => (
                  <PendingItem key={s.id} student={s} onClick={() => navigate(`/panel/students/${s.id}`)} />
                )) : <p style={{ fontSize: 12, color: "var(--ink-dim)" }}>—</p>}
              </div>
            </div>
          )}
        </GCard>
      </div>
    </>
  );
}
