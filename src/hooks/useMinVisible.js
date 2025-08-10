import { useEffect, useRef, useState } from "react";

export default function useMinVisible(on, minMs = 600) {
  const [show, setShow] = useState(false);
  const until = useRef(null);

  useEffect(() => {
    if (on) {
      setShow(true);
      until.current = Date.now() + minMs;
    } else {
      const now = Date.now();
      const wait = Math.max(0, (until.current ?? now) - now);
      const t = setTimeout(() => setShow(false), wait);
      return () => clearTimeout(t);
    }
  }, [on, minMs]);

  return show;
}