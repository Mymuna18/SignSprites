import { useState } from "react";
import { CameraModal } from "../CameraModal"; // <-- 1. Import your modal

export default function Game() {
  const [collectedStars, setCollectedStars] = useState(0);
  const [showCamera, setShowCamera] = useState(false); // <-- 2. State to track the camera

  const handleCollectStar = () => {
    setCollectedStars(collectedStars + 1);
  };

  // 3. What happens when they sign correctly?
  const handlePassObstacle = () => {
    setShowCamera(false); // Turn off the camera/close modal
    setCollectedStars(collectedStars + 1); // Reward them with a paper star!
    console.log("Obstacle cleared! Sprite moves forward.");
  };

  return (
    <div style={{ textAlign: "center", marginTop: "50px" }}>
      <h2>Game Screen</h2>
      <p>Collected Paper Stars: {collectedStars} ✨</p>

      <button
        onClick={handleCollectStar}
        style={{ padding: "10px 20px", marginRight: "10px" }}
      >
        Collect Star (Freebie)
      </button>

      {/* 4. Button to simulate the sprite walking into an obstacle */}
      <button
        onClick={() => setShowCamera(true)}
        style={{ padding: "10px 20px" }}
      >
        Hit Obstacle!
      </button>

      <p style={{ marginTop: "20px" }}>
        This is where your Ghibli sprite + sign language detection will go.
      </p>

      {/* 5. Render the modal ONLY if showCamera is true */}
      {showCamera && <CameraModal onPass={handlePassObstacle} />}
    </div>
  );
}
