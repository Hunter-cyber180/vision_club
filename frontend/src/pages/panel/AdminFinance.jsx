import { useEffect, useState } from "react";
import Icon from "../../components/Icon";
import StatCard from "../../components/panel/StatCard";
import GCard from "../../components/panel/GCard";
import Pagination from "../../components/Pagination";
import { fetchFinanceSummary, fetchFinanceTransactions } from "../../api/admin";
import { toFa, formatToman } from "../../utils/toFa";

const PER_PAGE = 8;

export default function AdminFinance() {
  const [loadingSummary, setLoadingSummary] = useState(true);
  const [summary, setSummary] = useState(null);
  const [loadingTx, setLoadingTx] = useState(true);
  const [transactions, setTransactions] = useState([]);
  const [pagination, setPagination] = useState(null);
  const [page, setPage] = useState(1);

  useEffect(() => {
    fetchFinanceSummary().then(setSummary).finally(() => setLoadingSummary(false));
  }, []);

  useEffect(() => {
    setLoadingTx(true);
    fetchFinanceTransactions({ page, limit: PER_PAGE })
      .then(({ transactions, pagination }) => {
        setTransactions(transactions);
        setPagination(pagination);
      })
      .finally(() => setLoadingTx(false));
  }, [page]);

  const stats = [
    { icon: "trendUp", tint: "teal", val: loadingSummary ? "…" : formatToman(summary?.revenueThisMonth || 0), label: "درآمد این ماه" },
    { icon: "check", tint: "blue", val: loadingSummary ? "…" : toFa(summary?.transactionsLast30d || 0), label: "تراکنش موفق (۳۰ روز اخیر)" },
    { icon: "alertTri", tint: "coral", val: loadingSummary ? "…" : toFa(summary?.unpaidTuitionCount || 0), label: "شهریه پرداخت‌نشده" },
    { icon: "trendUp", tint: "gold", val: loadingSummary ? "…" : formatToman(summary?.totalRevenue || 0), label: "کل درآمد مجموعه" },
  ];

  return (
    <>
      <div className="panel-head fade-in"><h2><Icon name="cash" /> امور مالی کلی مجموعه</h2><p>روند درآمد و تراکنش‌های اخیر همه دانش‌آموزها و مشاوران</p></div>
      <div className="wrap panel-wrap" style={{ paddingBottom: 48 }}>
        <div className="stat-row-cards">
          {stats.map((s) => <StatCard key={s.label} {...s} />)}
        </div>

        <GCard title="تراکنش‌های اخیر" hint={pagination ? `${toFa(pagination.totalItems)} تراکنش` : ""}>
          {loadingTx ? (
            <p style={{ fontSize: 12.5, color: "var(--ink-dim)" }}>در حال بارگذاری...</p>
          ) : transactions.length ? (
            <div style={{ overflowX: "auto" }}>
              <table className="pay-table">
                <tbody>
                  <tr><th>نام</th><th>بابت</th><th>مبلغ</th><th>تاریخ</th></tr>
                  {transactions.map((t) => (
                    <tr key={t.id}>
                      <td>{t.userName}</td>
                      <td>{t.title}</td>
                      <td>{formatToman(t.amount)}</td>
                      <td>{new Date(t.date).toLocaleDateString("fa-IR")}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : <div className="empty-state">هنوز تراکنشی ثبت نشده.</div>}
        </GCard>

        {pagination && (
          <Pagination
            page={pagination.currentPage}
            totalPages={pagination.totalPages}
            totalItems={pagination.totalItems}
            itemWord="تراکنش"
            onChange={setPage}
          />
        )}
      </div>
    </>
  );
}
