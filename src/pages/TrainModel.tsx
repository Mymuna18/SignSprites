import { useRef, useEffect, useState, useCallback } from "react";
import {
  HandLandmarker,
  FilesetResolver,
  DrawingUtils,
} from "@mediapipe/tasks-vision";
import { normalizeLandmarks, normalizeSequence } from "../handNormalize";

const STATIC_LETTERS = "ABCDEFGHIKLMNOPQRSTUVWXY".split(""); // 24 letters (no J or Z)
const DYNAMIC_LETTERS = ["J", "Z"];
const ALL_LETTERS = "ABCDEFGHIJKLMNOPQRSTUVWXYZ".split("");

const SEQUENCE_LENGTH = 20; // Number of frames to capture for dynamic signs
const SEQUENCE_INTERVAL = 80; // ms between frames (~12fps capture)

export default function TrainModel() {
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const handLandmarkerRef = useRef<HandLandmarker | null>(null);
  const latestLandmarksRef = useRef<number[] | null>(null);

  // Two separate classifiers
  const staticClassifierRef = useRef<any>(null);
  const dynamicClassifierRef = useRef<any>(null);

  const [isModelLoaded, setIsModelLoaded] = useState(false);
  const [currentLetter, setCurrentLetter] = useState("A");
  const [sampleCounts, setSampleCounts] = useState<Record<string, number>>(
    Object.fromEntries(ALL_LETTERS.map((l) => [l, 0])),
  );
  const [status, setStatus] = useState("Loading MediaPipe...");
  const [isTraining, setIsTraining] = useState(false);
  const [handDetected, setHandDetected] = useState(false);
  const [isRecording, setIsRecording] = useState(false);
  const [recordingProgress, setRecordingProgress] = useState(0);

  const isDynamic = DYNAMIC_LETTERS.includes(currentLetter);

  // Initialize ml5 neural networks
  useEffect(() => {
    const staticOptions = {
      inputs: 63,
      outputs: STATIC_LETTERS.length,
      task: "classification",
      debug: true,
    };
    staticClassifierRef.current = ml5.neuralNetwork(staticOptions);

    const dynamicOptions = {
      inputs: SEQUENCE_LENGTH * 63,
      outputs: DYNAMIC_LETTERS.length,
      task: "classification",
      debug: true,
    };
    dynamicClassifierRef.current = ml5.neuralNetwork(dynamicOptions);
  }, []);

  // Initialize MediaPipe + Webcam
  useEffect(() => {
    const video = videoRef.current;

    const init = async () => {
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
      setStatus("Ready! Select a letter and collect samples.");

      const stream = await navigator.mediaDevices.getUserMedia({ video: true });
      if (video) {
        video.srcObject = stream;
      }
    };

    init();

    return () => {
      if (video && video.srcObject) {
        (video.srcObject as MediaStream).getTracks().forEach((t) => t.stop());
      }
    };
  }, []);

  // Detection loop
  const handleVideoLoad = useCallback(() => {
    const video = videoRef.current;
    const canvas = canvasRef.current;
    if (!video || !canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;
    const drawingUtils = new DrawingUtils(ctx);

    const detect = () => {
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      ctx.drawImage(video, 0, 0, canvas.width, canvas.height);

      if (handLandmarkerRef.current && video.readyState >= 2) {
        const results = handLandmarkerRef.current.detectForVideo(
          video,
          performance.now(),
        );

        if (results.landmarks && results.landmarks.length > 0) {
          setHandDetected(true);
          const landmarks = results.landmarks[0];
          const flatLandmarks = landmarks.flatMap((lm) => [lm.x, lm.y, lm.z]);
          latestLandmarksRef.current = flatLandmarks;

          drawingUtils.drawLandmarks(landmarks, {
            color: "#FF0000",
            lineWidth: 2,
          });
          drawingUtils.drawConnectors(
            landmarks,
            HandLandmarker.HAND_CONNECTIONS,
            { color: "#00FF00", lineWidth: 4 },
          );
        } else {
          setHandDetected(false);
          latestLandmarksRef.current = null;
        }
      }
      requestAnimationFrame(detect);
    };
    detect();
  }, []);

  // ===== STATIC: Collect single frame =====
  const collectStaticSample = () => {
    if (!latestLandmarksRef.current || !staticClassifierRef.current) {
      setStatus("No hand detected! Show your hand to the camera.");
      return;
    }

    // *** KEY CHANGE: Normalize relative to wrist before storing ***
    const normalized = normalizeLandmarks(latestLandmarksRef.current);

    staticClassifierRef.current.addData(normalized, {
      label: currentLetter,
    });

    setSampleCounts((prev) => ({
      ...prev,
      [currentLetter]: prev[currentLetter] + 1,
    }));
    setStatus(`Collected NORMALIZED static sample for "${currentLetter}"`);
  };

  const collectStaticBurst = async (count: number) => {
    setStatus(
      `Collecting ${count} normalized samples for "${currentLetter}"...`,
    );
    for (let i = 0; i < count; i++) {
      collectStaticSample();
      await new Promise((r) => setTimeout(r, 100));
    }
    setStatus(
      `Done! Collected ${count} normalized samples for "${currentLetter}".`,
    );
  };

  // ===== DYNAMIC: Record sequence of frames =====
  const recordDynamicSequence = async () => {
    if (!dynamicClassifierRef.current) return;

    setIsRecording(true);
    setRecordingProgress(0);
    setStatus(
      `Recording motion for "${currentLetter}"... Perform the sign now!`,
    );

    const frames: number[][] = [];

    for (let i = 0; i < SEQUENCE_LENGTH; i++) {
      setRecordingProgress(((i + 1) / SEQUENCE_LENGTH) * 100);

      if (latestLandmarksRef.current) {
        frames.push([...latestLandmarksRef.current]);
      } else {
        frames.push(new Array(63).fill(0));
      }

      await new Promise((r) => setTimeout(r, SEQUENCE_INTERVAL));
    }

    const validFrames = frames.filter((f) => f.some((v) => v !== 0));
    if (validFrames.length < SEQUENCE_LENGTH * 0.5) {
      setStatus(
        "Not enough hand data captured. Keep your hand visible and try again.",
      );
      setIsRecording(false);
      setRecordingProgress(0);
      return;
    }

    // *** KEY CHANGE: Normalize each frame relative to its own wrist ***
    const normalizedFrames = normalizeSequence(frames);
    const flatSequence = normalizedFrames.flat();

    dynamicClassifierRef.current.addData(flatSequence, {
      label: currentLetter,
    });

    setSampleCounts((prev) => ({
      ...prev,
      [currentLetter]: prev[currentLetter] + 1,
    }));

    setIsRecording(false);
    setRecordingProgress(0);
    setStatus(`Recorded NORMALIZED motion for "${currentLetter}"!`);
  };

  // ===== LOAD SAVED DATA (raw) =====
  const loadStaticData = () => {
    if (!staticClassifierRef.current) return;
    setStatus("Loading static training data...");
    staticClassifierRef.current.loadData(
      "/training-data/asl-static-data.json",
      () => {
        setStatus(
          "Static training data loaded (raw). You can train, but consider using 'Load & Transform' instead for better accuracy.",
        );
      },
    );
  };

  const loadDynamicData = () => {
    if (!dynamicClassifierRef.current) return;
    setStatus("Loading dynamic training data...");
    dynamicClassifierRef.current.loadData(
      "/training-data/asl-dynamic-data.json",
      () => {
        setStatus("Dynamic training data loaded (raw).");
      },
    );
  };

  // ===== LOAD & TRANSFORM: Normalize existing data =====
  const loadAndTransformStaticData = async () => {
    if (!staticClassifierRef.current) return;
    setStatus("Loading & normalizing static training data...");

    try {
      const response = await fetch("/training-data/asl-static-data.json");
      const rawData = await response.json();
      const samples = rawData.data || rawData;

      let count = 0;
      for (const sample of samples) {
        // Extract the 63 raw landmark values from xs
        const rawInputs: number[] = [];
        const numInputs = Object.keys(sample.xs).length;
        for (let i = 0; i < numInputs; i++) {
          rawInputs.push(sample.xs[String(i)]);
        }

        // Skip invalid samples (all zeros)
        if (rawInputs.every((v) => v === 0)) continue;

        // Normalize relative to wrist
        const normalized = normalizeLandmarks(rawInputs);

        // Get the label
        const label = sample.ys["0"] || sample.ys.label;

        staticClassifierRef.current.addData(normalized, { label });
        count++;
      }

      setStatus(`Loaded & normalized ${count} static samples! Ready to train.`);
    } catch (err) {
      console.error("Failed to load/transform static data:", err);
      setStatus("Error loading static data. Check console.");
    }
  };

  const loadAndTransformDynamicData = async () => {
    if (!dynamicClassifierRef.current) return;
    setStatus("Loading & normalizing dynamic training data...");

    try {
      const response = await fetch("/training-data/asl-dynamic-data.json");
      const rawData = await response.json();
      const samples = rawData.data || rawData;

      let count = 0;
      for (const sample of samples) {
        const numInputs = Object.keys(sample.xs).length;
        const rawInputs: number[] = [];
        for (let i = 0; i < numInputs; i++) {
          rawInputs.push(sample.xs[String(i)]);
        }

        // Split into frames of 63 values each
        const frames: number[][] = [];
        for (let f = 0; f < SEQUENCE_LENGTH; f++) {
          frames.push(rawInputs.slice(f * 63, (f + 1) * 63));
        }

        // Normalize each frame relative to its wrist
        const normalizedFrames = normalizeSequence(frames);
        const flat = normalizedFrames.flat();

        const label = sample.ys["0"] || sample.ys.label;
        dynamicClassifierRef.current.addData(flat, { label });
        count++;
      }

      setStatus(
        `Loaded & normalized ${count} dynamic samples! Ready to train.`,
      );
    } catch (err) {
      console.error("Failed to load/transform dynamic data:", err);
      setStatus("Error loading dynamic data. Check console.");
    }
  };

  // ===== SAVE TRAINING DATA =====
  const saveStaticData = () => {
    staticClassifierRef.current?.saveData("asl-static-data");
    setStatus("Static training data saved!");
  };

  const saveDynamicData = () => {
    dynamicClassifierRef.current?.saveData("asl-dynamic-data");
    setStatus("Dynamic training data saved!");
  };

  // ===== TRAINING =====
  const trainStaticModel = () => {
    if (!staticClassifierRef.current) return;

    setIsTraining(true);
    setStatus(
      "Training static model with NORMALIZED data... (watch for loss chart)",
    );
    staticClassifierRef.current.normalizeData();
    staticClassifierRef.current.train({ epochs: 50, batchSize: 16 }, () => {
      setIsTraining(false);
      setStatus("Static model training complete!");
    });
  };

  const trainDynamicModel = () => {
    if (!dynamicClassifierRef.current) return;

    setIsTraining(true);
    setStatus("Training dynamic model with NORMALIZED data...");
    dynamicClassifierRef.current.normalizeData();
    dynamicClassifierRef.current.train({ epochs: 80, batchSize: 8 }, () => {
      setIsTraining(false);
      setStatus("Dynamic model training complete!");
    });
  };

  // ===== SAVE TRAINED MODELS =====
  const saveStaticModel = () => {
    staticClassifierRef.current?.save("asl-static-classifier");
    setStatus("Static model saved! Check your downloads.");
  };

  const saveDynamicModel = () => {
    dynamicClassifierRef.current?.save("asl-dynamic-classifier");
    setStatus("Dynamic model saved! Check your downloads.");
  };

  const staticTotal = STATIC_LETTERS.reduce((s, l) => s + sampleCounts[l], 0);
  const dynamicTotal = DYNAMIC_LETTERS.reduce((s, l) => s + sampleCounts[l], 0);

  return (
    <div
      style={{
        padding: "20px",
        fontFamily: "'Quicksand', sans-serif",
        maxWidth: "1100px",
        margin: "0 auto",
      }}
    >
      <h1 style={{ marginBottom: "4px" }}>ASL Training Data Collector</h1>
      <p
        style={{
          color: "#2E7D32",
          fontSize: "0.85rem",
          marginBottom: "4px",
          fontWeight: 600,
        }}
      >
        ✅ Wrist-relative normalization enabled — hand position on screen no
        longer matters!
      </p>
      <p style={{ color: "#666", marginBottom: "20px" }}>{status}</p>

      <div style={{ display: "flex", gap: "24px", flexWrap: "wrap" }}>
        {/* Camera */}
        <div style={{ flex: "1 1 640px" }}>
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
            style={{
              borderRadius: "12px",
              transform: "scaleX(-1)",
              border: isRecording
                ? "3px solid #FF9800"
                : handDetected
                  ? "3px solid #00FF00"
                  : "3px solid #ccc",
              width: "100%",
              maxWidth: "640px",
            }}
          />

          {/* Recording progress bar */}
          {isRecording && (
            <div
              style={{
                marginTop: "8px",
                height: "8px",
                background: "#eee",
                borderRadius: "4px",
                overflow: "hidden",
                maxWidth: "640px",
              }}
            >
              <div
                style={{
                  height: "100%",
                  width: `${recordingProgress}%`,
                  background: "linear-gradient(90deg, #FF9800, #FF5722)",
                  borderRadius: "4px",
                  transition: "width 0.1s",
                }}
              />
            </div>
          )}

          {/* Collection buttons */}
          <div
            style={{
              marginTop: "16px",
              display: "flex",
              gap: "8px",
              flexWrap: "wrap",
            }}
          >
            {isDynamic ? (
              <>
                <button
                  onClick={recordDynamicSequence}
                  disabled={!isModelLoaded || isTraining || isRecording}
                  style={{
                    ...btnStyle,
                    background: isRecording ? "#FF9800" : "#fff",
                    color: isRecording ? "white" : "#333",
                  }}
                >
                  {isRecording
                    ? `Recording... ${Math.round(recordingProgress)}%`
                    : `Record Motion (${currentLetter})`}
                </button>
                <span
                  style={{
                    alignSelf: "center",
                    fontSize: "0.85rem",
                    color: "#888",
                  }}
                >
                  Perform the {currentLetter} sign during recording (~
                  {((SEQUENCE_LENGTH * SEQUENCE_INTERVAL) / 1000).toFixed(1)}s)
                </span>
              </>
            ) : (
              <>
                <button
                  onClick={collectStaticSample}
                  disabled={!isModelLoaded || isTraining}
                  style={btnStyle}
                >
                  Collect 1 Sample ({currentLetter})
                </button>
                <button
                  onClick={() => collectStaticBurst(10)}
                  disabled={!isModelLoaded || isTraining}
                  style={btnStyle}
                >
                  Collect 10
                </button>
                <button
                  onClick={() => collectStaticBurst(30)}
                  disabled={!isModelLoaded || isTraining}
                  style={btnStyle}
                >
                  Collect 30
                </button>
              </>
            )}
          </div>

          {/* Load, Train & Save section */}
          <div
            style={{
              marginTop: "20px",
              padding: "16px",
              background: "#f9f9f9",
              borderRadius: "12px",
              border: "1px solid #eee",
            }}
          >
            <h3 style={{ marginBottom: "12px", fontSize: "1rem" }}>
              Load, Train & Save
            </h3>

            {/* TRANSFORM EXISTING DATA — the key new feature */}
            <div
              style={{
                display: "flex",
                gap: "8px",
                flexWrap: "wrap",
                marginBottom: "16px",
                paddingBottom: "16px",
                borderBottom: "2px solid #4CAF50",
                background: "#E8F5E9",
                padding: "12px",
                borderRadius: "8px",
              }}
            >
              <div style={{ width: "100%", marginBottom: "4px" }}>
                <strong style={{ color: "#2E7D32", fontSize: "0.85rem" }}>
                  🔄 Transform existing data (recommended — re-uses your 2820
                  samples):
                </strong>
              </div>
              <button
                onClick={loadAndTransformStaticData}
                disabled={isTraining}
                style={{
                  ...btnStyle,
                  background: "#4CAF50",
                  color: "white",
                  fontWeight: 600,
                }}
              >
                🔄 Load & Normalize Static Data
              </button>
              <button
                onClick={loadAndTransformDynamicData}
                disabled={isTraining}
                style={{
                  ...btnStyle,
                  background: "#FF9800",
                  color: "white",
                  fontWeight: 600,
                }}
              >
                🔄 Load & Normalize Dynamic Data
              </button>
            </div>

            {/* Load raw data (old way) */}
            <div
              style={{
                display: "flex",
                gap: "8px",
                flexWrap: "wrap",
                marginBottom: "16px",
                paddingBottom: "16px",
                borderBottom: "1px solid #eee",
              }}
            >
              <div style={{ width: "100%", marginBottom: "4px" }}>
                <small style={{ color: "#888" }}>
                  Load raw (un-normalized) data:
                </small>
              </div>
              <button
                onClick={loadStaticData}
                disabled={isTraining}
                style={{ ...btnStyle, background: "#E3F2FD", color: "#1565C0" }}
              >
                📂 Load Static Data (raw)
              </button>
              <button
                onClick={loadDynamicData}
                disabled={isTraining}
                style={{ ...btnStyle, background: "#FFF3E0", color: "#E65100" }}
              >
                📂 Load Dynamic Data (raw)
              </button>
            </div>

            {/* Save training data */}
            <div
              style={{
                display: "flex",
                gap: "8px",
                flexWrap: "wrap",
                marginBottom: "16px",
                paddingBottom: "16px",
                borderBottom: "1px solid #eee",
              }}
            >
              <button
                onClick={saveStaticData}
                disabled={isTraining}
                style={{ ...btnStyle, background: "#E8F5E9", color: "#2E7D32" }}
              >
                💾 Save Static Data
              </button>
              <button
                onClick={saveDynamicData}
                disabled={isTraining}
                style={{ ...btnStyle, background: "#FFF8E1", color: "#F57F17" }}
              >
                💾 Save Dynamic Data
              </button>
            </div>

            {/* Train & Save models */}
            <div
              style={{
                display: "flex",
                gap: "8px",
                flexWrap: "wrap",
                marginBottom: "12px",
              }}
            >
              <button
                onClick={trainStaticModel}
                disabled={isTraining}
                style={{ ...btnStyle, background: "#4CAF50", color: "white" }}
              >
                {isTraining
                  ? "Training..."
                  : `Train Static (${staticTotal} new samples)`}
              </button>
              <button
                onClick={saveStaticModel}
                disabled={isTraining}
                style={{ ...btnStyle, background: "#2196F3", color: "white" }}
              >
                Save Static Model
              </button>
            </div>

            <div style={{ display: "flex", gap: "8px", flexWrap: "wrap" }}>
              <button
                onClick={trainDynamicModel}
                disabled={isTraining}
                style={{ ...btnStyle, background: "#FF9800", color: "white" }}
              >
                {isTraining
                  ? "Training..."
                  : `Train Dynamic (${dynamicTotal} new samples)`}
              </button>
              <button
                onClick={saveDynamicModel}
                disabled={isTraining}
                style={{ ...btnStyle, background: "#9C27B0", color: "white" }}
              >
                Save Dynamic Model
              </button>
            </div>
          </div>
        </div>

        {/* Letter selector + sample counts */}
        <div style={{ flex: "0 0 320px" }}>
          <h3 style={{ marginBottom: "4px" }}>Static Letters (single pose)</h3>
          <div
            style={{
              display: "grid",
              gridTemplateColumns: "repeat(6, 1fr)",
              gap: "6px",
              marginTop: "8px",
            }}
          >
            {STATIC_LETTERS.map((letter) => (
              <button
                key={letter}
                onClick={() => setCurrentLetter(letter)}
                style={{
                  padding: "8px 4px",
                  fontSize: "0.9rem",
                  fontWeight: currentLetter === letter ? 700 : 400,
                  background:
                    currentLetter === letter
                      ? "#6b5b7b"
                      : sampleCounts[letter] >= 30
                        ? "#a8e6a3"
                        : sampleCounts[letter] > 0
                          ? "#c4d7b2"
                          : "#f0f0f0",
                  color: currentLetter === letter ? "white" : "#333",
                  border: "none",
                  borderRadius: "8px",
                  cursor: "pointer",
                  fontFamily: "'Quicksand', sans-serif",
                }}
              >
                {letter}
                <br />
                <small style={{ fontSize: "0.7rem" }}>
                  {sampleCounts[letter]}
                </small>
              </button>
            ))}
          </div>

          <h3 style={{ marginTop: "20px", marginBottom: "4px" }}>
            Dynamic Letters (motion) 🎬
          </h3>
          <div style={{ display: "flex", gap: "6px", marginTop: "8px" }}>
            {DYNAMIC_LETTERS.map((letter) => (
              <button
                key={letter}
                onClick={() => setCurrentLetter(letter)}
                style={{
                  padding: "12px 20px",
                  fontSize: "1rem",
                  fontWeight: currentLetter === letter ? 700 : 400,
                  background:
                    currentLetter === letter
                      ? "#FF9800"
                      : sampleCounts[letter] >= 10
                        ? "#FFE0B2"
                        : sampleCounts[letter] > 0
                          ? "#FFF3E0"
                          : "#f0f0f0",
                  color: currentLetter === letter ? "white" : "#333",
                  border: "none",
                  borderRadius: "8px",
                  cursor: "pointer",
                  fontFamily: "'Quicksand', sans-serif",
                }}
              >
                {letter}
                <br />
                <small style={{ fontSize: "0.7rem" }}>
                  {sampleCounts[letter]}
                </small>
              </button>
            ))}
          </div>

          {/* Legend */}
          <div
            style={{
              marginTop: "24px",
              padding: "12px",
              background: "#f9f9f9",
              borderRadius: "8px",
              fontSize: "0.8rem",
              color: "#666",
            }}
          >
            <p style={{ marginBottom: "8px" }}>
              <strong>Color guide:</strong>
            </p>
            <div
              style={{
                display: "flex",
                alignItems: "center",
                gap: "6px",
                marginBottom: "4px",
              }}
            >
              <span
                style={{
                  width: "14px",
                  height: "14px",
                  background: "#f0f0f0",
                  borderRadius: "4px",
                  display: "inline-block",
                }}
              />
              No samples yet
            </div>
            <div
              style={{
                display: "flex",
                alignItems: "center",
                gap: "6px",
                marginBottom: "4px",
              }}
            >
              <span
                style={{
                  width: "14px",
                  height: "14px",
                  background: "#c4d7b2",
                  borderRadius: "4px",
                  display: "inline-block",
                }}
              />
              Has samples
            </div>
            <div
              style={{
                display: "flex",
                alignItems: "center",
                gap: "6px",
                marginBottom: "8px",
              }}
            >
              <span
                style={{
                  width: "14px",
                  height: "14px",
                  background: "#a8e6a3",
                  borderRadius: "4px",
                  display: "inline-block",
                }}
              />
              30+ samples (good!)
            </div>
            <p>
              <strong>Tips:</strong>
            </p>
            <p>• Static: aim for 50–100 samples per letter</p>
            <p>• Dynamic: aim for 20–30 recordings per letter</p>
            <p>• Vary hand angle/distance between bursts</p>
          </div>
        </div>
      </div>
    </div>
  );
}

const btnStyle: React.CSSProperties = {
  padding: "10px 20px",
  fontSize: "0.9rem",
  borderRadius: "8px",
  border: "1px solid #ccc",
  cursor: "pointer",
  fontFamily: "'Quicksand', sans-serif",
};
