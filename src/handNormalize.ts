/**
 * Normalizes raw MediaPipe hand landmarks to be position-invariant and scale-invariant.
 *
 * Problem: Raw (x, y, z) coordinates depend on WHERE the hand appears on screen.
 * A hand signing "A" in the top-left looks completely different from "A" in the bottom-right.
 *
 * Solution:
 * 1. Subtract the wrist position (landmark 0) from all landmarks → position-invariant
 * 2. Divide by the distance from wrist to middle finger MCP (landmark 9) → scale-invariant
 *
 * Input:  21 landmarks × 3 coords = 63 raw values [x0, y0, z0, x1, y1, z1, ...]
 * Output: 63 normalized values (wrist becomes [0, 0, 0], everything else is relative)
 */

export function normalizeLandmarks(flatLandmarks: number[]): number[] {
  // flatLandmarks = [x0, y0, z0, x1, y1, z1, ..., x20, y20, z20] (63 values)
  const wristX = flatLandmarks[0];
  const wristY = flatLandmarks[1];
  const wristZ = flatLandmarks[2];

  // Reference point: middle finger MCP (landmark 9) for consistent hand scale
  const mfMcpX = flatLandmarks[9 * 3];
  const mfMcpY = flatLandmarks[9 * 3 + 1];
  const mfMcpZ = flatLandmarks[9 * 3 + 2];

  // Distance from wrist to middle finger MCP = "hand size"
  const dx = mfMcpX - wristX;
  const dy = mfMcpY - wristY;
  const dz = mfMcpZ - wristZ;
  const handSize = Math.sqrt(dx * dx + dy * dy + dz * dz);

  // Avoid division by zero
  const scale = handSize > 0.001 ? handSize : 1;

  const normalized: number[] = [];
  for (let i = 0; i < 21; i++) {
    const x = (flatLandmarks[i * 3] - wristX) / scale;
    const y = (flatLandmarks[i * 3 + 1] - wristY) / scale;
    const z = (flatLandmarks[i * 3 + 2] - wristZ) / scale;
    normalized.push(x, y, z);
  }

  return normalized; // 63 values, position & scale invariant
}

/**
 * Normalizes a sequence of frames for dynamic letters (J, Z).
 * Each frame is normalized independently relative to its own wrist.
 */
export function normalizeSequence(frames: number[][]): number[][] {
  return frames.map((frame) => normalizeLandmarks(frame));
}