import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import Icon from "../components/Icon";
import SvgThumb from "../components/SvgThumb";
import { useAuth } from "../context/AuthContext";
import { useToast } from "../context/ToastContext";
import { fetchWorkshopById, purchaseWorkshop } from "../api/workshops";
import { fetchMyWorkshops } from "../api/panel";
import { addToCart, fetchMyCart } from "../api/cart";
import { toFa, formatToman } from "../utils/toFa";

export default function WorkshopDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { isAuthenticated, role, panelRole, profile } = useAuth();
  const toast = useToast();

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [workshop, setWorkshop] = useState(null);
  const [enrolled, setEnrolled] = useState(false);
  const [busy, setBusy] = useState(false);
  const [inCart, setInCart] = useState(false);

  const isBuyerAccount = isAuthenticated && role === "user";
  const isStudent = panelRole === "student";
  const isAdminAccount = role === "admin";

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    Promise.all([
      fetchWorkshopById(id),
      isBuyerAccount && profile?.id ? fetchMyWorkshops(profile.id).catch(() => []) : Promise.resolve([]),
      isBuyerAccount ? fetchMyCart().catch(() => ({ items: [] })) : Promise.resolve({ items: [] }),
    ])
      .then(([w, myWorkshops, cart]) => {
        if (cancelled) return;
        setWorkshop(w);
        setEnrolled(myWorkshops.some((uw) => uw.workshop_id === Number(id) || uw.workshop?.id === Number(id)));
        setInCart((cart.items || []).some((i) => i.item_type === "workshop" && i.item_id === Number(id)));
      })
      .catch((err) => !cancelled && setError(err?.response?.data?.message || "دریافت اطلاعات کارگاه با خطا مواجه شد."))
      .finally(() => !cancelled && setLoading(false));
    return () => { cancelled = true; };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id]);

  if (loading) return <div className="wrap panel-wrap"><div className="empty-state">در حال بارگذاری...</div></div>;
  if (error || !workshop) return <div className="wrap panel-wrap"><div className="empty-state">{error || "کارگاه پیدا نشد."}</div></div>;

  const isFree = !workshop.price || workshop.price === 0;
  // برخلاف دوره‌ها، طبق درخواست صریح: هر مشاور و هر ادمینی (نه فقط مالک این
  // کارگاه) به همه‌ی کارگاه‌ها دسترسی مستقیم داره — نیازی به ثبت‌نام نیست.
  const isConsultantAccount = role === "consultant";
  const canWatch = enrolled || isConsultantAccount || isAdminAccount;

  const handleEnrollFree = async () => {
    setBusy(true);
    try {
      await purchaseWorkshop(workshop.id);
      toast("با موفقیت به کارگاه‌هات اضافه شد");
      setEnrolled(true);
    } catch (err) {
      toast(err?.response?.data?.message || "ثبت‌نام با خطا مواجه شد", "error");
    } finally {
      setBusy(false);
    }
  };

  const handleAddToCart = async () => {
    setBusy(true);
    try {
      await addToCart("workshop", workshop.id);
      toast("به سبد خرید اضافه شد");
      setInCart(true);
    } catch (err) {
      toast(err?.response?.data?.message || "افزودن به سبد خرید با خطا مواجه شد", "error");
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="wrap detail-view-inner fade-in">
      <button className="back-btn" onClick={() => navigate(-1)}><Icon name="chev" /> بازگشت به کارگاه‌ها</button>
      <div className="course-layout">
        <div className="course-main">
          <div className="player-mock">
            {canWatch && workshop.video_url ? (
              <video src={workshop.video_url} controls poster={workshop.video_thumbnail || undefined} style={{ width: "100%", height: "100%", objectFit: "cover" }} />
            ) : (
              <>
                <SvgThumb tint="violet" seed={"w" + workshop.id} />
                <div className="big-play" onClick={() => toast("برای تماشا ابتدا باید در کارگاه ثبت‌نام کنی")}><Icon name="lock" /></div>
              </>
            )}
          </div>
          <div className="glass course-info">
            <div className="course-info-head">
              <h1 className="course-title">{workshop.title}</h1>
              <div className="course-badges2">
                <span className="badge badge-violet">{workshop.category?.name || "کارگاه"}</span>
                <span className={`badge ${isFree ? "badge-teal" : "badge-gold"}`}>{isFree ? (isStudent && workshop.price > 0 ? "رایگان برای اعضای ویژه" : "رایگان") : formatToman(workshop.price)}</span>
              </div>
            </div>
            <div className="course-meta2">
              <span className="meta-item2"><Icon name="user" /> {workshop.instructor_name || "—"}</span>
              <span className="meta-item2"><Icon name="clock2" /> {toFa(workshop.duration_minutes)} دقیقه</span>
            </div>
            <p className="course-desc2">{workshop.description}</p>

            {isBuyerAccount && (
              <div className="settings-actions" style={{ marginTop: 16 }}>
                {enrolled ? (
                  <span className="badge badge-teal" style={{ padding: "10px 16px", fontSize: 13 }}><Icon name="checkCircle" /> قبلاً به این کارگاه اضافه شده</span>
                ) : isFree ? (
                  <button className="btn btn-gold btn-block" disabled={busy} onClick={handleEnrollFree}>
                    <Icon name="plus" /> {busy ? "در حال افزودن..." : "افزودن به لیست کارگاه‌ها"}
                  </button>
                ) : inCart ? (
                  <button className="btn btn-ghost btn-block" onClick={() => navigate("/cart")}><Icon name="wallet" /> در سبد خریدته — برو به سبد خرید</button>
                ) : (
                  <button className="btn btn-gold btn-block" disabled={busy} onClick={handleAddToCart}>
                    <Icon name="cash" /> {busy ? "در حال افزودن..." : `خرید (${formatToman(workshop.price)})`}
                  </button>
                )}
              </div>
            )}
            {!isAuthenticated && (
              <div className="settings-actions" style={{ marginTop: 16 }}>
                <button className="btn btn-gold btn-block" onClick={() => navigate("/auth")}>برای ثبت‌نام در کارگاه وارد شو</button>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
