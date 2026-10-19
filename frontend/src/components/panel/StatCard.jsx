import Icon from "../Icon";

export default function StatCard({ icon, tint, val, label }) {
  return (
    <div className="stat-card">
      <div className={`stat-ico ${tint}`}><Icon name={icon} /></div>
      <div><b>{val}</b><span>{label}</span></div>
    </div>
  );
}
