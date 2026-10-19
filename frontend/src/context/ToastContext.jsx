import { createContext, useCallback, useContext, useRef, useState } from "react";
import Icon from "../components/Icon";

const ToastContext = createContext(null);

export function ToastProvider({ children }) {
  const [toastState, setToastState] = useState(null); // { msg, type }
  const timerRef = useRef(null);

  const toast = useCallback((msg, type = "success") => {
    setToastState({ msg, type });
    clearTimeout(timerRef.current);
    timerRef.current = setTimeout(() => setToastState(null), 2200);
  }, []);

  return (
    <ToastContext.Provider value={toast}>
      {children}
      <div id="toast" className={`toast glass ${toastState ? "show" : ""}`}>
        {toastState && (
          <>
            <span className={`toast-ico ${toastState.type}`}>
              <Icon name={toastState.type === "error" ? "alertTri" : "check"} />
            </span>
            <span>{toastState.msg}</span>
          </>
        )}
      </div>
    </ToastContext.Provider>
  );
}

export function useToast() {
  const ctx = useContext(ToastContext);
  if (!ctx) throw new Error("useToast باید داخل ToastProvider استفاده بشه");
  return ctx;
}
