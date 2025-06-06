// FloatingButton.js
import React from "react";
import video from '../images/video.png'

const VideoFloatButton = ({ onClick, label = "+", style = {} }) => {
  return (
    <button
      onClick={onClick}
      style={{
        background: "linear-gradient(145deg, #6a82fb, #fc5c7d)", 
        position: "fixed",
        bottom: "2rem",
        right: "2rem",
        width: "60px",
        height: "60px",
        borderRadius: "50%",
        color: "white",
        border: "none",
        fontSize: "24px",
        boxShadow: "0 4px 12px rgba(0, 0, 0, 0.3)",
        cursor: "pointer",
        transition: "background 0.3s",
        zIndex: 1000,
        ...style,
      }}
   
    >
      <img src={video}/>
    </button>
  );
};

export default VideoFloatButton;
