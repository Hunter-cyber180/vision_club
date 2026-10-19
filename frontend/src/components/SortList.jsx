export default function SortList({ sorts, activeKey, onSelect }) {
  return (
    <div className="filter-group">
      <span className="g-label">مرتب‌سازی</span>
      <div className="sort-list">
        {sorts.map((s) => (
          <button
            key={s.key}
            className={`sort-opt ${activeKey === s.key ? "active" : ""}`}
            onClick={() => onSelect(s.key)}
          >
            <span className="dot" />
            {s.label}
          </button>
        ))}
      </div>
    </div>
  );
}
