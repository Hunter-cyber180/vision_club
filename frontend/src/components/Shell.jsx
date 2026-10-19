import { useEffect, useState } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import Icon from "./Icon";
import { useAuth } from "../context/AuthContext";

const GUEST_NAV = [
  { to: "/", key: "home", label: "خانه", icon: "home" },
  { to: "/courses", key: "courses", label: "دوره‌ها", icon: "book" },
  { to: "/workshops", key: "workshops", label: "کارگاه‌ها", icon: "workshop" },
  { to: "/exams", key: "exams", label: "آزمون‌ها", icon: "exam" },
];

// منوی شیت موبایل وقتی کاربر لاگین نکرده: همون گزینه‌های صفحه اصلی +
// ورود و ثبت‌نام (چون سایدبار/bottomnav دیگه بسته به لاگین عوض نمی‌شن).
const LOGGED_OUT_MENU = [
  ...GUEST_NAV,
  { to: "/auth", label: "ورود", icon: "lock" },
  { to: "/auth", label: "ثبت‌نام", icon: "user", registerMode: true },
];

// fullMenu: منوی کامل برای سایدبار و شیت موبایل (دقیقاً مثل fullMenuFor() نسخه‌ی اصلی)
function fullMenuForRole(role) {
  if (role === "student") return [
    { to: "/panel/dashboard", label: "داشبورد", icon: "home" },
    { to: "/panel/my-courses", label: "دوره‌های من", icon: "book" },
    { to: "/panel/my-workshops", label: "کارگاه‌های من", icon: "workshop" },
    { to: "/panel/my-exams", label: "آزمون‌های من", icon: "exam" },
    { to: "/panel/reports", label: "گزارش‌ها", icon: "report" },
    { to: "/panel/weekly-schedule", label: "برنامه هفتگی", icon: "calendar" },
    { to: "/panel/chat", label: "چت", icon: "chat" },
    { to: "/panel/cart", label: "سبد خرید", icon: "cash" },
    { to: "/panel/wallet", label: "کیف پول", icon: "wallet" },
    { to: "/panel/settings", label: "تنظیمات حساب", icon: "settings" },
  ];
  if (role === "consultant") return [
    { to: "/panel/dashboard", label: "داشبورد", icon: "home" },
    { to: "/panel/students", label: "دانش‌آموزان", icon: "users" },
    { to: "/panel/my-classes", label: "کلاس‌ها و جزوات", icon: "book" },
    { to: "/panel/workshops", label: "کارگاه‌های من", icon: "workshop" },
    { to: "/panel/chat", label: "چت", icon: "chat" },
    { to: "/panel/settings", label: "تنظیمات حساب", icon: "settings" },
  ];
  if (role === "admin") return [
    { to: "/panel/dashboard", label: "داشبورد", icon: "home" },
    { to: "/panel/finance", label: "امور مالی", icon: "cash" },
    { to: "/panel/workshops", label: "کارگاه‌ها", icon: "workshop" },
    { to: "/panel/students", label: "کاربران", icon: "users" },
    { to: "/panel/consultants", label: "مشاوران", icon: "user" },
    { to: "/panel/my-classes", label: "کلاس‌ها و جزوات", icon: "book" },
    { to: "/panel/chat", label: "چت", icon: "chat" },
    { to: "/panel/settings", label: "تنظیمات", icon: "settings" },
  ];
  return [
    { to: "/panel/dashboard", label: "داشبورد", icon: "home" },
    { to: "/panel/my-courses", label: "دوره‌های من", icon: "book" },
    { to: "/panel/my-workshops", label: "کارگاه‌های من", icon: "workshop" },
    { to: "/panel/my-exams", label: "آزمون‌های من", icon: "exam" },
    { to: "/panel/chat", label: "چت", icon: "chat" },
    { to: "/panel/cart", label: "سبد خرید", icon: "cash" },
    { to: "/panel/wallet", label: "کیف پول", icon: "wallet" },
    { to: "/panel/settings", label: "تنظیمات حساب", icon: "settings" },
  ];
}

export default function Shell({ children }) {
  // پیش‌فرض CSS وقتی data-theme ست نشده «روشن» است (html:not([data-theme])),
  // پس باید state اولیه هم دقیقاً همینو منعکس کنه، وگرنه اولین کلیک فقط
  // attribute رو با یه چیزی که از قبل بصری بوده یکی می‌کنه و انگار اثر نداره
  // (باگ «دو بار کلیک لازمه»). ترجیح با مقدار ذخیره‌شده در localStorage است.
  const [theme, setTheme] = useState(() => {
    const stored = typeof window !== "undefined" ? localStorage.getItem("theme") : null;
    if (stored === "dark" || stored === "light") return stored;
    return document.documentElement.getAttribute("data-theme") || "light";
  });
  const [menuOpen, setMenuOpen] = useState(false);
  const { isAuthenticated, panelRole, profile, logout } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();

  // همیشه بلافاصله بعد از رندر، DOM را با state هماهنگ نگه می‌داریم —
  // این تضمین می‌کنه اولین کلیک هم فوراً و به‌درستی اثر بصری داشته باشه.
  useEffect(() => {
    document.documentElement.setAttribute("data-theme", theme);
    localStorage.setItem("theme", theme);
  }, [theme]);

  const toggleTheme = () => {
    setTheme((t) => (t === "dark" ? "light" : "dark"));
  };

  // navbar پایین موبایل همیشه ثابته (خانه/دوره‌ها/کارگاه‌ها/آزمون‌ها + منو)،
  // چه لاگین کرده باشی چه نه؛ فقط محتوای «منو» بسته به لاگین فرق می‌کنه.
  const nav = GUEST_NAV;
  const fullMenu = isAuthenticated ? fullMenuForRole(panelRole) : LOGGED_OUT_MENU;
  const displayName = profile ? [profile.name, profile.lastname].filter(Boolean).join(" ") : "";

  const handleLogout = async () => {
    await logout();
    setMenuOpen(false);
    navigate("/");
  };

  const isHome = location.pathname === "/";
  // سایدبار و منوی پنل فقط داخل خودِ پنل (/panel/...) معنی دارن؛ صفحات
  // عمومی (خانه، دوره‌ها، کارگاه‌ها، آزمون‌ها) حتی برای کاربر لاگین‌شده هم
  // باید همون navbar بالا رو داشته باشن و سایدبار کنارشون باز نشه.
  const isPanelRoute = location.pathname.startsWith("/panel");

  return (
    <>
      <div id="topbar">
        <div className="logo"><div className="logo-mark">VC</div> ویژن کلاب</div>
        {!isPanelRoute && (
          <nav className="navbar-links">
            {GUEST_NAV.map((n) => (
              <Link key={n.key} className={`navbar-link ${location.pathname === n.to ? "active" : ""}`} to={n.to}>
                {n.label}
              </Link>
            ))}
          </nav>
        )}
        <div className="topbar-actions">
          <button className="icon-btn" onClick={toggleTheme}>
            <Icon name={theme === "dark" ? "sun" : "moon"} />
          </button>
          {isAuthenticated ? (
            <button className="icon-btn" onClick={() => navigate("/panel/settings")} title={displayName}>
              <div className="avatar" style={{ width: "100%", height: "100%", borderRadius: 12, fontSize: 13 }}>
                {(displayName || "ک")[0]}
              </div>
            </button>
          ) : (
            <Link className="btn btn-gold btn-sm" to="/auth">
              <Icon name="lock" /> ورود
            </Link>
          )}
        </div>
      </div>

      <div className="shell">
        {isAuthenticated && isPanelRoute && (
          <div id="sidebar">
            <div className="logo" style={{ marginBottom: 22, padding: "0 6px" }}>
              <div className="logo-mark">VC</div> ویژن کلاب
            </div>
            {fullMenu.map((m) => (
              <Link key={m.to} className={`side-link ${location.pathname === m.to ? "active" : ""}`} to={m.to}>
                <Icon name={m.icon} />
                <span>{m.label}</span>
              </Link>
            ))}
            <a
              className="side-link"
              href="javascript:void(0)"
              onClick={handleLogout}
              style={{ marginTop: "auto", color: "var(--coral)" }}
            >
              <Icon name="logout" />
              <span>خروج از حساب</span>
            </a>
          </div>
        )}
        <div id="app-main">
          {children}
          {!isHome && <div className="footer sheet-inline">© ۱۴۰۴ ویژن کلاب — مسیر شخصی‌سازی‌شده‌ی کنکور</div>}
        </div>
      </div>

      <div id="bottomnav">
        {nav.map((n) => (
          <button key={n.to} className={`nav-item ${location.pathname === n.to ? "active" : ""}`} onClick={() => navigate(n.to)}>
            <Icon name={n.icon} />
            <span>{n.label}</span>
          </button>
        ))}
        <button className={`nav-item ${menuOpen ? "active" : ""}`} onClick={() => setMenuOpen((v) => !v)}>
          <Icon name="menu" />
          <span>منو</span>
        </button>
      </div>

      <div id="menuOverlay" className={menuOpen ? "open" : ""} onClick={() => setMenuOpen(false)} />
      <div id="menuSheet" className={`glass ${menuOpen ? "open" : ""}`}>
        <div className="sheet-handle" />
        <div className="sheet-grid">
          {fullMenu.map((m) => (
            <button
              key={m.label}
              className="sheet-card"
              onClick={() => {
                setMenuOpen(false);
                navigate(m.to, m.registerMode ? { state: { mode: "register" } } : undefined);
              }}
            >
              <Icon name={m.icon} />
              <span>{m.label}</span>
            </button>
          ))}
          {isAuthenticated && (
            <button className="sheet-card" style={{ color: "var(--coral)" }} onClick={handleLogout}>
              <Icon name="logout" />
              <span>خروج</span>
            </button>
          )}
        </div>
      </div>
    </>
  );
}
