// Fast ASL classifier using TensorFlow.js directly with wrist-relative normalization

import { normalizeLandmarks, normalizeSequence } from "./handNormalize";

interface ModelMeta {
  inputMin: number[];
  inputMax: number[];
  labels: string[];
}

interface ClassifyResult {
  label: string;
  confidence: number;
}

export class ASLClassifier {
  private staticModel: any = null;
  private dynamicModel: any = null;
  private staticMeta: ModelMeta | null = null;
  private dynamicMeta: ModelMeta | null = null;
  public ready = false;

  async load() {
    const tfRef = (window as any).tf;
    if (!tfRef) {
      console.error("TensorFlow.js not found. Make sure tf.min.js is in index.html");
      return;
    }

    try {
      try {
        await tfRef.setBackend("webgl");
        await tfRef.ready();
        console.log("TF.js using WebGL backend");
      } catch {
        await tfRef.setBackend("cpu");
        await tfRef.ready();
        console.log("TF.js fell back to CPU backend");
      }

      const [staticModel, staticMetaRaw, dynamicModel, dynamicMetaRaw] =
        await Promise.all([
          tfRef.loadLayersModel("/static-model/model.json"),
          fetch("/static-model/model_meta.json").then((r: Response) => r.json()),
          tfRef.loadLayersModel("/dynamic-model/model.json"),
          fetch("/dynamic-model/model_meta.json").then((r: Response) => r.json()),
        ]);

      this.staticModel = staticModel;
      this.staticMeta = this.parseMeta(staticMetaRaw);
      this.dynamicModel = dynamicModel;
      this.dynamicMeta = this.parseMeta(dynamicMetaRaw);

      this.ready = true;
      console.log("ASL Classifier ready!", this.staticMeta.labels);
    } catch (err) {
      console.error("Failed to load ASL models:", err);
    }
  }

  private parseMeta(raw: any): ModelMeta {
    const inputs = raw.inputs;
    const inputCount = Object.keys(inputs).length;
    const inputMin: number[] = [];
    const inputMax: number[] = [];

    for (let i = 0; i < inputCount; i++) {
      inputMin.push(inputs[String(i)].min);
      inputMax.push(inputs[String(i)].max);
    }

    const legend = raw.outputs["0"].legend;
    const labels: string[] = new Array(Object.keys(legend).length);
    for (const [label, oneHot] of Object.entries(legend)) {
      const idx = (oneHot as number[]).indexOf(1);
      labels[idx] = label;
    }

    return { inputMin, inputMax, labels };
  }

  private applyMinMaxNorm(input: number[], meta: ModelMeta): number[] {
    return input.map((val, i) => {
      const min = meta.inputMin[i] ?? 0;
      const max = meta.inputMax[i] ?? 1;
      const range = max - min;
      if (range === 0) return 0;
      return (val - min) / range;
    });
  }

  classifyStatic(rawLandmarks: number[]): ClassifyResult | null {
    if (!this.staticModel || !this.staticMeta) return null;
    const tfRef = (window as any).tf;

    // Step 1: Normalize relative to wrist (matches what training data used)
    const relativeFeatures = normalizeLandmarks(rawLandmarks);

    // Step 2: Apply ml5's min/max normalization (from model_meta.json)
    const modelInput = this.applyMinMaxNorm(relativeFeatures, this.staticMeta);

    const inputTensor = tfRef.tensor2d([modelInput]);
    const prediction = this.staticModel.predict(inputTensor);
    const scores: number[] = Array.from(prediction.dataSync());

    inputTensor.dispose();
    prediction.dispose();

    const maxIdx = scores.indexOf(Math.max(...scores));
    return {
      label: this.staticMeta.labels[maxIdx],
      confidence: scores[maxIdx],
    };
  }

  classifyDynamic(rawFrames: number[][]): ClassifyResult | null {
    if (!this.dynamicModel || !this.dynamicMeta) return null;
    const tfRef = (window as any).tf;

    // Normalize each frame relative to its own wrist
    const normalizedFrames = normalizeSequence(rawFrames);
    const flat = normalizedFrames.flat();
    const modelInput = this.applyMinMaxNorm(flat, this.dynamicMeta);

    const inputTensor = tfRef.tensor2d([modelInput]);
    const prediction = this.dynamicModel.predict(inputTensor);
    const scores: number[] = Array.from(prediction.dataSync());

    inputTensor.dispose();
    prediction.dispose();

    const maxIdx = scores.indexOf(Math.max(...scores));
    return {
      label: this.dynamicMeta.labels[maxIdx],
      confidence: scores[maxIdx],
    };
  }
}

let instance: ASLClassifier | null = null;

export async function getClassifier(): Promise<ASLClassifier> {
  if (!instance) {
    instance = new ASLClassifier();
    await instance.load();
  }
  return instance;
}