import React from "react";

const LionelSilhouette = ({ size = 110, color = "#ffd54f" }) => {
  const wrapperStyle = {
    width: size,
    height: size,
    background: "#fff",
    display: "inline-flex",
    alignItems: "center",
    justifyContent: "center",
    borderRadius: 8,
    overflow: "hidden",
    boxSizing: "border-box",
    padding: Math.max(4, Math.round(size * 0.06)),
  };

  return (
    <span className="vinyl-icon" style={wrapperStyle} aria-hidden>
      <svg
        width={Math.max(size * 0.8, 56)}
        height={Math.max(size * 0.8, 56)}
        viewBox="0 0 200 200"
        xmlns="http://www.w3.org/2000/svg"
        role="img"
        aria-hidden
      >
        <g fill={color} stroke="none">
          {/* main hair outline (traced) */}
          <path d="M100 12c-14 0-26 6-36 16-8 8-14 18-16 28-10 2-18 9-24 18-8 12-10 28-8 42 2 14 10 26 20 36 12 12 28 20 46 22 4 12 12 22 22 30 18 14 40 16 60 8 8-4 16-8 22-14 8-8 14-18 18-28 6-12 6-26 2-40-4-12-14-22-26-28 4-10 6-22 4-34-2-12-8-22-16-30-10-12-22-18-36-18z" />
          {/* shoulders / neckline */}
          <path
            d="M40 152c10 6 28 16 60 16s50-10 60-16c-6 6-20 12-60 12s-54-6-60-12z"
            fill={color}
            opacity="0.95"
          />
        </g>
      </svg>
    </span>
  );
};

export default LionelSilhouette;
