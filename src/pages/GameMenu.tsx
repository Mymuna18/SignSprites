import React, { useState } from "react";
import { useNavigate } from "react-router-dom";

// IMPORT IMAGES
import menuBackground from "../assets/startingMenu.png";
import playButton from "../assets/play.png";
import playButtonHover from "../assets/playhover.png";

export default function GameMenu() {
  const navigate = useNavigate();
  const [hoveredPlay, setHoveredPlay] = useState(false);
  const [showInstructions, setShowInstructions] = useState(false);

  return (
    <div
      style={{
        width: "100vw",
        height: "100vh",
        backgroundImage: `url(${menuBackground})`,
        backgroundSize: "cover",
        backgroundPosition: "center",
        display: "flex",
        position: "relative",
        overflow: "hidden",
        fontFamily: "'Segoe UI', Tahoma, Geneva, Verdana, sans-serif",
      }}
    >
      {/* Big Play Button */}
      <img
        src={hoveredPlay ? playButtonHover : playButton}
        alt="Play"
        style={{
          position: "absolute",
          bottom: "15%",
          right: "12%",
          cursor: "pointer",
          width: "450px",
          transition: "transform 0.2s ease-in-out",
          transform: hoveredPlay ? "scale(1.1)" : "scale(1)",
          zIndex: 10,
        }}
        // Trigger Instructions instead of going straight to game
        onClick={() => setShowInstructions(true)}
        onMouseEnter={() => setHoveredPlay(true)}
        onMouseLeave={() => setHoveredPlay(false)}
      />

      {/* Instructions Modal Overlay */}
      {showInstructions && (
        <div style={overlayStyle} onClick={() => setShowInstructions(false)}>
          <div style={modalStyle} onClick={(e) => e.stopPropagation()}>
            <button
              style={closeButtonStyle}
              onClick={() => setShowInstructions(false)}
            >
              ✕
            </button>

            <div style={{ textAlign: "center", marginBottom: "24px" }}>
              <span style={{ fontSize: "2.5rem" }}>📜</span>
              <h2
                style={{
                  fontSize: "1.8rem",
                  marginTop: "8px",
                  color: "#2c3e50",
                }}
              >
                How to Play
              </h2>
            </div>

            <div style={instructionListStyle}>
              {/* Step 1 */}
              <div style={stepStyle}>
                <span
                  style={{
                    ...badgeStyle,
                    background: "linear-gradient(135deg, #d4af37, #ffdbac)",
                  }}
                >
                  1
                </span>
                <p>
                  <strong>Move your sprite</strong> using the arrow keys to
                  explore the magical world.
                </p>
              </div>

              {/* Step 2 */}
              <div style={stepStyle}>
                <span
                  style={{
                    ...badgeStyle,
                    background: "linear-gradient(135deg, #ff7f50, #ffb6c1)",
                  }}
                >
                  2
                </span>
                <p>
                  <strong>Collect stars</strong> by walking into them. Each star
                  represents a letter of the ASL alphabet (A–Z).
                </p>
              </div>

              {/* Step 3 */}
              <div style={stepStyle}>
                <span
                  style={{
                    ...badgeStyle,
                    background: "linear-gradient(135deg, #8a9a5b, #a8c49a)",
                  }}
                >
                  3
                </span>
                <p>
                  <strong>Sign the letter!</strong> Your camera will open with a
                  reference image. Show the correct hand sign to collect the
                  star.
                </p>
              </div>

              {/* Step 4 */}
              <div style={stepStyle}>
                <span
                  style={{
                    ...badgeStyle,
                    background: "linear-gradient(135deg, #967bb6, #4b0082)",
                  }}
                >
                  4
                </span>
                <p>
                  <strong>Cross the finish line</strong> after collecting all 26
                  stars to complete the game!
                </p>
              </div>
            </div>

            <button
              style={gotItButtonStyle}
              // This is where we finally go to the game
              onClick={() => navigate("/game")}
            >
              Got it! Let's Play
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

// STYLES
const overlayStyle: React.CSSProperties = {
  position: "fixed",
  inset: 0,
  background: "rgba(0,0,0,0.7)",
  display: "flex",
  justifyContent: "center",
  alignItems: "center",
  zIndex: 1000,
};

const modalStyle: React.CSSProperties = {
  background: "white",
  padding: "40px",
  borderRadius: "30px",
  width: "500px",
  maxWidth: "90vw",
  position: "relative",
  boxShadow: "0 20px 40px rgba(0,0,0,0.3)",
};

const closeButtonStyle: React.CSSProperties = {
  position: "absolute",
  top: "20px",
  right: "20px",
  background: "none",
  border: "none",
  fontSize: "20px",
  cursor: "pointer",
  color: "#999",
};

const instructionListStyle: React.CSSProperties = {
  display: "flex",
  flexDirection: "column",
  gap: "20px",
  fontSize: "1rem",
  lineHeight: 1.6,
  color: "#333",
};

const stepStyle: React.CSSProperties = {
  display: "flex",
  gap: "14px",
  alignItems: "flex-start",
};

const badgeStyle: React.CSSProperties = {
  borderRadius: "50%",
  width: "32px",
  height: "32px",
  minWidth: "32px",
  display: "flex",
  alignItems: "center",
  justifyContent: "center",
  fontSize: "0.9rem",
  fontWeight: 700,
  color: "white",
};

const gotItButtonStyle: React.CSSProperties = {
  width: "100%",
  marginTop: "30px",
  padding: "15px",
  borderRadius: "15px",
  border: "none",
  background: "#2c3e50",
  color: "white",
  fontSize: "1.1rem",
  fontWeight: "bold",
  cursor: "pointer",
  transition: "background 0.2s",
};
