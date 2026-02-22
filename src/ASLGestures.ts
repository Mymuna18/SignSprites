import fp from "fingerpose";

const {
  GestureDescription,
  Finger,
  FingerCurl,
  FingerDirection,
  GestureEstimator,
} = fp as any;

type Gesture = any;

function addAllDirections(gesture: Gesture, finger: any, weight = 0.25) {
  // Helps reduce “too strict” direction rules
  gesture.addDirection(finger, FingerDirection.VerticalUp, weight);
  gesture.addDirection(finger, FingerDirection.DiagonalUpLeft, weight);
  gesture.addDirection(finger, FingerDirection.DiagonalUpRight, weight);
  gesture.addDirection(finger, FingerDirection.HorizontalLeft, weight);
  gesture.addDirection(finger, FingerDirection.HorizontalRight, weight);
  gesture.addDirection(finger, FingerDirection.DiagonalDownLeft, weight);
  gesture.addDirection(finger, FingerDirection.DiagonalDownRight, weight);
  gesture.addDirection(finger, FingerDirection.VerticalDown, weight);
}

function straightUp(gesture: Gesture, finger: any, w = 1.0) {
  gesture.addCurl(finger, FingerCurl.NoCurl, w);
  gesture.addDirection(finger, FingerDirection.VerticalUp, 0.75 * w);
  gesture.addDirection(finger, FingerDirection.DiagonalUpLeft, 0.25 * w);
  gesture.addDirection(finger, FingerDirection.DiagonalUpRight, 0.25 * w);
}

function curled(gesture: Gesture, finger: any, w = 1.0) {
  gesture.addCurl(finger, FingerCurl.FullCurl, w);
  gesture.addCurl(finger, FingerCurl.HalfCurl, 0.6 * w);
  addAllDirections(gesture, finger, 0.1);
}

function halfCurled(gesture: Gesture, finger: any, w = 1.0) {
  gesture.addCurl(finger, FingerCurl.HalfCurl, w);
  gesture.addCurl(finger, FingerCurl.NoCurl, 0.25 * w);
  gesture.addCurl(finger, FingerCurl.FullCurl, 0.25 * w);
  addAllDirections(gesture, finger, 0.1);
}

function indexUpOthersCurled(name: string) {
  const g = new GestureDescription(name);
  straightUp(g, Finger.Index, 1.0);
  curled(g, Finger.Middle, 1.0);
  curled(g, Finger.Ring, 1.0);
  curled(g, Finger.Pinky, 1.0);
  return g;
}

// -------------------- LETTERS --------------------

// A: fingers curled, thumb out/up-ish
const A = new GestureDescription("A");
A.addCurl(Finger.Thumb, FingerCurl.NoCurl, 1.0);
A.addDirection(Finger.Thumb, FingerDirection.VerticalUp, 0.6);
A.addDirection(Finger.Thumb, FingerDirection.DiagonalUpLeft, 0.3);
A.addDirection(Finger.Thumb, FingerDirection.DiagonalUpRight, 0.3);
for (const f of [Finger.Index, Finger.Middle, Finger.Ring, Finger.Pinky]) curled(A, f, 1.0);

// B: four fingers straight up, thumb curled
const B = new GestureDescription("B");
for (const f of [Finger.Index, Finger.Middle, Finger.Ring, Finger.Pinky]) straightUp(B, f, 1.0);
B.addCurl(Finger.Thumb, FingerCurl.FullCurl, 1.0);
B.addCurl(Finger.Thumb, FingerCurl.HalfCurl, 0.5);
addAllDirections(B, Finger.Thumb, 0.2);

// C: all half-curled in a “C” shape (approx)
const C = new GestureDescription("C");
for (const f of [Finger.Index, Finger.Middle, Finger.Ring, Finger.Pinky]) halfCurled(C, f, 1.0);
halfCurled(C, Finger.Thumb, 1.0);

// D: index up, others curled, thumb half curl
const D = indexUpOthersCurled("D");
halfCurled(D, Finger.Thumb, 1.0);

// E: all fingers curled (thumb curled)
const E = new GestureDescription("E");
for (const f of [Finger.Index, Finger.Middle, Finger.Ring, Finger.Pinky]) curled(E, f, 1.0);
curled(E, Finger.Thumb, 1.0);

// F: thumb+index form circle (hard); approximate: thumb+index half curl, others up
const F = new GestureDescription("F");
halfCurled(F, Finger.Thumb, 1.0);
halfCurled(F, Finger.Index, 1.0);
for (const f of [Finger.Middle, Finger.Ring, Finger.Pinky]) straightUp(F, f, 1.0);

// G: index + thumb horizontal (hard). Approx: index straight, thumb straight, others curled, prefer horizontal
const G = new GestureDescription("G");
G.addCurl(Finger.Index, FingerCurl.NoCurl, 1.0);
G.addDirection(Finger.Index, FingerDirection.HorizontalLeft, 0.6);
G.addDirection(Finger.Index, FingerDirection.HorizontalRight, 0.6);
G.addCurl(Finger.Thumb, FingerCurl.NoCurl, 1.0);
G.addDirection(Finger.Thumb, FingerDirection.HorizontalLeft, 0.6);
G.addDirection(Finger.Thumb, FingerDirection.HorizontalRight, 0.6);
for (const f of [Finger.Middle, Finger.Ring, Finger.Pinky]) curled(G, f, 1.0);

// H: index+middle straight together horizontal-ish, others curled
const H = new GestureDescription("H");
H.addCurl(Finger.Index, FingerCurl.NoCurl, 1.0);
H.addCurl(Finger.Middle, FingerCurl.NoCurl, 1.0);
H.addDirection(Finger.Index, FingerDirection.HorizontalLeft, 0.6);
H.addDirection(Finger.Index, FingerDirection.HorizontalRight, 0.6);
H.addDirection(Finger.Middle, FingerDirection.HorizontalLeft, 0.6);
H.addDirection(Finger.Middle, FingerDirection.HorizontalRight, 0.6);
curled(H, Finger.Ring, 1.0);
curled(H, Finger.Pinky, 1.0);
halfCurled(H, Finger.Thumb, 0.8);

// I: pinky up, others curled
const I = new GestureDescription("I");
straightUp(I, Finger.Pinky, 1.0);
for (const f of [Finger.Index, Finger.Middle, Finger.Ring]) curled(I, f, 1.0);
curled(I, Finger.Thumb, 0.8);

// J: dynamic (motion). Approx as I (static) so you can at least detect a “J-ready” handshape.
const J = new GestureDescription("J");
straightUp(J, Finger.Pinky, 1.0);
for (const f of [Finger.Index, Finger.Middle, Finger.Ring]) curled(J, f, 1.0);
curled(J, Finger.Thumb, 0.8);

// K: index+middle up as a V + thumb out (hard). Approx: index+middle up, ring+pinky curled, thumb no curl
const K = new GestureDescription("K");
straightUp(K, Finger.Index, 1.0);
straightUp(K, Finger.Middle, 1.0);
curled(K, Finger.Ring, 1.0);
curled(K, Finger.Pinky, 1.0);
K.addCurl(Finger.Thumb, FingerCurl.NoCurl, 1.0);
addAllDirections(K, Finger.Thumb, 0.3);

// L: index up + thumb horizontal, others curled
const L = new GestureDescription("L");
straightUp(L, Finger.Index, 1.0);
L.addCurl(Finger.Thumb, FingerCurl.NoCurl, 1.0);
L.addDirection(Finger.Thumb, FingerDirection.HorizontalLeft, 0.6);
L.addDirection(Finger.Thumb, FingerDirection.HorizontalRight, 0.6);
for (const f of [Finger.Middle, Finger.Ring, Finger.Pinky]) curled(L, f, 1.0);

// M: three fingers over thumb (hard). Approx: index+middle+ring curled/half, pinky curled, thumb curled.
const M = new GestureDescription("M");
for (const f of [Finger.Index, Finger.Middle, Finger.Ring]) halfCurled(M, f, 1.0);
curled(M, Finger.Pinky, 1.0);
curled(M, Finger.Thumb, 1.0);

// N: two fingers over thumb (hard). Approx: index+middle half curl, ring+pinky curled, thumb curled.
const N = new GestureDescription("N");
halfCurled(N, Finger.Index, 1.0);
halfCurled(N, Finger.Middle, 1.0);
curled(N, Finger.Ring, 1.0);
curled(N, Finger.Pinky, 1.0);
curled(N, Finger.Thumb, 1.0);

// O: all fingers form O (hard). Approx: all half curl.
const O = new GestureDescription("O");
for (const f of [Finger.Thumb, Finger.Index, Finger.Middle, Finger.Ring, Finger.Pinky]) halfCurled(O, f, 1.0);

// P: like K but angled down (hard). Approx: index+middle straight, thumb straight, others curled (ignore down angle)
const P = new GestureDescription("P");
straightUp(P, Finger.Index, 1.0);
straightUp(P, Finger.Middle, 1.0);
P.addCurl(Finger.Thumb, FingerCurl.NoCurl, 1.0);
curled(P, Finger.Ring, 1.0);
curled(P, Finger.Pinky, 1.0);

// Q: like G but down (hard). Approx: index+thumb straight, others curled, allow horizontal directions
const Q = new GestureDescription("Q");
Q.addCurl(Finger.Index, FingerCurl.NoCurl, 1.0);
Q.addCurl(Finger.Thumb, FingerCurl.NoCurl, 1.0);
Q.addDirection(Finger.Index, FingerDirection.HorizontalLeft, 0.6);
Q.addDirection(Finger.Index, FingerDirection.HorizontalRight, 0.6);
Q.addDirection(Finger.Thumb, FingerDirection.HorizontalLeft, 0.6);
Q.addDirection(Finger.Thumb, FingerDirection.HorizontalRight, 0.6);
curled(Q, Finger.Middle, 1.0);
curled(Q, Finger.Ring, 1.0);
curled(Q, Finger.Pinky, 1.0);

// R: crossed index+middle (hard). Approx: index+middle straight, others curled, thumb curled
const R = new GestureDescription("R");
straightUp(R, Finger.Index, 1.0);
straightUp(R, Finger.Middle, 1.0);
curled(R, Finger.Ring, 1.0);
curled(R, Finger.Pinky, 1.0);
halfCurled(R, Finger.Thumb, 0.8);

// S: fist with thumb over fingers (hard vs A/E). Approx: all curled, thumb curled
const S = new GestureDescription("S");
for (const f of [Finger.Index, Finger.Middle, Finger.Ring, Finger.Pinky]) curled(S, f, 1.0);
curled(S, Finger.Thumb, 1.0);

// T: thumb between index+middle (hard). Approx: fist but thumb half curl
const T = new GestureDescription("T");
for (const f of [Finger.Index, Finger.Middle, Finger.Ring, Finger.Pinky]) curled(T, f, 1.0);
halfCurled(T, Finger.Thumb, 1.0);

// U: index+middle up together, others curled, thumb curled (hard vs V/R)
const U = new GestureDescription("U");
straightUp(U, Finger.Index, 1.0);
straightUp(U, Finger.Middle, 1.0);
curled(U, Finger.Ring, 1.0);
curled(U, Finger.Pinky, 1.0);
curled(U, Finger.Thumb, 0.8);

// V: index+middle up (spread), others curled, thumb curled
const V = new GestureDescription("V");
straightUp(V, Finger.Index, 1.0);
straightUp(V, Finger.Middle, 1.0);
curled(V, Finger.Ring, 1.0);
curled(V, Finger.Pinky, 1.0);
halfCurled(V, Finger.Thumb, 0.8);

// W: index+middle+ring up, pinky curled, thumb curled
const W = new GestureDescription("W");
straightUp(W, Finger.Index, 1.0);
straightUp(W, Finger.Middle, 1.0);
straightUp(W, Finger.Ring, 1.0);
curled(W, Finger.Pinky, 1.0);
halfCurled(W, Finger.Thumb, 0.8);

// X: index hooked (hard). Approx: index half curl, others curled, thumb curled
const X = new GestureDescription("X");
halfCurled(X, Finger.Index, 1.0);
curled(X, Finger.Middle, 1.0);
curled(X, Finger.Ring, 1.0);
curled(X, Finger.Pinky, 1.0);
halfCurled(X, Finger.Thumb, 0.8);

// Y: thumb + pinky out, others curled
const Y = new GestureDescription("Y");
Y.addCurl(Finger.Thumb, FingerCurl.NoCurl, 1.0);
addAllDirections(Y, Finger.Thumb, 0.3);
straightUp(Y, Finger.Pinky, 1.0);
curled(Y, Finger.Index, 1.0);
curled(Y, Finger.Middle, 1.0);
curled(Y, Finger.Ring, 1.0);

// Z: dynamic (draw Z). Approx as index up (static)
const Z = new GestureDescription("Z");
straightUp(Z, Finger.Index, 1.0);
curled(Z, Finger.Middle, 1.0);
curled(Z, Finger.Ring, 1.0);
curled(Z, Finger.Pinky, 1.0);
halfCurled(Z, Finger.Thumb, 0.8);

// Put all gestures in estimator
const estimator = new GestureEstimator([
  A, B, C, D, E, F, G, H, I, J, K, L, M, N, O, P, Q, R, S, T, U, V, W, X, Y, Z,
]);

export type GestureResult = { label: string; confidence: number } | null;

/**
 * Raw single-frame classification
 */
export function checkGesture(landmarks21x3: number[][]): GestureResult {
  if (!Array.isArray(landmarks21x3) || landmarks21x3.length !== 21) return null;

  const estimate = estimator.estimate(landmarks21x3, 0);
  const sorted = [...estimate.gestures].sort((a: any, b: any) => b.score - a.score);
  console.log("TOP 3:", sorted.slice(0, 3).map((g: any) => `${g.name}:${g.score.toFixed(1)}`));  
  if (!estimate.gestures || estimate.gestures.length === 0) return null;

  const gestures = [...estimate.gestures].sort((a: any, b: any) => b.score - a.score);
  const best = gestures[0];

  const MIN_SCORE = 4.0;

  if (best.score < MIN_SCORE) return null;

  return { label: best.name, confidence: best.score };
}

// ---- Optional: smoothing for “hold to confirm” ----
const history: { label: string; confidence: number }[] = [];
const HISTORY = 8;

export function smoothedGesture(current: GestureResult): GestureResult {
  if (!current) return null;

  history.push(current);
  if (history.length > HISTORY) history.shift();

  const counts = new Map<string, number>();
  for (const g of history) counts.set(g.label, (counts.get(g.label) || 0) + 1);

  let bestLabel = "";
  let bestCount = 0;
  for (const [label, count] of counts.entries()) {
    if (count > bestCount) {
      bestLabel = label;
      bestCount = count;
    }
  }

  // Require stability across frames
  if (bestCount < 4) return null;

  const relevant = history.filter((h) => h.label === bestLabel);
  const avg = relevant.reduce((s, x) => s + x.confidence, 0) / relevant.length;

  return { label: bestLabel, confidence: avg };
}

export function isCorrect(required: string, result: GestureResult) {
  return !!result && result.label.toUpperCase() === required.toUpperCase();
}