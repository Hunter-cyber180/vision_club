import { useState } from "react";
import Icon from "./Icon";

// f: { id, label, type, options?, placeholder?, optional? }
// type: text | email | tel | date | number | select | textarea | password | checkbox-group
export default function WizardField({ f, value, onChange }) {
  const [showPass, setShowPass] = useState(false);

  if (f.type === "select") {
    return (
      <select className="input" value={value ?? ""} onChange={(e) => onChange(e.target.value)}>
        <option value="" disabled>انتخاب کن</option>
        {f.options.map((o) => {
          const opt = typeof o === "string" ? { value: o, label: o } : o;
          return <option key={opt.value} value={opt.value}>{opt.label}</option>;
        })}
      </select>
    );
  }

  if (f.type === "textarea") {
    return (
      <textarea
        className="input"
        rows={3}
        placeholder={f.placeholder || ""}
        value={value ?? ""}
        onChange={(e) => onChange(e.target.value)}
      />
    );
  }

  if (f.type === "checkbox-group") {
    const arr = Array.isArray(value) ? value : [];
    return (
      <div className="chip-select-row">
        {f.options.map((o) => {
          const opt = typeof o === "string" ? { value: o, label: o } : o;
          const active = arr.includes(opt.value);
          return (
            <button
              key={opt.value}
              type="button"
              className={`chip-select ${active ? "active" : ""}`}
              onClick={() => {
                const next = active ? arr.filter((v) => v !== opt.value) : [...arr, opt.value];
                onChange(next);
              }}
            >
              {opt.label}
            </button>
          );
        })}
      </div>
    );
  }

  if (f.type === "password") {
    return (
      <div className="password-field">
        <input
          className="input"
          type={showPass ? "text" : "password"}
          placeholder={f.placeholder || ""}
          value={value ?? ""}
          onChange={(e) => onChange(e.target.value)}
        />
        <button type="button" className="password-toggle" onClick={() => setShowPass((v) => !v)}>
          <Icon name={showPass ? "eyeoff" : "eye"} />
        </button>
      </div>
    );
  }

  return (
    <input
      className="input"
      type={f.type}
      placeholder={f.placeholder || ""}
      value={value ?? ""}
      onChange={(e) => onChange(e.target.value)}
    />
  );
}
