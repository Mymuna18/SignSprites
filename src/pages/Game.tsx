import { useEffect, useState, useRef } from "react";
import { CameraModal } from "../CameraModal";

// SPRITES
import spriteWalk1 from "../assets/walking1.png";
import spriteWalk2 from "../assets/walking2.png";
import spriteJumping from "../assets/jumping.png";
import spriteLanding from "../assets/landing.png";

// STARS
import starGreen from "../assets/littleGreenStar.png";
import starRed from "../assets/littleRedStar.png";
import starWhite from "../assets/littleWhiteStar.png";
import starYellow from "../assets/littleYellowStar.png";

// INFO BUTTON + ASL CHART
import infoButton from "../assets/redi.png";
import infoButtonHover from "../assets/buttonHover.png";
import aslChart from "../assets/handSigns.jpg";

// ✅ SCREEN BACKGROUNDS (ADD YOUR IMAGES HERE)
import screen1Bg from "../assets/forest.png";
import screen2Bg from "../assets/restaurant_.png";

export default function Game() {
  const [collectedStars, setCollectedStars] = useState(0);
  const [showCamera, setShowCamera] = useState(false);
  const [showInfo, setShowInfo] = useState(false);
  const [isInfoHovered, setIsInfoHovered] = useState(false);
  const [isFinished, setIsFinished] = useState(false);

  const [position, setPosition] = useState({ x: 100, y: 150 });
  const [animationState, setAnimationState] = useState<
    "walk" | "prep" | "jump" | "land"
  >("walk");
  const [walkFrame, setWalkFrame] = useState(0);
  const [direction, setDirection] = useState(1);
  const [isWalking, setIsWalking] = useState(false);
  const [isLevelFading, setIsLevelFading] = useState(false);

  const requestRef = useRef<number>(0);
  const keysPressed = useRef<{ [key: string]: boolean }>({});

  const alphabet = "ABCDEFGHIJKLMNOPQRSTUVWXYZ".split("");
  const currentLetter = alphabet[collectedStars] || "Done";

  const obstacleX1 = 400;
  const obstacleX2 = 900;
  const starImages = [starGreen, starRed, starWhite, starYellow];

  const screenIndex = Math.floor(collectedStars / 2) * 2;
  const star1Color = starImages[screenIndex % starImages.length];
  const star2Color = starImages[(screenIndex + 1) % starImages.length];

  // ✅ Alternate background every 2 stars
  const currentScreen = Math.floor(collectedStars / 2) % 2;
  const backgroundImage = currentScreen === 0 ? screen1Bg : screen2Bg;

  const update = () => {
    if (
      animationState === "walk" &&
      !showCamera &&
      !isLevelFading &&
      !isFinished
    ) {
      let moving = false;
      let newX = position.x;

      if (keysPressed.current["ArrowRight"]) {
        newX += 6;
        setDirection(1);
        moving = true;
      }
      if (keysPressed.current["ArrowLeft"]) {
        newX -= 6;
        setDirection(-1);
        moving = true;
      }

      setIsWalking(moving);

      if (moving) {
        const atObstacle1 =
          newX >= obstacleX1 &&
          position.x < obstacleX1 &&
          collectedStars % 2 === 0;

        const atObstacle2 =
          newX >= obstacleX2 &&
          position.x < obstacleX2 &&
          collectedStars % 2 !== 0;

        if ((atObstacle1 || atObstacle2) && !showCamera) {
          setShowCamera(true);
          newX = atObstacle1 ? obstacleX1 : obstacleX2;
        }

        if (newX >= window.innerWidth - 100) handleLevelTransition();

        setPosition((prev) => ({ ...prev, x: newX }));
      }
    } else {
      setIsWalking(false);
    }

    requestRef.current = requestAnimationFrame(update);
  };

  useEffect(() => {
    requestRef.current = requestAnimationFrame(update);

    const down = (e: KeyboardEvent) => {
      keysPressed.current[e.key] = true;
    };

    const up = (e: KeyboardEvent) => {
      delete keysPressed.current[e.key];
    };

    window.addEventListener("keydown", down);
    window.addEventListener("keyup", up);

    return () => {
      window.removeEventListener("keydown", down);
      window.removeEventListener("keyup", up);
      if (requestRef.current) cancelAnimationFrame(requestRef.current);
    };
  }, [
    animationState,
    showCamera,
    position.x,
    isLevelFading,
    isFinished,
    collectedStars,
  ]);

  useEffect(() => {
    if (!isWalking || animationState !== "walk") {
      setWalkFrame(0);
      return;
    }

    const interval = setInterval(
      () => setWalkFrame((prev) => (prev === 0 ? 1 : 0)),
      120,
    );

    return () => clearInterval(interval);
  }, [isWalking, animationState]);

  const handlePassObstacle = () => {
    setShowCamera(false);
    setAnimationState("prep");

    setTimeout(() => {
      setAnimationState("jump");

      setPosition((prev) => ({ x: prev.x + 100, y: prev.y + 220 }));

      setTimeout(() => {
        setPosition((prev) => ({ x: prev.x + 80, y: 150 }));

        const nextCount = collectedStars + 1;
        setCollectedStars(nextCount);

        if (nextCount >= alphabet.length) setIsFinished(true);

        setTimeout(() => {
          setAnimationState("land");
          setTimeout(() => setAnimationState("walk"), 200);
        }, 150);
      }, 400);
    }, 150);
  };

  const handleLevelTransition = () => {
    setIsLevelFading(true);
    setTimeout(() => {
      setPosition({ x: -100, y: 150 });
      setIsLevelFading(false);
    }, 600);
  };

  if (isFinished) {
    return (
      <div
        style={{
          width: "100vw",
          height: "100vh",
          display: "flex",
          justifyContent: "center",
          alignItems: "center",
          background: "#cfe9ff",
          flexDirection: "column",
        }}
      >
        <h1 style={{ fontSize: "3rem" }}>🎉 Congratulations!</h1>
        <p style={{ fontSize: "1.5rem" }}>You've mastered the ASL Alphabet!</p>
        <button
          onClick={() => window.location.reload()}
          style={{ marginTop: "20px", padding: "10px 20px", cursor: "pointer" }}
        >
          Play Again
        </button>
      </div>
    );
  }

  const currentSprite =
    animationState === "jump"
      ? spriteJumping
      : animationState === "walk"
        ? walkFrame === 1
          ? spriteWalk2
          : spriteWalk1
        : spriteLanding;

  return (
    <div
      style={{
        width: "100vw",
        height: "100vh",
        position: "relative",
        overflow: "hidden",
        opacity: isLevelFading ? 0 : 1,
        transition: "opacity 0.5s",
        backgroundImage: `url(${backgroundImage})`,
        backgroundSize: "cover",
        backgroundPosition: "center",
        backgroundRepeat: "no-repeat",
      }}
    >
      {/* PROGRESS */}
      <div
        style={{
          position: "absolute",
          top: 20,
          left: 20,
          zIndex: 10,
          backgroundColor: "#d4f8d4", // light green
          padding: "12px 18px",
          borderRadius: "20px",
          fontWeight: "bold",
          fontSize: "1.1rem",
          boxShadow: "0 4px 10px rgba(0,0,0,0.15)",
          border: "2px solid #a6e3a6",
        }}
      >
        ⭐ Letter {currentLetter} ({collectedStars}/26)
      </div>
      {/* INFO BUTTON */}
      <img
        src={isInfoHovered ? infoButtonHover : infoButton}
        alt="info"
        onMouseEnter={() => setIsInfoHovered(true)}
        onMouseLeave={() => setIsInfoHovered(false)}
        onClick={() => setShowInfo(true)}
        style={{
          position: "absolute",
          top: 20,
          right: 20,
          width: "60px",
          cursor: "pointer",
          zIndex: 20,
        }}
      />

      {/* ASL POPUP */}
      {showInfo && (
        <div
          style={{
            position: "fixed",
            inset: 0,
            background: "rgba(0,0,0,0.7)",
            display: "flex",
            justifyContent: "center",
            alignItems: "center",
            zIndex: 50,
          }}
        >
          <div style={{ position: "relative" }}>
            <img
              src={aslChart}
              alt="ASL Chart"
              style={{
                maxWidth: "90vw",
                maxHeight: "90vh",
                borderRadius: "12px",
              }}
            />
            <button
              onClick={() => setShowInfo(false)}
              style={{
                position: "absolute",
                top: 10,
                right: 10,
                cursor: "pointer",
              }}
            >
              ✕
            </button>
          </div>
        </div>
      )}

      {/* STARS */}
      <img
        src={star1Color}
        alt="star1"
        style={{
          position: "absolute",
          left: obstacleX1 + 100,
          bottom: 350,
          width: "70px",
          zIndex: 5,
          display:
            collectedStars % 2 !== 0 || position.x > obstacleX1 + 100
              ? "none"
              : "block",
        }}
      />

      <img
        src={star2Color}
        alt="star2"
        style={{
          position: "absolute",
          left: obstacleX2 + 100,
          bottom: 350,
          width: "70px",
          zIndex: 5,
          display: position.x > obstacleX2 + 100 ? "none" : "block",
        }}
      />

      {/* SPRITE */}
      <img
        src={currentSprite}
        alt="sprite"
        style={{
          position: "absolute",
          left: position.x,
          bottom: position.y,
          width: "110px",
          transform: `scaleX(${direction})`,
          zIndex: 4,
        }}
      />

      {showCamera && (
        <CameraModal onPass={handlePassObstacle} targetLetter={currentLetter} />
      )}
    </div>
  );
}
