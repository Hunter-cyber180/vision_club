// group: { key, label, options: [{value,label}] یا [string] }
// selectedVal می‌تونه مقدار value باشه یا null (یعنی «همه»)
export default function ChipGroup({ group, selectedVal, onSelect }) {
  const options = group.options.map((o) => (typeof o === "string" ? { value: o, label: o } : o));
  return (
    <div className="filter-group">
      <span className="g-label">{group.label}</span>
      <div className="chip-row">
        <button
          className={`chip ${selectedVal === null ? "active" : ""}`}
          onClick={() => onSelect(group.key, null)}
        >
          همه
        </button>
        {options.map((opt) => (
          <button
            key={opt.value}
            className={`chip ${selectedVal === opt.value ? "active" : ""}`}
            onClick={() => onSelect(group.key, opt.value)}
          >
            {opt.label}
          </button>
        ))}
      </div>
    </div>
  );
}
