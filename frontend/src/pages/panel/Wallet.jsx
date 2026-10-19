import { useEffect, useState } from "react";
import Icon from "../../components/Icon";
import { useAuth } from "../../context/AuthContext";
import { useToast } from "../../context/ToastContext";
import {
  fetchMyWallet, createWalletCheckout,
  fetchMyTuitionPayments, payTuitionFromWallet,
} from "../../api/panel";
import { toFa, formatToman, jalaliMonthName } from "../../utils/toFa";

const CHARGE_AMOUNTS = [100000, 250000, 500000, 1000000];

function ChargeBox({ balance, onCharging }) {
  const toast = useToast();
  const [amount, setAmount] = useState("");
  const [submitting, setSubmitting] = useState(false);

  async function handleCharge(finalAmount) {
    const value = Number(finalAmount);
    if (!value || value <= 0) {
      toast("مبلغ نامعتبر است", "error");
      return;
    }
    setSubmitting(true);
    try {
      const { paymentUrl } = await createWalletCheckout(value);
      onCharging?.();
      window.location.href = paymentUrl;
    } catch (err) {
      toast(err?.response?.data?.message || "ساخت پرداخت با خطا مواجه شد", "error");
      setSubmitting(false);
    }
  }

  return (
    <div className="glass wallet-hero fade-in">
      <div className="bal-label">موجودی فعلی</div>
      <div className="bal-value">{formatToman(balance)}</div>
      <div className="amount-chips">
        {CHARGE_AMOUNTS.map((a) => (
          <button key={a} className="chip" disabled={submitting} onClick={() => handleCharge(a)}>
            {formatToman(a)}
          </button>
        ))}
      </div>
      <div style={{ display: "flex", gap: 8, justifyContent: "center", marginBottom: 14, flexWrap: "wrap" }}>
        <input
          type="number"
          min="1000"
          className="input"
          style={{ maxWidth: 200 }}
          placeholder="مبلغ دلخواه (تومان)"
          value={amount}
          onChange={(e) => setAmount(e.target.value)}
        />
      </div>
      <button className="btn btn-gold" disabled={submitting} onClick={() => handleCharge(amount)}>
        <Icon name="plus" /> {submitting ? "در حال انتقال به درگاه..." : "شارژ کیف پول"}
      </button>
    </div>
  );
}

function TuitionBox({ isStudent, tuitionAmount, walletBalance, onPaid }) {
  const toast = useToast();
  const [loading, setLoading] = useState(true);
  const [current, setCurrent] = useState(null);
  const [paying, setPaying] = useState(false);

  useEffect(() => {
    if (!isStudent) { setLoading(false); return; }
    let cancelled = false;
    fetchMyTuitionPayments()
      .then((items) => {
        if (cancelled) return;
        const now = new Date();
        // ماه/سال شمسی جاری رو از سمت بکند می‌گیریم؛ چون این‌جا فقط برای نمایش لازمه
        // ساده‌ترین راه اینه که آخرین رکورد (که findOrCreate بر اساس ماه جاری ساخته) رو در نظر بگیریم
        setCurrent(items[0] || null);
      })
      .finally(() => !cancelled && setLoading(false));
    return () => { cancelled = true; };
  }, [isStudent]);

  if (!isStudent) return null;

  async function handlePay() {
    setPaying(true);
    try {
      const result = await payTuitionFromWallet();
      setCurrent(result.tuitionPayment);
      onPaid?.(result.balance);
      toast("شهریه با موفقیت از کیف پول پرداخت شد.");
    } catch (err) {
      toast(err?.response?.data?.message || "پرداخت شهریه با خطا مواجه شد", "error");
    } finally {
      setPaying(false);
    }
  }

  const isPaid = current?.status === "paid";

  return (
    <div className="gcard" style={{ marginBottom: 16 }}>
      <div className="gcard-head"><h3>پرداخت شهریه</h3><span className="hint">از موجودی کیف پول</span></div>
      {loading ? (
        <p style={{ fontSize: 12.5, color: "var(--ink-dim)" }}>در حال بارگذاری...</p>
      ) : tuitionAmount == null ? (
        <div className="empty-state">مبلغ شهریه‌ی شما هنوز توسط مشاورتان مشخص نشده است.</div>
      ) : (
        <div style={{ padding: "0 4px 4px" }}>
          <div className="card-meta" style={{ marginBottom: 12 }}>
            <span className="pill">شهریه‌ی این ماه: {formatToman(tuitionAmount)}</span>
            {current && (
              <span className={`badge ${isPaid ? "badge-teal" : "badge-coral"}`}>
                {isPaid ? `پرداخت‌شده در ${jalaliMonthName(current.jalali_month)} ${toFa(current.jalali_year)}` : "پرداخت‌نشده"}
              </span>
            )}
          </div>
          {isPaid ? (
            <p style={{ fontSize: 12.5, color: "var(--ink-dim)" }}>شهریه‌ی این ماه پرداخت شده — ممنون از پرداخت به‌موقع‌تان.</p>
          ) : (
            <>
              {walletBalance < tuitionAmount && (
                <p style={{ fontSize: 12.5, color: "var(--coral)", marginBottom: 10 }}>
                  موجودی کیف پول کافی نیست. لطفاً ابتدا کیف پولت رو شارژ کن.
                </p>
              )}
              <button className="btn btn-gold" disabled={paying || walletBalance < tuitionAmount} onClick={handlePay}>
                {paying ? "در حال پرداخت..." : `پرداخت ${formatToman(tuitionAmount)} از کیف پول`}
              </button>
            </>
          )}
        </div>
      )}
    </div>
  );
}

export default function Wallet() {
  const { panelRole, profile, refreshProfile } = useAuth();
  const isStudent = panelRole === "student";
  const [loading, setLoading] = useState(true);
  const [balance, setBalance] = useState(0);
  const [charges, setCharges] = useState([]);

  const toast = useToast();

  useEffect(() => {
    // بعد از برگشت از درگاه پرداخت (شارژ کیف پول)، وضعیت رو با toast نشون بده
    // و پارامترهای query رو از URL پاک کن.
    const params = new URLSearchParams(window.location.search);
    const paymentStatus = params.get("payment");
    if (paymentStatus) {
      const message = params.get("message");
      if (paymentStatus === "success") toast(message || "کیف پول با موفقیت شارژ شد.");
      else toast(message || "پرداخت انجام نشد.", "error");
      window.history.replaceState({}, "", window.location.pathname);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    let cancelled = false;
    // مبلغ شهریه ممکنه همین چند لحظه پیش توسط مشاور تعیین/تغییر شده باشه؛
    // پروفایل رو دوباره از بکند می‌گیریم تا مقدار کش‌شده‌ی موقع لاگین رو نشون ندیم.
    refreshProfile();
    fetchMyWallet()
      .then((data) => {
        if (cancelled) return;
        setBalance(data.balance || 0);
        setCharges(data.charges || []);
      })
      .finally(() => !cancelled && setLoading(false));
    return () => { cancelled = true; };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <>
      <div className="panel-head fade-in"><h2><Icon name="wallet" /> کیف پول</h2><p>مدیریت موجودی و تراکنش‌هات{isStudent ? " و پرداخت شهریه" : ""}</p></div>
      <div className="wrap panel-wrap" style={{ paddingBottom: 48 }}>
        {loading ? (
          <div className="empty-state">در حال بارگذاری...</div>
        ) : (
          <>
            <ChargeBox balance={balance} />
            <TuitionBox
              isStudent={isStudent}
              tuitionAmount={profile?.tuition_amount ?? null}
              walletBalance={balance}
              onPaid={(newBalance) => setBalance(newBalance)}
            />
            <div className="gcard">
              <div className="gcard-head"><h3>تاریخچه‌ی شارژ کیف پول</h3><span className="hint">{toFa(charges.length)} تراکنش</span></div>
              {charges.length ? charges.map((c) => (
                <div className="tx-item" key={c.id}>
                  <div className="tx-ico in"><Icon name="plus" /></div>
                  <div className="tx-body">
                    <b>شارژ کیف پول</b>
                    <span>{new Date(c.created_at).toLocaleDateString("fa-IR")}</span>
                  </div>
                  <div className="tx-amount in">+{formatToman(c.charge_amount)}</div>
                </div>
              )) : <div className="empty-state">هنوز تراکنشی ثبت نشده.</div>}
            </div>
          </>
        )}
      </div>
    </>
  );
}
