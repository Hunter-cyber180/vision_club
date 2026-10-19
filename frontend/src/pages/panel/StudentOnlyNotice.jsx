import Icon from "../../components/Icon";

export default function StudentOnlyNotice() {
  return (
    <div className="wrap panel-wrap fade-in">
      <div className="glass card" style={{ padding: 40, textAlign: "center" }}>
        <div className="feature-icon" style={{ margin: "0 auto 14px", background: "color-mix(in srgb, var(--coral) 16%, transparent)", color: "var(--coral)" }}>
          <Icon name="alertTri" />
        </div>
        <h3>این بخش فقط برای دانش‌آموزها فعاله</h3>
        <p style={{ color: "var(--ink-dim)", fontSize: 13.5 }}>
          وقتی یکی از مشاورهای ویژن کلاب پذیرشت رو انجام بده، این بخش برات باز می‌شه.
        </p>
      </div>
    </div>
  );
}
