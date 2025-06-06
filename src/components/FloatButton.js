// FloatingButton.js
import React from "react";

const FloatButton = ({ onClick, label = "+", style = {} }) => {
  return (
    <button
      onClick={onClick}
      class="btn btn-secondary"
      style={{
        position: "fixed",
        bottom: "2rem",
        right: "2rem",
        width: "60px",
        height: "60px",
        borderRadius: "50%",
        backgroundColor: "#1976d2", // Material UI blue
        color: "white",
        border: "none",
        fontSize: "24px",
        boxShadow: "0 4px 12px rgba(0, 0, 0, 0.3)",
        cursor: "pointer",
        transition: "background 0.3s",
        zIndex: 1000,
        ...style,
      }}
      onMouseOver={(e) => {
        e.target.style.backgroundColor = "#115293"; // darker on hover
      }}
      onMouseOut={(e) => {
        e.target.style.backgroundColor = "#1976d2"; // reset on mouse out
      }}
    >
      {label}
      
    </button>
  );
};

export default FloatButton;
