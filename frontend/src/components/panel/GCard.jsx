import Icon from "../Icon";

export default function GCard({ icon, title, hint, children }) {
  return (
    <div className="gcard">
      <div className="gcard-head">
        <h3>{icon ? <Icon name={icon} /> : null} {title}</h3>
        {hint && <span className="hint">{hint}</span>}
      </div>
      {children}
    </div>
  );
}
