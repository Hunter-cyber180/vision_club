import Icon from "../components/Icon";

export default function ComingSoon({ title = "این بخش", icon = "clock2" }) {
  return (
    <div className="wrap panel-wrap fade-in">
      <div className="glass card" style={{ padding: 40, textAlign: "center", margin: "20px 0 0 0" }}>
        <div className="feature-icon" style={{ margin: "0 auto 14px", background: "color-mix(in srgb, var(--gold) 16%, transparent)", color: "var(--gold-bright)" }}>
          <Icon name={icon} />
        </div>
        <h3>{title} به‌زودی وصل می‌شه</h3>
        <p style={{ color: "var(--ink-dim)", fontSize: 13.5 }}>
          این بخش در فاز بعدی (اتصال پنل‌های کاربر/مشاور/ادمین به بکند) تکمیل می‌شه.
        </p>
      </div>
    </div>
  );
}
