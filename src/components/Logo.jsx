import React from "react";

const Logo = ({ chatId, size = 56, className = "" }) => {
  const [play, setPlay] = React.useState(false);
  const last = React.useRef(undefined);

  React.useEffect(() => {
    if (last.current === chatId) return; // ignore duplicate mounts
    last.current = chatId;
    // restart animation by toggling the class once
    setPlay(false);
    requestAnimationFrame(() => setPlay(true)); // next frame → apply .portal-winddown
  }, [chatId]);

  return (
    <img
      src="/maxevo-logo.png"
      width={size}
      height={size}
      alt="MaxEvo"
      draggable={false}
      className={`${play ? "portal-winddown" : ""} ${className}`}
      style={{ display: "block" }}
    />
  );
};

export default Logo;