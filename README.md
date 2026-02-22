# 🌟 Sign Sprites 🌟

## Overview

Inspired by the soot sprites from Spirited Away, players guide a Ghibli-style sprite across the screen, collecting paper stars. Along the way, the sprite encounters obstacles that require the player to sign a specific ASL letter to pass.

- **Real-time Tracking:** The game activates the webcam and tracks the player's hand in real-time.
- **Smart Detection:** It verifies if the player is signing the correct letter.

## How we built it

- **Frontend:** Built with **React**, **TypeScript**, and **Vite** for a component-based UI, with hand-drawn elements and backgrounds.
- **Backend:** Built with **Firebase** for quick user authentication.
- **Computer Vision:** We implemented **@mediapipe/tasks-vision** to extract 21 precise 3D hand landmarks from the webcam feed.
- **Machine Learning:** We flattened the MediaPipe coordinate data into a 63-point array and used the **fingerpose** library to identify static ASL gestures.
