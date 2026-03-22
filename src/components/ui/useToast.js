import { useCallback, useRef, useState } from "react";

export function useToast() {
  const [toast, setToast] = useState(null); // { type, title, message }
  const timerRef = useRef(null);

  const show = useCallback((next, ms = 2000) => {
    if (timerRef.current) clearTimeout(timerRef.current);

    setToast({
      id: Date.now(),
      type: next?.type || "success", // success | error | info | warn
      title: next?.title || "",
      message: next?.message || "",
    });

    timerRef.current = setTimeout(() => {
      setToast(null);
      timerRef.current = null;
    }, ms);
  }, []);

  const hide = useCallback(() => {
    if (timerRef.current) clearTimeout(timerRef.current);
    timerRef.current = null;
    setToast(null);
  }, []);

  return { toast, showToast: show, hideToast: hide };
}