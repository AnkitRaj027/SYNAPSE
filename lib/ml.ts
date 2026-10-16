export type Point = {
  x: number;
  y: number;
  label?: number;
  cluster?: number;
  id?: string;
  split?: "train" | "test";
};

export type DatasetKind = "separable" | "overlap" | "regression" | "clusters" | "moons" | "circles" | "blobs";
export type Algorithm = "logistic" | "linear" | "knn" | "kmeans";

// Deterministic Pseudo-Random Number Generator (Linear Congruential Generator)
export const rand = (seed: number) => {
  let value = seed >>> 0;
  return () => {
    value = (1664525 * value + 1013904223) >>> 0;
    return value / 4294967296;
  };
};

// Box-Muller transform for Gaussian distributed noise
export const gaussian = (random: () => number) => {
  const u = Math.max(random(), 1e-9);
  return Math.sqrt(-2 * Math.log(u)) * Math.cos(random() * Math.PI * 2);
};

export function makeDataset(kind: DatasetKind, count = 80, seed = 7): Point[] {
  const random = rand(seed);
  const points: Point[] = [];

  for (let i = 0; i < count; i++) {
    const a = random() * 2 - 1;
    const b = random() * 2 - 1;
    const id = `pt-${kind}-${seed}-${i}`;

    if (kind === "regression") {
      points.push({ id, x: a, y: 0.72 * a + (random() - 0.5) * 0.55 });
    } else if (kind === "clusters") {
      const c = i % 3;
      const angle = c * 2.1;
      points.push({
        id,
        x: Math.cos(angle) * 0.65 + (random() - 0.5) * 0.5,
        y: Math.sin(angle) * 0.65 + (random() - 0.5) * 0.5
      });
    } else if (kind === "moons") {
      const t = random() * Math.PI;
      const upper = i % 2 === 0;
      points.push({
        id,
        x: (upper ? Math.cos(t) : 1 - Math.cos(t)) * 0.75 - 0.35,
        y: (upper ? Math.sin(t) : -0.65 - Math.sin(t)) * 0.75 + 0.2 + (random() - 0.5) * 0.12,
        label: upper ? 0 : 1
      });
    } else if (kind === "circles") {
      const label = i % 2;
      const angle = random() * Math.PI * 2;
      const radius = label ? 0.68 : 0.28;
      points.push({
        id,
        x: Math.cos(angle) * radius + gaussian(random) * 0.06,
        y: Math.sin(angle) * radius + gaussian(random) * 0.06,
        label
      });
    } else if (kind === "blobs") {
      const label = i % 3;
      points.push({
        id,
        x: (label - 1) * 0.62 + gaussian(random) * 0.18,
        y: (label % 2 ? 0.45 : -0.45) + gaussian(random) * 0.18,
        label: label % 2
      });
    } else {
      const label = kind === "separable"
        ? (a + b > 0 ? 1 : 0)
        : (a + b + (random() - 0.5) * 0.9 > 0 ? 1 : 0);
      points.push({ id, x: a, y: b, label });
    }
  }

  return points;
}

/**
 * Strict Train/Test Split with zero data leakage.
 * Guarantees that points in train and test are strictly disjoint.
 */
export function trainTestSplit(
  points: Point[],
  testRatio = 0.25
): { train: Point[]; test: Point[] } {
  const n = points.length;
  if (n <= 1) return { train: [...points], test: [] };

  const cut = Math.max(1, Math.floor(n * (1 - testRatio)));
  const train = points.slice(0, cut).map((p) => ({ ...p, split: "train" as const }));
  const test = points.slice(cut).map((p) => ({ ...p, split: "test" as const }));
  return { train, test };
}

export type ConfusionMatrix = {
  tp: number;
  fp: number;
  tn: number;
  fn: number;
  total: number;
  accuracy: number;
  precision: number;
  recall: number;
  specificity: number;
  f1: number;
};

/**
 * Compute Confusion Matrix with safe division-by-zero handling.
 */
export function computeConfusionMatrix(
  points: Point[],
  predictions: number[],
  positiveClass = 1
): ConfusionMatrix {
  let tp = 0, fp = 0, tn = 0, fn = 0;
  for (let i = 0; i < points.length; i++) {
    const actual = points[i].label ?? 0;
    const pred = predictions[i] ?? 0;
    if (actual === positiveClass && pred === positiveClass) tp++;
    else if (actual !== positiveClass && pred === positiveClass) fp++;
    else if (actual !== positiveClass && pred !== positiveClass) tn++;
    else fn++;
  }
  const total = Math.max(1, points.length);
  const accuracy = (tp + tn) / total;
  const precision = tp + fp > 0 ? tp / (tp + fp) : 0;
  const recall = tp + fn > 0 ? tp / (tp + fn) : 0;
  const specificity = tn + fp > 0 ? tn / (tn + fp) : 0;
  const f1 = precision + recall > 0 ? (2 * precision * recall) / (precision + recall) : 0;
  return { tp, fp, tn, fn, total, accuracy, precision, recall, specificity, f1 };
}

// Numerically stable Sigmoid function with input clipping to prevent under/overflow
export const sigmoid = (z: number): number => {
  const clipped = Math.max(-30, Math.min(30, z));
  return 1 / (1 + Math.exp(-clipped));
};

export type LogisticOptions = {
  threshold?: number;
  regularization?: number;
  testPoints?: Point[];
};

export type LogisticPrediction = {
  logit: number;
  probability: number;
  prediction: number;
};

export function predictLogistic(
  p: Point,
  weights: [number, number],
  bias: number,
  threshold = 0.5
): LogisticPrediction {
  const logit = weights[0] * p.x + weights[1] * p.y + bias;
  const probability = sigmoid(logit);
  const prediction = probability >= threshold ? 1 : 0;
  return { logit, probability, prediction };
}

export type LogisticResult = {
  weights: [number, number];
  bias: number;
  logits: number[];
  probabilities: number[];
  predictions: number[];
  loss: number[];
  accuracy: number;
  testAccuracy?: number;
  threshold: number;
  regularization: number;
  confusionMatrix: ConfusionMatrix;
  testConfusionMatrix?: ConfusionMatrix;
};

export function logisticRegression(
  points: Point[],
  epochs = 120,
  learningRate = 0.15,
  options: LogisticOptions = {}
): LogisticResult {
  let w: [number, number] = [0, 0];
  let b = 0;
  const losses: number[] = [];
  const n = Math.max(points.length, 1);
  const threshold = options.threshold ?? 0.5;
  const regularization = options.regularization ?? 0;

  for (let epoch = 0; epoch < epochs; epoch++) {
    let dw0 = 0, dw1 = 0, db = 0, loss = 0;
    for (const p of points) {
      const z = w[0] * p.x + w[1] * p.y + b;
      const prob = sigmoid(z);
      const target = p.label ?? 0;
      const error = prob - target;
      dw0 += error * p.x;
      dw1 += error * p.y;
      db += error;
      // Cross-entropy with epsilon clipping to avoid log(0)
      loss += -(target * Math.log(prob + 1e-9) + (1 - target) * Math.log(1 - prob + 1e-9));
    }
    // Gradient descent step with L2 weight decay
    w = [
      w[0] - learningRate * (dw0 / n + regularization * w[0]),
      w[1] - learningRate * (dw1 / n + regularization * w[1])
    ];
    b -= (learningRate * db) / n;
    losses.push(loss / n + (regularization * (w[0] ** 2 + w[1] ** 2)) / 2);
  }

  // Train evaluations
  const trainPreds = points.map((p) => predictLogistic(p, w, b, threshold));
  const logits = trainPreds.map((pr) => pr.logit);
  const probabilities = trainPreds.map((pr) => pr.probability);
  const predictions = trainPreds.map((pr) => pr.prediction);
  const confusionMatrix = computeConfusionMatrix(points, predictions);

  // Strictly held-out test evaluations (NO data leakage)
  const testPoints = options.testPoints ?? [];
  let testAccuracy: number | undefined;
  let testConfusionMatrix: ConfusionMatrix | undefined;

  if (testPoints.length > 0) {
    const testPredictions = testPoints.map((p) => predictLogistic(p, w, b, threshold).prediction);
    testConfusionMatrix = computeConfusionMatrix(testPoints, testPredictions);
    testAccuracy = testConfusionMatrix.accuracy;
  }

  return {
    weights: w,
    bias: b,
    logits,
    probabilities,
    predictions,
    loss: losses,
    threshold,
    regularization,
    accuracy: confusionMatrix.accuracy,
    testAccuracy,
    confusionMatrix,
    testConfusionMatrix
  };
}

export type LinearResult = {
  slope: number;
  intercept: number;
  loss: number[];
  predictions: number[];
  mse: number;
  r2: number;
  testMse?: number;
  testR2?: number;
  residuals: { x: number; actual: number; predicted: number; residual: number }[];
};

export function linearRegression(
  points: Point[],
  epochs = 150,
  learningRate = 0.08,
  testPoints?: Point[]
): LinearResult {
  let slope = 0, intercept = 0;
  const losses: number[] = [];
  const n = Math.max(points.length, 1);

  // Gradient descent for Ordinary Least Squares (OLS)
  for (let e = 0; e < epochs; e++) {
    let ds = 0, di = 0, loss = 0;
    for (const p of points) {
      const pred = slope * p.x + intercept;
      const error = pred - p.y;
      ds += error * p.x;
      di += error;
      loss += error * error;
    }
    slope -= (learningRate * 2 * ds) / n;
    intercept -= (learningRate * 2 * di) / n;
    losses.push(loss / n);
  }

  const predictions = points.map((p) => slope * p.x + intercept);
  const mse = predictions.reduce((s, p, i) => s + (p - points[i].y) ** 2, 0) / n;

  // Compute R2 (Coefficient of Determination) on Train Set
  const meanY = points.reduce((s, p) => s + p.y, 0) / n;
  const ssTotal = points.reduce((s, p) => s + (p.y - meanY) ** 2, 0);
  const ssResidual = predictions.reduce((s, p, i) => s + (p - points[i].y) ** 2, 0);
  const r2 = ssTotal > 1e-9 ? Math.max(0, 1 - ssResidual / ssTotal) : 1;

  const residuals = points.map((p, i) => ({
    x: p.x,
    actual: p.y,
    predicted: predictions[i],
    residual: p.y - predictions[i]
  }));

  // Held-out test evaluation
  let testMse: number | undefined;
  let testR2: number | undefined;
  if (testPoints && testPoints.length > 0) {
    const testN = testPoints.length;
    const testPreds = testPoints.map((p) => slope * p.x + intercept);
    testMse = testPreds.reduce((s, p, i) => s + (p - testPoints[i].y) ** 2, 0) / testN;
    const testMeanY = testPoints.reduce((s, p) => s + p.y, 0) / testN;
    const testSsTot = testPoints.reduce((s, p) => s + (p.y - testMeanY) ** 2, 0);
    const testSsRes = testPreds.reduce((s, p, i) => s + (p - testPoints[i].y) ** 2, 0);
    testR2 = testSsTot > 1e-9 ? Math.max(0, 1 - testSsRes / testSsTot) : 1;
  }

  return { slope, intercept, loss: losses, predictions, mse, r2, testMse, testR2, residuals };
}

export type KnnNeighbor = Point & {
  distance: number;
  rank: number;
};

export type KnnResult = {
  prediction: number;
  probability: number;
  neighbors: KnnNeighbor[];
  trainAccuracy?: number;
  testAccuracy?: number;
};

export function knn(
  points: Point[],
  query: Point,
  k = 5
): KnnResult {
  if (points.length === 0) {
    return { prediction: 0, probability: 0, neighbors: [] };
  }

  // Euclidean distance with deterministic tie-breaking by coordinate values
  const sorted = points
    .map((p) => ({
      ...p,
      distance: Math.sqrt((p.x - query.x) ** 2 + (p.y - query.y) ** 2)
    }))
    .sort((a, b) => {
      const diff = a.distance - b.distance;
      if (Math.abs(diff) > 1e-7) return diff;
      return a.x !== b.x ? a.x - b.x : a.y - b.y;
    });

  const boundedK = Math.max(1, Math.min(k, points.length));
  const neighbors: KnnNeighbor[] = sorted.slice(0, boundedK).map((p, idx) => ({
    ...p,
    rank: idx + 1
  }));

  const ones = neighbors.filter((p) => p.label === 1).length;
  const probability = ones / neighbors.length;

  return {
    prediction: probability >= 0.5 ? 1 : 0,
    probability,
    neighbors
  };
}

export type KMeansResult = {
  points: Point[];
  centroids: Point[];
  iterations: number;
  inertia: number;
};

export function kmeans(points: Point[], k = 3, iterations = 12): KMeansResult {
  if (points.length === 0) {
    return { points: [], centroids: [], iterations: 0, inertia: 0 };
  }

  const boundedK = Math.max(1, Math.min(k, points.length));
  let centroids = points.slice(0, boundedK).map((p) => ({ x: p.x, y: p.y }));
  let assigned = points.map((p) => ({ ...p }));

  for (let step = 0; step < iterations; step++) {
    // E-step: Assign each point to nearest centroid
    assigned = assigned.map((p) => ({
      ...p,
      cluster: centroids.reduce(
        (best, c, i) =>
          (p.x - c.x) ** 2 + (p.y - c.y) ** 2 < (p.x - centroids[best].x) ** 2 + (p.y - centroids[best].y) ** 2
            ? i
            : best,
        0
      )
    }));

    // M-step: Recompute centroid means
    centroids = centroids.map((c, i) => {
      const group = assigned.filter((p) => p.cluster === i);
      return group.length
        ? {
            x: group.reduce((s, p) => s + p.x, 0) / group.length,
            y: group.reduce((s, p) => s + p.y, 0) / group.length
          }
        : c;
    });
  }

  // Final assignment pass
  assigned = assigned.map((p) => ({
    ...p,
    cluster: centroids.reduce(
      (best, c, i) =>
        (p.x - c.x) ** 2 + (p.y - c.y) ** 2 < (p.x - centroids[best].x) ** 2 + (p.y - centroids[best].y) ** 2
          ? i
          : best,
      0
    )
  }));

  const inertia = assigned.reduce(
    (s, p) => s + (p.x - centroids[p.cluster ?? 0].x) ** 2 + (p.y - centroids[p.cluster ?? 0].y) ** 2,
    0
  );

  return { points: assigned, centroids, iterations, inertia };
}

/**
 * 2D Decision Grid Evaluation
 * Computes model output probabilities across a 2D uniform grid from [-1, 1] to [-1, 1].
 */
export function evaluateGrid(
  resolution: number,
  predictor: (x: number, y: number) => number
): number[][] {
  const grid: number[][] = [];
  const step = 2 / (resolution - 1);

  for (let r = 0; r < resolution; r++) {
    const row: number[] = [];
    const y = 1 - r * step; // from +1 (top) down to -1 (bottom)
    for (let c = 0; c < resolution; c++) {
      const x = -1 + c * step; // from -1 (left) to +1 (right)
      row.push(predictor(x, y));
    }
    grid.push(row);
  }
  return grid;
}

// -----------------------------------------------------------------------------
// Two-Model Comparison Engine
// -----------------------------------------------------------------------------
export type ModelComparison = {
  modelA: {
    name: string;
    trainAccuracy: number;
    testAccuracy: number;
    f1: number;
    predictions: number[];
  };
  modelB: {
    name: string;
    trainAccuracy: number;
    testAccuracy: number;
    f1: number;
    predictions: number[];
  };
  agreementRate: number;
  disagreements: {
    point: Point;
    predA: number;
    predB: number;
    correctModel: "A" | "B" | "neither" | "both";
  }[];
};

export function compareModels(
  testPoints: Point[],
  modelAName: string,
  predictA: (p: Point) => number,
  modelBName: string,
  predictB: (p: Point) => number
): ModelComparison {
  const predsA = testPoints.map(predictA);
  const predsB = testPoints.map(predictB);

  const cmA = computeConfusionMatrix(testPoints, predsA);
  const cmB = computeConfusionMatrix(testPoints, predsB);

  let agreements = 0;
  const disagreements: ModelComparison["disagreements"] = [];

  for (let i = 0; i < testPoints.length; i++) {
    const p = testPoints[i];
    const a = predsA[i];
    const b = predsB[i];
    const actual = p.label ?? 0;

    if (a === b) {
      agreements++;
    } else {
      let correctModel: "A" | "B" | "neither" | "both" = "neither";
      if (a === actual && b !== actual) correctModel = "A";
      else if (b === actual && a !== actual) correctModel = "B";
      else if (a === actual && b === actual) correctModel = "both";

      disagreements.push({
        point: p,
        predA: a,
        predB: b,
        correctModel
      });
    }
  }

  const agreementRate = testPoints.length > 0 ? agreements / testPoints.length : 1;

  return {
    modelA: {
      name: modelAName,
      trainAccuracy: cmA.accuracy,
      testAccuracy: cmA.accuracy,
      f1: cmA.f1,
      predictions: predsA
    },
    modelB: {
      name: modelBName,
      trainAccuracy: cmB.accuracy,
      testAccuracy: cmB.accuracy,
      f1: cmB.f1,
      predictions: predsB
    },
    agreementRate,
    disagreements
  };
}

// -----------------------------------------------------------------------------
// Neural Network with Backpropagation Step Tracing & Gradient Checking
// -----------------------------------------------------------------------------
export type ActivationFn = "tanh" | "sigmoid" | "relu" | "leakyRelu";

export const activations = {
  tanh: {
    fn: (x: number) => Math.tanh(x),
    deriv: (out: number) => 1 - out * out
  },
  sigmoid: {
    fn: (x: number) => 1 / (1 + Math.exp(-Math.max(-30, Math.min(30, x)))),
    deriv: (out: number) => out * (1 - out)
  },
  relu: {
    fn: (x: number) => Math.max(0, x),
    deriv: (out: number) => (out > 0 ? 1 : 0)
  },
  leakyRelu: {
    fn: (x: number) => (x > 0 ? x : 0.05 * x),
    deriv: (out: number) => (out > 0 ? 1 : 0.05)
  }
};

export type BackpropTraceStep = {
  input: [number, number];
  target: number;
  z1: number[];
  a1: number[];
  z2: number;
  output: number;
  loss: number;
  outputError: number;
  hiddenErrors: number[];
  w1Gradients: number[][];
  b1Gradients: number[];
  w2Gradients: number[];
  b2Gradient: number;
};

export type NeuralResult = {
  weights: number[][]; // [w1_layer, w2_layer, [b1, b2]]
  losses: number[];
  predictions: number[];
  accuracy?: number;
  lastTrace?: BackpropTraceStep;
};

export function trainNeuralNetwork(
  data: number[][],
  targets: number[],
  hidden = 3,
  epochs = 150,
  learningRate = 0.1,
  activation: ActivationFn = "tanh"
): NeuralResult {
  const n = data.length;
  if (!n) return { weights: [], losses: [], predictions: [] };

  const act = activations[activation];
  const outSigmoid = activations.sigmoid;

  const seedPrng = rand(42);
  const w1 = Array.from({ length: hidden }, () => [
    (seedPrng() - 0.5) * 0.8,
    (seedPrng() - 0.5) * 0.8
  ]);
  const b1 = Array(hidden).fill(0);
  const w2 = Array.from({ length: hidden }, () => (seedPrng() - 0.5) * 0.8);
  let b2 = 0;

  const losses: number[] = [];
  let lastTrace: BackpropTraceStep | undefined;

  for (let epoch = 0; epoch < epochs; epoch++) {
    let loss = 0;

    data.forEach((input, index) => {
      // Forward pass
      const z1 = w1.map((w, j) => w[0] * input[0] + w[1] * input[1] + b1[j]);
      const a1 = z1.map((v) => act.fn(v));
      const z2 = a1.reduce((s, v, j) => s + v * w2[j], 0) + b2;
      const out = outSigmoid.fn(z2);

      const target = targets[index];
      const error = out - target;
      loss += -(target * Math.log(out + 1e-9) + (1 - target) * Math.log(1 - out + 1e-9));

      // Analytical Backprop Gradients
      const hiddenErrors = a1.map((a, j) => error * w2[j] * act.deriv(a));
      const w1Grads = hiddenErrors.map((hErr) => [hErr * input[0], hErr * input[1]]);
      const b1Grads = [...hiddenErrors];
      const w2Grads = a1.map((a) => error * a);
      const b2Grad = error;

      // Update weights
      a1.forEach((a, j) => {
        w1[j][0] -= learningRate * w1Grads[j][0];
        w1[j][1] -= learningRate * w1Grads[j][1];
        b1[j] -= learningRate * b1Grads[j];
        w2[j] -= learningRate * w2Grads[j];
      });
      b2 -= learningRate * b2Grad;

      // Keep snapshot of the final sample pass for step-by-step inspector
      if (epoch === epochs - 1 && index === n - 1) {
        lastTrace = {
          input: [input[0], input[1]],
          target,
          z1,
          a1,
          z2,
          output: out,
          loss,
          outputError: error,
          hiddenErrors,
          w1Gradients: w1Grads,
          b1Gradients: b1Grads,
          w2Gradients: w2Grads,
          b2Gradient: b2Grad
        };
      }
    });

    losses.push(loss / n);
  }

  // Predict
  const predictions = data.map((input) => {
    const a = w1.map((w, j) => act.fn(w[0] * input[0] + w[1] * input[1] + b1[j]));
    return outSigmoid.fn(a.reduce((s, v, j) => s + v * w2[j], 0) + b2);
  });

  const correct = predictions.filter((p, i) => (p >= 0.5 ? 1 : 0) === targets[i]).length;

  return {
    weights: [...w1, w2, [b1[0] ?? 0, b2]],
    losses,
    predictions,
    accuracy: correct / n,
    lastTrace
  };
}

/**
 * Numerical Gradient Checker
 * Validates analytical backprop gradients against finite difference approximation:
 * dL/dw ≈ (L(w + ε) - L(w - ε)) / (2ε)
 */
export function checkNumericalGradient(
  input: [number, number],
  target: number,
  weights1: [number, number],
  epsilon = 1e-4
): { analytical: number; numerical: number; relativeError: number } {
  const lossAt = (w0: number) => {
    const z1 = w0 * input[0] + weights1[1] * input[1];
    const a1 = Math.tanh(z1);
    const z2 = a1 * 0.5;
    const out = sigmoid(z2);
    return -(target * Math.log(out + 1e-9) + (1 - target) * Math.log(1 - out + 1e-9));
  };

  const lPlus = lossAt(weights1[0] + epsilon);
  const lMinus = lossAt(weights1[0] - epsilon);
  const numerical = (lPlus - lMinus) / (2 * epsilon);

  // Analytical gradient
  const z1 = weights1[0] * input[0] + weights1[1] * input[1];
  const a1 = Math.tanh(z1);
  const z2 = a1 * 0.5;
  const out = sigmoid(z2);
  const err = out - target;
  const analytical = err * 0.5 * (1 - a1 * a1) * input[0];

  const relativeError = Math.abs(analytical - numerical) / Math.max(1e-7, Math.abs(analytical) + Math.abs(numerical));
  return { analytical, numerical, relativeError };
}

// Preserve backward-compatible trainXor
export function trainXor(hidden = 2, epochs = 100, learningRate = 0.1): NeuralResult {
  const data = [[0, 0], [0, 1], [1, 0], [1, 1]];
  const target = [0, 1, 1, 0];
  return trainNeuralNetwork(data, target, hidden, epochs, learningRate, "tanh");
}

// -----------------------------------------------------------------------------
// Real Decision Tree Split Evaluator (Calculated from actual observations)
// -----------------------------------------------------------------------------
export type DecisionTreeSplit = {
  feature: "x" | "y";
  threshold: number;
  giniBefore: number;
  giniAfter: number;
  infoGain: number;
  leftCount: number;
  rightCount: number;
};

export function findBestSplit(points: Point[]): DecisionTreeSplit {
  const calcGini = (pts: Point[]) => {
    if (pts.length === 0) return 0;
    const ones = pts.filter((p) => p.label === 1).length;
    const p1 = ones / pts.length;
    const p0 = 1 - p1;
    return 1 - (p1 * p1 + p0 * p0);
  };

  const giniBefore = calcGini(points);
  let bestGain = -1;
  let bestSplit: DecisionTreeSplit = {
    feature: "x",
    threshold: 0,
    giniBefore,
    giniAfter: giniBefore,
    infoGain: 0,
    leftCount: points.length,
    rightCount: 0
  };

  for (const feat of ["x", "y"] as const) {
    const sorted = [...points].sort((a, b) => a[feat] - b[feat]);
    for (let i = 0; i < sorted.length - 1; i++) {
      const thresh = (sorted[i][feat] + sorted[i + 1][feat]) / 2;
      const left = points.filter((p) => p[feat] <= thresh);
      const right = points.filter((p) => p[feat] > thresh);

      const giniLeft = calcGini(left);
      const giniRight = calcGini(right);
      const giniAfter = (left.length / points.length) * giniLeft + (right.length / points.length) * giniRight;
      const gain = giniBefore - giniAfter;

      if (gain > bestGain) {
        bestGain = gain;
        bestSplit = {
          feature: feat,
          threshold: thresh,
          giniBefore,
          giniAfter,
          infoGain: gain,
          leftCount: left.length,
          rightCount: right.length
        };
      }
    }
  }

  return bestSplit;
}
