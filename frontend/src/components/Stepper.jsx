import Icon from "./Icon";
import { toFa } from "../utils/toFa";

export default function Stepper({ steps, activeStep }) {
  const pct = steps.length > 1 ? (activeStep / (steps.length - 1)) * 100 : 0;
  return (
    <div className="route">
      <div className="progress-fill" style={{ width: `${pct}%` }} />
      {steps.map((s, i) => (
        <div key={s.title} className={`stop ${i === activeStep ? "active" : ""} ${i < activeStep ? "done" : ""}`}>
          <div className="marker">{i < activeStep ? <Icon name="check" /> : toFa(i + 1)}</div>
          <div className="label">{s.title}</div>
        </div>
      ))}
    </div>
  );
}
