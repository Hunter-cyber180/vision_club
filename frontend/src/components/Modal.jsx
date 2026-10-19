import { useEffect, useState } from "react";
import Icon from "./Icon";

// یک مودال ساده که همون ساختار DOM/کلاس‌های CSS نسخه‌ی اصلی
// (#modalOverlay + #modalRoot > .modal) رو بازسازی می‌کنه تا انیمیشن‌ها حفظ بشن.
export default function Modal({ open, onClose, title, footer, children }) {
  const [mounted, setMounted] = useState(open);

  useEffect(() => {
    if (open) {
      setMounted(true);
    } else if (mounted) {
      const t = setTimeout(() => setMounted(false), 260);
      return () => clearTimeout(t);
    }
  }, [open]); // eslint-disable-line react-hooks/exhaustive-deps

  if (!mounted) return null;

  return (
    <>
      <div id="modalOverlay" className={open ? "open" : ""} onClick={onClose} />
      <div id="modalRoot">
        <div className="modal">
          <div className="modal-head">
            <h4>{title}</h4>
            <div className="modal-close" onClick={onClose}><Icon name="trash" /></div>
          </div>
          <div className="modal-body scroll">{children}</div>
          {footer && <div className="modal-foot">{footer}</div>}
        </div>
      </div>
    </>
  );
}
