import { useEffect, useRef, useState } from "react";

export default function useMinVisible(on, minMs = 800) {
  const [show, setShow] = useState(false);
  const until = useRef(null);
  
  useEffect(() => {
    if (on) { 
      setShow(true); 
      until.current = Date.now() + minMs; 
      return; 
    }
    const wait = Math.max(0, (until.current ?? 0) - Date.now());
    const t = setTimeout(() => setShow(false), wait);
    return () => clearTimeout(t);
  }, [on, minMs]);
  
  return show;
}