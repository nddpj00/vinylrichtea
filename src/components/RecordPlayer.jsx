import React from "react";
import "./recordplayer.css";

const RecordPlayer = ({ size = 180 }) => {
  return (
    <div className="record-player" style={{ width: size, height: size }}>
      <div className="platter">
        <div className="label" />
      </div>
      <div className="arm" />
    </div>
  );
};

export default RecordPlayer;
