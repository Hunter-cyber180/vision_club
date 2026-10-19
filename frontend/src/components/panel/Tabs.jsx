export default function Tabs({ tabs, active, onChange }) {
  return (
    <div className="tabs">
      {tabs.map((t) => (
        <button key={t.k} className={`tab ${active === t.k ? "active" : ""}`} onClick={() => onChange(t.k)}>
          {t.label}
        </button>
      ))}
    </div>
  );
}
