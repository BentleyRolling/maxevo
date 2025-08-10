import React from "react";

const Logo = ({ chatId, size = 56, className = "" }) => {
  // key on chatId so starting a new chat re-mounts & retriggers animation
  return (
    <img
      key={chatId}
      src="/maxevo-logo.png"
      alt="MaxEvo"
      width={size}
      height={size}
      className={`portal-spin ${className}`}
      draggable={false}
    />
  );
};

export default Logo;