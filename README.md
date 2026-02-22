# 🌟 Sign Sprites 🌟

## Overview

Inspired by the soot sprites from Spirited Away, players guide a Ghibli-style sprite across the screen, collecting paper stars. Along the way, the sprite encounters obstacles that require the player to sign a specific ASL letter to pass.

- **Real-time Tracking:** The game activates the webcam and tracks the player's hand in real-time.
- **Smart Detection:** It verifies if the player is signing the correct letter.
- **AI Coaching:** If the player gets stuck or signs the wrong letter, our AI coach provides custom, encouraging feedback on how to adjust their fingers to get it right.

## How we built it

- **Frontend:** Built with **React**, **TypeScript**, and **Vite** for a component-based UI.
- **Backend:** Built with **Firebase** for quick user authentication.
- **Computer Vision:** We implemented **@mediapipe/tasks-vision** to extract 21 precise 3D hand landmarks from the webcam feed.
- **Machine Learning:** We flattened the MediaPipe coordinate data into a 63-point array and fed it into an **ml5.js** neural network, which we custom-trained using 2,906 images and short videos to recognize overlapping ASL letters.
- **Generative AI Coach:** We integrated the **Gemini 2.5 Flash API** to dynamically compare the user's incorrect sign with the target sign and generate real-time, context-aware tips to help them improve.

## Challenges we ran into

Initially, we planned to use the `fingerpose` library for gesture recognition. However, we quickly realized it couldn't reliably handle the complex, overlapping finger positions required for many ASL letters (like the subtle difference between 'U' and 'V'). Mid-hackathon, we successfully pivoted our data pipeline to feed raw MediaPipe coordinate arrays into a custom `ml5.js` model instead.

## How to run it locally

1. Clone the repo.
2. Run `npm install` to grab all the dependencies.
3. Create a `.env` file in the root directory and add your Gemini API key: `VITE_GEMINI_API_KEY=your_key_here`
4. Run `npm run dev` and open your browser.
