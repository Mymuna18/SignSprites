import React, { useRef, useEffect, useState, useCallback } from "react";
import aslChart from "./assets/handSigns.jpg";
import {
  HandLandmarker,
  FilesetResolver,
  DrawingUtils,
} from "@mediapipe/tasks-vision";
import { getASLTip } from "./api/Gemini";
import { checkGesture, smoothedGesture, isCorrect } from "./ASLGestures";

const DYNAMIC_LETTERS = ["J", "Z"];

interface CameraModalProps {
  onPass: () => void;
  targetLetter: string;
}

export const CameraModal: React.FC<CameraModalProps> = ({
  onPass,
  targetLetter,
}) => {
  const [showChart, setShowChart] = useState(true);
  const [isModelLoaded, setIsModelLoaded] = useState(false);
  const [handDetected, setHandDetected] = useState(false);
  const [prediction, setPrediction] = useState<string | null>(null);
  const [confidence, setConfidence] = useState(0);
  const [attempts, setAttempts] = useState(0);
  const [geminiTip, setGeminiTip] = useState<string | null>(null);
  const [loadingTip, setLoadingTip] = useState(false);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const handLandmarkerRef = useRef<HandLandmarker | null>(null);
  const requestRef = useRef<number | null>(null);
  const attemptsRef = useRef(0);
  const successRef = useRef(false);

  const isDynamic = DYNAMIC_LETTERS.includes(targetLetter);

  // ---------- MediaPipe + webcam ----------
  useEffect(() => {
    let stream: MediaStream | null = null;

    const initializeMediaPipe = async () => {
      const vision = await FilesetResolver.forVisionTasks(
        "https://cdn.jsdelivr.net/npm/@mediapipe/tasks-vision@latest/wasm",
      );

      const landmarker = await HandLandmarker.createFromOptions(vision, {
        baseOptions: {
          modelAssetPath:
            "https://storage.googleapis.com/mediapipe-models/hand_landmarker/hand_landmarker/float16/1/hand_landmarker.task",
          delegate: "GPU",
        },
        runningMode: "VIDEO",
        numHands: 1,
      });

      handLandmarkerRef.current = landmarker;
      setIsModelLoaded(true);
    };

    const startWebcam = async () => {
      try {
        stream = await navigator.mediaDevices.getUserMedia({ video: true });
        if (videoRef.current) {
          videoRef.current.srcObject = stream;
        }
      } catch (err) {
        console.error("Webcam error: ", err);
      }
    };

    initializeMediaPipe();
    startWebcam();

    return () => {
      if (stream) {
        stream.getTracks().forEach((track) => track.stop());
      }
      if (requestRef.current) {
        cancelAnimationFrame(requestRef.current);
      }
    };
  }, []);

  // ---------- Success / failure handling ----------
  const handleSuccess = useCallback(() => {
    if (successRef.current) return;
    successRef.current = true;
    setSuccessMessage(`You signed "${targetLetter}" correctly! ⭐`);
    setTimeout(() => onPass(), 1500);
  }, [targetLetter, onPass]);

  const handleFailedAttempt = useCallback(() => {
    attemptsRef.current += 1;
    setAttempts(attemptsRef.current);

    if (attemptsRef.current >= 2 && !geminiTip && !loadingTip) {
      setLoadingTip(true);
      getASLTip(targetLetter, attemptsRef.current)
        .then((tip) => {
          setGeminiTip(tip);
          setLoadingTip(false);
        })
        .catch(() => setLoadingTip(false));
    }
  }, [targetLetter, geminiTip, loadingTip]);

  // ---------- Video loop with fingerpose classification ----------
  const handleVideoLoad = () => {
    const video = videoRef.current;
    const canvas = canvasRef.current;
    if (!video || !canvas) return;

    const ctx = canvas.getContext("2d");
    if (!ctx) return;
    const drawingUtils = new DrawingUtils(ctx);

    let lastClassifyTime = 0;

    const drawToCanvas = () => {
      if (!video || video.paused || video.ended) return;

      ctx.clearRect(0, 0, canvas.width, canvas.height);
      ctx.drawImage(video, 0, 0, canvas.width, canvas.height);

      if (handLandmarkerRef.current && video.readyState >= 2) {
        const now = performance.now();
        const results = handLandmarkerRef.current.detectForVideo(video, now);

        if (results.landmarks && results.landmarks.length > 0) {
          setHandDetected(true);

          for (const landmarks of results.landmarks) {
            drawingUtils.drawLandmarks(landmarks, {
              color: "#FF0000",
              lineWidth: 2,
            });
            drawingUtils.drawConnectors(
              landmarks,
              HandLandmarker.HAND_CONNECTIONS,
              { color: "#00FF00", lineWidth: 4 },
            );
          }

          // Classify every 200ms using fingerpose
          if (!successRef.current && now - lastClassifyTime > 200) {
            lastClassifyTime = now;

            // Convert MediaPipe normalized landmarks to pixel coordinates for fingerpose
            const firstHand = results.landmarks[0];
            const landmarks21x3 = firstHand.map((lm) => [
              lm.x * 640,
              lm.y * 480,
              lm.z * 640,
            ]);

            // Debug log - remove after confirming it works
            console.log(
              "landmarks sample:",
              landmarks21x3[0],
              landmarks21x3[8],
            );

            // Get raw gesture result
            const rawResult = checkGesture(landmarks21x3);

            // Use smoothing for stable detection
            const smoothed = smoothedGesture(rawResult);

            if (rawResult) {
              setPrediction(rawResult.label);
              setConfidence(Math.round((rawResult.confidence / 10) * 100));

              // Check smoothed result for confirmation
              if (smoothed && isCorrect(targetLetter, smoothed)) {
                handleSuccess();
              } else if (
                rawResult.confidence > 7 &&
                rawResult.label !== targetLetter
              ) {
                handleFailedAttempt();
              }
            } else {
              setPrediction(null);
            }
          }
        } else {
          setHandDetected(false);
        }
      }
      requestRef.current = requestAnimationFrame(drawToCanvas);
    };
    drawToCanvas();
  };

  // ---------- Render ----------
  return (
    <div style={overlayStyle}>
      <div style={containerStyle}>
        {showChart && (
          <div style={chartSectionStyle}>
            <img src={aslChart} alt="ASL Chart" style={chartImageStyle} />
            <button
              onClick={() => setShowChart(false)}
              style={closeButtonStyle}
            >
              ✕
            </button>
          </div>
        )}

        <div style={cameraSectionStyle}>
          <h2 style={{ marginBottom: "10px" }}>
            {!isModelLoaded
              ? "Summoning the spirits... (Loading camera)"
              : successMessage
                ? successMessage
                : `Sign the letter: ${targetLetter}`}
          </h2>

          {isModelLoaded && !successMessage && (
            <p
              style={{
                marginBottom: "10px",
                fontSize: "0.95rem",
                color: handDetected ? "#51CF66" : "#aaa",
              }}
            >
              {handDetected
                ? isDynamic
                  ? `Hold the "${targetLetter}" position steady...`
                  : prediction
                    ? `Detecting: "${prediction}" (${confidence}%)`
                    : "Analyzing your hand..."
                : "Show your hand to the camera"}
            </p>
          )}

          <div
            style={{
              ...videoWrapperStyle,
              border: successMessage
                ? "4px solid #51CF66"
                : handDetected
                  ? "4px solid #51CF66"
                  : "4px solid #333",
            }}
          >
            <video
              ref={videoRef}
              autoPlay
              playsInline
              onLoadedData={handleVideoLoad}
              style={{ display: "none" }}
            />
            <canvas
              ref={canvasRef}
              width="640"
              height="480"
              style={canvasStyle}
            />

            {prediction && !successMessage && (
              <div
                style={{
                  position: "absolute",
                  top: "12px",
                  left: "12px",
                  background:
                    prediction === targetLetter
                      ? "rgba(81, 207, 102, 0.9)"
                      : "rgba(255, 107, 107, 0.9)",
                  color: "white",
                  padding: "8px 16px",
                  borderRadius: "12px",
                  fontWeight: 700,
                  fontSize: "1.1rem",
                  zIndex: 10,
                }}
              >
                {prediction} — {confidence}%
              </div>
            )}

            {successMessage && (
              <div
                style={{
                  position: "absolute",
                  inset: 0,
                  background: "rgba(81, 207, 102, 0.3)",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  borderRadius: "12px",
                  zIndex: 10,
                }}
              >
                <span style={{ fontSize: "4rem" }}>⭐</span>
              </div>
            )}
          </div>

          {geminiTip && !successMessage && (
            <div style={tipBoxStyle}>
              <p style={tipLabelStyle}>✨ Spirit Guide Tip:</p>
              <p style={tipTextStyle}>{geminiTip}</p>
            </div>
          )}

          {loadingTip && !successMessage && (
            <p
              style={{
                marginTop: "10px",
                color: "#FFD700",
                fontSize: "0.9rem",
              }}
            >
              ✨ Asking the spirits for help...
            </p>
          )}

          {attempts > 0 && !successMessage && (
            <p style={{ marginTop: "8px", color: "#aaa", fontSize: "0.85rem" }}>
              Attempts: {attempts}
            </p>
          )}

          <div style={{ display: "flex", gap: "15px", marginTop: "20px" }}>
            {!showChart && (
              <button
                onClick={() => setShowChart(true)}
                style={{
                  padding: "12px 24px",
                  cursor: "pointer",
                  borderRadius: "8px",
                  border: "none",
                  background: "#3498db",
                  color: "white",
                  fontWeight: "bold",
                }}
              >
                Show ASL Chart
              </button>
            )}
            <button
              onClick={() => window.location.reload()}
              style={exitButtonStyle}
            >
              Exit Game
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

// Styles
const overlayStyle: React.CSSProperties = {
  position: "fixed",
  inset: 0,
  background: "rgba(0,0,0,0.8)",
  display: "flex",
  justifyContent: "center",
  alignItems: "center",
  zIndex: 100,
};

const containerStyle: React.CSSProperties = {
  width: "95vw",
  height: "85vh",
  background: "white",
  borderRadius: "20px",
  display: "flex",
  overflow: "hidden",
  position: "relative",
};

const chartSectionStyle: React.CSSProperties = {
  flex: 1,
  background: "#f4f4f4",
  display: "flex",
  justifyContent: "center",
  alignItems: "center",
  position: "relative",
  borderRight: "2px solid #ddd",
};

const chartImageStyle: React.CSSProperties = {
  maxWidth: "90%",
  maxHeight: "90%",
  objectFit: "contain",
};

const cameraSectionStyle: React.CSSProperties = {
  flex: 1,
  background: "#111",
  display: "flex",
  flexDirection: "column",
  justifyContent: "center",
  alignItems: "center",
  color: "white",
  padding: "20px",
};

const videoWrapperStyle: React.CSSProperties = {
  width: "100%",
  maxWidth: "640px",
  position: "relative",
  borderRadius: "12px",
  overflow: "hidden",
};

const canvasStyle: React.CSSProperties = {
  width: "100%",
  height: "auto",
  display: "block",
  transform: "scaleX(-1)",
};

const closeButtonStyle: React.CSSProperties = {
  position: "absolute",
  top: "10px",
  right: "10px",
  background: "rgba(0,0,0,0.6)",
  color: "white",
  border: "none",
  borderRadius: "50%",
  width: "35px",
  height: "35px",
  cursor: "pointer",
};

const exitButtonStyle: React.CSSProperties = {
  padding: "12px 24px",
  cursor: "pointer",
  borderRadius: "8px",
  border: "none",
  background: "#555",
  color: "white",
};

const tipBoxStyle: React.CSSProperties = {
  marginTop: "12px",
  padding: "12px 16px",
  background: "rgba(255,255,255,0.1)",
  borderRadius: "12px",
  border: "1px solid rgba(255,255,255,0.2)",
  maxWidth: "640px",
  width: "100%",
};

const tipLabelStyle: React.CSSProperties = {
  fontSize: "0.8rem",
  color: "#FFD700",
  marginBottom: "4px",
  fontWeight: 600,
};

const tipTextStyle: React.CSSProperties = {
  fontSize: "0.9rem",
  color: "#ddd",
  lineHeight: 1.5,
};
