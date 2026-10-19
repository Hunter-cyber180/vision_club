import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import Icon from "../../components/Icon";
import { useToast } from "../../context/ToastContext";
import { fetchMyCart, removeFromCart, checkoutCart } from "../../api/cart";
import { fetchMyWallet } from "../../api/panel";
import { formatToman, toFa } from "../../utils/toFa";

export default function Cart() {
  const navigate = useNavigate();
  const toast = useToast();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [items, setItems] = useState([]);
  const [total, setTotal] = useState(0);
  const [balance, setBalance] = useState(0);
  const [removingId, setRemovingId] = useState(null);
  const [checkingOut, setCheckingOut] = useState(false);

  const load = () => {
    setLoading(true);
    Promise.all([fetchMyCart(), fetchMyWallet()])
      .then(([cart, wallet]) => {
        setItems(cart.items || []);
        setTotal(cart.total || 0);
        setBalance(wallet?.balance || 0);
      })
      .catch((err) => setError(err?.response?.data?.message || "دریافت سبد خرید با خطا مواجه شد."))
      .finally(() => setLoading(false));
  };

  useEffect(load, []);

  const handleRemove = async (cartItemId) => {
    setRemovingId(cartItemId);
    try {
      await removeFromCart(cartItemId);
      load();
    } catch (err) {
      toast(err?.response?.data?.message || "حذف از سبد خرید با خطا مواجه شد", "error");
    } finally {
      setRemovingId(null);
    }
  };

  const handleCheckout = async () => {
    if (balance < total) {
      toast("موجودی کیف پول کافی نیست. لطفاً ابتدا کیف پولت رو شارژ کن.", "error");
      return;
    }
    setCheckingOut(true);
    try {
      await checkoutCart();
      toast("خرید با موفقیت انجام شد");
      load();
    } catch (err) {
      toast(err?.response?.data?.message || "پرداخت سبد خرید با خطا مواجه شد", "error");
    } finally {
      setCheckingOut(false);
    }
  };

  return (
    <>
      <div className="panel-head fade-in"><h2><Icon name="cash" /> سبد خرید</h2><p>دوره‌ها و کارگاه‌های انتخابی‌ت رو اینجا خریداری کن</p></div>
      <div className="wrap panel-wrap" style={{ paddingBottom: 48 }}>
        <div className="glass card" style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 10, marginBottom: 14, flexWrap: "wrap", padding: "14px 16px" }}>
          <div style={{ display: "flex", alignItems: "center", gap: 8, fontSize: 12.5, color: "var(--ink-dim)" }}>
            <Icon name="wallet" /> موجودی کیف پول:
          </div>
          <b style={{ fontSize: 15 }}>{formatToman(balance)}</b>
          <button className="btn btn-ghost btn-sm" onClick={() => navigate("/panel/wallet")}>شارژ کیف پول</button>
        </div>

        {loading && <div className="empty-state">در حال بارگذاری...</div>}
        {!loading && error && <div className="empty-state">{error}</div>}
        {!loading && !error && (
          items.length === 0 ? (
            <div className="empty-state">سبد خریدت خالیه.</div>
          ) : (
            <>
              {items.map((it) => (
                <div className="glass stu-card fade-in" key={it.cart_item_id} style={{ flexWrap: "wrap" }}>
                  <div className="ent-ico" style={{ background: "color-mix(in srgb, var(--gold) 16%, transparent)", color: "var(--gold-bright)" }}>
                    <Icon name={it.item_type === "course" ? "book" : "tool"} />
                  </div>
                  <div style={{ flex: 1, minWidth: 140 }}>
                    <h3 style={{ fontSize: 13.5 }}>{it.title}</h3>
                    <p style={{ fontSize: 11.5, color: "var(--ink-dim)" }}>{it.meta}</p>
                  </div>
                  <b style={{ fontSize: 13, flexShrink: 0 }}>{formatToman(it.price)}</b>
                  <div className="act-btn danger" title="حذف از سبد خرید" onClick={() => handleRemove(it.cart_item_id)} style={{ opacity: removingId === it.cart_item_id ? 0.5 : 1 }}>
                    <Icon name="trashBin" />
                  </div>
                </div>
              ))}

              <div className="glass card" style={{ marginTop: 14, padding: "16px", display: "flex", flexDirection: "column", gap: 12 }}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", fontSize: 13.5 }}>
                  <span>جمع کل ({toFa(items.length)} مورد)</span>
                  <b style={{ fontSize: 17 }}>{formatToman(total)}</b>
                </div>
                {balance < total && (
                  <div className="empty-state" style={{ padding: "8px 0", color: "var(--coral)", fontSize: 12 }}>موجودی کیف پول کافی نیست.</div>
                )}
                <button className="btn btn-gold btn-block" disabled={checkingOut} onClick={handleCheckout}>
                  <Icon name="check" /> {checkingOut ? "در حال پرداخت..." : "پرداخت و تکمیل خرید از کیف پول"}
                </button>
              </div>
            </>
          )
        )}
      </div>
    </>
  );
}
