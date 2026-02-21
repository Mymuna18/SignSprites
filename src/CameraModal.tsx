import React, { useRef, useEffect, useState } from "react";
import {
  HandLandmarker,
  FilesetResolver,
  DrawingUtils,
} from "@mediapipe/tasks-vision";

interface CameraModalProps {
  onPass: () => void;
}

export const CameraModal: React.FC<CameraModalProps> = ({ onPass }) => {
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);

  // 1. Create a Ref to hold our MediaPipe model so it doesn't reload constantly
  const handLandmarkerRef = useRef<HandLandmarker | null>(null);

  // A quick state to show a loading message while the AI model downloads
  const [isModelLoaded, setIsModelLoaded] = useState(false);

  useEffect(() => {
    // 2. Initialize the MediaPipe HandLandmarker
    const initializeMediaPipe = async () => {
      // Fetch the WebAssembly (WASM) files needed to run the AI in the browser
      const vision = await FilesetResolver.forVisionTasks(
        "https://cdn.jsdelivr.net/npm/@mediapipe/tasks-vision@latest/wasm",
      );

      // Load the specific Hand Tracking model
      const landmarker = await HandLandmarker.createFromOptions(vision, {
        baseOptions: {
          modelAssetPath:
            "https://storage.googleapis.com/mediapipe-models/hand_landmarker/hand_landmarker/float16/1/hand_landmarker.task",
          delegate: "GPU", // Uses the computer's graphics card for speed!
        },
        runningMode: "VIDEO",
        numHands: 1, // We only need one hand for basic ASL letters
      });

      handLandmarkerRef.current = landmarker;
      setIsModelLoaded(true);
    };

    // 3. Start the Webcam
    const startWebcam = async () => {
      try {
        const stream = await navigator.mediaDevices.getUserMedia({
          video: true,
        });
        if (videoRef.current) {
          videoRef.current.srcObject = stream;
        }
      } catch (err) {
        console.error("Webcam error: ", err);
      }
    };

    // Run both setups
    initializeMediaPipe();
    startWebcam();

    // Cleanup when modal closes
    return () => {
      if (videoRef.current && videoRef.current.srcObject) {
        const stream = videoRef.current.srcObject as MediaStream;
        stream.getTracks().forEach((track) => track.stop());
      }
    };
  }, []);

  const handleVideoLoad = () => {
    const video = videoRef.current;
    const canvas = canvasRef.current;
    if (!video || !canvas) return;

    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    // Create the tool that draws the neon lines on the hand
    const drawingUtils = new DrawingUtils(ctx);

    const drawToCanvas = () => {
      // Clear the previous frame and draw the new video frame
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      ctx.drawImage(video, 0, 0, canvas.width, canvas.height);

      // 4. Run the AI detection!
      if (handLandmarkerRef.current && video.readyState >= 2) {
        // MediaPipe needs a timestamp to know which frame it's looking at
        const startTimeMs = performance.now();
        const results = handLandmarkerRef.current.detectForVideo(
          video,
          startTimeMs,
        );

        // 5. If it sees a hand, draw the skeleton!
        if (results.landmarks && results.landmarks.length > 0) {
          for (const landmarks of results.landmarks) {
            // Draw the dots (joints)
            drawingUtils.drawLandmarks(landmarks, {
              color: "#FF0000",
              lineWidth: 2,
            });
            // Draw the lines (bones) connecting the dots
            drawingUtils.drawConnectors(
              landmarks,
              HandLandmarker.HAND_CONNECTIONS,
              { color: "#00FF00", lineWidth: 4 },
            );

            // NOTE FOR LATER: 'landmarks' is the exact Array we will pass to your friend's fingerpose code!
          }
        }
      }

      requestAnimationFrame(drawToCanvas);
    };

    drawToCanvas();
  };

  return (
    <div style={modalStyles}>
      <h2>
        {isModelLoaded
          ? 'Sign the letter "C"!'
          : "Summoning the spirits... (Loading AI)"}
      </h2>

      <video
        ref={videoRef}
        autoPlay
        playsInline
        style={{ display: "none" }}
        onLoadedData={handleVideoLoad}
      />

      <canvas
        ref={canvasRef}
        width="640"
        height="480"
        style={{ borderRadius: "10px", transform: "scaleX(-1)" }}
      />

      <br />
      <button
        onClick={onPass}
        style={{ marginTop: "20px", padding: "10px", cursor: "pointer" }}
      >
        Simulate Passing Obstacle
      </button>
    </div>
  );
};

// Quick temporary styles
const modalStyles: React.CSSProperties = {
  position: "absolute",
  top: "10%",
  left: "10%",
  width: "80%",
  height: "80%",
  backgroundColor: "rgba(0,0,0,0.8)",
  color: "white",
  borderRadius: "20px",
  display: "flex",
  flexDirection: "column",
  alignItems: "center",
  justifyContent: "center",
  zIndex: 100,
};
